import { useState, useMemo } from 'react';
import {
  LayoutDashboard, Users, FolderKanban, Heart, Wallet,
  Calendar, Package, BarChart3, Settings, Menu, X, Bell, ChevronRight, LogOut, ClipboardList, Truck, ShoppingCart, Moon, Sun
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { darkenHex } from '../utils/colors';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationPanel } from './NotificationPanel';

const navItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'membres', label: 'Membres', icon: Users },
  { id: 'projets', label: 'Projets', icon: FolderKanban },
  { id: 'dons', label: 'Dons', icon: Heart },
  { id: 'finances', label: 'Finances', icon: Wallet },
  { id: 'evenements', label: 'Événements', icon: Calendar },
  { id: 'stocks', label: 'Stocks', icon: Package },
  { id: 'fournisseurs', label: 'Fournisseurs', icon: Truck },
  { id: 'commandes', label: 'Commandes', icon: ShoppingCart },
  { id: 'rapports', label: 'Rapports', icon: BarChart3 },
  { id: 'logs', label: 'Logs', icon: ClipboardList, adminOnly: true },
  { id: 'parametres', label: 'Paramètres', icon: Settings },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { activeModule, setActiveModule, data } = useApp();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const { notifications, totalCount, navigate } = useNotifications();

  const userInitial = user ? user.nom.charAt(0).toUpperCase() : 'A';
  const userRole = user ? (user.role === 'administrateur' ? 'Administrateur' : user.role === 'gestionnaire' ? 'Gestionnaire' : 'Lecteur') : 'Utilisateur';

  const colors = useMemo(() => {
    const primary = data.ong.primaryColor || '#0d9488';
    return {
      primary,
      sidebarBg: `linear-gradient(180deg, ${darkenHex(primary, 0.40)} 0%, ${darkenHex(primary, 0.35)} 100%)`,
      sidebarBorder: darkenHex(primary, 0.25),
      sidebarHover: darkenHex(primary, 0.20),
      avatarFrom: darkenHex(primary, 0),
      avatarTo: darkenHex(primary, 0.30),
      sidebarText: '#ffffff',
    };
  }, [data.ong.primaryColor]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <style>{`
        .nav-inactive { color: #d1fae5; }
        .nav-inactive:hover { background-color: ${colors.sidebarHover}; }
        .sidebar-footer { border-color: ${colors.sidebarBorder}; }
        .avatar-gradient { background: linear-gradient(135deg, ${colors.avatarFrom}, ${colors.avatarTo}); }
        .btn-primary { background-color: ${colors.primary}; }
        .btn-primary:hover { background-color: ${darkenHex(colors.primary, 0.15)}; }
      `}</style>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 md:w-16'} transition-all duration-300 text-white flex flex-col overflow-hidden`} style={{ background: colors.sidebarBg }}>
        {/* Logo */}
        <div className="p-4 border-b flex items-center gap-3 min-h-[64px]" style={{ borderColor: colors.sidebarBorder }}>
          {data.ong.logo ? (
            <img src={data.ong.logo} alt="Logo" className="w-9 h-9 rounded-xl object-contain bg-white/20 shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-green-900" fill="currentColor" />
            </div>
          )}
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm leading-tight truncate">{data.ong.nom}</p>
              <p className="text-green-300 text-xs truncate">ONG Manager</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.filter(item => !item.adminOnly || user?.role === 'administrateur').map(item => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 
                  ${isActive
                    ? 'bg-yellow-400 text-green-900 font-semibold'
                    : 'nav-inactive'
                  }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {sidebarOpen && isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t sidebar-footer">
            <button onClick={toggleTheme} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-green-200 hover:bg-white/10 transition-colors text-xs mb-2">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDark ? 'Mode clair' : 'Mode sombre'}
            </button>
            <p className="text-green-400 text-xs text-center">ONG Manager v1.0</p>
          </div>
        )}
        {!sidebarOpen && (
          <div className="p-2 border-t sidebar-footer flex justify-center">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-green-200 hover:bg-white/10 transition-colors" title={isDark ? 'Mode clair' : 'Mode sombre'}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
          </button>

          <div className="flex-1">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">
              {navItems.find(n => n.id === activeModule)?.label}
            </h2>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {totalCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                  {totalCount > 99 ? '99+' : totalCount}
                </span>
              )}
            </button>
            {showNotifPanel && (
              <NotificationPanel
                notifications={notifications}
                totalCount={totalCount}
                onNavigate={navigate}
                onClose={() => setShowNotifPanel(false)}
              />
            )}
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
              className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-1.5 transition-colors"
            >
              <div className="w-9 h-9 rounded-full avatar-gradient flex items-center justify-center">
                <span className="text-white text-sm font-bold">{userInitial}</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.nom || 'Utilisateur'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{userRole}</p>
              </div>
            </button>

            {showLogoutConfirm && (
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 w-48 z-50">
                <button
                  onClick={() => { logout(); setShowLogoutConfirm(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 dark:bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}
