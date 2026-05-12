import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchApplications } from '../features/applications/applicationsSlice';
import { performApplicationAction } from '../features/applications/applicationDetailsSlice';
import { useRole } from '../app/useRole';

const Reviews: React.FC = () => {
  const dispatch = useAppDispatch();
  const { applications, loading, error } = useAppSelector((state) => state.applications);
  const actionLoading = useAppSelector((state) => state.applicationDetails.actionLoading);
  const { canReview } = useRole();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchApplications());
  }, [dispatch]);

  const reviewableApplications = applications.filter((application) =>
    ['SUBMITTED', 'UNDER_REVIEW'].includes(application.state)
  );

  const handleAction = async (
    applicationId: string,
    action: 'review' | 'requestMoreInfo'
  ) => {
    setStatusMessage(null);

    try {
      await dispatch(performApplicationAction({ applicationId, action })).unwrap();
      setStatusMessage(
        action === 'review'
          ? 'Application moved forward in review.'
          : 'Request for more information sent.'
      );
      dispatch(fetchApplications());
    } catch {
      setStatusMessage('Unable to complete the action. Refresh and try again.');
    }
  };

  if (!canReview()) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
          <h1 className="text-2xl font-semibold text-gray-900">Reviews</h1>
          <p className="mt-2 text-gray-600">
            You do not have permission to perform review actions.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading review queue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">Failed to load review applications: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-600 mt-2">Applications waiting for review or review completion.</p>
      </div>

      {statusMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {statusMessage}
        </div>
      )}

      {reviewableApplications.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-lg font-semibold text-gray-900">No applications in review</p>
          <p className="mt-2 text-gray-600">
            There are currently no submitted or under-review applications waiting for action.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviewableApplications.map((application) => (
            <div key={application.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <Link
                    to={`/dashboard/applications/${application.id}`}
                    className="text-xl font-semibold text-slate-900 hover:text-slate-700"
                  >
                    {application.institutionName}
                  </Link>
                  <p className="mt-2 text-sm text-gray-600">{application.licenseType.replace(/_/g, ' ')}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                      {application.state.replace(/_/g, ' ')}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      Submitted by {application.user.name}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleAction(application.id, 'review')}
                    className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {application.state === 'UNDER_REVIEW' ? 'Mark reviewed' : 'Start review'}
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleAction(application.id, 'requestMoreInfo')}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200"
                  >
                    Request more information
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
