import Sidebar from './components/Sidebar';
import ModalRoot from './components/ModalRoot';
import NotificationBell from './components/NotificationBell';
import Icon from './components/Icon';
import LoginScreen from './pages/LoginScreen';
import NurseDashboard from './pages/NurseDashboard';
import AddVisitRecord from './pages/AddVisitRecord';
import PatientRecords from './pages/PatientRecords';
import SearchHistory from './pages/SearchHistory';
import PriorityCases from './pages/PriorityCases';
import StockSupplies from './pages/StockSupplies';
import { AnalyticsPage, ReportTablesPage, SupplyReportPage } from './pages/ReportPages';
import FullLists from './pages/FullLists';
import PatientProfile from './pages/PatientProfile';
import MedicalCertificate from './pages/docs/MedicalCertificate';
import ParentalNotification from './pages/docs/ParentalNotification';
import AdminDashboard from './pages/admin/AdminDashboard';
import StockRequests from './pages/admin/StockRequests';
import UserManagement from './pages/admin/UserManagement';
import Settings from './pages/admin/Settings';
import AuditLog from './pages/admin/AuditLog';
import { useApp } from './context/useApp';
import { initialsOf, ROLE_LABELS } from './lib/format';

// view id (see config/navs.js) → page, per role. The backend enforces the same
// split: nurse-only routes use require_nurse, admin-only use require_admin.
const VIEWS = {
  nurse: {
    dashboard: NurseDashboard,
    'add-visit': AddVisitRecord,
    'patient-records': PatientRecords,
    'flag-cases': PriorityCases,
    'search-history': SearchHistory,
    stock: StockSupplies,
    reports: AnalyticsPage,
    'supply-report': SupplyReportPage,
    'report-tables': ReportTablesPage,
    'full-lists': FullLists,
    profile: PatientProfile,
    'medical-certificate': MedicalCertificate,
    'parental-notification': ParentalNotification,
  },
  admin: {
    dashboard: AdminDashboard,
    'stock-requests': StockRequests,
    users: UserManagement,
    reports: AnalyticsPage,
    'supply-report': SupplyReportPage,
    'report-tables': ReportTablesPage,
    'full-lists': FullLists,
    'audit-log': AuditLog,
    settings: Settings,
  },
};

function App() {
  const { isLoggedIn, role, userName, currentView, crumbLabel } = useApp();

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  const Page = VIEWS[role][currentView] || VIEWS[role].dashboard;
  const isAdmin = role === 'admin';

  return (
    <div id="app" className="active">
      <Sidebar />

      <div className="main">
        <div className="topbar no-print">
          <div className="crumb">
            <Icon name="menu" size={20} />
            {crumbLabel}
          </div>
          <div className="icons">
            <NotificationBell />
            <div className="divider" />
            <div className="who">
              <div className={`avatar${isAdmin ? ' blue' : ''}`}>
                {initialsOf(userName) || (isAdmin ? 'AD' : 'NS')}
              </div>
              <div>
                <div className="nm">{userName || ROLE_LABELS[role]}</div>
                <div className="rl">{isAdmin ? 'Admin' : 'Nurse on duty'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="content">
          <Page key={currentView} />
        </div>
      </div>

      <ModalRoot />
    </div>
  );
}

export default App;
