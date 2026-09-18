import { useCallback, useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';
import { clearSession, loadSession, saveSession } from '../lib/session';
import { AppContext } from './appContextInstance';
import { NAVS, EXTRA_VIEW_LABELS } from '../config/navs';

export function AppProvider({ children }) {
  // Restore a still-valid session saved before a page refresh. The token has
  // to be handed to the API client before any child component fetches.
  const [restored] = useState(() => {
    const session = loadSession();
    if (session) setAuthToken(session.accessToken);
    return session;
  });

  const [user, setUser] = useState(restored);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modal, setModal] = useState({ id: null, data: null });
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const logout = useCallback(() => {
    setAuthToken(null);
    clearSession();
    setUser(null);
    setCurrentView('dashboard');
    setSelectedPatient(null);
    setModal({ id: null, data: null });
  }, []);

  // A 401 means the token expired or the account was deactivated mid-session —
  // either way, drop back to the login screen rather than showing a broken page.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      setAuthError('Your session has ended. Please sign in again.');
    });
  }, [logout]);

  const login = useCallback(async (username, password) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await authApi.login(username, password);
      setAuthToken(res.accessToken);
      saveSession(res);
      setUser(res);
      setCurrentView('dashboard');
    } catch (e) {
      setAuthError(e.message || 'Unable to sign in.');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const navigate = (view, patient = null) => {
    if (patient) setSelectedPatient(patient);
    setModal({ id: null, data: null });
    setCurrentView(view);
  };

  const openModal = (id, data = null) => setModal({ id, data });
  const closeModal = () => setModal({ id: null, data: null });

  const role = user?.role || 'nurse';
  const crumbLabel =
    NAVS[role].find((l) => l.id === currentView)?.label ||
    EXTRA_VIEW_LABELS[currentView] ||
    'Infirmary Portal';

  const value = {
    isLoggedIn: Boolean(user),
    role,
    userName: user?.fullName || '',
    userId: user?.userId ?? null,
    currentView,
    selectedPatient,
    modal,
    crumbLabel,
    authError,
    authLoading,
    login,
    logout,
    navigate,
    openModal,
    closeModal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
