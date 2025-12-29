
import React from 'react';
import { Home, Wallet, History, Users, Settings, Timer, GlassWater, PlusCircle, Receipt } from 'lucide-react';
import { useAccounts } from '../context/AccountsContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { currentLog } = useAccounts();
  const isOpen = !!currentLog;

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'daily', label: 'Shift', icon: Timer },
    { id: 'expense', label: 'Log Exp', icon: PlusCircle },
    { id: 'bills', label: 'Bills', icon: Receipt },
    { id: 'hiking', label: 'Hiking Bar', icon: GlassWater },
    { id: 'accounts', label: 'Money Lab', icon: Wallet },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'history', label: 'Ledger', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const StatusBadge = () => (
    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${
      isOpen 
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
        : 'bg-gray-500/10 border-gray-500/20 text-gray-500'
    }`}>
      <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
      <span className="text-[10px] font-bold uppercase tracking-widest">
        {isOpen ? 'Restaurant Open' : 'Restaurant Closed'}
      </span>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#1e1e2f] text-white">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#161622] p-6 space-y-8 border-r border-white/5">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-500/20">
              M
            </div>
            <h1 className="text-xl font-bold tracking-tight">Mozzarella</h1>
          </div>
          <StatusBadge />
        </div>
        
        <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto pb-24 md:pb-0">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 h-16 glass-effect rounded-[2rem] flex items-center justify-around px-2 shadow-2xl z-50 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`p-3 min-w-[3rem] rounded-full transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white -translate-y-4 scale-110 shadow-xl' 
                  : 'text-gray-400'
              }`}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
