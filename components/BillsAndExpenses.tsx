
import React, { useState, useMemo } from 'react';
import { useAccounts } from '../context/AccountsContext';
import { 
  Receipt, History, Clock, Repeat, ArrowDownRight, 
  Trash2, CheckCircle2, AlertCircle, Calendar, 
  Filter, Search, Banknote, CreditCard, ChevronRight, X, PlayCircle, Landmark
} from 'lucide-react';

type Tab = 'ledger' | 'pending' | 'recurring';

const BillsAndExpenses: React.FC = () => {
  const { transactions, recurringPayments, toggleRecurring, deleteRecurring, transferFunds, accounts } = useAccounts();
  const [activeTab, setActiveTab] = useState<Tab>('ledger');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPendingTx, setSelectedPendingTx] = useState<any>(null);
  const [settlementSource, setSettlementSource] = useState('till_float');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const expenseLedger = useMemo(() => {
    return transactions
      .filter(tx => tx.toAccountId === 'operating_expenses' || tx.toAccountId === 'hiking_bar_expenses')
      .filter(tx => tx.note.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   tx.metadata?.payeeName?.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, searchQuery]);

  const pendingBills = useMemo(() => {
    return transactions
      .filter(tx => tx.fromAccountId === 'pending_bills' && !tx.isReconciled);
  }, [transactions]);

  const handleSettlePending = async () => {
    if (!selectedPendingTx) return;
    const destName = settlementSource === 'till_float' ? 'Till Cash' : 'Business Bank';
    
    // Process settlement: From actual cash account to pending_bills (the debt account)
    // In our simplified ledger, moving money from till to pending_bills settles the obligation.
    await transferFunds(
      settlementSource, 
      'pending_bills', 
      selectedPendingTx.amount, 
      `Settled Bill: ${selectedPendingTx.note} via ${destName}`,
      true
    );
    
    // Mark original pending tx as reconciled
    // (This would ideally be handled in AccountsContext.reconcileCreditBill if we used IDs, but here we trigger a transfer)
    setSelectedPendingTx(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      <header className="flex justify-between items-start pt-4">
        <div>
          <h1 className="text-3xl font-bold">Bills & Expenses</h1>
          <p className="text-gray-400 text-sm">Commitment & Outgoings Hub</p>
        </div>
        <div className="bg-rose-500/10 text-rose-400 p-3 rounded-2xl border border-rose-500/20">
          <Receipt size={24} />
        </div>
      </header>

      {/* Tabs */}
      <div className="flex space-x-2 p-1 bg-white/5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('ledger')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ledger' ? 'bg-[#1e1e2f] text-purple-400 shadow-xl border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Ledger
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-[#1e1e2f] text-rose-400 shadow-xl border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Pending ({pendingBills.length})
        </button>
        <button 
          onClick={() => setActiveTab('recurring')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'recurring' ? 'bg-[#1e1e2f] text-blue-400 shadow-xl border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Recurring
        </button>
      </div>

      {/* Search Bar (Only for Ledger) */}
      {activeTab === 'ledger' && (
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text"
            placeholder="Search expense history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm"
          />
        </div>
      )}

      {/* Content Rendering */}
      <section className="space-y-4">
        {activeTab === 'ledger' && (
          <div className="space-y-3">
            {expenseLedger.map(tx => (
              <div key={tx.id} className="neu-convex rounded-3xl p-5 border border-white/5 flex items-center justify-between group">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl bg-white/5 text-gray-400`}>
                    <ArrowDownRight size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-100">{tx.note}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                      {new Date(tx.timestamp).toLocaleDateString()} • {tx.metadata?.payeeName || 'Unknown Payee'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black tracking-tighter text-rose-400">{formatCurrency(tx.amount)}</p>
                  <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest">{tx.fromAccountId.split('_')[0]}</p>
                </div>
              </div>
            ))}
            {expenseLedger.length === 0 && (
              <div className="text-center py-20 opacity-30">
                <History size={48} className="mx-auto mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">No expenses found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingBills.map(tx => (
              <button 
                key={tx.id}
                onClick={() => setSelectedPendingTx(tx)}
                className="w-full text-left neu-convex rounded-[2rem] p-6 border border-rose-500/20 flex items-center justify-between group hover:border-rose-500/40 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/10">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-100">{tx.note}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] text-rose-400 font-black uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-lg">Awaiting Payment</span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{new Date(tx.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-xl font-black tracking-tighter text-white">{formatCurrency(tx.amount)}</p>
                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Settle Now</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-700 group-hover:text-rose-500 transition-colors" />
                </div>
              </button>
            ))}
            {pendingBills.length === 0 && (
              <div className="neu-concave rounded-[3rem] p-16 flex flex-col items-center justify-center text-center space-y-4 border border-white/5">
                <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <p className="font-black text-xl text-gray-300 tracking-tight">Debt-Free Corridor</p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">No pending commitments detected.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recurring' && (
          <div className="grid gap-4">
            {recurringPayments.map(rec => (
              <div key={rec.id} className={`neu-convex rounded-[2rem] p-6 border transition-all ${rec.isActive ? 'border-blue-500/20' : 'border-white/5 opacity-50'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400`}>
                      <Repeat size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-100">{rec.name}</h3>
                      <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mt-1">Frequency: {rec.frequency}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => toggleRecurring(rec.id)}
                      className={`p-2 rounded-xl transition-all ${rec.isActive ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <button 
                      onClick={() => deleteRecurring(rec.id)}
                      className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Amount Per cycle</p>
                    <p className="text-2xl font-black tracking-tighter text-white">{formatCurrency(rec.amount)}</p>
                  </div>
                  <button className="flex items-center space-x-2 bg-blue-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
                    <PlayCircle size={14} />
                    <span>Post Now</span>
                  </button>
                </div>
              </div>
            ))}
            {recurringPayments.length === 0 && (
              <div className="text-center py-20 opacity-30">
                <Calendar size={48} className="mx-auto mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">No recurring payments scheduled</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Settlement Modal */}
      {selectedPendingTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setSelectedPendingTx(null)} />
          <div className="relative w-full max-w-md bg-[#161622] rounded-[3rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in duration-300">
            <button onClick={() => setSelectedPendingTx(null)} className="absolute top-8 right-8 text-gray-500"><X size={24} /></button>
            <header className="text-center mb-8">
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <AlertCircle size={32} className="text-rose-400" />
              </div>
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Debt Settlement</p>
              <h2 className="text-3xl font-black tracking-tighter text-white">{formatCurrency(selectedPendingTx.amount)}</h2>
              <p className="text-xs text-gray-500 mt-2 italic">"{selectedPendingTx.note}"</p>
            </header>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Choose Payment Account</label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'till_float', name: 'Till Cash', icon: Banknote },
                    { id: 'business_bank', name: 'Business Bank', icon: Landmark }
                  ].map(source => (
                    <button 
                      key={source.id}
                      onClick={() => setSettlementSource(source.id)}
                      className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${settlementSource === source.id ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[#1e1e2f] border-white/5 opacity-60'}`}
                    >
                      <div className="flex items-center space-x-3 text-sm font-bold">
                        <source.icon size={18} className="text-rose-400" />
                        <span>{source.name}</span>
                      </div>
                      {settlementSource === source.id && <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center"><CheckCircle2 size={12} className="text-white" /></div>}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSettlePending}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 p-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-rose-500/30 hover:scale-[1.02] active:scale-95 transition-all mt-4 uppercase tracking-widest"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillsAndExpenses;
