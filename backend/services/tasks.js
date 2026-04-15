const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');

/**
 * AI Task Management Service - Manages human handoffs and exceptions
 */

/**
 * Create a new task for human review/action
 */
function createTask(taskData) {
  const id = uuidv4();
  
  run(`INSERT INTO ai_tasks (id, user_id, task_type, title, description, priority, status, context, related_load_id, related_client_id, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      taskData.user_id,
      taskData.task_type,
      taskData.title,
      taskData.description,
      taskData.priority || 'medium',
      'pending',
      taskData.context ? JSON.stringify(taskData.context) : null,
      taskData.related_load_id || null,
      taskData.related_client_id || null,
      taskData.due_date || null
    ]
  );
  
  // Create notification for the user
  run(`INSERT INTO notifications (id, user_id, title, message, type)
       VALUES (?, ?, ?, ?, 'warning')`,
    [
      uuidv4(),
      taskData.user_id,
      `Action Required: ${taskData.title}`,
      taskData.description.substring(0, 100) + (taskData.description.length > 100 ? '...' : ''),
    ]
  );
  
  return id;
}

/**
 * Get pending tasks for a user
 */
function getUserTasks(userId, status = 'pending') {
  return all(`
    SELECT t.*,
           l.load_number,
           s.company_name as client_name
    FROM ai_tasks t
    LEFT JOIN loads l ON t.related_load_id = l.id
    LEFT JOIN shippers s ON t.related_client_id = s.id
    WHERE t.user_id = ?
      AND t.status = ?
    ORDER BY 
      CASE t.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      t.created_at DESC
  `, [userId, status]);
}

/**
 * Update task status
 */
function updateTaskStatus(taskId, status, completedBy = null) {
  if (status === 'completed') {
    run(`UPDATE ai_tasks SET status = ?, completed_at = datetime('now') WHERE id = ?`,
      [status, taskId]);
  } else {
    run(`UPDATE ai_tasks SET status = ? WHERE id = ?`, [status, taskId]);
  }
}

/**
 * Create task for rate negotiation that needs human approval
 */
function createNegotiationApprovalTask(userId, loadId, currentRate, requestedRate, customerEmail) {
  return createTask({
    user_id: userId,
    task_type: 'negotiation',
    title: 'Rate Negotiation Requires Approval',
    description: `Customer is requesting rate adjustment from $${currentRate} to $${requestedRate}. Review and approve or provide counter-offer.`,
    priority: 'high',
    context: {
      current_rate: currentRate,
      requested_rate: requestedRate,
      difference: currentRate - requestedRate,
      customer_message: customerEmail
    },
    related_load_id: loadId,
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 24 hours
  });
}

/**
 * Create task for phone call requirement
 */
function createCallTask(userId, clientInfo, reason) {
  return createTask({
    user_id: userId,
    task_type: 'call_required',
    title: `Phone Call Required - ${clientInfo.company_name}`,
    description: `AI detected that this situation requires a personal phone call. ${reason}`,
    priority: 'high',
    context: {
      client: clientInfo,
      reason: reason
    },
    related_client_id: clientInfo.id,
    due_date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0] // 12 hours
  });
}

/**
 * Create task for exception handling
 */
function createExceptionTask(userId, exceptionType, details) {
  return createTask({
    user_id: userId,
    task_type: 'exception',
    title: `Exception: ${exceptionType}`,
    description: details.description,
    priority: details.priority || 'medium',
    context: details.context,
    related_load_id: details.load_id,
    due_date: details.due_date
  });
}

/**
 * Create follow-up task
 */
function createFollowUpTask(userId, clientInfo, followUpReason) {
  return createTask({
    user_id: userId,
    task_type: 'follow_up',
    title: `Follow Up - ${clientInfo.company_name}`,
    description: `Follow up with client: ${followUpReason}`,
    priority: 'medium',
    context: {
      client: clientInfo,
      reason: followUpReason
    },
    related_client_id: clientInfo.id,
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 2 days
  });
}

/**
 * Get task statistics
 */
function getTaskStats(userId) {
  const stats = all(`
    SELECT 
      status,
      priority,
      COUNT(*) as count
    FROM ai_tasks
    WHERE user_id = ?
    GROUP BY status, priority
  `, [userId]);
  
  const summary = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  stats.forEach(row => {
    summary[row.status] = (summary[row.status] || 0) + row.count;
    summary[row.priority] = (summary[row.priority] || 0) + row.count;
  });
  
  return summary;
}

/**
 * Detect if situation requires human handoff
 */
function requiresHumanHandoff(aiConfidence, situationType, context) {
  const rules = {
    // Low AI confidence always requires human review
    low_confidence: aiConfidence < 0.6,
    
    // Rate negotiations beyond threshold
    large_discount: context?.discount_percentage > 20,
    
    // New customer over threshold amount
    large_new_customer: context?.is_new_customer && context?.deal_value > 10000,
    
    // Complaint or negative sentiment
    negative_sentiment: context?.sentiment === 'negative',
    
    // Legal or compliance issues
    compliance_issue: situationType === 'compliance' || situationType === 'insurance',
    
    // Complex multi-stop loads
    complex_load: context?.stops > 3,
    
    // Hazardous materials
    hazmat: context?.commodity?.toLowerCase().includes('hazardous')
  };
  
  const requiresHandoff = Object.values(rules).some(rule => rule === true);
  const reasons = Object.entries(rules)
    .filter(([_, value]) => value === true)
    .map(([key, _]) => key);
  
  return {
    requires_handoff: requiresHandoff,
    reasons: reasons,
    confidence: aiConfidence
  };
}

module.exports = {
  createTask,
  getUserTasks,
  updateTaskStatus,
  createNegotiationApprovalTask,
  createCallTask,
  createExceptionTask,
  createFollowUpTask,
  getTaskStats,
  requiresHumanHandoff
};
