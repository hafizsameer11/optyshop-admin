import React, { useState, useEffect } from 'react';
import { FiMail, FiUser, FiBriefcase, FiGlobe, FiMessageSquare, FiTrash2, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { API_ROUTES } from '../../config/apiRoutes';
import SubmissionsTable from '../../components/SubmissionsTable';
import SubmissionDrawer from '../../components/SubmissionDrawer';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useI18n } from '../../context/I18nContext';

const DemoRequests = () => {
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
            const url = `${API_ROUTES.ADMIN.DEMO_REQUESTS.LIST}${queryString ? `?${queryString}` : ''}`;
            
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
            console.error("Failed to fetch demo requests", error);
            if (error.response?.status !== 404) {
                toast.error(`${t('failedToLoad')} ${t('demoRequests').toLowerCase()}`);
            }
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = async (item) => {
        try {
            const response = await api.get(API_ROUTES.ADMIN.DEMO_REQUESTS.BY_ID(item.id));
            const request = response.data?.data?.request || response.data?.request;
            setSelectedItem(request);
            setDrawerOpen(true);
        } catch (error) {
            console.error("Failed to fetch demo request details", error);
            // Fallback to item data if detail fetch fails
            setSelectedItem(item);
            setDrawerOpen(true);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm(`${t('areYouSure')} ${t('demoRequests').toLowerCase()}?`)) {
            return;
        }
        try {
            await api.delete(API_ROUTES.ADMIN.DEMO_REQUESTS.DELETE(id));
            toast.success(`${t('demoRequests')} ${t('deletedSuccessfully')}`);
            fetchData();
            if (drawerOpen && selectedItem?.id === id) {
                setDrawerOpen(false);
                setSelectedItem(null);
            }
        } catch (error) {
            console.error("Failed to delete demo request", error);
            toast.error(error.response?.data?.message || `${t('failedToDelete')} ${t('demoRequests').toLowerCase()}`);
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
            render: (row) => <span className="font-medium text-gray-900">{row.fullName || `${row.name} ${row.surname}`}</span> 
        },
        { title: t('email'), dataIndex: 'email' },
        { title: t('company'), dataIndex: 'companyName' },
        { title: t('village'), dataIndex: 'village' },
        { 
            title: t('website'), 
            dataIndex: 'websiteUrl',
            render: (row) => row.websiteUrl ? (
                <a href={row.websiteUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-indigo-600 hover:underline truncate max-w-xs block">
                    {row.websiteUrl}
                </a>
            ) : '-'
        },
        { 
            title: t('framesInCatalog'), 
            dataIndex: 'framesInCatalog',
            render: (row) => row.framesInCatalog || '-'
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
        { label: t('village'), key: 'village', icon: FiMapPin },
        { label: t('websiteUrl'), key: 'websiteUrl', icon: FiGlobe, type: 'link' },
        { label: t('framesInCatalog'), key: 'framesInCatalog', icon: FiBriefcase },
        { label: t('message'), key: 'message', icon: FiMessageSquare, type: 'long-text' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('demoRequests')}</h1>
                    <p className="text-sm text-gray-500">{t('manageDemoBookings')}</p>
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
                emptyMessage={t('noDemoRequests')}
            />

            <SubmissionDrawer
                isOpen={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedItem(null);
                }}
                title={`Demo Request #${selectedItem?.id}`}
                data={selectedItem}
                fields={drawerFields}
                formType="Demo Request"
            />
        </div>
    );
};

export default DemoRequests;
