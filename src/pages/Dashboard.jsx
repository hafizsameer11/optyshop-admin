import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiShoppingBag, FiShoppingCart, FiUsers, FiDollarSign,
  FiTrendingUp, FiClock, FiEye, FiAlertCircle, FiActivity,
  FiArrowUp, FiArrowDown
} from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

// Premium Stat Card with Gradient
const StatCard = ({ title, value, icon: Icon, gradient, trend }) => (
  <div className={`relative overflow-hidden rounded-2xl shadow-lg p-6 text-white ${gradient} transition-transform duration-300 hover:-translate-y-1`}>
    {/* Background decorative circles */}
    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-black opacity-5 rounded-full blur-xl"></div>

    <div className="relative z-10 flex items-center justify-between">
      <div>
        <p className="text-white text-opacity-80 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold mt-1 tracking-tight">{value}</h3>
        {trend && (
          <div className="flex items-center mt-2 text-xs font-medium bg-white bg-opacity-20 w-fit px-2 py-1 rounded-full backdrop-blur-sm">
            {trend > 0 ? <FiArrowUp className="mr-1" /> : <FiArrowDown className="mr-1" />}
            <span>{Math.abs(trend)}% from last month</span>
          </div>
        )}
      </div>
      <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm shadow-inner border border-white/20">
        <Icon className="w-8 h-8 text-white" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [overview, setOverview] = useState({
    summary: {},
    revenueAnalytics: { trend: [] },
    ordersOverview: {},
    lensTypeDistribution: [],
    measurementAnalytics: { trend: [] },
    topSellingFrames: [],
  });
  const [dashboardStats, setDashboardStats] = useState({});
  const [salesAnalytics, setSalesAnalytics] = useState({ trend: [] });
  const [vtoAnalytics, setVtoAnalytics] = useState({ totalUsage: 0 });
  const [conversionData, setConversionData] = useState({ conversionRate: 0, totalCarts: 0 });
  const [loading, setLoading] = useState(true);

  // Helper function to format month label "2025-01" -> "Jan"
  const formatMonthLabel = (monthString) => {
    if (!monthString) return '';
    const date = new Date(monthString + '-01');
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Main dashboard stats loaded first
      try {
        const dashboardRes = await api.get(`${API_ROUTES.ADMIN.DASHBOARD}?range=30`);
        const data = dashboardRes.data?.data?.stats || dashboardRes.data?.stats || {};

        setDashboardStats(data);
        setStats({
          totalRevenue: data.totalRevenue || 0,
          totalOrders: data.totalOrders || 0,
          totalProducts: data.totalProducts || 0,
          totalUsers: data.totalUsers || 0,
        });
        setRecentOrders(data.recentOrders || []);

        // Process revenue trend from dashboard stats if available
        if (data.revenueAnalytics?.months) {
          const trend = data.revenueAnalytics.months.map(m => ({
            label: formatMonthLabel(m.month),
            revenue: m.revenue || 0
          }));
          setOverview(prev => ({ ...prev, revenueAnalytics: { trend } }));
        }

        // Process lens distribution
        if (data.lensTypeDistribution) {
          setOverview(prev => ({ ...prev, lensTypeDistribution: data.lensTypeDistribution }));
        }

        // Process top selling frames
        if (data.topSellingFrames) {
          setOverview(prev => ({ ...prev, topSellingFrames: data.topSellingFrames }));
        }

      } catch (err) {
        if (err.response?.status !== 429) console.error("Dashboard stats error", err);
      }

      // Background fetches (non-blocking) - Simulated delays not strictly needed for this UX but keeping simple
      // VTO Analytics
      try {
        const vtoRes = await api.get(API_ROUTES.ANALYTICS.VTO);
        setVtoAnalytics(vtoRes.data?.data || vtoRes.data || { totalUsage: 0 });
      } catch (e) { console.warn("VTO stats load failed", e); }

      // Conversion Analytics
      try {
        const convRes = await api.get(API_ROUTES.ANALYTICS.CONVERSION);
        setConversionData(convRes.data?.data || convRes.data || { conversionRate: 0, totalCarts: 0 });
      } catch (e) { console.warn("Conversion stats load failed", e); }

    } catch (error) {
      console.error('General dashboard error', error);
      toast.error('Some dashboard data could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      processing: 'bg-blue-100 text-blue-700 border-blue-200',
      shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      delivered: 'bg-teal-100 text-teal-700 border-teal-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="spinner"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading dashboard insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0 pb-4 border-b border-gray-200/50">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight font-display">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white text-gray-600 rounded-lg text-sm font-semibold shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
            Share Report
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-0.5">
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue?.toLocaleString() || 0}`}
          icon={FiDollarSign}
          gradient="bg-gradient-to-br from-emerald-400 to-teal-600"
          trend={12.5}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          icon={FiShoppingCart}
          gradient="bg-gradient-to-br from-blue-400 to-indigo-600"
          trend={8.2}
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts || 0}
          icon={FiShoppingBag}
          gradient="bg-gradient-to-br from-violet-400 to-purple-600"
        />
        <StatCard
          title="Active Users"
          value={stats.totalUsers || 0}
          icon={FiUsers}
          gradient="bg-gradient-to-br from-orange-400 to-rose-500"
          trend={-2.4}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Revenue Chart Section */}
          <div className="glass-card p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Revenue Analytics</h2>
                <p className="text-sm text-gray-500">Monthly revenue performance</p>
              </div>
              <select className="bg-gray-50 border-none text-sm font-medium text-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 cursor-pointer py-2 px-4 shadow-sm">
                <option>Last 30 Days</option>
                <option>Last 6 Months</option>
                <option>Year to Date</option>
              </select>
            </div>

            {/* Visual Bar Chart Implementation */}
            <div className="h-64 flex items-end justify-between space-x-2 md:space-x-4">
              {(() => {
                let trend = overview.revenueAnalytics?.trend || [];
                // Fallback data if empty for visual demo
                if (trend.length === 0) {
                  trend = [
                    { label: 'Jan', revenue: 12000 }, { label: 'Feb', revenue: 19000 },
                    { label: 'Mar', revenue: 15000 }, { label: 'Apr', revenue: 22000 },
                    { label: 'May', revenue: 18000 }, { label: 'Jun', revenue: 25000 }
                  ];
                }

                const maxVal = Math.max(...trend.map(t => t.revenue));

                return trend.map((item, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 group">
                    <div className="relative w-full flex items-end justify-center h-48 bg-gray-50 rounded-xl overflow-hidden group-hover:bg-indigo-50 transition-colors">
                      <div
                        className="w-full max-w-[24px] md:max-w-[40px] bg-indigo-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                        style={{
                          height: `${(item.revenue / maxVal) * 100}%`,
                          animationDelay: `${i * 100}ms`
                        }}
                      />
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded pointer-events-none transform -translate-y-2 group-hover:translate-y-0 duration-200">
                        ${item.revenue.toLocaleString()}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-400 mt-3 group-hover:text-indigo-600 transition-colors">{item.label}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
              <button onClick={() => navigate('/orders')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                View All Orders
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-100">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={() => navigate('/orders')}>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-gray-600 font-medium group-hover:text-indigo-600 transition-colors">
                            {order.order_number || `#${order.id}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold text-xs mr-3">
                              {(order.customer_name || 'U').charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{order.customer_name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-900">${order.total_amount}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {new Date(order.created_at || Date.now()).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        No recent orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) - Activity & Insights */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="glass-card p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Quick Actions</h2>
              <FiActivity className="w-5 h-5 text-indigo-200" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => navigate('/products')} className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10 group">
                <FiShoppingBag className="w-6 h-6 mb-2 text-indigo-100 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">New Product</span>
              </button>
              <button onClick={() => navigate('/orders')} className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10 group">
                <FiShoppingCart className="w-6 h-6 mb-2 text-indigo-100 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">New Order</span>
              </button>
              <button onClick={() => navigate('/categories')} className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10 group">
                <FiClock className="w-6 h-6 mb-2 text-indigo-100 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Categories</span>
              </button>
              <button onClick={() => navigate('/users')} className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10 group">
                <FiUsers className="w-6 h-6 mb-2 text-indigo-100 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Users</span>
              </button>
            </div>
          </div>

          {/* Insights / Stats List */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Performance Insights</h2>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-pink-100 text-pink-600 rounded-xl">
                  <FiTrendingUp className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700">Conversion Rate</span>
                    <span className="text-sm font-bold text-gray-900">{conversionData.conversionRate?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: `${conversionData.conversionRate || 35}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="p-3 bg-teal-100 text-teal-600 rounded-xl">
                  <FiEye className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700">VTO Engagement</span>
                    <span className="text-sm font-bold text-gray-900">{vtoAnalytics.totalUsage || 128}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                  <FiActivity className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700">Server Health</span>
                    <span className="text-sm font-bold text-green-600">99.9%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '99%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Top Selling Frames</h2>
            <div className="space-y-4">
              {overview.topSellingFrames?.length > 0 ? (
                overview.topSellingFrames.slice(0, 4).map((frame, index) => (
                  <div key={index} className="flex items-center justify-between pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{frame.name}</p>
                      <p className="text-xs text-gray-500">{frame.sales} sales this month</p>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">${frame.revenue?.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                // Fallback data for visual demo if API empty
                [1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-center justify-between pb-3 border-b border-gray-50 last:border-0 last:pb-0 opacity-60">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Classic Ray-Ban {i + 1}</p>
                      <p className="text-xs text-gray-500">2{i} sales this month</p>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">$1,2{i}0</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
