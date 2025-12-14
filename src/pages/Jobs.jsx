import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiEye } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import JobModal from '../components/JobModal';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [expandedJobId, setExpandedJobId] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.ADMIN.JOBS.LIST);
      // API response structure: { success: true, message: "...", data: { jobs: [...] } }
      const jobsData = response.data?.data?.jobs || response.data?.jobs || [];
      setJobs(Array.isArray(jobsData) ? jobsData : []);
    } catch (error) {
      console.error('Jobs API error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot fetch jobs');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        toast.error('Failed to fetch jobs');
      }
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedJob(null);
    setIsModalOpen(true);
  };

  const handleEdit = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  const handleModalSuccess = () => {
    fetchJobs();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job? This will also delete all associated applications.')) {
      return;
    }

    try {
      await api.delete(API_ROUTES.ADMIN.JOBS.DELETE(id));
      toast.success('Job deleted successfully');
      fetchJobs();
    } catch (error) {
      console.error('Job delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete job');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete job';
        toast.error(errorMessage);
      }
    }
  };

  const toggleApplications = (jobId) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const parseRequirements = (requirements) => {
    if (!requirements) return [];
    try {
      if (typeof requirements === 'string') {
        return JSON.parse(requirements);
      }
      return Array.isArray(requirements) ? requirements : [];
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Job</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => {
                const applications = job.applications || [];
                const requirements = parseRequirements(job.requirements);
                const isExpanded = expandedJobId === job.id;

                return (
                  <React.Fragment key={job.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{job.title}</div>
                        {job.slug && (
                          <div className="text-sm text-gray-500">/{job.slug}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.department || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.location || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleApplications(job.id)}
                          className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-900"
                        >
                          <FiUsers />
                          <span>{applications.length} application{applications.length !== 1 ? 's' : ''}</span>
                          {applications.length > 0 && (
                            <FiEye className={isExpanded ? 'rotate-180' : ''} />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            job.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {job.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleEdit(job)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                          title="Edit job"
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          onClick={() => handleDelete(job.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete job"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            {/* Job Details */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                                <p className="text-sm text-gray-600">{job.description || 'No description provided'}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Requirements</h4>
                                <ul className="text-sm text-gray-600 list-disc list-inside">
                                  {requirements.length > 0 ? (
                                    requirements.map((req, idx) => (
                                      <li key={idx}>{req}</li>
                                    ))
                                  ) : (
                                    <li>No requirements listed</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                            {job.apply_url && (
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Apply URL</h4>
                                <a 
                                  href={job.apply_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary-600 hover:underline"
                                >
                                  {job.apply_url}
                                </a>
                              </div>
                            )}
                            
                            {/* Applications Table */}
                            {applications.length > 0 ? (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Applications</h4>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                          Name
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                          Email
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                          Applied Date
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {applications.map((application) => (
                                        <tr key={application.id}>
                                          <td className="px-4 py-2 text-sm text-gray-900">
                                            {application.first_name} {application.last_name}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-600">
                                            {application.email}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-600">
                                            {application.created_at 
                                              ? new Date(application.created_at).toLocaleDateString()
                                              : 'N/A'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                No applications yet for this job posting.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {jobs.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No jobs found. Click "Add Job" to create one.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <JobModal
          job={selectedJob}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default Jobs;

