
import React, { useMemo, useState } from 'react';
import { X, ArrowUpRight, ArrowDownRight, History, Landmark, CheckSquare, Square, Calculator, Percent, CreditCard, Banknote, Filter, UserCircle, Search, SortAsc, SortDesc, ArrowUpDown } from 'lucide-react';
import { Account, Transaction } from '../types';
import { useAccounts } from '../context/AccountsContext';

interface AccountJournalProps {
  account: Account;
  transactions: Transaction[];
  onClose: () => void;
}

type FilterType = 'all' | 'inflow' | 'outflow';
type SortBy = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

const AccountJournal: React.FC<AccountJournalProps> = ({ account, transactions, onClose }) => {
  const { reconcileCardSettlement, reconcileCreditBill, transferFunds, creditPartners } = useAccounts();
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  
  // Controls
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Reconcile Card Modal
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [netReceived, setNetReceived] = useState('');
  const [reconcileNote, setReconcileNote] = useState('');

  // Till Float Bank Money Modal
  const [isBankMoneyOpen, setIsBankMoneyOpen] = useState(false);
  const [bankMoneyAmount, setBankMoneyAmount] = useState('');

  // Credit Bill Reconcile Modal
  const [isCreditReconcileOpen, setIsCreditReconcileOpen] = useState(false);
  const [creditDest, setCreditDest] = useState('till_float');
  const [partnerFilter, setPartnerFilter] = useState('All');

  const isCardAccount = account.id === 'mozzarella_card_payment' || account.id === 'hiking_bar_card_payment';
  const isPendingBills = account.id === 'pending_bills';
  const isTillFloat = account.id === 'till_float';

  const accountTransactions = useMemo(() => {
    let list = transactions.filter(tx => tx.fromAccountId === account.id || tx.toAccountId === account.id);
    
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(tx => 
        tx.note?.toLowerCase().includes(q) || 
        tx.metadata?.partner?.toLowerCase().includes(q) ||
        tx.amount.toString().includes(q)
      );
    }

    // Filter by type
    if (filterType === 'inflow') {
      list = list.filter(tx => tx.toAccountId === account.id);
    } else if (filterType === 'outflow') {
      list = list.filter(tx => tx.fromAccountId === account.id);
    }

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': return b.timestamp - a.timestamp;
        case 'date-asc': return a.timestamp - b.timestamp;
        case 'amount-desc': return b.amount - a.amount;
        case 'amount-asc': return a.amount - b.amount;
        default: return 0;
      }
    });

    return list;
  }, [transactions, account.id, searchQuery, filterType, sortBy]);

  const pendingTransactions = useMemo(() => {
    let list = accountTransactions.filter(tx => !tx.isReconciled && tx.toAccountId === account.id);
    if (isPendingBills && partnerFilter !== 'All') {
      list = list.filter(tx => tx.metadata?.partner === partnerFilter);
    }
    return list;
  }, [accountTransactions, isPendingBills, partnerFilter]);

  const historyTransactions = useMemo(() => {
    return accountTransactions.filter(tx => tx.isReconciled || tx.fromAccountId === account.id);
  }, [accountTransactions]);

  const selectedTotal = useMemo(() => {
    return transactions
      .filter(tx => selectedTxIds.includes(tx.id))
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [selectedTxIds, transactions]);

  const bankFee = useMemo(() => {
    const net = parseFloat(netReceived) || 0;
    return Math.max(0, selectedTotal - net);
  }, [selectedTotal, netReceived]);

  const feePercentage = useMemo(() => {
    if (selectedTotal === 0) return 0;
    return (bankFee / selectedTotal) * 100;
  }, [bankFee, selectedTotal]);

  const toggleSelection = (id: string) => {
    setSelectedTxIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkReconcileCard = async () => {
    if (selectedTxIds.length === 0 || !netReceived) return;
    await reconcileCardSettlement(
      selectedTxIds, 
      account.id, 
      parseFloat(netReceived), 
      bankFee, 
      reconcileNote || `Reconciled batch of ${selectedTxIds.length} transactions`
    );
    setSelectedTxIds([]);
    setIsReconcileModalOpen(false);
    setNetReceived('');
    setReconcileNote('');
  };

  const handleBulkReconcileCredit = async () => {
    if (selectedTxIds.length === 0) return;
    const destName = creditDest === 'till_float' ? 'Cash' : 'Card';
    await reconcileCreditBill(selectedTxIds, creditDest, `Settled via ${destName}`);
    setSelectedTxIds([]);
    setIsCreditReconcileOpen(false);
  };

  const handleBankMoneyTransfer = async () => {
    const amt = parseFloat(bankMoneyAmount);
    if (!amt || isNaN(amt)) return;
    await transferFunds('till_float', 'staff_bank_card', amt, 'Transfer to Staff Bank Card (Bank Money)');
    setBankMoneyAmount('');
    setIsBankMoneyOpen(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#161622] rounded-[3rem] shadow-2xl border border-white/10 flex flex-col max-h-[90vh] animate-in zoom-in duration-200 overflow-hidden">
        {/* Header */}
        <header className="p-8 border-b border-white/5 relative bg-[#1c1c2b]">
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2 text-gray-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-center space-x-6">
            <div className={`w-20 h-20 rounded-[2rem] bg-gradient-to-br ${account.gradient} flex items-center justify-center shadow-2xl shadow-black/40`}>
              <Landmark size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{account.type} Journal</p>
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black tracking-tighter">{account.name}</h2>
                {isTillFloat && (
                   <button 
                    onClick={() => setIsBankMoneyOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/10"
                   >
                     <Landmark size={14} />
                     <span>Bank Money</span>
                   </button>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xl font-bold text-white">{formatCurrency(account.balance)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Toolbar: Filters, Search, Sort */}
        <div className="p-4 bg-white/[0.02] border-b border-white/5 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text"
              placeholder="Search ledger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e1e2f] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold outline-none focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>

          <div className="flex items-center bg-[#1e1e2f] rounded-xl border border-white/5 p-1">
            {(['all', 'inflow', 'outflow'] as FilterType[]).map(t => (
              <button 
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterType === t ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-[#1e1e2f] rounded-xl border border-white/5 p-1">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="bg-transparent border-none outline-none text-[9px] font-black uppercase tracking-widest text-gray-400 px-2 cursor-pointer"
            >
              <option value="date-desc">Newest</option>
              <option value="date-asc">Oldest</option>
              <option value="amount-desc">Highest $</option>
              <option value="amount-asc">Lowest $</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Action Bars for Card/Bills Selection */}
          {(isCardAccount || isPendingBills) && selectedTxIds.length > 0 && (
            <div className="sticky top-0 z-10 p-4 bg-purple-500/10 backdrop-blur-md border-b border-purple-500/20 flex items-center justify-between animate-in slide-in-from-top duration-300">
               <div className="flex items-center space-x-4">
                 <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white font-black text-xs">
                   {selectedTxIds.length}
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                     {isPendingBills ? 'Selected for Payment' : 'Pending Gross Settlement'}
                   </p>
                   <p className="text-xl font-bold">{formatCurrency(selectedTotal)}</p>
                 </div>
               </div>
               <button 
                onClick={() => isPendingBills ? setIsCreditReconcileOpen(true) : setIsReconcileModalOpen(true)}
                className="bg-purple-500 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-purple-500/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center space-x-2"
               >
                 <Calculator size={18} />
                 <span>Reconcile</span>
               </button>
            </div>
          )}

          <div className="p-6 space-y-8">
            {/* Pending Section for Card/Bills */}
            {(isCardAccount || isPendingBills) && (
              <section className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{isPendingBills ? 'Pending Credit Bills' : 'Pending for Bank Receipt'}</span>
                  </h3>
                  {isPendingBills && (
                    <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                      <Filter size={12} className="text-gray-500" />
                      <select 
                        value={partnerFilter} 
                        onChange={(e) => { setPartnerFilter(e.target.value); setSelectedTxIds([]); }}
                        className="bg-transparent border-none outline-none text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer"
                      >
                        <option value="All">All Profiles</option>
                        {creditPartners.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {pendingTransactions.length > 0 ? (
                    pendingTransactions.map(tx => (
                      <button 
                        key={tx.id} 
                        onClick={() => toggleSelection(tx.id)}
                        className={`w-full text-left neu-convex rounded-3xl p-5 border flex items-center justify-between transition-all ${
                          selectedTxIds.includes(tx.id) ? 'border-purple-500/50 bg-purple-500/5 shadow-purple-500/10' : 'border-white/5 hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-xl ${selectedTxIds.includes(tx.id) ? 'text-purple-400' : 'text-gray-600'}`}>
                            {selectedTxIds.includes(tx.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              {tx.metadata?.partner && <UserCircle size={12} className="text-rose-400" />}
                              <h4 className="font-bold text-sm text-gray-100">{tx.note || (isPendingBills ? tx.metadata?.partner : 'Internal Transfer')}</h4>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                              {new Date(tx.timestamp).toLocaleDateString()} • Pending
                            </p>
                          </div>
                        </div>
                        <p className={`text-lg font-black tracking-tighter ${isPendingBills ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {formatCurrency(tx.amount)}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-10 opacity-30">
                       <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No pending items</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Historical Ledger */}
            <section className="space-y-4">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center space-x-2 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Account Ledger</span>
              </h3>
              <div className="space-y-3">
                {historyTransactions.length > 0 ? (
                  historyTransactions.map((tx) => {
                    const isOutflow = tx.fromAccountId === account.id;
                    return (
                      <div key={tx.id} className="neu-convex rounded-3xl p-5 border border-white/5 flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-2xl ${
                            isOutflow ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {isOutflow ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-gray-100 line-clamp-1">{tx.note || 'Internal Transfer'}</h4>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                {isOutflow ? `To: ${tx.toAccountId.replace('_', ' ')}` : `From: ${tx.fromAccountId.replace('_', ' ')}`}
                              </span>
                              <span className="text-gray-800 text-[10px]">•</span>
                              <span className="text-[9px] text-gray-500 font-bold uppercase">
                                {new Date(tx.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-black tracking-tighter ${
                            isOutflow ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {isOutflow ? '-' : '+'}{formatCurrency(tx.amount)}
                          </p>
                          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                            {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                    <History size={64} className="mb-4 text-gray-600" />
                    <p className="font-black uppercase tracking-widest text-xs">No matching ledger entries</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Modal: Bank Money (Till Float specific) */}
        {isBankMoneyOpen && (
          <div className="absolute inset-0 z-[120] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            <div className="relative w-full max-w-md bg-[#161622] rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in duration-200">
              <header className="text-center mb-8">
                 <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CreditCard size={32} />
                 </div>
                 <h2 className="text-2xl font-black">Bank Money</h2>
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Move Cash to Staff Bank Card</p>
              </header>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Amount to Transfer</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-bold">$</span>
                    <input 
                      type="number"
                      inputMode="decimal"
                      value={bankMoneyAmount}
                      onChange={(e) => setBankMoneyAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#1e1e2f] border border-white/10 rounded-2xl p-4 pl-8 focus:ring-2 focus:ring-blue-500 outline-none font-black text-xl"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button 
                    onClick={() => setIsBankMoneyOpen(false)}
                    className="flex-1 p-5 rounded-2xl font-bold bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleBankMoneyTransfer}
                    disabled={!bankMoneyAmount || parseFloat(bankMoneyAmount) <= 0 || parseFloat(bankMoneyAmount) > account.balance}
                    className="flex-1 p-5 rounded-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-xl shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Confirm Move
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Card Reconcile */}
        {isReconcileModalOpen && (
          <div className="absolute inset-0 z-[120] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            <div className="relative w-full max-w-md bg-[#161622] rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in duration-200">
              <header className="text-center mb-8">
                 <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calculator size={32} />
                 </div>
                 <h2 className="text-2xl font-black">Bank Settlement</h2>
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Reconcile Batch Receipts</p>
              </header>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Expected Gross</p>
                      <p className="text-lg font-bold text-white">{formatCurrency(selectedTotal)}</p>
                   </div>
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Items</p>
                      <p className="text-lg font-bold text-purple-400">{selectedTxIds.length} txns</p>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Net Received in Bank</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 font-bold">$</span>
                    <input 
                      type="number"
                      inputMode="decimal"
                      value={netReceived}
                      onChange={(e) => setNetReceived(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#1e1e2f] border border-white/10 rounded-2xl p-4 pl-8 focus:ring-2 focus:ring-purple-500 outline-none font-black text-xl"
                    />
                  </div>
                </div>

                {parseFloat(netReceived) > 0 && (
                  <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-3">
                       <div className="flex items-center space-x-2">
                          <History size={14} className="text-rose-400" />
                          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Bank Charges</span>
                       </div>
                       <span className="text-lg font-black text-rose-400">-{formatCurrency(bankFee)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-rose-500/10">
                       <div className="flex items-center space-x-2">
                          <Percent size={14} className="text-gray-500" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fee Percentage</span>
                       </div>
                       <span className="text-xs font-black text-gray-400">{feePercentage.toFixed(2)}%</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Settlement Note</label>
                  <input 
                    type="text"
                    value={reconcileNote}
                    onChange={(e) => setReconcileNote(e.target.value)}
                    placeholder="Ref: Statement 0045"
                    className="w-full bg-[#1e1e2f] border border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button onClick={() => setIsReconcileModalOpen(false)} className="flex-1 p-5 rounded-2xl font-bold bg-white/5 hover:bg-white/10 transition-colors">Back</button>
                  <button onClick={handleBulkReconcileCard} disabled={!netReceived || parseFloat(netReceived) <= 0} className="flex-1 p-5 rounded-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/30 active:scale-95 transition-all">Authorize</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Credit Reconcile */}
        {isCreditReconcileOpen && (
          <div className="absolute inset-0 z-[120] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            <div className="relative w-full max-w-md bg-[#161622] rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in duration-200">
              <header className="text-center mb-8">
                 <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Landmark size={32} />
                 </div>
                 <h2 className="text-2xl font-black">Settle Credit Bills</h2>
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Final Payment Collection</p>
              </header>

              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total to Settle</p>
                   <p className="text-3xl font-black text-rose-400">{formatCurrency(selectedTotal)}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Received Via</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setCreditDest('till_float')}
                      className={`p-4 rounded-2xl border flex flex-col items-center space-y-2 transition-all ${creditDest === 'till_float' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-transparent text-gray-500'}`}
                    >
                      <Banknote size={24} />
                      <span className="text-[10px] font-bold uppercase">Cash (Till)</span>
                    </button>
                    <button 
                      onClick={() => setCreditDest('mozzarella_card_payment')}
                      className={`p-4 rounded-2xl border flex flex-col items-center space-y-2 transition-all ${creditDest === 'mozzarella_card_payment' ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-white/5 border-transparent text-gray-500'}`}
                    >
                      <CreditCard size={24} />
                      <span className="text-[10px] font-bold uppercase">Card Pay</span>
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button onClick={() => setIsCreditReconcileOpen(false)} className="flex-1 p-5 rounded-2xl font-bold bg-white/5 hover:bg-white/10 transition-colors">Cancel</button>
                  <button onClick={handleBulkReconcileCredit} className="flex-1 p-5 rounded-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-xl shadow-rose-500/30 active:scale-95 transition-all">Settle Bills</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Journal Footer */}
        <footer className="p-6 bg-black/20 border-t border-white/5 text-center">
          <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">
            Mozzarella Financial Lab • Audit Trail Finalized
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AccountJournal;
