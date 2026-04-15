/**
 * Manual Task Assignment System
 * ONLY assigns tasks that require human intervention (calls, disputes, approvals)
 * AI handles everything else autonomously
 */

const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');

class ManualTaskAssignmentEngine {
  
  /**
   * Task types that REQUIRE human intervention
   */
  static HUMAN_ONLY_TASKS = [
    'phone_call',           // AI cannot make phone calls
    'dispute_resolution',   // Complex negotiations requiring human judgment
    'high_value_approval',  // Deals over threshold
    'emergency_response',   // Urgent situations
    'relationship_management', // VIP clients
    'complex_verification', // Legal/compliance checks
    'legal_compliance'      // Regulatory issues
  ];

  /**
   * Check if task requires human action
   */
  requiresHumanAction(task) {
    return ManualTaskAssignmentEngine.HUMAN_ONLY_TASKS.includes(task.category || task.task_type);
  }

  /**
   * Create task with AI-generated context for human
   */
  async createManualTask(taskData) {
    // Verify this task actually needs human intervention
    if (!this.requiresHumanAction(taskData)) {
      console.log(`[TASK ASSIGNMENT] Task "${taskData.title}" can be handled by AI automatically`);
      return null;
    }

    const taskId = uuidv4();

    // Generate AI talking points and context
    const context = await this.generateTaskContext(taskData);

    // Insert task into database
    run(`INSERT INTO ai_tasks 
         (id, user_id, task_type, title, description, priority, status, context, related_load_id, related_client_id, due_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, datetime('now'))`,
      [
        taskId,
        taskData.user_id || null,
        taskData.task_type,
        taskData.title,
        taskData.description,
        taskData.priority || 'medium',
        JSON.stringify(context),
        taskData.related_load_id || null,
        taskData.related_client_id || null,
        taskData.due_date || this.getDefaultDueDate(taskData.priority)
      ]
    );

    // Create task assignment
    const assignment = await this.assignTask(taskId, taskData);

    // Create notification
    if (assignment && assignment.assigned_to) {
      run(`INSERT INTO notifications (id, user_id, title, message, type, created_at)
           VALUES (?, ?, ?, ?, 'warning', datetime('now'))`,
        [
          uuidv4(),
          assignment.assigned_to,
          `Task Assigned: ${taskData.title}`,
          taskData.description.substring(0, 150),
        ]
      );
    }

    console.log(`[TASK ASSIGNMENT] Created manual task: ${taskData.title} (ID: ${taskId})`);
    return { taskId, assignment, context };
  }

  /**
   * Generate AI-powered context for the human agent
   */
  async generateTaskContext(taskData) {
    const context = {
      created_by: 'AI_AGENT',
      requires_human_reason: this.getHumanReason(taskData.task_type),
      talking_points: [],
      background_info: {},
      recommended_approach: '',
      urgency_factors: [],
      related_data: {}
    };

    // Generate task-specific context
    switch (taskData.task_type) {
      case 'call_required':
        context.talking_points = await this.generateCallScript(taskData);
        context.urgency_factors = this.calculateCallUrgency(taskData);
        break;

      case 'negotiation':
        context.talking_points = await this.generateNegotiationPoints(taskData);
        context.recommended_approach = 'Focus on value proposition, not just price';
        break;

      case 'approval_needed':
        context.background_info = await this.getApprovalContext(taskData);
        context.recommended_approach = 'Review deal profitability and risk factors';
        break;

      case 'exception':
        context.urgency_factors = ['Requires immediate attention'];
        context.recommended_approach = 'Assess situation and take corrective action';
        break;
    }

    return context;
  }

  /**
   * Generate AI talking points for phone calls
   */
  async generateCallScript(taskData) {
    const script = [
      `Introduction: "Hi, this is [Your Name] from SurfTrans Logistics"`
    ];

    if (taskData.context) {
      if (taskData.context.company) {
        script.push(`Company: ${taskData.context.company}`);
      }
      if (taskData.context.reason) {
        script.push(`Purpose: ${taskData.context.reason}`);
      }
      if (taskData.context.deal_value) {
        script.push(`Deal Value: $${taskData.context.deal_value.toLocaleString()}`);
      }
      if (taskData.context.negotiation_range) {
        script.push(`Negotiation Range: $${taskData.context.negotiation_range.min.toLocaleString()} - $${taskData.context.negotiation_range.max.toLocaleString()}`);
      }
    }

    script.push(`Key Points to Discuss:`);
    script.push(`- Understand their current logistics challenges`);
    script.push(`- Present our value proposition`);
    script.push(`- Address any concerns or objections`);
    script.push(`- Next steps and follow-up timeline`);

    return script;
  }

  /**
   * Generate negotiation talking points
   */
  async generateNegotiationPoints(taskData) {
    return [
      'Acknowledge their concerns and validate their position',
      'Explain our pricing rationale and market conditions',
      'Highlight value-added services (tracking, insurance, reliability)',
      'Offer alternatives if within margin thresholds',
      'Seek win-win solution that preserves relationship',
      'Set clear expectations and timeline'
    ];
  }

  /**
   * Get context for approval tasks
   */
  async getApprovalContext(taskData) {
    if (taskData.related_load_id) {
      const load = get(`
        SELECT l.*, s.company_name as shipper_name, c.company_name as carrier_name
        FROM loads l
        LEFT JOIN shippers s ON l.shipper_id = s.id
        LEFT JOIN carriers c ON l.carrier_id = c.id
        WHERE l.id = ?
      `, [taskData.related_load_id]);

      return {
        load_details: load,
        profitability: load ? load.brokerage_fee : null,
        margin_percentage: load ? (load.brokerage_fee / load.shipper_rate * 100).toFixed(1) : null
      };
    }

    return {};
  }

