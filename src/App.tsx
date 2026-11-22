import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Login from './components/Login';
import { Toaster } from 'react-hot-toast';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Membres = lazy(() => import('./components/Membres'));
const Projets = lazy(() => import('./components/Projets'));
const Dons = lazy(() => import('./components/Dons'));
const Finances = lazy(() => import('./components/Finances'));
const Evenements = lazy(() => import('./components/Evenements'));
const Stocks = lazy(() => import('./components/Stocks'));
const Fournisseurs = lazy(() => import('./components/Fournisseurs'));
const Commandes = lazy(() => import('./components/Commandes'));
const Rapports = lazy(() => import('./components/Rapports'));
const Parametres = lazy(() => import('./components/Parametres'));
const Logs = lazy(() => import('./components/Logs'));

function ModuleLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full dark:border-green-400"></div>
    </div>
  );
}

function AppContent() {
  const { activeModule } = useApp();

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <Dashboard />;
      case 'membres': return <Membres />;
      case 'projets': return <Projets />;
      case 'dons': return <Dons />;
      case 'finances': return <Finances />;
      case 'evenements': return <Evenements />;
      case 'stocks': return <Stocks />;
      case 'fournisseurs': return <Fournisseurs />;
      case 'commandes': return <Commandes />;
      case 'rapports': return <Rapports />;
      case 'parametres': return <Parametres />;
      case 'logs': return <Logs />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout>
      <Suspense fallback={<ModuleLoader />}>
        {renderModule()}
      </Suspense>
    </Layout>
  );
}

function ProtectedApp() {
  const { login, logout, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return (
    <AppProvider>
      <LayoutWithAuth onLogout={logout}>
        <AppContent />
      </LayoutWithAuth>
    </AppProvider>
  );
}

function LayoutWithAuth({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  return (
    <>
      {children}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <ProtectedApp />
    </AuthProvider>
  );
}
