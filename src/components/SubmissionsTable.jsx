import React from 'react';
import { FiChevronLeft, FiChevronRight, FiSearch, FiFolder } from 'react-icons/fi';
import LanguageSwitcher from './LanguageSwitcher';

const SubmissionsTable = ({
    data = [],
    columns = [],
    loading = false,
    pagination = { page: 1, total: 0, limit: 10, totalPages: 1 },
    onPageChange,
    onRowClick,
    emptyMessage = "No submissions found"
}) => {
    if (loading) {
        return (
            <div className="w-full h-64 flex flex-col items-center justify-center space-y-4 glass-card">
                <div className="spinner"></div>
                <p className="text-gray-500 animate-pulse">Loading data...</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="w-full h-64 flex flex-col items-center justify-center space-y-4 glass-card">
                <div className="p-4 bg-gray-50 rounded-full">
                    <FiFolder className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 flex items-center justify-end">
                <LanguageSwitcher variant="compact" />
            </div>
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                    style={{ width: col.width }}
                                >
                                    {col.title}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((row, rowIdx) => (
                            <tr
                                key={row.id || rowIdx}
                                onClick={() => onRowClick && onRowClick(row)}
                                className={`
                  transition-colors duration-200 
                  ${onRowClick ? 'cursor-pointer hover:bg-indigo-50/50' : ''}
                `}
                            >
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                        {col.render ? col.render(row) : row[col.dataIndex]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-gray-100 p-4 flex items-center justify-between bg-white/30">
                <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onPageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FiChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="px-4 py-1 bg-indigo-50 text-indigo-700 rounded-md font-medium text-sm">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>

                    <button
                        onClick={() => onPageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FiChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubmissionsTable;
