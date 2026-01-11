import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Project, AppState, ProjectStatus, Transaction, TransactionType, TransactionStatus, Investment, User, ChartPoint } from './types.ts';
import { INITIAL_STATE } from './constants.ts';
import Layout from './components/Layout.tsx';
import ProjectCard from './components/ProjectCard.tsx';
import { 
  TrendingUp, ArrowLeft, Shield, History, Plus, Minus, Users, Activity, LogOut,
  Crown, RefreshCcw, AlertTriangle, Flame, Camera, Search, Filter, Wallet, LayoutGrid, Clock, AlignLeft
} from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

const STORAGE_KEY = 'SHARK_TANK_EXPLORE_POOL_V20';
const AUTH_KEY = 'SHARK_TANK_AUTH_STATE_V20';

const CATEGORIES = ['All', 'Fintech', 'AI', 'Health', 'E-commerce', 'Green Energy', 'Web3', 'SaaS'];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.projects = (parsed.projects || []).map((p: Project) => ({
          ...p,
          creatorFees: p.creatorFees || 0,
          history: p.history || [{ time: p.createdAt, value: p.amountRaised || 0 }]
        }));
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return INITIAL_STATE;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedAuth = localStorage.getItem(AUTH_KEY);
    return savedAuth === 'true';
  });

  const [isSignUp, setIsSignUp] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState('home');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [isPoolAction, setIsPoolAction] = useState<'deposit' | 'withdraw' | null>(null);
  const [poolAmountInput, setPoolAmountInput] = useState('');

  const [exploreSearch, setExploreSearch] = useState('');
  const [exploreCategory, setExploreCategory] = useState('All');

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  const [adminTransactionView, setAdminTransactionView] = useState<'pending' | 'projects'>('pending');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(AUTH_KEY, isAuthenticated.toString());
  }, [isAuthenticated]);

  const activeChartData = useMemo(() => {
    if (!selectedProject) return [];
    const liveProject = state.projects.find(p => p.id === selectedProject.id);
    if (!liveProject || !liveProject.history) return [];
    return liveProject.history.map((pt, i) => ({
      time: i === liveProject.history!.length - 1 ? 'Live' : `${i}`,
      value: pt.value,
      timestamp: pt.time
    }));
  }, [selectedProject, state.projects]);

  const filteredExploreProjects = useMemo(() => {
    return state.projects.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(exploreSearch.toLowerCase()) || 
                          p.pitch.toLowerCase().includes(exploreSearch.toLowerCase());
      const matchesCategory = exploreCategory === 'All' || p.category === exploreCategory;
      const isActive = p.status !== ProjectStatus.PENDING;
      return matchesSearch && matchesCategory && isActive;
    });
  }, [state.projects, exploreSearch, exploreCategory]);

  const myProjects = useMemo(() => {
    return state.projects.filter(p => p.founderId === state.currentUser.id);
  }, [state.projects, state.currentUser.id]);

  const myTransactions = useMemo(() => {
    return state.transactions.filter(t => t.userId === state.currentUser.id);
  }, [state.transactions, state.currentUser.id]);

  const chartColor = useMemo(() => {
    if (activeChartData.length < 2) return "#10b981";
    return activeChartData[activeChartData.length - 1].value < activeChartData[activeChartData.length - 2].value ? "#ef4444" : "#10b981";
  }, [activeChartData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = state.allUsers.find(u => u.email.toLowerCase() === authEmail.toLowerCase() && u.password === authPassword);
    if (user) {
      setIsAuthenticated(true);
      setState(prev => ({ ...prev, currentUser: user }));
      setAuthError('');
    } else {
      setAuthError('Invalid credentials.');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName || !authEmail || !authPassword) return setAuthError('Missing fields.');
    if (state.allUsers.find(u => u.email.toLowerCase() === authEmail.toLowerCase())) return setAuthError('Email exists.');
    const newUser: User = { 
      id: `u-${Date.now()}`, 
      name: authName, 
      email: authEmail, 
      password: authPassword, 
      balance: 0, 
      role: 'user', 
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authName}` 
    };
    setState(prev => ({ 
      ...prev, 
      allUsers: [...prev.allUsers, newUser],
      currentUser: newUser
    }));
    setIsAuthenticated(true);
    setIsSignUp(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('home');
    setSelectedProject(null);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    const project: Project = {
      id: `proj-${now}`,
      founderId: state.currentUser.id,
      founderName: state.currentUser.name,
      title: newTitle, 
      pitch: newTitle, 
      description: newDesc, 
      problem: "N/A", solution: "N/A", businessModel: "Shared Pool", 
      category: "General", 
      fundingGoal: 0, 
      amountRaised: 0, creatorFees: 0, totalUnits: 0, investorsCount: 0, equityOffered: 0, strategyRate: 0, 
      timeline: "2025", status: ProjectStatus.PENDING, isTrending: false, isFeatured: false, createdAt: now, 
      image: newImage || `https://picsum.photos/seed/${newTitle}/800/600`,
      history: [{ time: now, value: 0 }]
    };
    setState(prev => ({ ...prev, projects: [...prev.projects, project] }));
    setNewTitle(''); setNewDesc(''); setNewImage(null);
    alert("Project protocol submitted for registry review."); setActiveTab('home');
  };

  const handlePoolDeposit = () => {
    if (!selectedProject || !poolAmountInput) return;
    const depositAmount = parseFloat(poolAmountInput);
    if (isNaN(depositAmount) || depositAmount <= 0) return;
    if (depositAmount > state.currentUser.balance) return alert("Insufficient wallet balance.");

    setState(prev => {
      const project = prev.projects.find(p => p.id === selectedProject.id)!;
      const fee = depositAmount * 0.03;
      const netAmount = depositAmount - fee;

      let updatedInvestments = [...prev.investments];
      const existingInvIndex = updatedInvestments.findIndex(
        inv => inv.projectId === selectedProject.id && inv.userId === state.currentUser.id
      );

      if (existingInvIndex !== -1) {
        const existing = updatedInvestments[existingInvIndex];
        updatedInvestments[existingInvIndex] = {
          ...existing,
          amount: existing.amount + netAmount,
          initialAmount: existing.initialAmount + depositAmount
        };
      } else {
        updatedInvestments.push({
          id: `inv-${Date.now()}`,
          userId: state.currentUser.id,
          userName: state.currentUser.name,
          projectId: selectedProject.id,
          projectTitle: selectedProject.title,
          units: 0,
          amount: netAmount,
          initialAmount: depositAmount,
          totalGains: 0,
          timestamp: Date.now()
        });
      }

      const totalPoolAfter = updatedInvestments
        .filter(inv => inv.projectId === selectedProject.id)
        .reduce((sum, inv) => sum + inv.amount, 0);

      const updatedProjects = prev.projects.map(p => {
        if (p.id === selectedProject.id) {
          return { 
            ...p, 
            amountRaised: totalPoolAfter, 
            creatorFees: (p.creatorFees || 0) + fee,
            investorsCount: updatedInvestments.filter(inv => inv.projectId === selectedProject.id).length,
            history: [...(p.history || []), { time: Date.now(), value: totalPoolAfter }]
          };
        }
        return p;
      });

      const updatedAllUsers = prev.allUsers.map(u => {
        if (u.id === state.currentUser.id) return { ...u, balance: u.balance - depositAmount };
        if (u.id === project.founderId) return { ...u, balance: u.balance + fee };
        return u;
      });

      return {
        ...prev,
        currentUser: updatedAllUsers.find(u => u.id === state.currentUser.id)!,
        allUsers: updatedAllUsers,
        projects: updatedProjects,
        investments: updatedInvestments
      };
    });

    setIsPoolAction(null);
    setPoolAmountInput('');
  };

  const handlePoolWithdraw = () => {
    if (!selectedProject || !poolAmountInput) return;
    const withdrawal = parseFloat(poolAmountInput);
    if (isNaN(withdrawal) || withdrawal <= 0) return;

    const currentInv = state.investments.find(i => i.projectId === selectedProject.id && i.userId === state.currentUser.id);
    if (!currentInv) return alert("No active stake found.");
    if (withdrawal > currentInv.amount) return alert("Withdrawal request exceeds your node balance.");

    setState(prev => {
      let updatedInvestments = prev.investments.map(inv => {
        if (inv.projectId === selectedProject.id && inv.userId === state.currentUser.id) {
          return { ...inv, amount: Math.max(0, inv.amount - withdrawal) };
        }
        return inv;
      }).filter(i => i.amount > 0.01);

      const totalPoolAfter = updatedInvestments
        .filter(inv => inv.projectId === selectedProject.id)
        .reduce((sum, inv) => sum + inv.amount, 0);

      const updatedProjects = prev.projects.map(p => 
        p.id === selectedProject.id 
          ? { 
              ...p, 
              amountRaised: totalPoolAfter,
              investorsCount: updatedInvestments.filter(inv => inv.projectId === selectedProject.id).length,
              history: [...(p.history || []), { time: Date.now(), value: totalPoolAfter }]
            } 
          : p
      );

      const updatedUser = { ...state.currentUser, balance: state.currentUser.balance + withdrawal };
      const updatedAllUsers = prev.allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);

      return {
        ...prev,
        currentUser: updatedUser,
        allUsers: updatedAllUsers,
        projects: updatedProjects,
        investments: updatedInvestments
      };
    });

    setIsPoolAction(null);
    setPoolAmountInput('');
  };

  const handleTransactionRequest = (type: TransactionType) => {
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) return alert("Invalid amount.");
    
    if (type === TransactionType.WITHDRAWAL && amount > state.currentUser.balance) {
      return alert("Insufficient wallet balance for withdrawal.");
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      type,
      amount,
      status: TransactionStatus.PENDING,
      note: noteInput || (type === TransactionType.DEPOSIT ? 'Bank Deposit Request' : 'Bank Withdrawal Request'),
      timestamp: Date.now()
    };

    setState(prev => ({
      ...prev,
      transactions: [newTx, ...prev.transactions]
    }));

    setIsDepositing(false);
    setIsWithdrawing(false);
    setAmountInput('');
    setNoteInput('');
    alert(`${type} protocol submitted. Awaiting registry approval.`);
  };

  const handleAdminAction = (tx: Transaction, action: 'approve' | 'reject') => {
    setState(prev => {
      const updatedTxs = prev.transactions.map(t => t.id === tx.id ? { ...t, status: action === 'approve' ? TransactionStatus.APPROVED : TransactionStatus.REJECTED } : t);
      if (action === 'reject') return { ...prev, transactions: updatedTxs };
      const user = prev.allUsers.find(u => u.id === tx.userId);
      if (!user) return { ...prev, transactions: updatedTxs };
      const updatedUser = { ...user, balance: tx.type === TransactionType.DEPOSIT ? user.balance + tx.amount : Math.max(0, user.balance - tx.amount) };
      return {
        ...prev,
        allUsers: prev.allUsers.map(u => u.id === tx.userId ? updatedUser : u),
        currentUser: prev.currentUser.id === tx.userId ? updatedUser : prev.currentUser,
        transactions: updatedTxs
      };
    });
  };

  const handleAdminProjectAction = (projectId: string, action: 'approve' | 'reject') => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === projectId ? { ...p, status: action === 'approve' ? ProjectStatus.FUNDING : ProjectStatus.PENDING } : p)
        .filter(p => action === 'approve' || p.id !== projectId)
    }));
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Shared Capital Hub</span>
                </div>
                <p className="text-white font-black text-3xl tracking-tight uppercase italic">Registry Hub</p>
              </div>
              <div className="text-right z-10">
                <p className="text-emerald-400 font-black text-3xl tracking-tighter">${state.projects.reduce((a,p)=>a+(p.amountRaised || 0),0).toLocaleString()}</p>
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block mt-1">Total Assets Locked</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
            </div>
            
            <section className="px-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <TrendingUp className="text-emerald-500" /> Featured Nodes
                </h3>
                <button onClick={() => setActiveTab('explore')} className="text-[10px] font-black uppercase text-slate-500 hover:text-emerald-400 transition-colors">See All</button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {state.projects.filter(p => p.status !== ProjectStatus.PENDING && (p.isTrending || p.isFeatured)).slice(0, 3).map(p => <ProjectCard key={p.id} project={p} onClick={setSelectedProject} />)}
              </div>
            </section>
          </div>
        );
      case 'explore':
        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
             <div className="space-y-4">
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                  <input 
                    value={exploreSearch}
                    onChange={e => setExploreSearch(e.target.value)}
                    placeholder="Search Nodes..." 
                    className="w-full bg-slate-900 border border-slate-800 rounded-[2rem] py-6 pl-16 pr-8 text-white font-bold outline-none focus:border-emerald-500/50 shadow-2xl transition-all" 
                  />
                </div>
                
                <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar">
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setExploreCategory(cat)}
                      className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${exploreCategory === cat ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
             </div>

             <section className="px-1">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{filteredExploreProjects.length} Nodes Found</p>
                  <Filter size={16} className="text-slate-500" />
                </div>
                <div className="grid grid-cols-1 gap-6">
                   {filteredExploreProjects.length > 0 ? (
                     filteredExploreProjects.map(p => <ProjectCard key={p.id} project={p} onClick={setSelectedProject} />)
                   ) : (
                     <div className="text-center py-20 bg-slate-900/50 rounded-[3rem] border border-slate-800/50 border-dashed">
                        <Activity size={40} className="text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-600 font-black uppercase text-xs tracking-widest">No nodes match your registry query</p>
                     </div>
                   )}
                </div>
             </section>
          </div>
        );
      case 'wallet':
        return (
          <div className="space-y-10 animate-in slide-in-from-left duration-500 pb-20">
            <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] p-12 relative overflow-hidden shadow-2xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Available Node Balance</span>
              <h2 className="text-6xl font-black mt-4 tracking-tighter text-white">${state.currentUser.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
              <div className="flex gap-4 mt-12">
                <button 
                  onClick={() => { setIsDepositing(true); setIsWithdrawing(false); setIsPoolAction(null); setAmountInput(''); }} 
                  className="flex-1 bg-emerald-500 py-6 rounded-3xl text-slate-950 font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Plus size={18}/> Deposit
                </button>
                <button 
                  onClick={() => { setIsWithdrawing(true); setIsDepositing(false); setIsPoolAction(null); setAmountInput(''); }} 
                  className="flex-1 bg-slate-800 py-6 rounded-3xl text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <Minus size={18}/> Withdraw
                </button>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-5 text-emerald-500 pointer-events-none"><Wallet size={200} /></div>
            </div>

            <section className="px-1">
              <h3 className="text-sm font-black text-white flex items-center gap-3 mb-6 uppercase tracking-[0.2em] italic"><Clock size={18} className="text-amber-500" /> Recent Activity</h3>
              <div className="space-y-3">
                {myTransactions.length > 0 ? (
                  myTransactions.map(tx => (
                    <div key={tx.id} className="bg-slate-900/60 p-6 rounded-[2rem] border border-slate-800 flex justify-between items-center group shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${tx.type === TransactionType.DEPOSIT ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {tx.type === TransactionType.DEPOSIT ? <Plus size={18} /> : <Minus size={18} />}
                        </div>
                        <div>
                          <p className="font-black text-slate-100 text-sm tracking-tight">{tx.type} Protocol</p>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${tx.status === TransactionStatus.APPROVED ? 'bg-emerald-500/10 text-emerald-500' : tx.status === TransactionStatus.PENDING ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                      <p className="font-black text-lg text-white tracking-tighter">${tx.amount.toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-slate-900/20 rounded-[2rem] border border-slate-800 border-dashed">
                    <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">No recent transactions</p>
                  </div>
                )}
              </div>
            </section>

            <section className="px-1">
              <h3 className="text-xl font-black text-white flex items-center gap-3 mb-6 uppercase tracking-tight italic"><History size={24} className="text-slate-500" /> Active Registry Stakes</h3>
              <div className="space-y-4">
                {state.investments.filter(inv => inv.userId === state.currentUser.id).length > 0 ? (
                  state.investments.filter(inv => inv.userId === state.currentUser.id).map(inv => {
                    const proj = state.projects.find(p => p.id === inv.projectId);
                    if (!proj) return null;
                    const share = (proj.amountRaised || 0) > 0 ? (inv.amount / proj.amountRaised) * 100 : 0;
                    return (
                      <div key={inv.id} className="bg-slate-900 p-7 rounded-[2.5rem] border border-slate-800 flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all hover:border-emerald-500/20" onClick={() => setSelectedProject(proj)}>
                        <div className="flex items-center gap-5">
                          <img src={proj.image} className="w-14 h-14 rounded-2xl object-cover shadow-lg" />
                          <div>
                            <p className="font-black text-slate-100 tracking-tight text-lg">{proj.title}</p>
                            <p className="text-[10px] text-emerald-500 uppercase font-black tracking-[0.2em] mt-1">Registry Share: {share.toFixed(2)}%</p>
                          </div>
                        </div>
                        <p className="font-black text-2xl text-emerald-400 tracking-tighter">${inv.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-slate-900/30 rounded-[2.5rem] border border-slate-800 border-dashed">
                     <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">No active deployments found</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        );
      case 'create':
        return (
          <form onSubmit={handleCreateProject} className="bg-slate-900 p-12 rounded-[3.5rem] border border-slate-800 space-y-10 shadow-2xl animate-in zoom-in duration-500 pb-20">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Deploy New Node</h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Submit your project to the registry</p>
            </div>
            
            <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video bg-slate-950 border border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative shadow-inner group">
              {newImage ? (
                <img src={newImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="text-center space-y-3">
                  <Camera size={50} className="text-slate-800 group-hover:text-emerald-500 transition-colors mx-auto" />
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Upload Key Asset</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setNewImage(r.result as string); r.readAsDataURL(f); } }} accept="image/*" className="hidden" />
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Node Title</label>
                <input 
                  required 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  placeholder="Enter protocol name..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] py-6 px-10 text-white font-bold outline-none focus:border-emerald-500/50 transition-all shadow-inner" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Full Description</label>
                <div className="relative">
                  <textarea 
                    required 
                    value={newDesc} 
                    onChange={e => setNewDesc(e.target.value)} 
                    placeholder="Describe your node protocol in detail..." 
                    rows={5}
                    className="w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] py-8 px-10 text-white font-bold outline-none focus:border-emerald-500/50 transition-all shadow-inner resize-none leading-relaxed" 
                  />
                  <AlignLeft className="absolute right-8 top-8 text-slate-800 pointer-events-none" size={20} />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full py-9 bg-emerald-500 text-slate-950 font-black rounded-[2.5rem] uppercase tracking-widest shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all text-base">Request Deployment</button>
          </form>
        );
      case 'profile':
        return (
          <div className="space-y-12 animate-in fade-in duration-500 pb-12">
            <div className="text-center pt-6 space-y-6">
              <div className="w-40 h-40 rounded-[3.5rem] bg-slate-900 mx-auto p-1.5 border border-slate-800 shadow-2xl relative overflow-hidden group">
                <img src={state.currentUser.avatar} className="w-full h-full rounded-[3rem] object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="space-y-1">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">{state.currentUser.name}</h2>
                <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.4em]">{state.currentUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2.5rem] text-center">
                  <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest mb-1 block">Nodes Deployed</span>
                  <p className="text-2xl font-black text-white">{myProjects.length}</p>
               </div>
               <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2.5rem] text-center">
                  <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest mb-1 block">Capital Managed</span>
                  <p className="text-2xl font-black text-emerald-400">${myProjects.reduce((a,p)=>a+p.amountRaised, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
               </div>
            </div>

            <section className="space-y-6">
               <div className="flex items-center justify-between px-2">
                 <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2"><LayoutGrid size={16} className="text-emerald-500"/> My Registry Nodes</h3>
               </div>
               <div className="grid grid-cols-1 gap-4">
                  {myProjects.length > 0 ? (
                    myProjects.map(p => (
                      <div key={p.id} onClick={() => setSelectedProject(p)} className="bg-slate-900 border border-slate-800/50 p-5 rounded-[2.5rem] flex items-center justify-between group cursor-pointer active:scale-95 transition-all">
                        <div className="flex items-center gap-4">
                          <img src={p.image} className="w-14 h-14 rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform" />
                          <div>
                            <p className="font-black text-slate-100 text-sm">{p.title}</p>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${p.status === ProjectStatus.FUNDING ? 'text-emerald-500 bg-emerald-500/5' : p.status === ProjectStatus.PENDING ? 'text-amber-500 bg-amber-500/5' : 'text-slate-500 bg-slate-950'}`}>
                              {p.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-black text-white">${p.amountRaised.toLocaleString()}</p>
                           <p className="text-[9px] text-slate-500 font-bold uppercase">Liquidity</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-slate-900/30 rounded-[2.5rem] border border-slate-800 border-dashed">
                       <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">No active deployments</p>
                    </div>
                  )}
               </div>
            </section>

            <button onClick={handleLogout} className="w-full py-7 bg-red-500/5 border border-red-500/10 rounded-[2.5rem] text-[10px] font-black text-red-500/60 uppercase tracking-[0.3em] flex items-center justify-center gap-4 active:scale-95 transition-all hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"><LogOut size={18} /> Terminate Access</button>
          </div>
        );
      case 'admin':
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3 uppercase italic"><Shield className="text-emerald-500" /> Core Registry HQ</h2>
            <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-xl">
              <button onClick={() => setAdminTransactionView('pending')} className={`flex-1 py-4 text-[10px] font-black rounded-xl transition-all uppercase tracking-wider ${adminTransactionView === 'pending' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}>Approvals</button>
              <button onClick={() => setAdminTransactionView('projects')} className={`flex-1 py-4 text-[10px] font-black rounded-xl transition-all uppercase tracking-wider ${adminTransactionView === 'projects' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}>Nodes</button>
            </div>
            {adminTransactionView === 'pending' ? (
              <section className="space-y-4">
                {state.transactions.filter(t => t.status === TransactionStatus.PENDING).map(tx => (
                  <div key={tx.id} className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-2xl animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <span className={`text-[10px] font-black uppercase ${tx.type === TransactionType.DEPOSIT ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'} px-3 py-1.5 rounded-lg mb-3 inline-block tracking-widest`}>{tx.type} Request</span>
                        <p className="font-black text-4xl text-white tracking-tighter">${tx.amount.toLocaleString()}</p>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{tx.userName}</p>
                    </div>
                    <div className="flex gap-4">
                       <button onClick={() => handleAdminAction(tx, 'approve')} className="flex-1 py-5 bg-emerald-500 text-slate-950 text-xs font-black rounded-2xl uppercase tracking-widest shadow-xl active:scale-95 transition-all">Authorize</button>
                       <button onClick={() => handleAdminAction(tx, 'reject')} className="flex-1 py-5 bg-slate-800 text-white border border-slate-700 text-xs font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-all">Deny</button>
                    </div>
                  </div>
                ))}
              </section>
            ) : (
              <section className="space-y-4">
                {state.projects.filter(p => p.status === ProjectStatus.PENDING).map(proj => (
                  <div key={proj.id} className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-2xl animate-in fade-in zoom-in-95">
                    <div className="flex items-start gap-6 mb-8">
                       <img src={proj.image} className="w-24 h-24 rounded-3xl object-cover shadow-2xl ring-2 ring-white/5" />
                       <div className="flex-1">
                          <h4 className="font-black text-2xl text-white leading-[1.1] tracking-tight">{proj.title}</h4>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">Founder: {proj.founderName}</p>
                          <div className="mt-2 inline-block px-3 py-1 bg-slate-950 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest">{proj.category}</div>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <button onClick={() => handleAdminProjectAction(proj.id, 'approve')} className="flex-1 py-5 bg-emerald-500 text-slate-950 text-xs font-black rounded-2xl uppercase tracking-widest shadow-xl active:scale-95 transition-all">Deploy Node</button>
                       <button onClick={() => handleAdminProjectAction(proj.id, 'reject')} className="flex-1 py-5 bg-slate-800 text-white border border-slate-700 text-xs font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-all">Dismiss</button>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>
        );
      default: return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-12 animate-in zoom-in duration-500">
          <div className="text-center">
            <div className="w-28 h-28 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[3rem] mx-auto flex items-center justify-center font-black text-6xl text-slate-950 mb-8 shadow-[0_0_60px_rgba(16,185,129,0.4)] rotate-3">S</div>
            <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic leading-none">SharkTank</h1>
            <p className="text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px] mt-4">Node Shared Registry Terminal</p>
          </div>
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="bg-slate-900 p-12 rounded-[4rem] border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden group">
            {isSignUp && <input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Node Identity (Name)" className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] py-6 px-10 text-sm focus:border-emerald-500 outline-none transition-all text-white font-bold shadow-inner" />}
            <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Access ID (Email)" className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] py-6 px-10 text-sm focus:border-emerald-500 outline-none transition-all text-white font-bold shadow-inner" />
            <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Node Secure Key" className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] py-6 px-10 text-sm focus:border-emerald-500 outline-none transition-all text-white font-bold shadow-inner" />
            {authError && <p className="text-red-500 text-[10px] text-center font-black uppercase tracking-[0.2em]">{authError}</p>}
            <button type="submit" className="w-full py-8 bg-emerald-500 text-slate-950 font-black rounded-[2rem] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-emerald-500/20 mt-4 text-sm">Authorize Registry</button>
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }} className="w-full text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] pt-6 hover:text-emerald-400 transition-colors">{isSignUp ? 'Switch to Authorize Access' : 'Initialize New Node Access'}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="antialiased font-inter text-slate-100 bg-slate-950 min-h-screen">
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={state.currentUser.role === 'admin'}>
        {renderActiveView()}
      </Layout>

      {selectedProject && (
        <div className="fixed inset-0 z-[60] bg-slate-950 overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="max-w-lg mx-auto p-8 space-y-12 pb-48">
            <div className="relative aspect-video rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-900 group">
              <img src={selectedProject.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <button onClick={() => setSelectedProject(null)} className="absolute top-10 left-10 w-16 h-16 bg-slate-950/80 backdrop-blur-2xl rounded-2xl flex items-center justify-center text-white border border-white/5 shadow-2xl active:scale-90 transition-all"><ArrowLeft size={28}/></button>
              <div className="absolute top-10 right-10 px-6 py-3 bg-red-600 text-[10px] font-black uppercase text-white rounded-2xl flex items-center gap-2 shadow-2xl animate-pulse"><Flame size={16} /> HIGH VOLATILITY REGISTRY</div>
            </div>

            <div className="space-y-3">
              <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-[0.95]">{selectedProject.title}</h2>
              <div className="flex items-center gap-4 text-slate-500 font-black text-[10px] uppercase tracking-[0.25em]">
                <span className="text-emerald-400">Node Founder: {selectedProject.founderName}</span>
                <span className="w-2 h-2 rounded-full bg-slate-800" />
                <span>{selectedProject.category}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-20"><Activity size={80} className="text-emerald-500" /></div>
              <div className="h-56 w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeChartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.5}/>
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={5} fillOpacity={1} fill={`url(#colorValue)`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '2rem', fontWeight: '900', color: '#fff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
               <div className="bg-slate-900 p-12 rounded-[3.5rem] border border-slate-800 shadow-2xl col-span-2 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                  <div className="absolute top-0 right-0 p-10 opacity-5 text-emerald-500 group-hover:opacity-10 transition-opacity"><TrendingUp size={120} /></div>
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] mb-3 block">Node Total Liquidity</span>
                  <p className="text-7xl font-black text-white tracking-tighter leading-none">${(state.projects.find(p => p.id === selectedProject.id)?.amountRaised || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
               </div>
               <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-slate-800 shadow-xl flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.25em] mb-3">My Stake</span>
                  <p className="text-3xl font-black text-white tracking-tighter">${(state.investments.find(i => i.projectId === selectedProject.id && i.userId === state.currentUser.id)?.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
               </div>
               <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-slate-800 shadow-xl flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.25em] mb-3">Participants</span>
                  <p className="text-3xl font-black text-emerald-400 tracking-tighter">{selectedProject.investorsCount}</p>
               </div>
            </div>

            <div className="space-y-10 pb-24">
               <h3 className="text-2xl font-black text-white tracking-tighter flex items-center gap-5 uppercase italic leading-none"><Users size={32} className="text-emerald-500" /> Node Registry Participants</h3>
               <div className="space-y-5">
                 {state.investments.filter(inv => inv.projectId === selectedProject.id).length > 0 ? (
                    state.investments.filter(inv => inv.projectId === selectedProject.id).map(inv => {
                      const proj = state.projects.find(p => p.id === selectedProject.id);
                      const informationalShare = (proj?.amountRaised || 0) > 0 ? (inv.amount / proj!.amountRaised) * 100 : 0;
                      return (
                        <div key={inv.id} className="bg-slate-900/60 p-8 rounded-[3rem] border border-slate-800 flex justify-between items-center shadow-2xl group hover:border-emerald-500/40 transition-all animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex items-center gap-6">
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${inv.userName}`} className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 group-hover:scale-110 transition-transform duration-500 shadow-lg" />
                             <div>
                               <p className="font-black text-slate-100 text-lg tracking-tight">{inv.userName}</p>
                               <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.25em] mt-1.5">Share: {informationalShare.toFixed(2)}%</p>
                             </div>
                          </div>
                          <p className="text-2xl font-black text-white tracking-tighter">${inv.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                      );
                    })
                 ) : (
                    <div className="text-center py-10 bg-slate-900/20 rounded-[2rem] border border-slate-800 border-dashed">
                      <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">No node participants yet</p>
                    </div>
                 )}
               </div>
            </div>
            
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-md px-10 z-50 flex gap-5 animate-in slide-in-from-bottom duration-500">
              <button onClick={() => { setIsPoolAction('deposit'); setIsDepositing(false); setIsWithdrawing(false); setPoolAmountInput(''); }} className="flex-1 py-8 bg-emerald-500 text-slate-950 font-black rounded-[2.5rem] uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(16,185,129,0.4)] active:scale-95 transition-all text-sm leading-none">Add Stake</button>
              <button onClick={() => { setIsPoolAction('withdraw'); setIsDepositing(false); setIsWithdrawing(false); setPoolAmountInput(''); }} className="flex-1 py-8 bg-slate-900 border border-slate-800 text-white font-black rounded-[2.5rem] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all text-sm leading-none">Withdraw</button>
            </div>
          </div>
        </div>
      )}

      {(isPoolAction || isDepositing || isWithdrawing) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-10">
          <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-3xl" onClick={() => { setIsPoolAction(null); setIsDepositing(false); setIsWithdrawing(false); }} />
          <div className="relative w-full max-w-sm bg-slate-900 rounded-[4rem] p-14 border border-slate-800 space-y-12 shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
            <div className="text-center">
               <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
                {isPoolAction === 'deposit' ? 'Node Stake' : isPoolAction === 'withdraw' ? 'Node Exit' : isDepositing ? 'Deposit' : 'Withdrawal'}
               </h3>
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Secure Registry Terminal Access</p>
            </div>
            <div className="space-y-8">
              <div className="relative group">
                <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-700 font-black text-4xl group-focus-within:text-emerald-500 transition-colors">
                   $
                </span>
                <input 
                  type="number" 
                  autoFocus 
                  value={isPoolAction ? poolAmountInput : amountInput} 
                  onChange={e => isPoolAction ? setPoolAmountInput(e.target.value) : setAmountInput(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] py-12 pl-20 pr-10 text-6xl font-black text-white outline-none focus:border-emerald-500/50 transition-all text-center tracking-tighter shadow-inner" 
                  placeholder="0.00" 
                />
              </div>
              {isPoolAction === 'deposit' && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[2rem] text-center">
                  <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em] mb-2">Protocol Fee Active</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">3% Creator incentive applied to this registry entry.</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                if (isPoolAction === 'deposit') handlePoolDeposit();
                else if (isPoolAction === 'withdraw') handlePoolWithdraw();
                else if (isDepositing) handleTransactionRequest(TransactionType.DEPOSIT);
                else if (isWithdrawing) handleTransactionRequest(TransactionType.WITHDRAWAL);
              }} 
              className="w-full py-9 bg-emerald-500 text-slate-950 font-black rounded-[2.5rem] uppercase tracking-[0.25em] active:scale-95 transition-all shadow-[0_20px_50px_rgba(16,185,129,0.3)] text-base"
            >
              Confirm Action
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;