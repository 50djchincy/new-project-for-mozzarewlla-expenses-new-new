
import React, { useState, useMemo } from 'react';
import { useAccounts } from '../context/AccountsContext';
import { 
  Landmark, ArrowUpRight, CheckCircle2, AlertCircle, X, Banknote, 
  CreditCard, Receipt, GlassWater, History, TrendingUp, Clock, BarChart3,
  CheckCircle, ArrowRightLeft
} from 'lucide-react';
import { Transaction } from '../types';

const InputRow = ({ label, name, value, onChange, icon: Icon, colorClass }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-widest">{label}</label>
    <div className="relative">
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${colorClass}`}>
        <Icon size={16} />
      </div>
      <input 
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder="0.00"
        className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm font-semibold"
      />
    </div>
  </div>
);

const HikingBar: React.FC = () => {
  const { accounts, transactions, reconcileTransaction } = useAccounts();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  
  // Modal Form State
  const [formData, setFormData] = useState({
    cash: '',
    card: '',
    serviceCharge: '',
    contra: ''
  });

  const hbDebt = accounts.find(a => a.id === 'hiking_bar_rec')?.balance || 0;
  
  const allHbTx = useMemo(() => {
    return transactions.filter(t => t.toAccountId === 'hiking_bar_rec' || t.fromAccountId === 'hiking_bar_rec');
  }, [transactions]);

  const unreconciledTx = useMemo(() => {
    return allHbTx.filter(t => t.toAccountId === 'hiking_bar_rec' && !t.isReconciled);
  }, [allHbTx]);

  const historyTx = useMemo(() => {
    return allHbTx.filter(t => t.isReconciled || t.fromAccountId === 'hiking_bar_rec')
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [allHbTx]);

  // Small Analysis Calculations
  const analysis = useMemo(() => {
    const totalInflow = allHbTx
      .filter(t => t.toAccountId === 'hiking_bar_rec')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalOutflow = allHbTx
      .filter(t => t.fromAccountId === 'hiking_bar_rec')
      .reduce((sum, t) => sum + t.amount, 0);

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentVolume = allHbTx
      .filter(t => t.timestamp > sevenDaysAgo && t.toAccountId === 'hiking_bar_rec')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const avgTicket = totalInflow > 0 ? totalInflow / allHbTx.filter(t => t.toAccountId === 'hiking_bar_rec').length : 0;
    
    // Recovery rate: Settled / (Settled + Pending)
    const settledAmount = totalInflow - hbDebt;
    const recoveryRate = totalInflow > 0 ? (settledAmount / totalInflow) * 100 : 0;

    return { totalInflow, totalOutflow, recentVolume, avgTicket, recoveryRate };
  }, [allHbTx, hbDebt]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const handleSettleClick = (tx: Transaction) => {
    setSelectedTx(tx);
    setFormData({ cash: '', card: '', serviceCharge: '', contra: '' });
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;

    const data = {
      cash: parseFloat(formData.cash) || 0,
      card: parseFloat(formData.card) || 0,
      serviceCharge: parseFloat(formData.serviceCharge) || 0,
      contra: parseFloat(formData.contra) || 0
    };

    const totalInput = data.cash + data.card + data.serviceCharge + data.contra;
    
    if (Math.abs(totalInput - selectedTx.amount) > 0.01) {
      alert(`Validation Failed: Sum (${formatCurrency(totalInput)}) must match transaction amount (${formatCurrency(selectedTx.amount)})`);
      return;
    }

    await reconcileTransaction(selectedTx.id, data);
    setSelectedTx(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      <header className="flex justify-between items-end pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Hiking Bar</h1>
          <p className="text-gray-400 text-sm font-medium">Inter-Restaurant Ledger</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Total Outstanding</p>
          <div className="flex items-center justify-end space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-3xl font-black text-blue-400 tracking-tighter">{formatCurrency(hbDebt)}</p>
          </div>
        </div>
      </header>

      {/* Analysis Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="neu-convex rounded-[2rem] p-5 border border-white/5">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center">
            <TrendingUp size={10} className="mr-1 text-emerald-400" /> Intake (7d)
          </p>
          <p className="text-xl font-black text-white">{formatCurrency(analysis.recentVolume)}</p>
        </div>
        <div className="neu-convex rounded-[2rem] p-5 border border-white/5">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center">
            <Clock size={10} className="mr-1 text-amber-400" /> Avg. Bill
          </p>
          <p className="text-xl font-black text-white">{formatCurrency(analysis.avgTicket)}</p>
        </div>
        <div className="neu-convex rounded-[2rem] p-5 border border-white/5 col-span-2">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center">
              <BarChart3 size={10} className="mr-1 text-purple-400" /> Settlement Progress
            </p>
            <span className="text-[10px] font-black text-purple-400">{analysis.recoveryRate.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000" 
              style={{ width: `${analysis.recoveryRate}%` }}
            />
          </div>
        </div>
      </section>

      {/* Main Tabs */}
      <div className="flex space-x-2 p-1 bg-white/5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-[#1e1e2f] text-blue-400 shadow-xl border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Pending ({unreconciledTx.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-[#1e1e2f] text-emerald-400 shadow-xl border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
        >
          History
        </button>
      </div>

      {/* Transaction List */}
      <section className="space-y-4">
        {activeTab === 'pending' ? (
          <div className="grid gap-4">
            {unreconciledTx.map(tx => (
              <button 
                key={tx.id}
                onClick={() => handleSettleClick(tx)}
                className="neu-convex rounded-3xl p-6 border border-white/5 flex items-center justify-between text-left group hover:border-blue-500/30 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/10">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-100 line-clamp-1">{tx.note || 'Restaurant Order'}</h3>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">
                      {new Date(tx.timestamp).toLocaleDateString()} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black tracking-tighter text-white">{formatCurrency(tx.amount)}</p>
                  <div className="flex items-center justify-end text-[9px] font-black text-amber-500 uppercase tracking-widest mt-1">
                     <AlertCircle size={10} className="mr-1" /> Awaiting
                  </div>
                </div>
              </button>
            ))}
            
            {unreconciledTx.length === 0 && (
              <div className="neu-concave rounded-[3rem] p-16 flex flex-col items-center justify-center text-center space-y-4 border border-white/5">
                <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CheckCircle size={40} />
                </div>
                <div>
                  <p className="font-black text-xl text-gray-300 tracking-tight">Debt-Free Corridor</p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">All partner orders have been settled.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {historyTx.map(tx => {
               const isOutflow = tx.fromAccountId === 'hiking_bar_rec';
               return (
                <div 
                  key={tx.id}
                  className="neu-convex rounded-3xl p-6 border border-white/5 flex items-center justify-between opacity-80"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                      isOutflow ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 'bg-gray-500/5 text-gray-500 border-white/5'
                    }`}>
                      {isOutflow ? <ArrowRightLeft size={24} /> : <Receipt size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-gray-200 line-clamp-1">{tx.note || 'Settlement'}</h3>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">
                        {new Date(tx.timestamp).toLocaleDateString()} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black tracking-tighter ${isOutflow ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {isOutflow ? '-' : '+'}{formatCurrency(tx.amount)}
                    </p>
                    <div className="flex items-center justify-end text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">
                       <CheckCircle2 size={10} className="mr-1" /> {isOutflow ? 'Settled' : 'Billed'}
                    </div>
                  </div>
                </div>
              );
            })}

            {historyTx.length === 0 && (
              <div className="text-center py-20 opacity-30">
                 <History size={48} className="mx-auto mb-4" />
                 <p className="font-black uppercase tracking-widest text-xs">No history recorded</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Reconciliation Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedTx(null)} />
          <div className="relative w-full max-w-md bg-[#161622] rounded-[3rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in duration-300">
            <header className="text-center mb-8 relative">
              <button 
                onClick={() => setSelectedTx(null)}
                className="absolute -top-4 -right-4 p-3 text-gray-500 hover:text-white bg-white/5 rounded-full transition-all"
              >
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                <Landmark size={32} className="text-blue-400" />
              </div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Reconcile Order</p>
              <h2 className="text-4xl font-black tracking-tighter text-white">{formatCurrency(selectedTx.amount)}</h2>
              <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic font-medium opacity-60">"{selectedTx.note}"</p>
            </header>

            <form onSubmit={handleReconcile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputRow label="Cash" name="cash" value={formData.cash} onChange={handleInputChange} icon={Banknote} colorClass="text-emerald-400" />
                <InputRow label="Card Pay" name="card" value={formData.card} onChange={handleInputChange} icon={CreditCard} colorClass="text-purple-400" />
                <InputRow label="Svc Charge" name="serviceCharge" value={formData.serviceCharge} onChange={handleInputChange} icon={ArrowUpRight} colorClass="text-rose-400" />
                <InputRow label="Contra" name="contra" value={formData.contra} onChange={handleInputChange} icon={GlassWater} colorClass="text-blue-400" />
              </div>

              <div className="neu-concave rounded-[2rem] p-6 border border-white/5 space-y-4 bg-black/40 mt-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <BarChart3 size={60} />
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                   <span>Allocation Status</span>
                   <span className={Math.abs((parseFloat(formData.cash) || 0) + (parseFloat(formData.card) || 0) + (parseFloat(formData.serviceCharge) || 0) + (parseFloat(formData.contra) || 0) - selectedTx.amount) < 0.01 ? 'text-emerald-400' : 'text-rose-400'}>
                     {formatCurrency((parseFloat(formData.cash) || 0) + (parseFloat(formData.card) || 0) + (parseFloat(formData.serviceCharge) || 0) + (parseFloat(formData.contra) || 0))}
                   </span>
                </div>
                <div className="h-px bg-white/5 w-full" />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Amount</span>
                  <span className="text-2xl font-black text-white tracking-tighter">{formatCurrency(selectedTx.amount)}</span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={Math.abs((parseFloat(formData.cash) || 0) + (parseFloat(formData.card) || 0) + (parseFloat(formData.serviceCharge) || 0) + (parseFloat(formData.contra) || 0) - selectedTx.amount) > 0.01}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:grayscale uppercase tracking-widest"
              >
                Confirm Settlement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HikingBar;
