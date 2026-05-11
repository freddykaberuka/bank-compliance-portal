import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { createApplication, fetchApplications } from '../features/applications/applicationsSlice';

const Applications: React.FC = () => {
  const dispatch = useAppDispatch();
  const { applications, loading, error, createLoading, createError } = useAppSelector((state) => state.applications);
  const [institutionName, setInstitutionName] = useState('');
  const [licenseType, setLicenseType] = useState('COMMERCIAL_BANK');
  const [description, setDescription] = useState('');
  const [formMessage, setFormMessage] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchApplications());
  }, [dispatch]);

  const getStatusBadge = (state: string) => {
    const statusClasses = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      NEEDS_MORE_INFO: 'bg-orange-100 text-orange-800',
      REVIEWED: 'bg-purple-100 text-purple-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[state as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {state.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCreate = async () => {
    if (!institutionName.trim()) {
      setFormMessage('Institution name is required.');
      return;
    }

    setFormMessage(null);

    dispatch(createApplication({ institutionName: institutionName.trim(), licenseType, description: description.trim() }))
      .unwrap()
      .then(() => {
        setFormMessage('Application created.');
        setInstitutionName('');
        setLicenseType('COMMERCIAL_BANK');
        setDescription('');
      })
      .catch(() => {
        setFormMessage(null);
      });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            <strong>Error:</strong> {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-600 mt-2">Manage and track your banking license applications</p>
      </div>
      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Create new application</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Institution Name</label>
            <input
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter institution name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">License Type</label>
            <select
              value={licenseType}
              onChange={(e) => setLicenseType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="COMMERCIAL_BANK">Commercial Bank</option>
              <option value="RETAIL_BANK">Retail Bank</option>
              <option value="INVESTMENT_BANK">Investment Bank</option>
              <option value="CREDIT_UNION">Credit Union</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              placeholder="Optional description"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={handleCreate}
              disabled={createLoading}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {createLoading ? 'Creating...' : 'Create application'}
            </button>
            {(formMessage || createError) && (
              <p className={`text-sm ${createError ? 'text-red-600' : 'text-green-700'}`}>
                {createError || formMessage}
              </p>
            )}
          </div>
        </div>
      </section>

      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new application.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Institution Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reviewer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={`/dashboard/applications/${application.id}`} className="text-blue-600 hover:text-blue-800">
                        {application.institutionName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.licenseType.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(application.state)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.reviewedByUser?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(application.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;