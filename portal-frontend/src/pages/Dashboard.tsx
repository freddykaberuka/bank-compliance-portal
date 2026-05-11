import { useAppSelector } from '../app/hooks';
import { selectAuthUser, selectAuthRole } from '../features/auth/authSelectors';

export const Dashboard = () => {
  const user = useAppSelector(selectAuthUser);
  const role = useAppSelector(selectAuthRole);

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator - Full system access';
      case 'APPROVER':
        return 'Approver - Can approve applications';
      case 'REVIEWER':
        return 'Reviewer - Can review applications';
      case 'APPLICANT':
        return 'Applicant - Can submit applications';
      default:
        return 'User';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.name}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to the Bank Compliance Portal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your Role</h3>
            <p className="text-gray-600">{getRoleDescription(role || '')}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">• View your applications</p>
              <p className="text-sm text-gray-600">• Submit new applications</p>
              <p className="text-sm text-gray-600">• Check review status</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
              <p className="text-sm font-medium text-gray-600">Approved</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
          </div>
        </div>
      </div>
    </div>
  );
};