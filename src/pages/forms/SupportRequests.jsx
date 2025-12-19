import React, { useState, useEffect } from 'react';
import { FiMail, FiUser, FiPhone, FiMessageSquare, FiTrash2, FiTag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { API_ROUTES } from '../../config/apiRoutes';
import SubmissionsTable from '../../components/SubmissionsTable';
import SubmissionDrawer from '../../components/SubmissionDrawer';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const SupportRequests = () => {
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
            // GET /api/admin/requests/support (Admin endpoint)
            // Endpoint: GET {{base_url}}/api/admin/requests/support
            // Auth: Authorization: Bearer {{admin_token}}
            const url = `${API_ROUTES.ADMIN.SUPPORT_REQUESTS.LIST}${queryString ? `?${queryString}` : ''}`;
            
            const response = await api.get(url);
            console.log('Support requests API Response:', JSON.stringify(response.data, null, 2));
            
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
                    } else if (dataObj.supportRequests && Array.isArray(dataObj.supportRequests)) {
                        requestsData = dataObj.supportRequests;
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
                    } else if (response.data.supportRequests && Array.isArray(response.data.supportRequests)) {
                        requestsData = response.data.supportRequests;
                    }
                }
            }
            
            console.log('Parsed support requests:', requestsData);
            console.log('Parsed support requests count:', requestsData.length);
            
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
            console.error("Failed to fetch support requests", error);
            console.error("Error details:", error.response?.data);
            console.error("Error status:", error.response?.status);
            setData([]);
            if (error.response?.status === 401) {
                toast.error('Authentication required. Please log in again.');
            } else if (error.response?.status === 404) {
                toast.error('Support requests endpoint not found. Check API configuration.');
            } else if (!error.response) {
                toast.error('Cannot connect to server. Check if backend is running.');
            } else {
                toast.error(error.response?.data?.message || "Failed to load support requests");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = async (item) => {
        try {
            const response = await api.get(API_ROUTES.ADMIN.SUPPORT_REQUESTS.BY_ID(item.id));
            const request = response.data?.data?.request || response.data?.request;
            setSelectedItem(request);
            setDrawerOpen(true);
        } catch (error) {
            console.error("Failed to fetch support request details", error);
            // Fallback to item data if detail fetch fails
            setSelectedItem(item);
            setDrawerOpen(true);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this support request?')) {
            return;
        }
        try {
            await api.delete(API_ROUTES.ADMIN.SUPPORT_REQUESTS.DELETE(id));
            toast.success('Support request deleted successfully');
            fetchData();
            if (drawerOpen && selectedItem?.id === id) {
                setDrawerOpen(false);
                setSelectedItem(null);
            }
        } catch (error) {
            console.error("Failed to delete support request", error);
            toast.error(error.response?.data?.message || "Failed to delete support request");
        }
    };

    const columns = [
        { 
            title: 'Date', 
            dataIndex: 'createdAt', 
            render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A' 
        },
        { 
            title: 'Name', 
            dataIndex: 'fullName',
            render: (row) => <span className="font-medium text-gray-900">{row.fullName || `${row.firstName} ${row.lastName}`}</span> 
        },
        { 
            title: 'Email', 
            dataIndex: 'email', 
            render: (row) => <span className="text-gray-500">{row.email}</span> 
        },
        { 
            title: 'Phone', 
            dataIndex: 'phoneNumber', 
            render: (row) => <span className="text-gray-500">{row.phoneNumber || '-'}</span> 
        },
        { 
            title: 'Solutions', 
            dataIndex: 'solutionsConcerned',
            render: (row) => {
                if (!row.solutionsConcerned || !Array.isArray(row.solutionsConcerned) || row.solutionsConcerned.length === 0) {
                    return <span className="text-gray-400">-</span>;
                }
                return (
                    <div className="flex flex-wrap gap-1">
                        {row.solutionsConcerned.slice(0, 2).map((solution, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                                {solution.replace(/-/g, ' ')}
                            </span>
                        ))}
                        {row.solutionsConcerned.length > 2 && (
                            <span className="px-2 py-1 text-xs text-gray-500">
                                +{row.solutionsConcerned.length - 2}
                            </span>
                        )}
                    </div>
                );
            }
        },
        { 
            title: 'Message', 
            dataIndex: 'message', 
            render: (row) => <span className="text-gray-400 truncate max-w-xs block">{row.message?.substring(0, 50) || '-'}...</span> 
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
        { label: 'First Name', key: 'firstName', icon: FiUser },
        { label: 'Last Name', key: 'lastName', icon: FiUser },
        { label: 'Full Name', key: 'fullName', icon: FiUser },
        { label: 'Email Address', key: 'email', icon: FiMail },
        { label: 'Phone Number', key: 'phoneNumber', icon: FiPhone },
        { 
            label: 'Solutions Concerned', 
            key: 'solutionsConcerned', 
            icon: FiTag,
            type: 'array'
        },
        { label: 'Message', key: 'message', icon: FiMessageSquare, type: 'long-text' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Support Requests</h1>
                    <p className="text-sm text-gray-500">Manage customer support inquiries</p>
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
                emptyMessage="No support requests found."
            />

            <SubmissionDrawer
                isOpen={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedItem(null);
                }}
                title={`Support Request #${selectedItem?.id}`}
                data={selectedItem}
                fields={drawerFields}
                formType="Support Request"
            />
        </div>
    );
};

export default SupportRequests;

