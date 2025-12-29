
import React, { useState, useMemo, useEffect } from 'react';
import { useAccounts } from '../context/AccountsContext';
import { 
  Power, Calculator, Coins, Landmark, ArrowRightCircle, Plus, 
  Hash, X, RotateCcw, MessageSquare, PlusCircle, ShoppingBag, 
  Receipt, Truck, Utensils, Zap, MoreHorizontal, Check, Banknote, CreditCard, History, Trash2, TrendingUp, TrendingDown, Minus, GlassWater
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Food', icon: Utensils, color: 'text-orange-400' },
  { id: 'Drink', icon: ShoppingBag, color: 'text-blue-400' },
  { id: 'Utilities', icon: Zap, color: 'text-yellow-400' },
  { id: 'Rent', icon: Receipt, color: 'text-purple-400' },
  { id: 'Stock', icon: Truck, color: 'text-emerald-400' },
  { id: 'Others', icon: MoreHorizontal, color: 'text-gray-400' },
];

const SOURCES = [
  { id: 'till_float', name: 'Till Cash', icon: Banknote },
  { id: 'business_bank', name: 'Business Bank', icon: Landmark },
  { id: 'mozzarella_card_payment', name: 'Card Collections', icon: CreditCard },
  { id: 'hiking_bar_card_payment', name: 'HB Card Rec.', icon: GlassWater },
  { id: 'staff_bank_card', name: 'Staff Card', icon: CreditCard },
  { id: 'pending_bills', name: 'Payment Pending', icon: History },
];

const InputField = ({ label, name, value, onChange, icon: Icon, placeholder = "0.00" }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-widest">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
        <Icon size={16} />
      </div>
      <input 
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm font-semibold"
      />
    </div>
  </div>
);

const DenomRow = ({ label, name, value, onChange }: { label: string, name: string, value: string, onChange: (name: string, val: string) => void }) => (
  <div className="flex items-center justify-between p-3 neu-concave rounded-2xl border border-white/5">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-xs">
        {label === 'Coins' ? '¢' : '$'}
      </div>
      <span className="font-bold text-sm text-gray-300">{label}</span>
    </div>
    <div className="flex items-center space-x-3">
      <X size={12} className="text-gray-600" />
      <input 
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-16 bg-transparent border-b border-white/10 text-right font-bold text-purple-400 focus:border-purple-500 outline-none p-1"
        placeholder="0"
      />
    </div>
  </div>
);

