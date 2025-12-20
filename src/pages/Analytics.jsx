import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiEye, FiShoppingCart, FiActivity, FiAlertCircle, FiBarChart2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [salesData, setSalesData] = useState(null);
  const [vtoData, setVtoData] = useState(null);
  const [conversionData, setConversionData] = useState(null);
  const [adminLogs, setAdminLogs] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [adminLogsPagination, setAdminLogsPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [errorLogsPagination, setErrorLogsPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

  useEffect(() => {
    fetchAnalytics();
  }, [activeTab, period, adminLogsPagination.page, errorLogsPagination.page]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'sales') {
        const response = await api.get(`${API_ROUTES.ANALYTICS.SALES}?period=${period}`);
        const data = response.data?.data || response.data || {};
        setSalesData(data);
      } else if (activeTab === 'vto') {
        const response = await api.get(API_ROUTES.ANALYTICS.VTO);
        const data = response.data?.data || response.data || {};
        setVtoData(data);
      } else if (activeTab === 'conversion') {
        const response = await api.get(API_ROUTES.ANALYTICS.CONVERSION);
        const data = response.data?.data || response.data || {};
        setConversionData(data);
      } else if (activeTab === 'admin-logs') {
        const params = new URLSearchParams({
          page: adminLogsPagination.page.toString(),
          limit: adminLogsPagination.limit.toString(),
        });
        const response = await api.get(`${API_ROUTES.ANALYTICS.LOGS.ADMIN}?${params.toString()}`);
        console.log('Admin logs API Response:', response.data);
        
        // Handle various response structures
        let logs = [];
        let pagination = { page: 1, limit: 50, total: 0, totalPages: 1 };
        
        if (response.data) {
          // Try different nested structures
          if (Array.isArray(response.data)) {
            logs = response.data;
          } else if (Array.isArray(response.data.data)) {
            logs = response.data.data;
          } else if (response.data.data && Array.isArray(response.data.data.logs)) {
            logs = response.data.data.logs;
            pagination = response.data.data.pagination || pagination;
          } else if (response.data.data && Array.isArray(response.data.data.adminLogs)) {
            logs = response.data.data.adminLogs;
            pagination = response.data.data.pagination || pagination;
          } else if (response.data.logs && Array.isArray(response.data.logs)) {
            logs = response.data.logs;
            pagination = response.data.pagination || pagination;
          } else if (response.data.adminLogs && Array.isArray(response.data.adminLogs)) {
            logs = response.data.adminLogs;
            pagination = response.data.pagination || pagination;
          } else {
            // Try to find any array in the response
            const keys = Object.keys(response.data);
            for (const key of keys) {
              if (Array.isArray(response.data[key])) {
                logs = response.data[key];
                break;
              }
            }
            // Check nested data
            if (logs.length === 0 && response.data.data) {
              const dataKeys = Object.keys(response.data.data);
              for (const key of dataKeys) {
                if (Array.isArray(response.data.data[key])) {
                  logs = response.data.data[key];
                  pagination = response.data.data.pagination || response.data.pagination || pagination;
                  break;
                }
              }
            }
          }
          
          // Extract pagination if available
          if (response.data.pagination) {
            pagination = { ...pagination, ...response.data.pagination };
          } else if (response.data.data?.pagination) {
            pagination = { ...pagination, ...response.data.data.pagination };
          }
        }
        
        setAdminLogs(Array.isArray(logs) ? logs : []);
        setAdminLogsPagination(prev => ({
          ...prev,
          ...pagination,
          totalPages: pagination.pages || pagination.totalPages || Math.ceil((pagination.total || 0) / (pagination.limit || 50)) || 1
        }));
      } else if (activeTab === 'error-logs') {
        const params = new URLSearchParams({
          page: errorLogsPagination.page.toString(),
          limit: errorLogsPagination.limit.toString(),
        });
        const response = await api.get(`${API_ROUTES.ANALYTICS.LOGS.ERRORS}?${params.toString()}`);
        console.log('Error logs API Response:', response.data);
        
        // Handle various response structures
        let logs = [];
        let pagination = { page: 1, limit: 50, total: 0, totalPages: 1 };
        
        if (response.data) {
          // Try different nested structures
          if (Array.isArray(response.data)) {
            logs = response.data;
          } else if (Array.isArray(response.data.data)) {
            logs = response.data.data;
          } else if (response.data.data && Array.isArray(response.data.data.logs)) {
            logs = response.data.data.logs;
            pagination = response.data.data.pagination || pagination;
          } else if (response.data.data && Array.isArray(response.data.data.errorLogs)) {
            logs = response.data.data.errorLogs;
            pagination = response.data.data.pagination || pagination;
          } else if (response.data.logs && Array.isArray(response.data.logs)) {
            logs = response.data.logs;
            pagination = response.data.pagination || pagination;
          } else if (response.data.errorLogs && Array.isArray(response.data.errorLogs)) {
            logs = response.data.errorLogs;
            pagination = response.data.pagination || pagination;
          } else {
            // Try to find any array in the response
            const keys = Object.keys(response.data);
            for (const key of keys) {
              if (Array.isArray(response.data[key])) {
                logs = response.data[key];
                break;
              }
            }
            // Check nested data
            if (logs.length === 0 && response.data.data) {
              const dataKeys = Object.keys(response.data.data);
              for (const key of dataKeys) {
                if (Array.isArray(response.data.data[key])) {
                  logs = response.data.data[key];
                  pagination = response.data.data.pagination || response.data.pagination || pagination;
                  break;
                }
              }
            }
          }
          
          // Extract pagination if available
          if (response.data.pagination) {
            pagination = { ...pagination, ...response.data.pagination };
          } else if (response.data.data?.pagination) {
            pagination = { ...pagination, ...response.data.data.pagination };
          }
        }
        
        setErrorLogs(Array.isArray(logs) ? logs : []);
        setErrorLogsPagination(prev => ({
          ...prev,
          ...pagination,
          totalPages: pagination.pages || pagination.totalPages || Math.ceil((pagination.total || 0) / (pagination.limit || 50)) || 1
        }));
      }
    } catch (error) {
      console.error('Analytics API error:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'sales', label: 'Sales Analytics', icon: FiTrendingUp },
    { id: 'vto', label: 'VTO Analytics', icon: FiEye },
    { id: 'conversion', label: 'Conversion Rates', icon: FiShoppingCart },
    { id: 'admin-logs', label: 'Admin Logs', icon: FiActivity },
    { id: 'error-logs', label: 'Error Logs', icon: FiAlertCircle },
  ];

  if (loading && !salesData && !vtoData && !conversionData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        {activeTab === 'sales' && (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sales Analytics */}
      {activeTab === 'sales' && salesData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${salesData.totalRevenue?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {salesData.totalOrders || 0}
                  </p>
                </div>
                <FiShoppingCart className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${salesData.averageOrderValue?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <FiBarChart2 className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Growth Rate</p>
                  <p className={`text-2xl font-bold ${(salesData.growthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(salesData.growthRate || 0).toFixed(1)}%
                  </p>
                </div>
                <FiTrendingUp className={`w-8 h-8 ${(salesData.growthRate || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
            </div>
          </div>

          {/* Trend Chart Data */}
          {salesData.trend && salesData.trend.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
              <div className="space-y-2">
                {salesData.trend.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      {item.period || item.date || `Period ${index + 1}`}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${item.revenue?.toFixed(2) || item.amount?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VTO Analytics */}
      {activeTab === 'vto' && vtoData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Usage</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vtoData.totalUsage || vtoData.total_usage || 0}
                  </p>
                </div>
                <FiEye className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unique Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vtoData.uniqueUsers || vtoData.unique_users || 0}
                  </p>
                </div>
                <FiActivity className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(vtoData.conversionRate || vtoData.conversion_rate || 0).toFixed(1)}%
                  </p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {vtoData.trend && vtoData.trend.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Trend</h2>
              <div className="space-y-2">
                {vtoData.trend.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      {item.period || item.date || `Period ${index + 1}`}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {item.usage || item.count || 0} uses
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conversion Rates */}
      {activeTab === 'conversion' && conversionData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overall Conversion</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(conversionData.conversionRate || conversionData.conversion_rate || 0).toFixed(2)}%
                  </p>
                </div>
                <FiShoppingCart className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Carts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {conversionData.totalCarts || conversionData.total_carts || 0}
                  </p>
                </div>
                <FiShoppingCart className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {conversionData.completedOrders || conversionData.completed_orders || 0}
                  </p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {conversionData.breakdown && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Breakdown</h2>
              <div className="space-y-2">
                {Object.entries(conversionData.breakdown).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {typeof value === 'number' ? value.toFixed(2) + '%' : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Logs */}
      {activeTab === 'admin-logs' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Admin Activity Logs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adminLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      No admin logs found
                    </td>
                  </tr>
                ) : (
                  adminLogs.map((log, index) => (
                    <tr key={log.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.timestamp || log.createdAt || log.created_at 
                          ? new Date(log.timestamp || log.createdAt || log.created_at).toLocaleString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.user?.name || log.user?.email || log.userName || log.user_name || log.user || log.userId || log.user_id || log.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {log.action || log.actionType || log.type || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.details || log.message || log.description || log.data || JSON.stringify(log.metadata || log.meta || {}) || 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error Logs */}
      {activeTab === 'error-logs' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Error Logs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endpoint
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {errorLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      No error logs found
                    </td>
                  </tr>
                ) : (
                  errorLogs.map((log, index) => (
                    <tr key={log.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.timestamp || log.createdAt || log.created_at 
                          ? new Date(log.timestamp || log.createdAt || log.created_at).toLocaleString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {log.errorType || log.error_type || log.type || log.status || 'Error'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.message || log.error || log.details || log.description || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.endpoint || log.path || log.url || log.route || 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {errorLogsPagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((errorLogsPagination.page - 1) * errorLogsPagination.limit) + 1} to {Math.min(errorLogsPagination.page * errorLogsPagination.limit, errorLogsPagination.total)} of {errorLogsPagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setErrorLogsPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={errorLogsPagination.page <= 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-1 bg-indigo-50 text-indigo-700 rounded-md font-medium text-sm">
                  Page {errorLogsPagination.page} of {errorLogsPagination.totalPages}
                </span>
                <button
                  onClick={() => setErrorLogsPagination(prev => ({ ...prev, page: Math.min(errorLogsPagination.totalPages, prev.page + 1) }))}
                  disabled={errorLogsPagination.page >= errorLogsPagination.totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;

