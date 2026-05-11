import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationDetails from './pages/ApplicationDetails';
import { DashboardLayout } from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="applications" element={<Applications />} />
            <Route path="applications/:id" element={<ApplicationDetails />} />
            <Route path="reviews" element={<div className="p-8"><h1 className="text-3xl font-bold">Reviews</h1><p className="text-gray-600 mt-2">Review applications</p></div>} />
            <Route path="audit-logs" element={<div className="p-8"><h1 className="text-3xl font-bold">Audit Logs</h1><p className="text-gray-600 mt-2">View system audit logs</p></div>} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;

