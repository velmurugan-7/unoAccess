import { createBrowserRouter } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
// import ConsentPage from './pages/ConsentPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import AccountChooserPage from './pages/AccountChooserPage';
// import AppMonitoringPage from './pages/AppMonitoringPage';
import ApiKeysPage from './pages/ApiKeysPage';
import AlertsPage from './pages/AlertsPage';
import StatusPage from './pages/StatusPage';
import DocsPage from './pages/DocsPage';
import SloPage from './pages/SloPage';
import ErrorsPage from './pages/ErrorsPage';
import ServiceMapPage from './pages/ServiceMapPage';
import PricingPage from './pages/PricingPage';
import { NotFoundPage, ForbiddenPage, ServerErrorPage } from './pages/ErrorPages';
import { ProtectedRoute } from './components/ProtectedRoute';
import MyAppPage from './pages/MyAppPage';
import LearnPage from './pages/LearnPage';
import AppMonitoringPage, { RumPageWrapper } from './pages/AppMonitoringPage';

export const router = createBrowserRouter([
  // Public
  { path: '/', element: <LandingPage /> },
  { path: '/pricing', element: <PricingPage /> },
  { path: '/status', element: <StatusPage /> },
  { path: '/docs', element: <DocsPage /> },
  { path: '/docs/:section', element: <DocsPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  // { path: '/oauth/authorize', element: <ConsentPage /> },
  { path: '/account-chooser', element: <AccountChooserPage /> },
  // Protected – user
  { path: '/dashboard', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
  { path: '/settings', element: <ProtectedRoute><SettingsPage /></ProtectedRoute> },
  { path: '/account/keys', element: <ProtectedRoute><ApiKeysPage /></ProtectedRoute> },
  { path: '/alerts', element: <ProtectedRoute><AlertsPage /></ProtectedRoute> },
  { path: '/learn', element: <ProtectedRoute><LearnPage /></ProtectedRoute> },
  { path: '/app-monitoring/:clientId', element: <ProtectedRoute><AppMonitoringPage /></ProtectedRoute> },
  { path: '/app/:clientId/errors', element: <ProtectedRoute><ErrorsPage /></ProtectedRoute> },
  { path: '/app/:clientId/service-map', element: <ProtectedRoute><ServiceMapPage /></ProtectedRoute> },
  { path: '/app/:clientId/slo', element: <ProtectedRoute><SloPage /></ProtectedRoute> },
  { path: '/account/app', element: <ProtectedRoute><MyAppPage /></ProtectedRoute> },
  { path: '/app/:clientId/rum', element: <ProtectedRoute><RumPageWrapper /></ProtectedRoute> },
  // Protected – admin
  { path: '/admin', element: <ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute> },
  // Error pages
  { path: '/403', element: <ForbiddenPage /> },
  { path: '/500', element: <ServerErrorPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
