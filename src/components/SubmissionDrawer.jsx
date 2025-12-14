import React, { useEffect, useState } from 'react';
import { FiX, FiCalendar, FiUser, FiMail, FiMapPin, FiBriefcase, FiGlobe, FiLinkedin, FiSend } from 'react-icons/fi';
import { sendFormSubmissionEmail } from '../utils/emailService';
import toast from 'react-hot-toast';

const SubmissionDrawer = ({ isOpen, onClose, title, data, fields = [], formType = 'Form' }) => {
    const [sendingEmail, setSendingEmail] = useState(false);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Check if all fields are filled
    const areAllFieldsFilled = () => {
        if (!data || !fields) return false;
        
        for (const field of fields) {
            // Skip status fields as they might be computed
            if (field.key === 'status') continue;
            
            const value = data[field.key];
            // Check if value exists and is not empty
            if (value === null || value === undefined || value === '' || 
                (typeof value === 'string' && !value.trim())) {
                return false;
            }
        }
        return true;
    };

    const handleSendEmail = async () => {
        if (!areAllFieldsFilled()) {
            toast.error('Cannot send email: Some fields are missing');
            return;
        }

        setSendingEmail(true);
        try {
            const emailSent = await sendFormSubmissionEmail(
                data,
                formType,
                null // Uses default admin email from env or 'admin@optyshop.com'
            );
            
            if (emailSent) {
                toast.success('Email notification sent successfully');
            } else {
                toast.error('Email service not available');
            }
        } catch (error) {
            console.error('Failed to send email notification:', error);
            toast.error('Failed to send email notification');
        } finally {
            setSendingEmail(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
                <div className="relative w-full h-full bg-white shadow-2xl flex flex-col animate-slide-left border-l border-white/20">

                    {/* Header */}
                    <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                            {data && (
                                <p className="text-sm text-gray-500 mt-1 flex items-center">
                                    <FiCalendar className="w-3 h-3 mr-1" />
                                    {data.createdAt ? new Date(data.createdAt).toLocaleString() : 
                                     data.created_at ? new Date(data.created_at).toLocaleString() : 
                                     'N/A'}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {!data ? (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                No data selected
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {fields.map((field, idx) => (
                                    <div key={idx} className="group">
                                        <div className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                            {field.icon && <field.icon className="w-3 h-3 mr-2" />}
                                            {field.label}
                                        </div>
                                        {field.type === 'link' ? (
                                            <a
                                                href={data[field.key]}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:text-indigo-700 hover:underline break-words"
                                            >
                                                {data[field.key] || 'N/A'}
                                            </a>
                                        ) : field.type === 'long-text' ? (
                                            <div className="p-4 bg-gray-50 rounded-xl text-gray-700 text-sm whitespace-pre-wrap leading-relaxed border border-gray-100 group-hover:bg-indigo-50/50 transition-colors">
                                                {data[field.key] || 'N/A'}
                                            </div>
                                        ) : field.type === 'array' ? (
                                            <div className="flex flex-wrap gap-2">
                                                {Array.isArray(data[field.key]) && data[field.key].length > 0 ? (
                                                    data[field.key].map((item, idx) => (
                                                        <span key={idx} className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full">
                                                            {typeof item === 'string' ? item.replace(/-/g, ' ') : String(item)}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400">None</span>
                                                )}
                                            </div>
                                        ) : field.render ? (
                                            <div className="text-gray-800 font-medium text-sm break-words border-b border-gray-50 pb-2">
                                                {field.render(data[field.key])}
                                            </div>
                                        ) : (
                                            <div className="text-gray-800 font-medium text-sm break-words border-b border-gray-50 pb-2">
                                                {data[field.key] || 'N/A'}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-3">
                        {areAllFieldsFilled() && (
                            <button
                                onClick={handleSendEmail}
                                disabled={sendingEmail}
                                className="w-full flex items-center justify-center space-x-2 bg-primary-500 text-white py-3 rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <FiSend className="w-4 h-4" />
                                <span>{sendingEmail ? 'Sending...' : 'Send Email Notification'}</span>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubmissionDrawer;
