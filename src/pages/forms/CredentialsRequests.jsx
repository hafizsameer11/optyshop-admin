import React, { useState, useEffect } from 'react';
import { FiMail, FiUser, FiPhone, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { API_ROUTES } from '../../config/apiRoutes';
import SubmissionsTable from '../../components/SubmissionsTable';
import SubmissionDrawer from '../../components/SubmissionDrawer';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const CredentialsRequests = () => {
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
            const url = `${API_ROUTES.ADMIN.CREDENTIALS_REQUESTS.LIST}${queryString ? `?${queryString}` : ''}`;
            
            const response = await api.get(url);
            const requestsData = response.data?.data?.requests || response.data?.requests || [];
            setData(Array.isArray(requestsData) ? requestsData : []);
            
            if (response.data?.data?.count !== undefined) {
                setPagination(prev => ({ 
                    ...prev, 
                    total: response.data.data.count,
                    totalPages: Math.ceil(response.data.data.count / prev.limit) 
                }));
            } else if (response.data?.meta) {
                setPagination(prev => ({ 
                    ...prev, 
                    ...response.data.meta, 
                    totalPages: Math.ceil(response.data.meta.total / response.data.meta.limit) 
                }));
            }
        } catch (error) {
            console.error("Failed to fetch credentials requests", error);
            if (error.response?.status !== 404) {
                toast.error("Failed to load credentials requests");
            }
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = async (item) => {
        try {
            const response = await api.get(API_ROUTES.ADMIN.CREDENTIALS_REQUESTS.BY_ID(item.id));
            const request = response.data?.data?.request || response.data?.request;
            setSelectedItem(request);
            setDrawerOpen(true);
        } catch (error) {
            console.error("Failed to fetch credentials request details", error);
            // Fallback to item data if detail fetch fails
            setSelectedItem(item);
            setDrawerOpen(true);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this credentials request?')) {
            return;
        }
        try {
            await api.delete(API_ROUTES.ADMIN.CREDENTIALS_REQUESTS.DELETE(id));
            toast.success('Credentials request deleted successfully');
            fetchData();
            if (drawerOpen && selectedItem?.id === id) {
                setDrawerOpen(false);
                setSelectedItem(null);
            }
        } catch (error) {
            console.error("Failed to delete credentials request", error);
            toast.error(error.response?.data?.message || "Failed to delete credentials request");
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
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Credentials Requests</h1>
                    <p className="text-sm text-gray-500">Manage credentials access requests</p>
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

            <SubmissionsTable
                data={data}
                columns={columns}
                loading={loading}
                pagination={pagination}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                onRowClick={handleRowClick}
                emptyMessage="No credentials requests found."
            />

            <SubmissionDrawer
                isOpen={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedItem(null);
                }}
                title={`Credentials Request #${selectedItem?.id}`}
                data={selectedItem}
                fields={drawerFields}
                formType="Credentials Request"
            />
        </div>
    );
};

export default CredentialsRequests;

