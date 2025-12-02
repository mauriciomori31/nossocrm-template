import React, { lazy, Suspense, useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Settings,
  Sun,
  Moon,
  Bell,
  CalendarCheck,
  Crosshair,
  BarChart3,
  Inbox,
  Sparkles,
  BotMessageSquare,
  Zap,
  LogOut,
  User,
  Bug,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { prefetchRoute, RouteName } from '@/lib/prefetch';
import { isDebugMode, enableDebugMode, disableDebugMode } from '@/lib/debug';

// Lazy load AI Assistant (heavy component with Gemini SDK)
const AIAssistant = lazy(() => import('./AIAssistant'));

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({
  to,
  icon: Icon,
  label,
  active,
  prefetch,
}: {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  active: boolean;
  prefetch?: RouteName;
}) => (
  <Link
    to={to}
    onMouseEnter={prefetch ? () => prefetchRoute(prefetch) : undefined}
    onFocus={prefetch ? () => prefetchRoute(prefetch) : undefined}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium
    ${active
        ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-900/50'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
      }`}
  >
    <Icon size={20} className={active ? 'text-primary-500' : ''} />
    <span className="font-display tracking-wide">{label}</span>
  </Link>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { isGlobalAIOpen, setIsGlobalAIOpen, activeBoard } = useCRM();
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(isDebugMode);
  
  const toggleDebugMode = () => {
    if (debugEnabled) {
      disableDebugMode();
      setDebugEnabled(false);
    } else {
      enableDebugMode();
      setDebugEnabled(true);
    }
  };

  // Gera iniciais do email
  const userInitials = profile?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-dark-bg bg-dots">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col z-20 glass border-r border-slate-200 dark:border-white/5">
        <div className="h-16 px-5 flex items-center border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/20">
              N
            </div>
            <span className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
              NossoCRM
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem
            to="/inbox"
            icon={Inbox}
            label="Inbox"
            active={location.pathname === '/inbox'}
            prefetch="inbox"
          />
          <NavItem
            to="/dashboard"
            icon={LayoutDashboard}
            label="Visão Geral"
            active={location.pathname === '/dashboard'}
            prefetch="dashboard"
          />
          <NavItem
            to="/boards"
            icon={KanbanSquare}
            label="Boards"
            active={location.pathname === '/boards' || location.pathname === '/pipeline'}
            prefetch="boards"
          />
          <NavItem
            to="/contacts"
            icon={Users}
            label="Contatos"
            active={location.pathname === '/contacts'}
            prefetch="contacts"
          />
          <NavItem
            to="/reports"
            icon={BarChart3}
            label="Relatórios"
            active={location.pathname === '/reports'}
            prefetch="reports"
          />
          <NavItem
            to="/settings"
            icon={Settings}
            label="Configurações"
            active={location.pathname === '/settings'}
            prefetch="settings"
          />
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-white/5">
          <div className="relative">
            {/* User Card - Clickable */}
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all group"
            >
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 shadow-lg"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white dark:ring-slate-800 shadow-lg">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
                    : profile?.nickname?.substring(0, 2).toUpperCase() || userInitials}
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {profile?.nickname || profile?.first_name || profile?.email?.split('@')[0] || 'Usuário'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {profile?.email || ''}
                </p>
              </div>
              <svg 
                className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsUserMenuOpen(false)}
                />
                
                {/* Menu */}
                <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-150">
                  <div className="p-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Editar Perfil
                    </Link>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair da conta
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex min-w-0 overflow-hidden relative">
        {/* Middle Content (Header + Page) */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300 ease-in-out">
          {/* Ambient background glow */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary-500/10 rounded-full blur-[100px]"></div>
            <div className="absolute top-[40%] right-[0%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]"></div>
          </div>

          {/* Header */}
          <header className="h-16 glass border-b border-slate-200 dark:border-white/5 flex items-center justify-end px-6 z-10 shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsGlobalAIOpen(!isGlobalAIOpen)}
                className={`p-2 rounded-full transition-all active:scale-95 ${isGlobalAIOpen
                    ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                title="Assistente Nosso"
              >
                <Sparkles size={20} />
              </button>
              
              {/* Debug Mode Toggle */}
              <button
                onClick={toggleDebugMode}
                className={`p-2 rounded-full transition-all active:scale-95 ${
                  debugEnabled
                    ? 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30 ring-2 ring-purple-400/50'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
                title={debugEnabled ? 'Debug Mode ATIVO - Clique para desativar' : 'Ativar Debug Mode'}
              >
                <Bug size={20} />
              </button>
              
              <button className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full relative transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-dark-card"></span>
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all active:scale-95"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-auto p-6 relative z-10 scroll-smooth">{children}</div>
        </main>

        {/* Right Sidebar (AI Assistant) */}
        <div
          className={`border-l border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${isGlobalAIOpen ? 'w-96 opacity-100' : 'w-0 opacity-0'}`}
        >
          <div className="w-96 h-full">
            {isGlobalAIOpen && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                  </div>
                }
              >
                <AIAssistant
                  isOpen={true}
                  onClose={() => setIsGlobalAIOpen(false)}
                  variant="sidebar"
                  activeBoard={activeBoard}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
