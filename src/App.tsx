import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import { Coffee, CreditCard, DollarSign, TrendingUp, Users, Clock, BarChart3, Upload } from 'lucide-react';

interface SalesRecord {
  date: string;
  datetime: string;
  cash_type: string;
  card: string;
  money: number;
  coffee_name: string;
  hour: number;
}

const SalesAnalyticsDashboard = () => {
  const [data, setData] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const processedData = results.data
            .filter((row): row is Record<string, unknown> =>
              row !== null && typeof row === 'object'
            )
            .map((row): SalesRecord => {
              const datetime = new Date(String(row.datetime || ''));
              return {
                date: String(row.date || ''),
                datetime: String(row.datetime || ''),
                cash_type: String(row.cash_type || ''),
                card: String(row.card || ''),
                money: parseFloat(String(row.money)) || 0,
                coffee_name: String(row.coffee_name || ''),
                hour: datetime.getHours()
              };
            })
            .filter(record => record.coffee_name && record.money > 0); // Filter out invalid records

          setData(processedData);
          setLoading(false);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          setError(`Failed to process CSV file: ${errorMessage}`);
          setLoading(false);
        }
      },
      error: (error) => {
        setError(`CSV parsing error: ${error.message}`);
        setLoading(false);
      }
    });
  };

  const analytics = useMemo(() => {
    if (data.length === 0) return null;

    // Basic statistics
    const totalRevenue = data.reduce((sum, record) => sum + record.money, 0);
    const totalOrders = data.length;
    const avgOrderValue = totalRevenue / totalOrders;
    const uniqueCustomers = new Set(data.map(record => record.card)).size;

    // Coffee type analysis
    const coffeeStats = data.reduce((acc, record) => {
      const coffee = record.coffee_name;
      if (!acc[coffee]) {
        acc[coffee] = { count: 0, revenue: 0, avgPrice: 0 };
      }
      acc[coffee].count += 1;
      acc[coffee].revenue += record.money;
      acc[coffee].avgPrice = acc[coffee].revenue / acc[coffee].count;
      return acc;
    }, {} as Record<string, { count: number; revenue: number; avgPrice: number }>);

    const coffeeChartData = Object.entries(coffeeStats).map(([name, stats]) => ({
      name,
      count: stats.count,
      revenue: stats.revenue,
      avgPrice: parseFloat(stats.avgPrice.toFixed(2))
    }));

    // Hourly analysis
    const hourlyStats = data.reduce((acc, record) => {
      const hour = record.hour;
      if (!acc[hour]) {
        acc[hour] = { orders: 0, revenue: 0 };
      }
      acc[hour].orders += 1;
      acc[hour].revenue += record.money;
      return acc;
    }, {} as Record<number, { orders: number; revenue: number }>);

    const hourlyChartData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      orders: hourlyStats[hour]?.orders || 0,
      revenue: hourlyStats[hour]?.revenue || 0
    })).filter(item => item.orders > 0);

    // Payment method analysis
    const paymentStats = data.reduce((acc, record) => {
      const method = record.cash_type;
      if (!acc[method]) {
        acc[method] = { count: 0, revenue: 0 };
      }
      acc[method].count += 1;
      acc[method].revenue += record.money;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    const paymentChartData = Object.entries(paymentStats).map(([method, stats]) => ({
      method,
      count: stats.count,
      revenue: stats.revenue,
      percentage: ((stats.count / totalOrders) * 100).toFixed(1)
    }));

    // Customer frequency analysis
    const customerFrequency = data.reduce((acc, record) => {
      const customer = record.card;
      acc[customer] = (acc[customer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const frequencyDistribution = Object.values(customerFrequency).reduce((acc, frequency) => {
      const bucket = frequency === 1 ? '1 order' :
                   frequency <= 3 ? '2-3 orders' :
                   frequency <= 5 ? '4-5 orders' : '6+ orders';
      acc[bucket] = (acc[bucket] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const customerFrequencyData = Object.entries(frequencyDistribution).map(([bucket, count]) => ({
      bucket,
      customers: count
    }));

    // Price vs Volume correlation
    const priceVolumeData = coffeeChartData.map(item => ({
      coffee: item.name,
      price: item.avgPrice,
      volume: item.count
    }));

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      uniqueCustomers,
      coffeeChartData,
      hourlyChartData,
      paymentChartData,
      customerFrequencyData,
      priceVolumeData
    };
  }, [data]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];

  // File upload screen
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upload Your Sales Data</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">Upload your CSV file to start analyzing sales correlations and insights</p>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
            <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-3" />
                  Choose CSV File
                </>
              )}
            </div>
          </label>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Analytics Dashboard</h1>
            <p className="text-gray-600">Discover correlations and insights in your coffee shop sales data</p>
          </div>
          <button
            onClick={() => setData([])}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Upload New File
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">${analytics.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.totalOrders.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <Coffee className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Avg Order Value</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">${analytics.avgOrderValue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Unique Customers</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.uniqueCustomers.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Coffee Sales Analysis */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                <Coffee className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Coffee Types - Sales & Revenue</h3>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={analytics.coffeeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#3B82F6" name="Orders" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenue" fill="#10B981" name="Revenue ($)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Sales Pattern */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mr-3">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Hourly Sales Pattern</h3>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={analytics.hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }} name="Orders" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Method Distribution */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Payment Method Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={analytics.paymentChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ method, percentage }) => `${method} (${percentage}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.paymentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Customer Frequency Analysis */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Customer Visit Frequency</h3>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={analytics.customerFrequencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="bucket" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="customers" fill="#F97316" name="Number of Customers" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Price vs Volume Correlation */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Price vs Volume Correlation</h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={analytics.priceVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="coffee" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="volume" fill="#6366F1" name="Volume (Orders)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="price" fill="#8B5CF6" name="Avg Price ($)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insights Summary */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center mr-3">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Key Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-center mb-3">
                <Coffee className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="font-semibold text-gray-900">Top Performing Coffee</h4>
              </div>
              <p className="text-gray-700 leading-relaxed">
                <span className="font-semibold text-blue-600">
                  {analytics.coffeeChartData.reduce((top, current) =>
                    current.revenue > top.revenue ? current : top
                  ).name}
                </span> generates the highest revenue with ${analytics.coffeeChartData.reduce((top, current) =>
                  current.revenue > top.revenue ? current : top
                ).revenue.toFixed(2)} total
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="flex items-center mb-3">
                <Clock className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="font-semibold text-gray-900">Peak Hours</h4>
              </div>
              <p className="text-gray-700 leading-relaxed">
                <span className="font-semibold text-green-600">
                  {analytics.hourlyChartData.reduce((peak, current) =>
                    current.orders > peak.orders ? current : peak
                  ).hour}
                </span> is your busiest hour with {analytics.hourlyChartData.reduce((peak, current) =>
                  current.orders > peak.orders ? current : peak
                ).orders} orders
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100">
              <div className="flex items-center mb-3">
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="font-semibold text-gray-900">Customer Loyalty</h4>
              </div>
              <p className="text-gray-700 leading-relaxed">
                <span className="font-semibold text-purple-600">{analytics.uniqueCustomers}</span> unique customers with <span className="font-semibold text-purple-600">{analytics.totalOrders}</span> total orders ({(analytics.totalOrders / analytics.uniqueCustomers).toFixed(1)} orders per customer)
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
              <div className="flex items-center mb-3">
                <DollarSign className="h-5 w-5 text-orange-600 mr-2" />
                <h4 className="font-semibold text-gray-900">Average Transaction</h4>
              </div>
              <p className="text-gray-700 leading-relaxed">
                <span className="font-semibold text-orange-600">${analytics.avgOrderValue.toFixed(2)}</span> per order across all coffee types with consistent pricing patterns
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalyticsDashboard;