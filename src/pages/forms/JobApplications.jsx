import React, { useState, useEffect } from 'react';
import { FiMail, FiUser, FiLinkedin, FiGlobe, FiFileText, FiPhone, FiCheck, FiX, FiEdit, FiTrash2, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { API_ROUTES } from '../../config/apiRoutes';
import SubmissionsTable from '../../components/SubmissionsTable';
import JobApplicationDrawer from '../../components/JobApplicationDrawer';

const JobApplications = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedItem, setSelectedItem] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [pagination.page, search, statusFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (pagination.page) params.append('page', pagination.page);
            if (pagination.limit) params.append('limit', pagination.limit);
            if (search) params.append('search', search);
            if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
            
            const queryString = params.toString();
            const url = `${API_ROUTES.ADMIN.JOB_APPLICATIONS.LIST}${queryString ? `?${queryString}` : ''}`;
            
            const response = await api.get(url);
            const applicationsData = response.data?.data?.applications || response.data?.applications || [];
            setData(Array.isArray(applicationsData) ? applicationsData : []);
            
            if (response.data?.meta) {
                setPagination(prev => ({ 
                    ...prev, 
                    ...response.data.meta, 
                    totalPages: Math.ceil(response.data.meta.total / response.data.meta.limit) 
                }));
            }
        } catch (error) {
            console.error("Failed to fetch job applications", error);
            if (error.response?.status !== 404) {
                toast.error("Failed to load job applications");
            }
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (item) => {
        fetchApplicationDetails(item.id);
    };

    const fetchApplicationDetails = async (id) => {
        try {
            const response = await api.get(API_ROUTES.ADMIN.JOB_APPLICATIONS.BY_ID(id));
            const application = response.data?.data?.application || response.data?.application;
            setSelectedItem(application);
            setDrawerOpen(true);
        } catch (error) {
            console.error("Failed to fetch application details", error);
            toast.error("Failed to load application details");
        }
    };

    const handleAccept = async (id) => {
        try {
            const response = await api.post(API_ROUTES.ADMIN.JOB_APPLICATIONS.ACCEPT(id));
            toast.success(response.data?.message || 'Application accepted successfully');
            fetchData();
            if (drawerOpen && selectedItem?.id === id) {
                fetchApplicationDetails(id);
            }
        } catch (error) {
            console.error("Failed to accept application", error);
            toast.error(error.response?.data?.message || "Failed to accept application");
        }
    };

    const handleReject = async (id) => {
        try {
            const response = await api.post(API_ROUTES.ADMIN.JOB_APPLICATIONS.REJECT(id));
            toast.success(response.data?.message || 'Application rejected successfully');
            fetchData();
            if (drawerOpen && selectedItem?.id === id) {
                fetchApplicationDetails(id);
            }
        } catch (error) {
            console.error("Failed to reject application", error);
            toast.error(error.response?.data?.message || "Failed to reject application");
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this application?')) {
            return;
        }
        try {
            await api.delete(API_ROUTES.ADMIN.JOB_APPLICATIONS.DELETE(id));
            toast.success('Application deleted successfully');
            fetchData();
            if (drawerOpen && selectedItem?.id === id) {
                setDrawerOpen(false);
                setSelectedItem(null);
            }
        } catch (error) {
            console.error("Failed to delete application", error);
            toast.error(error.response?.data?.message || "Failed to delete application");
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            accepted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Accepted' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const downloadResume = (resumeCv, firstName, lastName) => {
        if (!resumeCv) {
            toast.error('Resume not available');
            return;
        }
        try {
            // Decode base64 and create download
            const byteCharacters = atob(resumeCv);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${firstName}_${lastName}_resume.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download resume', error);
            toast.error('Failed to download resume');
        }
    };

    const columns = [
        { 
            title: 'Date', 
            dataIndex: 'created_at', 
            render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A' 
        },
        { 
            title: 'Name', 
            render: (row) => (
                <span className="font-medium text-gray-900">
                    {row.first_name} {row.last_name}
                </span>
            )
        },
        { title: 'Email', dataIndex: 'email' },
        { 
            title: 'Phone', 
            dataIndex: 'phone_number',
            render: (row) => row.phone_number || '-'
        },
        { 
            title: 'Job', 
            render: (row) => row.job ? (
                <span className="text-sm text-gray-600">
                    {row.job.title}
                    {row.job.department && ` - ${row.job.department}`}
                </span>
            ) : (
                <span className="text-gray-400 italic">General Application</span>
            )
        },
        { 
            title: 'Status', 
            dataIndex: 'status',
            render: (row) => getStatusBadge(row.status)
        },
        {
            title: 'Actions',
            render: (row) => (
                <div className="flex items-center space-x-2">
                    {row.status === 'pending' && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAccept(row.id);
                                }}
                                className="text-green-600 hover:text-green-900"
                                title="Accept"
                            >
                                <FiCheck className="w-5 h-5" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleReject(row.id);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Reject"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </>
                    )}
                    <button
                        onClick={(e) => handleDelete(row.id, e)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                    >
                        <FiTrash2 className="w-5 h-5" />
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Job Applications</h1>
                    <p className="text-sm text-gray-500">Review and manage job applications</p>
                </div>
                <div className="flex gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all shadow-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Search applicants..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all shadow-sm"
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
                emptyMessage="No job applications found."
            />

            <JobApplicationDrawer
                isOpen={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedItem(null);
                }}
                application={selectedItem}
                onAccept={handleAccept}
                onReject={handleReject}
                onDelete={handleDelete}
                onRefresh={fetchApplicationDetails}
            />
        </div>
    );
};

export default JobApplications;