  /**
   * Calculate urgency factors for calls
   */
  calculateCallUrgency(taskData) {
    const factors = [];

    if (taskData.priority === 'urgent') {
      factors.push('Immediate response required');
    }

    if (taskData.context && taskData.context.deal_value > 10000) {
      factors.push('High-value deal ($10K+)');
    }

    if (taskData.context && taskData.context.is_new_customer) {
      factors.push('New customer - first impression critical');
    }

    if (taskData.due_date) {
      const daysUntilDue = Math.floor((new Date(taskData.due_date) - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 1) {
        factors.push(`Due within ${daysUntilDue} day(s)`);
      }
    }

    return factors;
  }

  /**
   * Get reason why human is needed
   */
  getHumanReason(taskType) {
    const reasons = {
      phone_call: 'AI cannot make phone calls - requires personal communication',
      dispute_resolution: 'Complex negotiation requiring human judgment and empathy',
      high_value_approval: 'High-risk financial decision requires human oversight',
      emergency_response: 'Critical situation needs immediate human decision-making',
      relationship_management: 'VIP client requires personal relationship touch',
      complex_verification: 'Legal/compliance verification needs human expertise',
      legal_compliance: 'Regulatory compliance requires human review and sign-off'
    };

    return reasons[taskType] || 'Task requires human judgment';
  }

  /**
   * Assign task to best available agent
   */
  async assignTask(taskId, taskData) {
    // For now, assign to task creator or first available admin
    let assignedTo = taskData.user_id;

    if (!assignedTo) {
      // Find available admin
      const admin = get(`
        SELECT id FROM users 
        WHERE role = 'admin' AND status = 'active' 
        ORDER BY created_at ASC 
        LIMIT 1
      `);

      if (admin) {
        assignedTo = admin.id;
      }
    }

    if (!assignedTo) {
      console.warn('[TASK ASSIGNMENT] No available agent to assign task');
      return null;
    }

    // Create assignment record
    const assignmentId = uuidv4();
    run(`INSERT INTO user_task_assignments 
         (id, task_id, assigned_to, assigned_by, assigned_at, due_date, priority, status, task_category, auto_assigned, assignment_reason, created_at)
         VALUES (?, ?, ?, ?, datetime('now'), ?, ?, 'pending', ?, 1, ?, datetime('now'))`,
      [
        assignmentId,
        taskId,
        assignedTo,
        'system',
        taskData.due_date || this.getDefaultDueDate(taskData.priority),
        taskData.priority || 'medium',
        taskData.task_type,
        `Auto-assigned: ${this.getHumanReason(taskData.task_type)}`
      ]
    );

    return {
      assignment_id: assignmentId,
      task_id: taskId,
      assigned_to: assignedTo,
      assigned_at: new Date().toISOString()
    };
  }

  /**
   * Get default due date based on priority
   */
  getDefaultDueDate(priority) {
    const now = new Date();
    let hoursToAdd = 24;

    switch (priority) {
      case 'urgent':
        hoursToAdd = 2;
        break;
      case 'high':
        hoursToAdd = 8;
        break;
      case 'medium':
        hoursToAdd = 24;
        break;
      case 'low':
        hoursToAdd = 72;
        break;
    }

    now.setHours(now.getHours() + hoursToAdd);
    return now.toISOString().split('T')[0];
  }

  /**
   * Get tasks for a user
   */
  getUserTasks(userId, status = 'pending') {
    return all(`
      SELECT t.*, 
             uta.assigned_at,
             uta.assignment_reason,
             l.load_number,
             s.company_name as client_name
      FROM ai_tasks t
      LEFT JOIN user_task_assignments uta ON t.id = uta.task_id
      LEFT JOIN loads l ON t.related_load_id = l.id
      LEFT JOIN shippers s ON t.related_client_id = s.id
      WHERE uta.assigned_to = ?
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
   * Get urgent tasks needing immediate action
   */
  getUrgentTasks() {
    return all(`
      SELECT t.*, uta.assigned_to
      FROM ai_tasks t
      LEFT JOIN user_task_assignments uta ON t.id = uta.task_id
      WHERE t.priority IN ('urgent', 'high')
        AND t.status = 'pending'
        AND t.due_date < datetime('now', '+4 hours')
      ORDER BY t.due_date ASC
    `);
  }

  /**
   * Update task status
   */
  updateTaskStatus(taskId, status, outcomeNotes = null) {
    const setClause = outcomeNotes 
      ? `status = ?, context = json_set(context, '$.outcome_notes', ?)`
      : `status = ?`;

    const params = outcomeNotes ? [status, outcomeNotes, taskId] : [status, taskId];

    if (status === 'completed') {
      run(`UPDATE ai_tasks SET ${setClause}, completed_at = datetime('now') WHERE id = ?`, 
        outcomeNotes ? [status, outcomeNotes, taskId] : [status, taskId]);
    } else {
      run(`UPDATE ai_tasks SET ${setClause} WHERE id = ?`, params);
    }
  }

  /**
   * Get task analytics
   */
  getTaskAnalytics(userId) {
    return all(`
      SELECT 
        t.task_type,
        t.priority,
        COUNT(*) as total,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending,
        AVG(CASE WHEN t.status = 'completed' THEN 
          julianday(t.completed_at) - julianday(t.created_at) 
        END) as avg_completion_days
      FROM ai_tasks t
      LEFT JOIN user_task_assignments uta ON t.id = uta.task_id
      WHERE uta.assigned_to = ?
      GROUP BY t.task_type, t.priority
      ORDER BY total DESC
    `, [userId]);
  }
}

// Singleton instance
const taskAssignmentEngine = new ManualTaskAssignmentEngine();

module.exports = taskAssignmentEngine;
