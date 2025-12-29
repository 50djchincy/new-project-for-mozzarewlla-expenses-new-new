
import React, { useState, useMemo } from 'react';
import { useAccounts } from '../context/AccountsContext';
import { Send, Plus, Search, Filter, X, AlertCircle, TrendingUp, TrendingDown, PiggyBank, Wallet } from 'lucide-react';
import AccountJournal from './AccountJournal';
import { Account, Transaction } from '../types';

const MoneyLab: React.FC = () => {
  const { accounts, transactions, transferFunds, totalAssets, totalReceivables } = useAccounts();
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedJournalAccount, setSelectedJournalAccount] = useState<Account | null>(null);
  
  // Form State
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const HIDDEN_ACCOUNT_IDS = [
    'hiking_bar_rec', 
    'variance_short', 
    'variance_excess', 
    'operating_expenses', 
    'hiking_bar_expenses'
  ];

  const visibleAccounts = useMemo(() => 
    accounts.filter(acc => !HIDDEN_ACCOUNT_IDS.includes(acc.id)), 
  [accounts]);

  // Map of accountId to number of unreconciled transactions
  const pendingMap = useMemo(() => {
    const map: Record<string, number> = {};
    const PENDING_TARGET_IDS = ['mozzarella_card_payment', 'hiking_bar_card_payment', 'pending_bills'];
    
    transactions.forEach(tx => {
      if (!tx.isReconciled && tx.toAccountId && PENDING_TARGET_IDS.includes(tx.toAccountId)) {
        map[tx.toAccountId] = (map[tx.toAccountId] || 0) + 1;
      }
    });
    return map;
  }, [transactions]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId || !amount) return;
    await transferFunds(fromId, toId, parseFloat(amount), note);
    setIsTransferOpen(false);
    setFromId('');
    setToId('');
    setAmount('');
    setNote('');
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      {/* Treasury Header */}
      <div className="flex justify-between items-center pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">The Money Lab</h1>
          <p className="text-gray-400 text-sm font-medium">Real-time treasury & liquidity</p>
        </div>
        <button 
          onClick={() => setIsTransferOpen(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center space-x-2"
        >
          <Send size={20} className="text-white" />
          <span className="font-black hidden sm:inline text-white text-xs uppercase tracking-widest">Transfer</span>
        </button>
      </div>

      {/* Liquidity Breakdown */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="neu-convex rounded-[2.5rem] p-6 border border-white/5 flex items-center space-x-6">
           <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <Wallet size={32} />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Available Liquidity</p>
              <h2 className="text-3xl font-black tracking-tighter text-white">{formatCurrency(totalAssets)}</h2>
              <p className="text-[9px] text-emerald-500/60 font-black uppercase tracking-widest mt-1">Confirmed Cash & Bank</p>
           </div>
        </div>
        <div className="neu-convex rounded-[2.5rem] p-6 border border-white/5 flex items-center space-x-6">
           <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <TrendingUp size={32} />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Pending Receivables</p>
              <h2 className="text-3xl font-black tracking-tighter text-white">{formatCurrency(totalReceivables)}</h2>
              <p className="text-[9px] text-amber-500/60 font-black uppercase tracking-widest mt-1">In Transit / Awaiting Check</p>
           </div>
        </div>
      </section>

      {/* Account List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleAccounts.map(acc => {
          const hasPending = pendingMap[acc.id] > 0;
          return (
            <button 
              key={acc.id} 
              onClick={() => setSelectedJournalAccount(acc)}
              className={`neu-convex rounded-[2.5rem] p-6 border relative group overflow-hidden hover:border-white/10 transition-all text-left block w-full ${hasPending ? 'border-rose-500/30' : 'border-white/5'}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${acc.gradient} opacity-10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
              
              {hasPending && (
                <div className="absolute top-6 right-6 z-20 flex items-center">
                   <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse" />
                </div>
              )}
              
              <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${acc.gradient} flex items-center justify-center shadow-2xl shadow-black/40`}>
                    <span className="text-sm font-black text-white">{acc.id.substring(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">{acc.type}</p>
                    <h3 className="font-bold text-gray-100">{acc.name}</h3>
                  </div>
              </div>
              
              <div className="mt-2">
                  <p className="text-3xl font-black tracking-tighter text-white">{formatCurrency(acc.balance)}</p>
                  <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${acc.gradient}`} style={{ width: acc.balance > 1000 ? '90%' : '40%' }} />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">
                      {acc.type === 'Asset' ? 'Verified Assets' : 'Pending Receipt'}
                    </p>
                    <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest group-hover:underline">Explore History</span>
                  </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Account Journal Detail */}
      {selectedJournalAccount && (
        <AccountJournal 
          account={selectedJournalAccount}
          transactions={transactions}
          onClose={() => setSelectedJournalAccount(null)}
        />
      )}

      {/* Transfer Modal Overlay */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsTransferOpen(false)} />
          <div className="relative w-full max-w-md bg-[#161622] rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in duration-200">
            <header className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black">Move Funds</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Internal Reallocation</p>
              </div>
              <button onClick={() => setIsTransferOpen(false)} className="p-2 text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </header>

            <form onSubmit={handleTransfer} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Source Account</label>
                <select 
                  className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold appearance-none cursor-pointer"
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                  required
                >
                  <option value="">Select source</option>
                  {visibleAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Destination</label>
                <select 
                  className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold appearance-none cursor-pointer"
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                  required
                >
                  <option value="">Select destination</option>
                  {visibleAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Amount to Transfer</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 font-bold">$</span>
                   <input 
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 pl-8 focus:ring-2 focus:ring-purple-500 outline-none font-black text-lg"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Internal Note</label>
                <input 
                  type="text"
                  placeholder="Reference/Reason"
                  className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-semibold"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="pt-4 flex space-x-4">
                <button 
                  type="button" 
                  onClick={() => setIsTransferOpen(false)}
                  className="flex-1 bg-white/5 p-5 rounded-2xl font-bold hover:bg-white/10 transition-colors uppercase text-xs tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 p-5 rounded-2xl font-black text-white shadow-xl shadow-purple-500/20 active:scale-95 transition-all uppercase text-xs tracking-widest"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyLab;
