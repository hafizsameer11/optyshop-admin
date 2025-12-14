import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiShoppingCart, FiUsers, FiPackage, FiDollarSign, FiActivity } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const Overview = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.OVERVIEW.GET);
      const data = response.data?.data || response.data || {};
      setOverview(data);
    } catch (error) {
      console.error('Overview API error:', error);
      toast.error('Failed to fetch overview data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500">No overview data available</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">System Overview</h1>
        <button
          onClick={fetchOverview}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {overview.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${overview.summary.totalRevenue?.toFixed(2) || overview.summary.revenue?.toFixed(2) || '0.00'}
                </p>
              </div>
              <FiDollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.summary.totalOrders || overview.summary.orders || 0}
                </p>
              </div>
              <FiShoppingCart className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.summary.totalUsers || overview.summary.users || 0}
                </p>
              </div>
              <FiUsers className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.summary.totalProducts || overview.summary.products || 0}
                </p>
              </div>
              <FiPackage className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Analytics */}
        {overview.revenueAnalytics && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiTrendingUp className="mr-2" />
              Revenue Analytics
            </h2>
            {overview.revenueAnalytics.trend && overview.revenueAnalytics.trend.length > 0 ? (
              <div className="space-y-2">
                {overview.revenueAnalytics.trend.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      {item.period || item.date || item.month || `Period ${index + 1}`}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${item.revenue?.toFixed(2) || item.amount?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No revenue trend data available</p>
            )}
          </div>
        )}

        {/* Orders Overview */}
        {overview.ordersOverview && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiShoppingCart className="mr-2" />
              Orders Overview
            </h2>
            <div className="space-y-3">
              {Object.entries(overview.ordersOverview).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {typeof value === 'number' ? value : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lens Type Distribution */}
        {overview.lensTypeDistribution && overview.lensTypeDistribution.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lens Type Distribution</h2>
            <div className="space-y-2">
              {overview.lensTypeDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    {item.name || item.lens_type || `Type ${index + 1}`}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.count || item.quantity || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Measurement Analytics */}
        {overview.measurementAnalytics && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiActivity className="mr-2" />
              Measurement Analytics
            </h2>
            {overview.measurementAnalytics.trend && overview.measurementAnalytics.trend.length > 0 ? (
              <div className="space-y-2">
                {overview.measurementAnalytics.trend.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      {item.period || item.date || `Period ${index + 1}`}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {item.count || item.measurements || 0}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No measurement trend data available</p>
            )}
          </div>
        )}

        {/* Top Selling Frames */}
        {overview.topSellingFrames && overview.topSellingFrames.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Frames</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {overview.topSellingFrames.map((frame, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {frame.name || frame.product_name || `Frame ${index + 1}`}
                  </p>
                  <p className="text-xs text-gray-600">
                    Sales: {frame.sales || frame.count || 0}
                  </p>
                  {frame.revenue && (
                    <p className="text-xs text-gray-600">
                      Revenue: ${frame.revenue.toFixed(2)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Additional Data Display */}
      {overview.additionalData && Object.keys(overview.additionalData).length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(overview.additionalData).map(([key, value]) => (
              <div key={key} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 capitalize mb-1">
                  {key.replace(/_/g, ' ')}
                </p>
                <p className="text-sm text-gray-900">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;