const DailyOps: React.FC = () => {
  const { currentLog, accounts, transactions, creditPartners, openDay, closeDay, transferFunds, addExpense } = useAccounts();
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseData, setExpenseData] = useState({
    amount: '',
    category: 'Food',
    sourceId: 'till_float',
    note: '',
    isStock: false
  });

  const [formData, setFormData] = useState({
    totalSales: '',
    cardPayments: '',
    hikingBarSales: '',
    foreignCurrency: '',
    foreignCurrencyNote: '',
    actualCash: '' 
  });

  const [creditBills, setCreditBills] = useState<{ id: string, partner: string, amount: string }[]>([]);
  const [currentCreditPartner, setCurrentCreditPartner] = useState(creditPartners[0] || '');
  const [currentCreditAmount, setCurrentCreditAmount] = useState('');

  const [topUpAmount, setTopUpAmount] = useState('');

  const [denoms, setDenoms] = useState<Record<string, string>>({
    '5000': '', '2000': '', '1000': '', '500': '', '100': '', '50': '', '20': '', 'coins': ''
  });

  const tillFloat = accounts.find(a => a.id === 'till_float')?.balance || 0;

  useEffect(() => {
    if (creditPartners.length > 0 && !currentCreditPartner) {
      setCurrentCreditPartner(creditPartners[0]);
    }
  }, [creditPartners, currentCreditPartner]);

  const physicalTotal = useMemo(() => {
    let total = 0;
    Object.entries(denoms).forEach(([key, val]) => {
      const numVal = parseFloat(val) || 0;
      if (key === 'coins') total += numVal;
      else total += parseInt(key) * numVal;
    });
    return total;
  }, [denoms]);

  useEffect(() => {
    if (physicalTotal > 0) {
      setFormData(prev => ({ ...prev, actualCash: physicalTotal.toString() }));
    }
  }, [physicalTotal]);

  const resetCalculator = () => {
    setDenoms({ '5000': '', '2000': '', '1000': '', '500': '', '100': '', '50': '', '20': '', 'coins': '' });
  };

  const totalCreditBillsAmount = useMemo(() => 
    creditBills.reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0)
  , [creditBills]);

  // Calculate shift expenses from till_float
  const shiftCashExpenses = useMemo(() => {
    if (!currentLog) return 0;
    return transactions
      .filter(tx => 
        tx.timestamp >= currentLog.timestamp && 
        tx.fromAccountId === 'till_float' && 
        (tx.toAccountId === 'operating_expenses' || tx.toAccountId === 'hiking_bar_expenses' || tx.metadata?.isLoan)
      )
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions, currentLog]);

  const calculations = useMemo(() => {
    const totalSales = parseFloat(formData.totalSales) || 0;
    const cardPayments = parseFloat(formData.cardPayments) || 0;
    const creditBillsSum = totalCreditBillsAmount;
    const hikingBarSales = parseFloat(formData.hikingBarSales) || 0;
    const foreignCurrency = parseFloat(formData.foreignCurrency) || 0;
    const openingFloat = currentLog?.openingFloat || 0;
    
    // Non-cash components
    const totalNonCash = cardPayments + creditBillsSum + hikingBarSales + foreignCurrency;
    
    // Net cash contribution
    const cashSales = totalSales - totalNonCash;
    
    // Expected = Opening + Cash Revenue - Expenses from Till
    const expectedCash = openingFloat + cashSales - shiftCashExpenses;
    
    // Variance
    const actual = parseFloat(formData.actualCash) || 0;
    const variance = actual - expectedCash;
    
    return { cashSales, expectedCash, variance, totalNonCash, cardPayments, creditBillsSum, hikingBarSales, foreignCurrency };
  }, [formData, currentLog, totalCreditBillsAmount, shiftCashExpenses]);

  const handleOpenDay = async () => {
    await openDay(tillFloat);
  };

  const handleTopUp = async () => {
    const amt = parseFloat(topUpAmount);
    if (!amt || isNaN(amt)) return;
    await transferFunds('owner_equity', 'till_float', amt, 'Shift Float Top-Up');
    setTopUpAmount('');
  };

  const handleAddCreditBill = () => {
    if (!currentCreditAmount || parseFloat(currentCreditAmount) <= 0 || !currentCreditPartner) return;
    setCreditBills(prev => [
      ...prev, 
      { id: Date.now().toString(), partner: currentCreditPartner, amount: currentCreditAmount }
    ]);
    setCurrentCreditAmount('');
  };

  const removeCreditBill = (id: string) => {
    setCreditBills(prev => prev.filter(b => b.id !== id));
  };

  const handleQuickExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseData.amount || parseFloat(expenseData.amount) <= 0) return;
    await addExpense({
      amount: parseFloat(expenseData.amount),
      category: expenseData.category,
      note: expenseData.note,
      sourceId: expenseData.sourceId,
      isStock: expenseData.isStock
    });
    setIsExpenseModalOpen(false);
    setExpenseData({ amount: '', category: 'Food', sourceId: 'till_float', note: '', isStock: false });
  };

  const handleCloseDay = async (e: React.FormEvent) => {
    e.preventDefault();
    const actual = parseFloat(formData.actualCash);
    const foreignVal = parseFloat(formData.foreignCurrency) || 0;

    if (isNaN(actual)) return;
    if (foreignVal > 0 && !formData.foreignCurrencyNote.trim()) {
      alert("A comment is mandatory when foreign currency is entered.");
      return;
    }

    await closeDay({
      totalSales: parseFloat(formData.totalSales) || 0,
      cardPayments: parseFloat(formData.cardPayments) || 0,
      creditBills: totalCreditBillsAmount,
      creditBillsList: creditBills.map(b => ({ partner: b.partner, amount: parseFloat(b.amount) })),
      hikingBarSales: parseFloat(formData.hikingBarSales) || 0,
      foreignCurrency: foreignVal,
      foreignCurrencyNote: formData.foreignCurrencyNote,
      expensesCash: shiftCashExpenses,
      expectedCash: calculations.expectedCash,
      actualCash: actual,
    });
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const handleFormChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDenomChange = (name: string, value: string) => {
    setDenoms(prev => ({ ...prev, [name]: value }));
  };

  if (!currentLog) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-lg mx-auto pb-24">
        <header className="text-center pt-8">
          <h1 className="text-4xl font-bold tracking-tight">Shift Start</h1>
          <p className="text-gray-400 mt-2">Ready for the floor?</p>
        </header>

        <div className="neu-convex rounded-[2.5rem] p-8 border border-white/5 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <Landmark size={32} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Available Float</p>
              <h2 className="text-5xl font-bold tracking-tighter text-white">{formatCurrency(tillFloat)}</h2>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Injection (Optional)</label>
            <div className="flex space-x-3">
              <div className="relative flex-1">
                 <input 
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 pl-10 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                />
                <Plus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
              </div>
              <button 
                onClick={handleTopUp}
                className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-6 rounded-2xl transition-all font-bold shadow-lg"
              >
                Inject
              </button>
            </div>
          </div>

          <button 
            onClick={handleOpenDay}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-[2rem] font-bold text-xl shadow-2xl shadow-emerald-500/30 flex items-center justify-center space-x-3 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Power size={24} />
            <span>Open Day</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500 pb-32">
      <header className="flex justify-between items-start pt-4">
        <div>
          <h1 className="text-3xl font-bold">Close Shift</h1>
          <p className="text-gray-400 text-sm">Review day operations</p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-2xl text-[10px] font-bold border border-emerald-500/20 tracking-widest">
          {currentLog.date}
        </div>
      </header>

      <form onSubmit={handleCloseDay} className="space-y-6">
        <section className="neu-convex rounded-[2rem] p-6 border border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center space-x-2">
              <Calculator size={14} />
              <span>Operational Figures</span>
            </h2>
            <button 
              type="button"
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all shadow-lg shadow-purple-500/20"
            >
              <PlusCircle size={12} />
              <span>Quick Expense</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Total Sales" name="totalSales" value={formData.totalSales} onChange={handleFormChange} icon={Hash} />
            <InputField label="Card Payments" name="cardPayments" value={formData.cardPayments} onChange={handleFormChange} icon={Landmark} />
            <InputField label="Hiking Sales" name="hikingBarSales" value={formData.hikingBarSales} onChange={handleFormChange} icon={Landmark} />
            <InputField label="Foreign CCY Received" name="foreignCurrency" value={formData.foreignCurrency} onChange={handleFormChange} icon={Coins} />
          </div>

          {/* Credit Bills Section */}
          <div className="pt-4 border-t border-white/5 space-y-4">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-widest flex items-center">
              <ArrowRightCircle size={14} className="mr-2 text-rose-400" />
              Detailed Credit Bills
            </label>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <select 
                  value={currentCreditPartner}
                  onChange={(e) => setCurrentCreditPartner(e.target.value)}
                  className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-3 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-bold"
                >
                  <option value="" disabled>Select partner</option>
                  {creditPartners.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="relative w-full sm:w-32">
                <input 
                  type="number"
                  inputMode="decimal"
                  value={currentCreditAmount}
                  onChange={(e) => setCurrentCreditAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-3 pl-8 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-bold"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-[10px] font-bold">$</span>
              </div>
              <button 
                type="button"
                onClick={handleAddCreditBill}
                className="bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white p-3 rounded-2xl transition-all font-bold text-xs"
              >
                Add Bill
              </button>
            </div>

            {/* List of Added Bills */}
            {creditBills.length > 0 && (
              <div className="space-y-2 mt-4 animate-in fade-in duration-300">
                {creditBills.map(bill => (
                  <div key={bill.id} className="flex justify-between items-center bg-black/20 p-3 rounded-2xl border border-white/5">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                        <Receipt size={14} />
                      </div>
                      <span className="text-xs font-bold text-gray-300">{bill.partner}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-black text-rose-400">{formatCurrency(parseFloat(bill.amount))}</span>
                      <button 
                        type="button" 
                        onClick={() => removeCreditBill(bill.id)}
                        className="p-2 text-gray-600 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center p-3 border-t border-white/5 mt-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Credit Bills</span>
                  <span className="text-sm font-black text-rose-400">{formatCurrency(totalCreditBillsAmount)}</span>
                </div>
              </div>
            )}
          </div>

          {(parseFloat(formData.foreignCurrency) > 0) && (
            <div className="pt-2 animate-in slide-in-from-top duration-300">
              <label className="text-[10px] font-bold text-orange-400 uppercase ml-2 tracking-widest flex items-center">
                <MessageSquare size={12} className="mr-1" />
                Mandatory Foreign CCY Comment
              </label>
              <div className="relative mt-1">
                <textarea
                  value={formData.foreignCurrencyNote}
                  onChange={(e) => handleFormChange('foreignCurrencyNote', e.target.value)}
                  placeholder="Detail currencies, exchange rates or reason..."
                  className="w-full bg-[#161622] border border-orange-500/20 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all min-h-[80px]"
                  required
                />
              </div>
            </div>
          )}
        </section>

        <section className="neu-convex rounded-[2.5rem] p-6 border border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center space-x-2">
              <Coins size={14} />
              <span>Cash Calculator</span>
            </h2>
            <div className="flex items-center space-x-4">
               <button 
                type="button" 
                onClick={resetCalculator}
                className="p-2 text-gray-500 hover:text-rose-500 transition-colors"
                title="Reset Calculator"
              >
                <RotateCcw size={18} />
              </button>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Physical Total</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(physicalTotal)}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DenomRow label="5,000" name="5000" value={denoms['5000']} onChange={handleDenomChange} />
            <DenomRow label="2,000" name="2000" value={denoms['2000']} onChange={handleDenomChange} />
            <DenomRow label="1,000" name="1000" value={denoms['1000']} onChange={handleDenomChange} />
            <DenomRow label="500" name="500" value={denoms['500']} onChange={handleDenomChange} />
            <DenomRow label="100" name="100" value={denoms['100']} onChange={handleDenomChange} />
            <DenomRow label="50" name="50" value={denoms['50']} onChange={handleDenomChange} />
            <DenomRow label="20" name="20" value={denoms['20']} onChange={handleDenomChange} />
            <div className="flex items-center justify-between p-3 neu-concave rounded-2xl border border-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 font-bold text-xs">¢</div>
                <span className="font-bold text-sm text-gray-300">Coins</span>
              </div>
              <input 
                type="number"
                inputMode="decimal"
                value={denoms.coins}
                onChange={(e) => handleDenomChange('coins', e.target.value)}
                className="w-20 bg-transparent border-b border-white/10 text-right font-bold text-teal-400 focus:border-teal-500 outline-none p-1"
                placeholder="0.00"
              />
            </div>
          </div>
        </section>

        {/* Final Math Summary */}
        <section className="neu-concave rounded-[2.5rem] p-8 border border-white/5 space-y-6 bg-black/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Calculator size={120} /></div>
          <div className="space-y-4 relative z-10">
            {/* Base Opening */}
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-gray-400">Opening Float</span>
              <span className="font-bold text-gray-200">{formatCurrency(currentLog.openingFloat)}</span>
            </div>
            
            {/* Sales Plus */}
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-gray-400">Total Revenue (Gross)</span>
              <span className="font-bold text-emerald-400">+{formatCurrency(parseFloat(formData.totalSales) || 0)}</span>
            </div>

            {/* Deductions Sub-list */}
            <div className="pl-4 space-y-2 border-l border-white/10 my-2">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Non-Cash Deductions</p>
              
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-500">Card Payments</span>
                <span className="text-rose-400/80">-{formatCurrency(calculations.cardPayments)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-500">Hiking Bar Debt</span>
                <span className="text-rose-400/80">-{formatCurrency(calculations.hikingBarSales)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-500">Credit Bills</span>
                <span className="text-rose-400/80">-{formatCurrency(calculations.creditBillsSum)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-500">Foreign CCY</span>
                <span className="text-rose-400/80">-{formatCurrency(calculations.foreignCurrency)}</span>
              </div>
            </div>

            {/* Cash Expenses Minus */}
            <div className="flex justify-between items-center text-sm font-medium pt-2 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-gray-400">Cash Expenses (Shift)</span>
                <span className="text-[8px] text-gray-600 uppercase tracking-widest">Deducted from Till</span>
              </div>
              <span className="font-bold text-rose-400">-{formatCurrency(shiftCashExpenses)}</span>
            </div>

            <div className="h-px bg-white/5 w-full my-2" />
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                 <span className="text-sm font-bold text-gray-300 uppercase tracking-widest">Expected Till</span>
                 <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">(Opening + Gross - NonCash - Expenses)</span>
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">{formatCurrency(calculations.expectedCash)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Physical Count</p>
                  <p className="text-xl font-black text-emerald-400">{formatCurrency(physicalTotal)}</p>
               </div>
               <div className={`p-4 rounded-2xl border ${calculations.variance === 0 ? 'bg-white/5 border-white/5' : calculations.variance < 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Variance</p>
                  <div className="flex items-center space-x-1">
                    {calculations.variance < 0 ? <TrendingDown size={14} className="text-rose-400" /> : calculations.variance > 0 ? <TrendingUp size={14} className="text-emerald-400" /> : null}
                    <p className={`text-xl font-black ${calculations.variance === 0 ? 'text-gray-400' : calculations.variance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatCurrency(calculations.variance)}
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </section>

        <button 
          type="submit"
          disabled={physicalTotal === 0 && !formData.actualCash}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 p-7 rounded-[2.5rem] font-bold text-xl shadow-2xl shadow-purple-500/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
        >
          Finalize & Record Shift
        </button>
      </form>

      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsExpenseModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#161622] rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <header className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Quick Expense</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Shift Transaction</p>
              </div>
              <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
            </header>
            <form onSubmit={handleQuickExpenseSubmit} className="space-y-6">
              <div className="neu-convex rounded-3xl p-6 border border-white/5 text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Amount</p>
                <div className="relative inline-block">
                  <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-purple-400">$</span>
                  <input type="number" inputMode="decimal" value={expenseData.amount} onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})} placeholder="0.00" className="bg-transparent text-4xl font-black tracking-tighter text-white outline-none w-full max-w-[150px] text-center" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} type="button" onClick={() => setExpenseData({...expenseData, category: cat.id})} className={`p-3 rounded-2xl border transition-all flex flex-col items-center space-y-1 ${expenseData.category === cat.id ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}>
                    <cat.icon size={16} className={expenseData.category === cat.id ? cat.color : ''} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">{cat.id}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-widest">Payment Source</label>
                <div className="grid grid-cols-1 gap-2">
                  {SOURCES.map(source => (
                    <button key={source.id} type="button" onClick={() => setExpenseData({...expenseData, sourceId: source.id})} className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${expenseData.sourceId === source.id ? 'bg-purple-500/10 border-purple-500/30' : 'bg-[#1e1e2f] border-white/5 opacity-60'}`}>
                      <div className="flex items-center space-x-3 text-sm font-bold"><source.icon size={18} className="text-purple-400" /><span>{source.name}</span></div>
                      {expenseData.sourceId === source.id && <Check size={16} className="text-purple-500" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-widest">Note</label>
                <input type="text" value={expenseData.note} onChange={(e) => setExpenseData({...expenseData, note: e.target.value})} placeholder="Details..." className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
              <button type="submit" className="w-full p-6 rounded-[2rem] bg-gradient-to-r from-purple-500 to-pink-500 font-bold text-lg shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all">Log Transaction</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyOps;
