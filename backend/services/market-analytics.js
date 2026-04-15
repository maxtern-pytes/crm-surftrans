/**
 * Market Analytics Service
 * Provides real-time market insights, lane analytics, and trend forecasting
 */

const { run, get, all } = require('../db/database');
const marketScraper = require('./scrapers/market-data-scraper');
const cache = require('./cache');

/**
 * Get comprehensive market summary
 */
async function getMarketSummary() {
  const cacheKey = 'market_summary';
  const cached = await cache.getMarketData(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
    return cached;
  }

  const summary = await marketScraper.getMarketSummary();
  
  // Add historical performance
  summary.historical_performance = getHistoricalPerformance();
  
  // Add top lanes
  summary.top_lanes = getTopLanes();
  
  await cache.cacheMarketData(cacheKey, summary);
  
  return summary;
}

/**
 * Get lane-specific analytics
 */
function getLaneAnalytics(originState, destinationState) {
  const laneKey = `${originState}-${destinationState}`;
  
  const stats = get(`
    SELECT 
      COUNT(*) as total_loads,
      AVG(shipper_rate) as avg_shipper_rate,
      AVG(carrier_rate) as avg_carrier_rate,
      AVG(brokerage_fee) as avg_margin,
      MIN(shipper_rate) as min_rate,
      MAX(shipper_rate) as max_rate,
      AVG(weight) as avg_weight,
      COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_loads,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_loads
    FROM loads
    WHERE origin_state = ?
      AND destination_state = ?
      AND status IN ('delivered', 'cancelled')
  `, [originState, destinationState]);

  if (!stats || stats.total_loads === 0) {
    return {
      lane: laneKey,
      total_loads: 0,
      message: 'No historical data for this lane'
    };
  }

  const completionRate = (stats.completed_loads / stats.total_loads * 100).toFixed(1);
  const avgMarginPercent = (stats.avg_margin / stats.avg_shipper_rate * 100).toFixed(1);

  return {
    lane: laneKey,
    ...stats,
    completion_rate: parseFloat(completionRate),
    avg_margin_percentage: parseFloat(avgMarginPercent),
    market_data: marketScraper.getLaneMarketData(originState, destinationState)
  };
}

/**
 * Get top performing lanes
 */
function getTopLanes(limit = 10) {
  return all(`
    SELECT 
      origin_state,
      destination_state,
      COUNT(*) as load_count,
      AVG(brokerage_fee) as avg_margin,
      SUM(brokerage_fee) as total_revenue,
      AVG(shipper_rate) as avg_rate
    FROM loads
    WHERE status = 'delivered'
    GROUP BY origin_state, destination_state
    ORDER BY total_revenue DESC
    LIMIT ?
  `, [limit]);
}

/**
 * Get historical performance trends
 */
