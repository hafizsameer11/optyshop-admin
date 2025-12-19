import React, { useState, useEffect } from 'react';
import { FiMail, FiBriefcase, FiBarChart2, FiBox, FiStar, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { API_ROUTES } from '../../config/apiRoutes';
import SubmissionsTable from '../../components/SubmissionsTable';
import SubmissionDrawer from '../../components/SubmissionDrawer';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const PricingRequests = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [pagination.page, search]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (pagination.page) params.append('page', pagination.page);
            if (pagination.limit) params.append('limit', pagination.limit);
            if (search) params.append('search', search);
            
            const queryString = params.toString();
            // GET /api/admin/requests/pricing (Admin endpoint)
            // Endpoint: GET {{base_url}}/api/admin/requests/pricing
            // Auth: Authorization: Bearer {{admin_token}}
            const url = `${API_ROUTES.ADMIN.PRICING_REQUESTS.LIST}${queryString ? `?${queryString}` : ''}`;
            
            const response = await api.get(url);
            console.log('Pricing requests API Response:', JSON.stringify(response.data, null, 2));
            
            // Handle various response structures from the API
            // Possible formats:
            // 1. { success: true, data: { data: [...], pagination: {...} } }
            // 2. { success: true, data: { requests: [...], count: N } }
            // 3. { success: true, data: [...] }
            // 4. { data: [...], pagination: {...} }
            // 5. { requests: [...], count: N }
            // 6. [...] (direct array)
            let requestsData = [];
            
            if (response.data) {
                // Check for nested data structure
                if (response.data.data) {
                    const dataObj = response.data.data;
                    
                    // If data is directly an array
                    if (Array.isArray(dataObj)) {
                        requestsData = dataObj;
                    } 
                    // Check for various property names in nested data
                    else if (dataObj.requests && Array.isArray(dataObj.requests)) {
                        requestsData = dataObj.requests;
                    } else if (dataObj.data && Array.isArray(dataObj.data)) {
                        requestsData = dataObj.data;
                    } else if (dataObj.results && Array.isArray(dataObj.results)) {
                        requestsData = dataObj.results;
                    } else if (dataObj.pricingRequests && Array.isArray(dataObj.pricingRequests)) {
                        requestsData = dataObj.pricingRequests;
                    }
                } 
                // Check if response.data is directly an array
                else if (Array.isArray(response.data)) {
                    requestsData = response.data;
                } 
                // Check for various property names at root level
                else {
                    if (response.data.requests && Array.isArray(response.data.requests)) {
                        requestsData = response.data.requests;
                    } else if (response.data.data && Array.isArray(response.data.data)) {
                        requestsData = response.data.data;
                    } else if (response.data.results && Array.isArray(response.data.results)) {
                        requestsData = response.data.results;
                    } else if (response.data.pricingRequests && Array.isArray(response.data.pricingRequests)) {
                        requestsData = response.data.pricingRequests;
                    }
                }
            }
            
            console.log('Parsed pricing requests:', requestsData);
            console.log('Parsed pricing requests count:', requestsData.length);
            
            setData(Array.isArray(requestsData) ? requestsData : []);
            
            // Handle pagination
            if (response.data?.data?.count !== undefined) {
                setPagination(prev => ({ 
                    ...prev, 
                    total: response.data.data.count,
                    totalPages: Math.ceil(response.data.data.count / prev.limit) 
                }));
            } else if (response.data?.data?.total !== undefined) {
                setPagination(prev => ({ 
                    ...prev, 
                    total: response.data.data.total,
                    totalPages: Math.ceil(response.data.data.total / prev.limit) 
                }));
            } else if (response.data?.pagination) {
                setPagination(prev => ({ 
                    ...prev, 
                    total: response.data.pagination.total || response.data.pagination.count || 0,
                    totalPages: response.data.pagination.totalPages || Math.ceil((response.data.pagination.total || response.data.pagination.count || 0) / prev.limit)
                }));
            } else if (response.data?.meta) {
                setPagination(prev => ({ 
                    ...prev, 
                    ...response.data.meta, 
                    totalPages: Math.ceil((response.data.meta.total || 0) / (response.data.meta.limit || prev.limit)) 
                }));
            } else if (requestsData.length > 0) {
                // If we have data but no pagination info, assume all data is loaded
                setPagination(prev => ({ 
                    ...prev, 
                    total: requestsData.length,
                    totalPages: 1
                }));
            }
        } catch (error) {
            console.error("Failed to fetch pricing requests", error);
            console.error("Error details:", error.response?.data);
            console.error("Error status:", error.response?.status);
            setData([]);
            if (error.response?.status === 401) {
                toast.error('Authentication required. Please log in again.');
            } else if (error.response?.status === 404) {
                toast.error('Pricing requests endpoint not found. Check API configuration.');
            } else if (!error.response) {
                toast.error('Cannot connect to server. Check if backend is running.');
            } else {
                toast.error(error.response?.data?.message || "Failed to load pricing requests");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = async (item) => {
        try {
            const response = await api.get(API_ROUTES.ADMIN.PRICING_REQUESTS.BY_ID(item.id));
            const request = response.data?.data?.request || response.data?.request;
            setSelectedItem(request);
            setDrawerOpen(true);
        } catch (error) {
            console.error("Failed to fetch pricing request details", error);
            // Fallback to item data if detail fetch fails
            setSelectedItem(item);
            setDrawerOpen(true);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this pricing request?')) {
            return;
        }
        try {
            await api.delete(API_ROUTES.ADMIN.PRICING_REQUESTS.DELETE(id));
            toast.success('Pricing request deleted successfully');
            fetchData();
            if (drawerOpen && selectedItem?.id === id) {
                setDrawerOpen(false);
                setSelectedItem(null);
            }
        } catch (error) {
            console.error("Failed to delete pricing request", error);
            toast.error(error.response?.data?.message || "Failed to delete pricing request");
        }
    };

    const columns = [
        { 
            title: 'Date', 
            dataIndex: 'createdAt', 
            render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : (row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A')
        },
        { title: 'Email', dataIndex: 'email', render: (row) => <span className="font-medium text-gray-900">{row.email}</span> },
        { title: 'Company', dataIndex: 'companyName', render: (row) => row.companyName || row.company || '-' },
        { title: 'Monthly Traffic', dataIndex: 'monthlyTraffic', render: (row) => row.monthlyTraffic || '-' },
        { title: 'SKU Count', dataIndex: 'skuCount', render: (row) => row.skuCount || '-' },
        {
            title: 'Priority', 
            dataIndex: 'priority', 
            render: (row) => row.priority ? (
                <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                    row.priority === 'High' ? 'bg-red-100 text-red-700' :
                    row.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                }`}>
                    {row.priority}
                </span>
            ) : '-'
        },
        {
            title: 'Actions',
            render: (row) => (
                <button
                    onClick={(e) => handleDelete(row.id, e)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                >
                    <FiTrash2 className="w-5 h-5" />
                </button>
            )
        },
    ];

    const drawerFields = [
        { label: 'Email Address', key: 'email', icon: FiMail },
        { label: 'Company', key: 'companyName', icon: FiBriefcase },
        { label: 'Monthly Traffic', key: 'monthlyTraffic', icon: FiBarChart2 },
        { label: 'SKU Count', key: 'skuCount', icon: FiBox },
        { label: 'Priority Level', key: 'priority', icon: FiStar },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pricing Requests</h1>
                    <p className="text-sm text-gray-500">Manage high-value pricing inquiries</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <LanguageSwitcher variant="compact" />
                    <div className="w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search requests..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <SubmissionsTable
                data={data}
                columns={columns}
                loading={loading}
                pagination={pagination}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                onRowClick={handleRowClick}
                emptyMessage="No pricing requests found."
            />

            <SubmissionDrawer
                isOpen={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedItem(null);
                }}
                title={`Pricing Inquiry #${selectedItem?.id}`}
                data={selectedItem}
                fields={drawerFields}
                formType="Pricing Request"
            />
        </div>
    );
};

export default PricingRequests;
