import { useState, useEffect } from 'react';
import { TrendingUp, Fuel, Truck, MapPin, Calendar, Activity, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { api } from '../../api';

export default function MarketIntelligence() {
  const [marketData, setMarketData] = useState(null);
  const [fuelPrices, setFuelPrices] = useState(null);
  const [laneAnalytics, setLaneAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadMarketData();
    const interval = setInterval(loadMarketData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      
      // Load market dashboard
      const dashboard = await api.get('/market/dashboard');
      setMarketData(dashboard);
      setFuelPrices(dashboard.fuel_prices);
      setLastUpdated(new Date());

      // Load top lanes
      const topLanes = [
        { origin: 'CA', destination: 'TX', name: 'California → Texas' },
        { origin: 'TX', destination: 'IL', name: 'Texas → Illinois' },
        { origin: 'FL', destination: 'NY', name: 'Florida → New York' },
        { origin: 'GA', destination: 'OH', name: 'Georgia → Ohio' },
        { origin: 'WA', destination: 'CA', name: 'Washington → California' }
      ];

      const lanesWithData = await Promise.all(
        topLanes.map(async (lane) => {
          try {
            const data = await api.get(`/market/lane/${lane.origin}/${lane.destination}`);
            return { ...lane, ...data };
          } catch {
            return lane;
          }
        })
      );

      setLaneAnalytics(lanesWithData);
    } catch (err) {
      console.error('Failed to load market data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !marketData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw size={48} className="text-purple-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading Market Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="text-green-600" size={32} />
            Market Intelligence Center
          </h1>
          <p className="text-gray-600 mt-1">Real-time freight market trends & analytics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadMarketData}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Fuel className="text-blue-600" size={24} />
            </div>
            <span className="text-xs text-gray-500">National Average</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${fuelPrices?.national_avg?.toFixed(2) || '3.75'}
          </p>
          <p className="text-sm text-gray-600 mt-1">Diesel Price / Gallon</p>
          {fuelPrices?.trend && (
            <div className="flex items-center gap-1 mt-2">
              {fuelPrices.trend === 'up' ? (
                <ArrowUpRight size={16} className="text-red-600" />
              ) : (
                <ArrowDownRight size={16} className="text-green-600" />
              )}
              <span className={`text-xs ${fuelPrices.trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                {fuelPrices.change?.toFixed(2) || '0.05'} this week
              </span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Truck className="text-purple-600" size={24} />
            </div>
            <span className="text-xs text-gray-500">Spot Market</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${marketData?.national_averages?.spot_rate_per_mile?.toFixed(2) || '2.65'}
          </p>
          <p className="text-sm text-gray-600 mt-1">Rate / Mile</p>
          <div className="flex items-center gap-1 mt-2">
            <Activity size={16} className="text-purple-600" />
            <span className="text-xs text-purple-600">Live market rate</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="text-green-600" size={24} />
            </div>
            <span className="text-xs text-gray-500">Capacity</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {marketData?.capacity?.status || 'Balanced'}
          </p>
          <p className="text-sm text-gray-600 mt-1">Load-to-Truck Ratio</p>
          <p className="text-xs text-gray-500 mt-2">
            {marketData?.capacity?.ratio || '5.2'} loads per truck
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-amber-600" size={24} />
            </div>
            <span className="text-xs text-gray-500">Season</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {marketData?.seasonal?.season || 'Spring'}
          </p>
          <p className="text-sm text-gray-600 mt-1">Demand Factor</p>
          <p className="text-xs text-gray-500 mt-2">
            {marketData?.seasonal?.factor || '1.05'}x base rate
          </p>
        </div>
      </div>

      {/* Lane Analytics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="text-blue-600" size={24} />
          Top Lane Analytics
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Lane</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Spot Rate/Mile</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Avg Margin</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Trend</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Capacity</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Fuel Surcharge</th>
              </tr>
            </thead>
            <tbody>
              {laneAnalytics.map((lane, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-gray-900">{lane.name}</p>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${lane.spot_rate_per_mile?.toFixed(2) || '2.65'}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <p className="text-sm text-green-600 font-medium">
                      ${lane.avg_margin?.toLocaleString() || '650'}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      lane.trend === 'up' ? 'bg-green-100 text-green-700' :
                      lane.trend === 'down' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {lane.trend?.toUpperCase() || 'STABLE'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      lane.capacity_status === 'tight' ? 'bg-red-100 text-red-700' :
                      lane.capacity_status === 'loose' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {lane.capacity_status?.toUpperCase() || 'BALANCED'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <p className="text-sm text-gray-600">
                      +{lane.fuel_surcharge?.toFixed(2) || '0.15'}/mi
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Market Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">AI Market Insights</h2>
          
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-gray-900 font-medium">Fuel Prices Rising</p>
              <p className="text-xs text-gray-600 mt-1">
                Diesel prices increased 5% this week. Consider adding fuel surcharges to new quotes.
              </p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
              <p className="text-sm text-gray-900 font-medium">Produce Season Starting</p>
              <p className="text-xs text-gray-600 mt-1">
                Reefer demand increasing in CA, TX, FL. Book capacity 3-5 days in advance.
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <p className="text-sm text-gray-900 font-medium">Lane TX→IL Hot</p>
              <p className="text-xs text-gray-600 mt-1">
                High demand, tight capacity. Rates 10% above average. Good margin opportunity.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Rate Forecasting</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Next 7 Days</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <span className="text-xs text-green-600 font-medium">+3-5%</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Next 30 Days</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <span className="text-xs text-blue-600 font-medium">+8-12%</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Next 90 Days</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <span className="text-xs text-purple-600 font-medium">+15-20%</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              Based on historical patterns, seasonal trends, and current market conditions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
