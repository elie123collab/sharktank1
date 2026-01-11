
import React from 'react';
import { Home, Compass, PlusSquare, Wallet, User as UserIcon, Shield } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, isAdmin }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'create', label: 'Create', icon: PlusSquare },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto bg-slate-950 border-x border-slate-900 shadow-2xl shadow-emerald-500/10">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-400 rounded-lg flex items-center justify-center font-black text-slate-950">
            S
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            SharkTank
          </span>
        </div>
        <div className="w-8 h-8 rounded-full border border-emerald-500/30 overflow-hidden">
          <img src={`https://picsum.photos/seed/header/200`} alt="avatar" />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe">
        <div className="w-full max-w-lg px-6 py-3 bg-slate-950/90 backdrop-blur-2xl border-t border-slate-900 flex justify-between items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 transition-all ${
                  isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-emerald-500/10' : ''}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
