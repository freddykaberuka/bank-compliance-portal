import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { selectAuthRole } from '../features/auth/authSelectors';
import { apiClient } from '../api';
import DocumentUpload, { MAX_FILE_SIZE } from '../components/DocumentUpload';
import type { ApplicationDocument } from '../features/applications/applicationDetailsSlice';
import {
  fetchApplicationDetails,
  fetchApplicationDocuments,
  performApplicationAction,
  resetApplicationDetails,
  uploadApplicationDocument,
} from '../features/applications/applicationDetailsSlice';

const statusClasses: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  NEEDS_MORE_INFO: 'bg-orange-100 text-orange-800',
  REVIEWED: 'bg-purple-100 text-purple-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const workflowSteps = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'REVIEWED',
  'APPROVED',
  'REJECTED',
];

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const formatFileSize = (size: number) => {
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)} MB`;
  if (size >= 1_000) return `${(size / 1_000).toFixed(1)} KB`;
  return `${size} B`;
};

const ApplicationDetails: React.FC = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const role = useAppSelector(selectAuthRole);
  const {
    application,
    documents,
    loading,
    documentsLoading,
    uploading,
    uploadProgress,
    actionLoading,
    error,
    uploadError,
  } = useAppSelector((state) => state.applicationDetails);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localUploadError, setLocalUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setSuccessMessage(null);
    dispatch(fetchApplicationDetails(id));
    dispatch(fetchApplicationDocuments(id));

    return () => {
      dispatch(resetApplicationDetails());
    };
  }, [dispatch, id]);

  const currentState = application?.state ?? '';

  const canSubmit = role === 'APPLICANT' && ['DRAFT', 'NEEDS_MORE_INFO'].includes(currentState);
  const canUpload = role === 'APPLICANT';
  const canReview = role === 'REVIEWER' && ['SUBMITTED', 'UNDER_REVIEW'].includes(currentState);
  const canRequestMoreInfo = role === 'REVIEWER' && ['SUBMITTED', 'UNDER_REVIEW'].includes(currentState);
  const canApproveOrReject = role === 'APPROVER' && currentState === 'REVIEWED';

  const actionsDisabled = actionLoading || loading;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (file && file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setLocalUploadError('File size must be 5MB or smaller.');
      return;
    }

    setSelectedFile(file);
    setLocalUploadError(null);
  };

  const actionSuccessMessage: Record<string, string> = {
    submit: 'Application submitted.',
    review: 'Application sent for review.',
    requestMoreInfo: 'Requested more information.',
    approve: 'Application approved.',
    reject: 'Application rejected.',
  };

  const handleUpload = () => {
    if (!id) return;
    if (!selectedFile) {
      setLocalUploadError('Choose a file to upload.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setLocalUploadError('File size must be 5MB or smaller.');
      return;
    }

    setLocalUploadError(null);
    dispatch(uploadApplicationDocument({ applicationId: id, file: selectedFile }))
      .unwrap()
      .then(() => {
        setSuccessMessage('Document uploaded successfully.');
        setSelectedFile(null);
      })
      .catch(() => {
        setSuccessMessage(null);
      });
  };

  const handleAction = (action: 'submit' | 'review' | 'requestMoreInfo' | 'approve' | 'reject') => {
    if (!id) return;
    dispatch(performApplicationAction({ applicationId: id, action }))
      .unwrap()
      .then(() => setSuccessMessage(actionSuccessMessage[action]))
      .catch(() => {
        setSuccessMessage(null);
      });
  };

  const downloadDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await apiClient.get(`/applications/${application?.id}/documents/${documentId}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Document download failed', error);
    }
  };

  const documentHistory = useMemo(() => {
    const groups: Record<string, ApplicationDocument[]> = {};

    documents.forEach((document) => {
      const fileGroup = groups[document.fileName] ?? [];
      fileGroup.push(document);
      groups[document.fileName] = fileGroup;
    });

    return Object.entries(groups)
      .map(([fileName, group]) => ({
        fileName,
        documents: group.sort((a, b) => b.version - a.version),
      }))
      .sort((a, b) => b.documents[0].createdAt.localeCompare(a.documents[0].createdAt));
  }, [documents]);

  const auditEvents = useMemo(() => {
    if (!application) return [];

    const events = [
      {
        title: 'Created',
        label: `Created by ${application.user.name}`,
        date: application.createdAt,
      },
    ];

    if (['SUBMITTED', 'UNDER_REVIEW', 'REVIEWED', 'APPROVED', 'REJECTED'].includes(application.state)) {
      events.push({
        title: 'Submitted',
        label: `Submitted by ${application.user.name}`,
        date: application.updatedAt,
      });
    }

    if (application.reviewedBy) {
      events.push({
        title: 'Reviewed',
        label: `Reviewed by ${application.reviewedBy.name}`,
        date: application.updatedAt,
      });
    }

    if (application.approvedBy) {
      events.push({
        title: application.state === 'REJECTED' ? 'Rejected' : 'Approved',
        label: `${application.state === 'REJECTED' ? 'Rejected' : 'Approved'} by ${application.approvedBy.name}`,
        date: application.updatedAt,
      });
    }

    return events;
  }, [application]);

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

  if (!application) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-700">Application not found.</p>
          <Link to="/dashboard/applications" className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md">
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{application.institutionName}</h1>
          <p className="text-gray-600 mt-2">Application details for this request.</p>
        </div>
        <Link
          to="/dashboard/applications"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to applications
        </Link>
      </div>
      {successMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {successMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Application information</h2>
                <p className="mt-1 text-sm text-gray-500">Full details for this application request.</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusClasses[application.state] ?? 'bg-gray-100 text-gray-800'}`}>
                {application.state.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">License type</h3>
                <p className="mt-1 text-sm text-gray-900">{application.licenseType.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</h3>
                <p className="mt-1 text-sm text-gray-900">{formatDate(application.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Updated</h3>
                <p className="mt-1 text-sm text-gray-900">{formatDate(application.updatedAt)}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Version</h3>
                <p className="mt-1 text-sm text-gray-900">{application.version}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Applicant</h3>
              <p className="mt-1 text-sm text-gray-900">{application.user.name}</p>
              <p className="text-sm text-gray-500">{application.user.email}</p>
            </div>

            <div className="mt-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</h3>
              <p className="mt-2 text-sm text-gray-700">{application.description || 'No description provided.'}</p>
            </div>
          </section>

          <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900">Audit history</h2>
            <p className="mt-1 text-sm text-gray-500">Events captured from application metadata.</p>

            <div className="mt-6 space-y-4">
              {auditEvents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                  No audit history is available for this application.
                </div>
              ) : (
                auditEvents.map((event, index) => (
                  <div key={event.title + index} className="rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                        <p className="mt-1 text-sm text-gray-600">{event.label}</p>
                      </div>
                      <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900">Workflow</h2>
            <p className="mt-1 text-sm text-gray-500">Current state and review flow for this application.</p>

            <div className="mt-6 space-y-3">
              {workflowSteps.map((step) => {
                const isActive = step === application.state;
                const isCompleted = workflowSteps.indexOf(step) < workflowSteps.indexOf(application.state);
                return (
                  <div key={step} className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                        isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {workflowSteps.indexOf(step) + 1}
                    </span>
                    <span className={`text-sm ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{step.replace(/_/g, ' ')}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Actions</h2>
                <p className="mt-1 text-sm text-gray-500">Only authorized actions are shown here.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {canSubmit && (
                <button
                  onClick={() => handleAction('submit')}
                  disabled={actionsDisabled}
                  className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  Submit application
                </button>
              )}
              {canUpload && (
                <DocumentUpload
                  file={selectedFile}
                  onFileChange={handleFileChange}
                  onUpload={handleUpload}
                  uploading={uploading}
                  progress={uploadProgress}
                  error={localUploadError || uploadError}
                  maxSizeBytes={MAX_FILE_SIZE}
                />
              )}
              {canReview && (
                <button
                  onClick={() => handleAction('review')}
                  disabled={actionsDisabled}
                  className="inline-flex justify-center rounded-md bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600 disabled:cursor-not-allowed disabled:bg-yellow-300"
                >
                  Review application
                </button>
              )}
              {canRequestMoreInfo && (
                <button
                  onClick={() => handleAction('requestMoreInfo')}
                  disabled={actionsDisabled}
                  className="inline-flex justify-center rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
                >
                  Request more information
                </button>
              )}
              {canApproveOrReject && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={actionsDisabled}
                    className="inline-flex justify-center rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
                  >
                    Approve application
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={actionsDisabled}
                    className="inline-flex justify-center rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                  >
                    Reject application
                  </button>
                </div>
              )}
              {!canSubmit && !canUpload && !canReview && !canRequestMoreInfo && !canApproveOrReject && (
                <p className="text-sm text-gray-500">You do not have any actions available for this application.</p>
              )}
            </div>
          </section>
        </aside>
      </div>

      <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Uploaded documents</h2>
            <p className="mt-1 text-sm text-gray-500">Documents attached to this application.</p>
          </div>
        </div>

        <div className="mt-6">
          {documentsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
              No documents uploaded for this application yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded by</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((document) => (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{document.fileName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{document.uploadedBy.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{document.version}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatFileSize(document.fileSize)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(document.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                        type="button"
                        onClick={() => downloadDocument(document.id, document.fileName)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Download
                      </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
          {documentHistory.length > 0 && (
            <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900">Version history</h2>
              <div className="mt-4 space-y-4">
                {documentHistory.map((group) => (
                  <div key={group.fileName} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{group.fileName}</p>
                        <p className="text-sm text-gray-500">{group.documents.length} version{group.documents.length === 1 ? '' : 's'}</p>
                      </div>
                      <p className="text-sm text-gray-700">Latest v{group.documents[0].version}</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      {group.documents.map((document) => (
                        <div key={document.id} className="flex items-center justify-between gap-4 rounded-md bg-white p-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Version {document.version}</p>
                            <p className="text-sm text-gray-500">Uploaded {formatDate(document.createdAt)}</p>
                          </div>
                          <div className="text-sm text-gray-500">{formatFileSize(document.fileSize)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
      </div>
  );
};

export default ApplicationDetails;
