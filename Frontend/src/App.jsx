import Sidebar from './components/Sidebar';
import ModalRoot from './components/ModalRoot';
import NotificationBell from './components/NotificationBell';
import LoginScreen from './pages/LoginScreen';
import NurseDashboard from './pages/NurseDashboard';
import VisitRecords from './pages/VisitRecords';
import PriorityCases from './pages/PriorityCases';
import StockSupplies from './pages/StockSupplies';
import Insights from './pages/Insights';
import PatientProfile from './pages/PatientProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Settings from './pages/admin/Settings';
import { useApp } from './context/useApp';

// view id (see config/navs.js) → page, per role. The backend enforces the same
// split: nurse-only routes use require_nurse, admin-only use require_admin.
const VIEWS = {
  nurse: {
    dashboard: NurseDashboard,
    'visit-hub': VisitRecords,
    'flag-cases': PriorityCases,
    stock: StockSupplies,
    insights: Insights,
    profile: PatientProfile,
  },
  admin: {
    dashboard: AdminDashboard,
    users: UserManagement,
    settings: Settings,
  },
};

function App() {
  const { isLoggedIn, role, currentView, crumbLabel } = useApp();

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  const Page = VIEWS[role][currentView] || VIEWS[role].dashboard;

  return (
    <div id="app" className="active">
      <Sidebar />

      <div className="main">
        <div className="topbar">
          <div className="crumb">☰ {crumbLabel}</div>
          <div className="icons">
            <NotificationBell />
            <span id="topRolePill">👤 {role === 'admin' ? 'Admin' : 'Nurse'}</span>
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
