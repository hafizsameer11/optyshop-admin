import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiMail, FiPhone, FiLinkedin, FiGlobe, FiFileText, FiCheck, FiX as FiXIcon, FiEdit, FiTrash2, FiDownload, FiBriefcase, FiMessageSquare, FiCalendar } from 'react-icons/fi';
import { sendFormSubmissionEmail } from '../utils/emailService';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

const JobApplicationDrawer = ({ isOpen, onClose, application, onAccept, onReject, onDelete, onRefresh }) => {
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('pending');
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    useEffect(() => {
        if (application) {
            setNotes(application.notes || '');
            setStatus(application.status || 'pending');
            setIsEditing(false);
        }
    }, [application]);

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

    if (!isOpen || !application) return null;

    const downloadResume = () => {
        if (!application.resume_cv) {
            toast.error('Resume not available');
            return;
        }
        try {
            // Convert base64 to data URL (HTTPS-compatible)
            const dataUrl = `data:application/pdf;base64,${application.resume_cv}`;
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${application.first_name}_${application.last_name}_resume.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Resume downloaded successfully');
        } catch (error) {
            console.error('Failed to download resume', error);
            toast.error('Failed to download resume');
        }
    };

    const downloadCoverLetter = () => {
        if (!application.cover_letter_file) {
            toast.error('Cover letter not available');
            return;
        }
        try {
            // Convert base64 to data URL (HTTPS-compatible)
            const dataUrl = `data:application/pdf;base64,${application.cover_letter_file}`;
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${application.first_name}_${application.last_name}_cover_letter.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Cover letter downloaded successfully');
        } catch (error) {
            console.error('Failed to download cover letter', error);
            toast.error('Failed to download cover letter');
        }
    };

    const handleStatusUpdate = async () => {
        try {
            setSaving(true);
            const response = await api.put(API_ROUTES.ADMIN.JOB_APPLICATIONS.UPDATE_STATUS(application.id), {
                status,
                notes: notes.trim() || null
            });
            toast.success(response.data?.message || 'Status updated successfully');
            setIsEditing(false);
            if (onRefresh) {
                onRefresh(application.id);
            }
        } catch (error) {
            console.error('Failed to update status', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        } finally {
            setSaving(false);
        }
    };

    const handleSendEmail = async () => {
        if (!areAllFieldsFilled()) {
            toast.error('Cannot send email: Some fields are missing');
            return;
        }

        setSendingEmail(true);
        try {
            // Format application data for email
            const emailData = {
                first_name: application.first_name,
                last_name: application.last_name,
                email: application.email,
                phone_number: application.phone_number || 'N/A',
                linkedin_profile: application.linkedin_profile || 'N/A',
                portfolio_website: application.portfolio_website || 'N/A',
                why_join_message: application.why_join_message || 'N/A',
                job: application.job ? `${application.job.title} - ${application.job.department}` : 'General Application',
                status: application.status,
                notes: application.notes || 'N/A',
            };

            const emailSent = await sendFormSubmissionEmail(
                emailData,
                'Job Application',
                null
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

    const areAllFieldsFilled = () => {
        const requiredFields = ['first_name', 'last_name', 'email', 'phone_number', 'why_join_message'];
        for (const field of requiredFields) {
            if (!application[field] || (typeof application[field] === 'string' && !application[field].trim())) {
                return false;
            }
        }
        return true;
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            accepted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Accepted' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="absolute inset-y-0 right-0 max-w-2xl w-full flex">
                <div className="relative w-full h-full bg-white shadow-2xl flex flex-col animate-slide-left border-l border-white/20">
                    {/* Header */}
                    <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900">
                                Application #{application.id}
                            </h2>
                            <div className="flex items-center gap-3 mt-2">
                                {getStatusBadge(application.status)}
                                {application.job && (
                                    <span className="text-sm text-gray-600">
                                        <FiBriefcase className="inline w-4 h-4 mr-1" />
                                        {application.job.title}
                                    </span>
                                )}
                            </div>
                            {application.created_at && (
                                <p className="text-sm text-gray-500 mt-1 flex items-center">
                                    <FiCalendar className="w-3 h-3 mr-1" />
                                    Applied: {new Date(application.created_at).toLocaleString()}
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
                        {/* Applicant Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Applicant Information</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                        <FiUser className="w-3 h-3 mr-2" />
                                        Full Name
                                    </div>
                                    <div className="text-gray-800 font-medium">
                                        {application.first_name} {application.last_name}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                        <FiMail className="w-3 h-3 mr-2" />
                                        Email Address
                                    </div>
                                    <div className="text-gray-800">
                                        <a href={`mailto:${application.email}`} className="text-indigo-600 hover:underline">
                                            {application.email}
                                        </a>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                        <FiPhone className="w-3 h-3 mr-2" />
                                        Phone Number
                                    </div>
                                    <div className="text-gray-800">
                                        {application.phone_number || 'N/A'}
                                    </div>
                                </div>

                                {application.linkedin_profile && (
                                    <div>
                                        <div className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                            <FiLinkedin className="w-3 h-3 mr-2" />
                                            LinkedIn Profile
                                        </div>
                                        <a
                                            href={application.linkedin_profile}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:underline break-words"
                                        >
                                            View Profile
                                        </a>
                                    </div>
                                )}

                                {application.portfolio_website && (
                                    <div>
                                        <div className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                            <FiGlobe className="w-3 h-3 mr-2" />
                                            Portfolio Website
                                        </div>
                                        <a
                                            href={application.portfolio_website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:underline break-words"
                                        >
                                            View Portfolio
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Documents</h3>
                            <div className="flex gap-4">
                                {application.resume_cv && (
                                    <button
                                        onClick={downloadResume}
                                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        <FiDownload className="w-4 h-4" />
                                        <span>Download Resume</span>
                                    </button>
                                )}
                                {application.cover_letter_file && (
                                    <button
                                        onClick={downloadCoverLetter}
                                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        <FiDownload className="w-4 h-4" />
                                        <span>Download Cover Letter</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Why Join Message */}
                        {application.why_join_message && (
                            <div>
                                <div className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    <FiMessageSquare className="w-3 h-3 mr-2" />
                                    Why Join Message
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl text-gray-700 text-sm whitespace-pre-wrap leading-relaxed border border-gray-100">
                                    {application.why_join_message}
                                </div>
                            </div>
                        )}

                        {/* Status & Notes */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Review & Status</h3>
                            
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="accepted">Accepted</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Notes
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows="4"
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                            placeholder="Add review notes..."
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleStatusUpdate}
                                            disabled={saving}
                                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setNotes(application.notes || '');
                                                setStatus(application.status || 'pending');
                                            }}
                                            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {application.notes && (
                                        <div>
                                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                                Notes
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-xl text-gray-700 text-sm whitespace-pre-wrap">
                                                {application.notes}
                                            </div>
                                        </div>
                                    )}
                                    {application.reviewed_at && (
                                        <div className="text-sm text-gray-500">
                                            Reviewed: {new Date(application.reviewed_at).toLocaleString()}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                    >
                                        <FiEdit className="w-4 h-4" />
                                        <span>Edit Status & Notes</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-3">
                        {areAllFieldsFilled() && (
                            <button
                                onClick={handleSendEmail}
                                disabled={sendingEmail}
                                className="w-full flex items-center justify-center space-x-2 bg-primary-500 text-white py-3 rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <FiMail className="w-4 h-4" />
                                <span>{sendingEmail ? 'Sending...' : 'Send Email Notification'}</span>
                            </button>
                        )}
                        {application.status === 'pending' && !isEditing && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onAccept(application.id)}
                                    className="flex-1 flex items-center justify-center space-x-2 bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-colors"
                                >
                                    <FiCheck className="w-4 h-4" />
                                    <span>Accept</span>
                                </button>
                                <button
                                    onClick={() => onReject(application.id)}
                                    className="flex-1 flex items-center justify-center space-x-2 bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-colors"
                                >
                                    <FiXIcon className="w-4 h-4" />
                                    <span>Reject</span>
                                </button>
                            </div>
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

export default JobApplicationDrawer;

