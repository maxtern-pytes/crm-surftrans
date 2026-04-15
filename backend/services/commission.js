const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');

// Commission tiers
const INITIAL_RATE = 0.17;
const INITIAL_CAP = 500;
const UPGRADED_RATE = 0.27;
const UPGRADE_THRESHOLD = 2000;

/**
 * Calculate commission for a given load and agent.
 * Automatically upgrades agent if they cross the $2000 total brokerage threshold.
 */
function calculateCommission(agentId, loadId) {
  const load = get('SELECT * FROM loads WHERE id = ?', [loadId]);
  if (!load) throw new Error('Load not found');

  const agent = get('SELECT * FROM users WHERE id = ?', [agentId]);
  if (!agent) throw new Error('Agent not found');

  const brokerageFee = load.brokerage_fee || (load.shipper_rate - (load.carrier_rate || 0));

  // Check if agent needs upgrade
  const newTotalBrokerage = (agent.total_brokerage || 0) + brokerageFee;

  let commRate = agent.commission_rate;
  let commCap = agent.commission_cap;
  let capRemoved = agent.cap_removed;

  // Auto-upgrade if crossing threshold
  if (!capRemoved && newTotalBrokerage >= UPGRADE_THRESHOLD) {
    commRate = UPGRADED_RATE;
    commCap = null;
    capRemoved = 1;

    run(`UPDATE users SET commission_rate = ?, commission_cap = NULL, cap_removed = 1, 
         total_brokerage = ?, updated_at = datetime('now') WHERE id = ?`,
      [UPGRADED_RATE, newTotalBrokerage, agentId]);

    // Create notification for the agent
    run(`INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), agentId,
       'Commission Upgrade!',
       `Congratulations! You've crossed $${UPGRADE_THRESHOLD.toLocaleString()} in total brokerage. Your commission rate has been upgraded to ${(UPGRADED_RATE * 100)}% with no cap!`,
       'success']);

    // Notify admins
    const admins = all("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins) {
      run(`INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), admin.id,
         'Agent Commission Upgrade',
         `Agent ${agent.first_name} ${agent.last_name} (${agent.agent_id}) has been auto-upgraded to ${(UPGRADED_RATE * 100)}% commission. Total brokerage: $${newTotalBrokerage.toFixed(2)}`,
         'info']);
    }
  } else {
    run(`UPDATE users SET total_brokerage = ?, updated_at = datetime('now') WHERE id = ?`,
      [newTotalBrokerage, agentId]);
  }

  // Calculate commission amount
  let commissionAmount = brokerageFee * commRate;
  let capApplied = 0;

  if (commCap && commissionAmount > commCap) {
    commissionAmount = commCap;
    capApplied = 1;
  }

  // Record commission
  const commId = uuidv4();
  run(`INSERT INTO commissions (id, agent_id, load_id, load_number, brokerage_fee, commission_rate, commission_amount, cap_applied, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [commId, agentId, loadId, load.load_number, brokerageFee, commRate, commissionAmount, capApplied]);

  return {
    id: commId,
    brokerageFee,
    commissionRate: commRate,
    commissionAmount,
    capApplied: !!capApplied,
    agentUpgraded: capRemoved && !agent.cap_removed,
    newTotalBrokerage,
  };
}

/**
 * Check and process all pending commission upgrades
 */
function processCommissionUpgrades() {
  const agents = all("SELECT * FROM users WHERE role = 'agent' AND cap_removed = 0 AND total_brokerage >= ?", [UPGRADE_THRESHOLD]);
  const upgraded = [];

  for (const agent of agents) {
    run(`UPDATE users SET commission_rate = ?, commission_cap = NULL, cap_removed = 1, updated_at = datetime('now') WHERE id = ?`,
      [UPGRADED_RATE, agent.id]);

    run(`INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), agent.id,
       'Commission Upgrade!',
       `Your commission has been upgraded to ${(UPGRADED_RATE * 100)}% with no cap!`,
       'success']);

    upgraded.push(agent.agent_id);
  }

  return upgraded;
}

module.exports = { calculateCommission, processCommissionUpgrades, INITIAL_RATE, INITIAL_CAP, UPGRADED_RATE, UPGRADE_THRESHOLD };