function getHistoricalPerformance(days = 90) {
  return all(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as load_count,
      SUM(brokerage_fee) as daily_revenue,
      AVG(brokerage_fee) as avg_margin
    FROM loads
    WHERE status = 'delivered'
      AND created_at >= date('now', ?)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `, [`-${days} days`]);
}

/**
 * Get market trends by commodity
 */
function getCommodityTrends() {
  return all(`
    SELECT 
      commodity,
      COUNT(*) as load_count,
      AVG(shipper_rate) as avg_rate,
      AVG(brokerage_fee) as avg_margin,
      AVG(weight) as avg_weight
    FROM loads
    WHERE status = 'delivered'
      AND commodity IS NOT NULL
    GROUP BY commodity
    ORDER BY load_count DESC
    LIMIT 20
  `);
}

/**
 * Get capacity indicators
 */
function getCapacityIndicators() {
  const currentMonth = all(`
    SELECT 
      COUNT(*) as loads_posted,
      COUNT(CASE WHEN carrier_id IS NULL THEN 1 END) as unassigned_loads,
      AVG(pickup_date <= date('now', '+7 days') AND carrier_id IS NULL THEN 1 ELSE 0 END) as urgent_unassigned
    FROM loads
    WHERE created_at >= date('now', '-30 days')
  `)[0];

  const loadToTruckRatio = currentMonth.loads_posted > 0
    ? (currentMonth.loads_posted / (currentMonth.loads_posted - currentMonth.unassigned_loads)).toFixed(2)
    : 0;

  return {
    loads_last_30_days: currentMonth.loads_posted,
    unassigned_loads: currentMonth.unassigned_loads,
    load_to_truck_ratio: parseFloat(loadToTruckRatio),
    capacity_status: getCapacityStatus(loadToTruckRatio)
  };
}

/**
 * Get capacity status from ratio
 */
function getCapacityStatus(ratio) {
  if (ratio > 3.0) return 'tight';
  if (ratio > 2.0) return 'balanced';
  return 'loose';
}

/**
 * Forecast lane rates (simple linear projection)
 */
function forecastLaneRates(originState, destinationState, daysAhead = 30) {
  const historical = all(`
    SELECT 
      DATE(created_at) as date,
      AVG(shipper_rate) as avg_rate
    FROM loads
    WHERE origin_state = ?
      AND destination_state = ?
      AND status = 'delivered'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `, [originState, destinationState]);

  if (historical.length < 10) {
    return {
      forecast: null,
      message: 'Insufficient historical data for forecasting'
    };
  }

  // Simple trend calculation
  const firstHalf = historical.slice(0, Math.floor(historical.length / 2));
  const secondHalf = historical.slice(Math.floor(historical.length / 2));

  const firstAvg = firstHalf.reduce((sum, h) => sum + h.avg_rate, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, h) => sum + h.avg_rate, 0) / secondHalf.length;

  const trend = ((secondAvg - firstAvg) / firstAvg) * 100;
  const projectedRate = secondAvg * (1 + (trend / 100) * (daysAhead / 30));

  return {
    current_avg_rate: secondAvg,
    projected_rate: projectedRate,
    trend_percentage: trend.toFixed(2),
    trend_direction: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
    confidence: historical.length > 50 ? 'high' : historical.length > 20 ? 'medium' : 'low',
    days_forecast: daysAhead
  };
}

/**
 * Get seasonal insights
 */
function getSeasonalInsights() {
  const monthlyData = all(`
    SELECT 
      strftime('%m', created_at) as month,
      COUNT(*) as load_count,
      AVG(shipper_rate) as avg_rate,
      AVG(brokerage_fee) as avg_margin
    FROM loads
    WHERE status = 'delivered'
    GROUP BY strftime('%m', created_at)
    ORDER BY month
  `);

  const currentMonth = new Date().getMonth() + 1;
  const currentData = monthlyData.find(m => parseInt(m.month) === currentMonth);
  
  const seasonalFactors = marketScraper.getSeasonalFactors();

  return {
    current_month: currentMonth,
    current_data: currentData,
    seasonal_factor: seasonalFactors[currentMonth],
    monthly_trends: monthlyData,
    recommendations: generateSeasonalRecommendations(currentMonth, currentData)
  };
}

/**
 * Generate seasonal recommendations
 */
function generateSeasonalRecommendations(month, currentData) {
  const recommendations = [];

  if (month >= 10 || month <= 1) {
    recommendations.push({
      type: 'peak_season',
      priority: 'high',
      message: 'Peak holiday season - increase rates by 10-15%',
      action: 'Adjust pricing and secure carrier capacity early'
    });
  }

  if (month >= 4 && month <= 7) {
    recommendations.push({
      type: 'produce_season',
      priority: 'medium',
      message: 'Produce season - reefer demand high',
      action: 'Source additional reefer capacity for produce lanes'
    });
  }

  if (currentData && currentData.avg_margin < 400) {
    recommendations.push({
      type: 'low_margin',
      priority: 'high',
      message: `Average margin is $${currentData.avg_margin.toFixed(0)} - below target`,
      action: 'Review pricing strategy for this period'
    });
  }

  return recommendations;
}

/**
 * Get real-time market dashboard data
 */
async function getMarketDashboard() {
  const [
    marketSummary,
    topLanes,
    capacityIndicators,
    commodityTrends,
    seasonalInsights
  ] = await Promise.all([
    getMarketSummary(),
    getTopLanes(15),
    getCapacityIndicators(),
    getCommodityTrends(),
    getSeasonalInsights()
  ]);

  return {
    market_summary: marketSummary,
    top_lanes: topLanes,
    capacity: capacityIndicators,
    commodities: commodityTrends,
    seasonal: seasonalInsights,
    last_updated: new Date().toISOString()
  };
}

module.exports = {
  getMarketSummary,
  getLaneAnalytics,
  getTopLanes,
  getHistoricalPerformance,
  getCommodityTrends,
  getCapacityIndicators,
  forecastLaneRates,
  getSeasonalInsights,
  getMarketDashboard
};
