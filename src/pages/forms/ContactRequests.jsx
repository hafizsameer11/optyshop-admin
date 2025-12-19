import React, { useState, useEffect } from 'react';
import { FiMail, FiUser, FiMapPin, FiBriefcase, FiMessageSquare, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { API_ROUTES } from '../../config/apiRoutes';
import SubmissionsTable from '../../components/SubmissionsTable';
import SubmissionDrawer from '../../components/SubmissionDrawer';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useI18n } from '../../context/I18nContext';

const ContactRequests = () => {
    const { t } = useI18n();
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
            const url = `${API_ROUTES.ADMIN.CONTACT_REQUESTS.LIST}${queryString ? `?${queryString}` : ''}`;
            
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
            console.error("Failed to fetch contact requests", error);
            if (error.response?.status !== 404) {
                toast.error(`${t('failedToLoad')} ${t('contactRequests').toLowerCase()}`);
            }
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (item) => {
        setSelectedItem(item);
        setDrawerOpen(true);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm(`${t('areYouSure')} ${t('contactRequests').toLowerCase()}?`)) {
            return;
        }
        try {
            await api.delete(API_ROUTES.ADMIN.CONTACT_REQUESTS.DELETE(id));
            toast.success(`${t('contactRequests')} ${t('deletedSuccessfully')}`);
            fetchData();
            if (drawerOpen && selectedItem?.id === id) {
                setDrawerOpen(false);
                setSelectedItem(null);
            }
        } catch (error) {
            console.error("Failed to delete contact request", error);
            toast.error(error.response?.data?.message || `${t('failedToDelete')} ${t('contactRequests').toLowerCase()}`);
        }
    };

    const columns = [
        { 
            title: t('date'), 
            dataIndex: 'createdAt', 
            render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A' 
        },
        { 
            title: t('name'), 
            dataIndex: 'fullName',
            render: (row) => <span className="font-medium text-gray-900">{row.fullName || `${row.firstName} ${row.lastName}`}</span> 
        },
        { 
            title: t('email'), 
            dataIndex: 'email', 
            render: (row) => <span className="text-gray-500">{row.email}</span> 
        },
        { title: t('country'), dataIndex: 'country' },
        { title: t('company'), dataIndex: 'companyName' },
        { 
            title: t('message'), 
            dataIndex: 'message', 
            render: (row) => <span className="text-gray-400 truncate max-w-xs block">{row.message?.substring(0, 50)}...</span> 
        },
        {
            title: t('actions'),
            render: (row) => (
                <button
                    onClick={(e) => handleDelete(row.id, e)}
                    className="text-red-600 hover:text-red-900"
                    title={t('delete')}
                >
                    <FiTrash2 className="w-5 h-5" />
                </button>
            )
        },
    ];

    const drawerFields = [
        { label: t('fullName'), key: 'fullName', icon: FiUser },
        { label: t('emailAddress'), key: 'email', icon: FiMail },
        { label: t('company'), key: 'companyName', icon: FiBriefcase },
        { label: t('country'), key: 'country', icon: FiMapPin },
        { label: t('message'), key: 'message', icon: FiMessageSquare, type: 'long-text' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('contactRequests')}</h1>
                    <p className="text-sm text-gray-500">{t('manageInquiries')}</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <LanguageSwitcher variant="compact" />
                    <div className="w-full md:w-64">
                        <input
                            type="text"
                            placeholder={t('searchRequests')}
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
                emptyMessage={t('noContactRequests')}
            />

            <SubmissionDrawer
                isOpen={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedItem(null);
                }}
                title={`Contact Request #${selectedItem?.id}`}
                data={selectedItem}
                fields={drawerFields}
                formType="Contact Request"
            />
        </div>
    );
};

export default ContactRequests;
