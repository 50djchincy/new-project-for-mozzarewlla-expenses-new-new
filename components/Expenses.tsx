
import React, { useState, useMemo, useEffect } from 'react';
import { useAccounts } from '../context/AccountsContext';
import { 
  ShoppingBag, Receipt, Truck, Utensils, Zap, MoreHorizontal, Check, 
  CreditCard, Banknote, History, Users, User, Landmark, GlassWater, 
  ArrowRight, Layers, Save, Repeat, Trash2, LayoutTemplate, 
  DollarSign, Clock, PiggyBank, CheckCircle2, ChevronRight, X,
  UserCog, HandCoins
} from 'lucide-react';
import { Staff } from '../types';

const SOURCES = [
  { id: 'till_float', name: 'Till Cash', icon: Banknote },
  { id: 'business_bank', name: 'Business Bank', icon: Landmark },
  { id: 'staff_bank_card', name: 'Staff Bank Card', icon: CreditCard },
];

type StaffAction = 'general' | 'payroll' | 'advance' | 'loan';

const Expenses: React.FC = () => {
  const { 
    addExpense, staff, vendors, expenseCategories, templates, 
    deleteTemplate, commitPayroll, manageStaffAdvance, manageStaffLoan 
  } = useAccounts();

  // Core State
  const [payeeType, setPayeeType] = useState<'vendor' | 'staff'>('vendor');
  const [payeeId, setPayeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [sourceId, setSourceId] = useState('business_bank');
  const [note, setNote] = useState('');
  
  // Staff Specific State
  const [staffAction, setStaffAction] = useState<StaffAction>('general');
  const [payrollCycle, setPayrollCycle] = useState<'1st' | '15th'>('1st');
  const [initialLoanAmount, setInitialLoanAmount] = useState('');
  const [loanDeductionInput, setLoanDeductionInput] = useState('');
  const [advanceDeductionInput, setAdvanceDeductionInput] = useState('');

  // General Expense Specific State
  const [categoryId, setCategoryId] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [isStock, setIsStock] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedStaff = useMemo(() => 
    payeeType === 'staff' ? staff.find(s => s.id === payeeId) : null,
  [payeeType, payeeId, staff]);

  const activeCategory = useMemo(() => 
    expenseCategories.find(c => c.id === categoryId), 
  [categoryId, expenseCategories]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  // Sync amount when switching cycles for staff payroll
  useEffect(() => {
    if (selectedStaff && staffAction === 'payroll') {
      if (payrollCycle === '1st') {
        setAmount(selectedStaff.baseSalary.toString());
        setLoanDeductionInput(Math.min(selectedStaff.monthlyLoanInstallment, selectedStaff.loanBalance).toString());
        setAdvanceDeductionInput(selectedStaff.advanceBalance.toString());
      } else {
        setAmount('');
        setLoanDeductionInput('0');
        setAdvanceDeductionInput('0');
      }
    }
  }, [payrollCycle, selectedStaff, staffAction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) < 0 || !payeeId || isProcessing) return;
    
    setIsProcessing(true);

    try {
      if (payeeType === 'vendor' || (payeeType === 'staff' && staffAction === 'general')) {
        await addExpense({
          amount: parseFloat(amount),
          category: activeCategory?.name || (payeeType === 'staff' ? 'Staff' : 'Others'),
          subCategory,
          note,
          sourceId,
          isStock,
          payeeType,
          payeeId,
          saveAsTemplate,
          templateName
        });
      } else if (payeeType === 'staff') {
        if (staffAction === 'payroll') {
          const gross = parseFloat(amount) || 0;
          const loanDed = parseFloat(loanDeductionInput) || 0;
          const advDed = parseFloat(advanceDeductionInput) || 0;
          await commitPayroll(payeeId, payrollCycle, gross, loanDed, advDed, sourceId);
        } else if (staffAction === 'advance') {
          await manageStaffAdvance(payeeId, parseFloat(amount), sourceId);
        } else if (staffAction === 'loan') {
          await manageStaffLoan(payeeId, parseFloat(amount), parseFloat(initialLoanAmount), sourceId);
        }
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        resetForm();
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setNote('');
    setIsStock(false);
    setCategoryId('');
    setSubCategory('');
    setPayeeId('');
    setSaveAsTemplate(false);
    setTemplateName('');
    setInitialLoanAmount('');
    setLoanDeductionInput('');
    setAdvanceDeductionInput('');
    setStaffAction('general');
  };

  const loadTemplate = (tpl: any) => {
    setAmount(tpl.amount.toString());
    setCategoryId(tpl.categoryId);
    setSubCategory(tpl.subCategory);
    setSourceId(tpl.sourceId);
    setPayeeType(tpl.payeeType);
    setPayeeId(tpl.payeeId);
    setNote(tpl.note);
    setIsStock(tpl.isStock);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-32 max-w-lg mx-auto">
      <header className="pt-4">
        <h1 className="text-3xl font-black tracking-tight">Financial Center</h1>
        <p className="text-gray-400 text-sm font-medium">Unified Expenditure Management</p>
      </header>

      {/* Quick Templates Bar */}
      {templates.length > 0 && payeeType === 'vendor' && (
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2 flex items-center">
            <LayoutTemplate size={12} className="mr-2" /> Quick Templates
          </label>
          <div className="flex space-x-3 overflow-x-auto pb-4 no-scrollbar px-1">
            {templates.map(tpl => (
              <div key={tpl.id} className="relative group shrink-0">
                <button 
                  onClick={() => loadTemplate(tpl)}
                  className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-xs font-bold hover:bg-white/10 hover:border-purple-500/30 transition-all flex items-center space-x-2 whitespace-nowrap"
                >
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>{tpl.name}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payee Selection - ALWAYS VISIBLE */}
        <div className="neu-convex rounded-[2rem] p-6 border border-white/5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Recipient</label>
            <div className="flex bg-white/5 rounded-full p-1 border border-white/5">
              <button 
                type="button" 
                onClick={() => { setPayeeType('vendor'); setPayeeId(''); }}
                className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${payeeType === 'vendor' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-500'}`}
              >Vendor</button>
              <button 
                type="button"
                onClick={() => { setPayeeType('staff'); setPayeeId(''); setStaffAction('general'); }}
                className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${payeeType === 'staff' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-500'}`}
              >Staff</button>
            </div>
          </div>
          
          <div className="relative">
            {payeeType === 'vendor' ? (
              <ShoppingBag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
            ) : (
              <UserCog size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
            )}
            <select 
              value={payeeId}
              onChange={(e) => setPayeeId(e.target.value)}
              className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold appearance-none cursor-pointer"
              required
            >
              <option value="">Choose {payeeType === 'vendor' ? 'Vendor Profile' : 'Staff Member'}</option>
              {payeeType === 'vendor' 
                ? vendors.map(v => <option key={v.id} value={v.id} className="bg-[#161622]">{v.name}</option>)
                : staff.map(s => <option key={s.id} value={s.id} className="bg-[#161622]">{s.name} ({s.role})</option>)
              }
            </select>
          </div>
        </div>

        {/* Dynamic Staff Sub-Menu */}
        {payeeType === 'staff' && payeeId && (
          <div className="neu-convex rounded-[2rem] p-4 bg-white/[0.02] border border-white/5">
            <div className="grid grid-cols-4 gap-2">
              {(['general', 'payroll', 'advance', 'loan'] as StaffAction[]).map(action => (
                <button
                  key={action}
                  type="button"
                  onClick={() => { setStaffAction(action); setAmount(''); }}
                  className={`py-3 rounded-xl flex flex-col items-center space-y-1 transition-all border ${
                    staffAction === action 
                    ? 'bg-purple-500/10 border-purple-500/40 text-purple-400' 
                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {action === 'general' && <Receipt size={16} />}
                  {action === 'payroll' && <DollarSign size={16} />}
                  {action === 'advance' && <Clock size={16} />}
                  {action === 'loan' && <PiggyBank size={16} />}
                  <span className="text-[8px] font-black uppercase tracking-tighter">{action}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Amount Section - Contextual Heading */}
        <div className="neu-convex rounded-[2.5rem] p-8 border border-white/5 text-center relative overflow-hidden">
           <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 rounded-full -mr-16 -mt-16 ${
             staffAction === 'payroll' ? 'bg-emerald-500' : 
             staffAction === 'advance' ? 'bg-blue-500' : 
             staffAction === 'loan' ? 'bg-amber-500' : 'bg-purple-500'
           }`} />
           
           <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 relative z-10">
              {staffAction === 'payroll' ? (payrollCycle === '1st' ? 'Gross Base Salary' : 'Entitled SC Amount') : 
               staffAction === 'advance' ? 'Advance Amount' : 
               staffAction === 'loan' ? 'Disbursement Amount' : 'Transaction Amount'}
           </p>
           <div className="relative inline-block z-10">
             <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-purple-400">$</span>
             <input 
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="bg-transparent text-5xl font-black tracking-tighter text-white outline-none w-full max-w-[200px] text-center"
              required
            />
           </div>
        </div>

        {/* Contextual Fields based on StaffAction */}
        {payeeType === 'staff' && staffAction === 'payroll' && (
          <div className="space-y-6 animate-in slide-in-from-top duration-300">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
              <button type="button" onClick={() => setPayrollCycle('1st')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${payrollCycle === '1st' ? 'bg-purple-500 text-white' : 'text-gray-500'}`}>1st (Salary)</button>
              <button type="button" onClick={() => setPayrollCycle('15th')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${payrollCycle === '15th' ? 'bg-purple-500 text-white' : 'text-gray-500'}`}>15th (SC)</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-rose-400 uppercase ml-2 tracking-widest">Adv Deduction</label>
                <input type="number" value={advanceDeductionInput} onChange={(e) => setAdvanceDeductionInput(e.target.value)} className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-3 text-sm font-bold outline-none text-rose-400" />
                <p className="text-[8px] text-gray-600 ml-2">Limit: {formatCurrency(selectedStaff?.advanceBalance || 0)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-500 uppercase ml-2 tracking-widest">Loan Deduction</label>
                <input type="number" value={loanDeductionInput} onChange={(e) => setLoanDeductionInput(e.target.value)} className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-3 text-sm font-bold outline-none text-amber-500" />
                <p className="text-[8px] text-gray-600 ml-2">Bal: {formatCurrency(selectedStaff?.loanBalance || 0)}</p>
              </div>
            </div>

            <div className="neu-concave rounded-3xl p-6 border border-white/5 bg-black/20">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Net Payable Cash</span>
                  <span className="text-3xl font-black text-emerald-400 tracking-tighter">
                    {formatCurrency(parseFloat(amount || '0') - (parseFloat(loanDeductionInput) || 0) - (parseFloat(advanceDeductionInput) || 0))}
                  </span>
               </div>
            </div>
          </div>
        )}

        {payeeType === 'staff' && staffAction === 'loan' && (
          <div className="space-y-4 animate-in slide-in-from-top duration-300">
             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Initial Aggregate Loan Amount</label>
             <input 
              type="number" 
              value={initialLoanAmount} 
              onChange={(e) => setInitialLoanAmount(e.target.value)} 
              placeholder="Total principal..." 
              className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 text-xl font-black outline-none" 
            />
          </div>
        )}

        {/* Shared Category/Note for non-payroll staff or vendor */}
        {(payeeType === 'vendor' || staffAction === 'general') && (
          <div className="animate-in slide-in-from-top duration-300 space-y-6">
            <div className="neu-convex rounded-[2rem] p-6 border border-white/5 space-y-4">
               <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Classification</label>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter ml-1">Primary Category</label>
                    <div className="relative">
                      <Layers size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
                      <select 
                        value={categoryId}
                        onChange={(e) => { setCategoryId(e.target.value); setSubCategory(''); }}
                        className="w-full bg-[#1e1e2f] border border-white/5 rounded-xl p-3 pl-10 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-bold appearance-none cursor-pointer"
                        required={payeeType === 'vendor'}
                      >
                        <option value="" className="bg-[#161622]">Select Main</option>
                        {expenseCategories.map(c => <option key={c.id} value={c.id} className="bg-[#161622]">{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className={`space-y-2 transition-opacity duration-300 ${!categoryId ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter ml-1">Sub-Category</label>
                    <div className="relative">
                      <ArrowRight size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
                      <select 
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        className="w-full bg-[#1e1e2f] border border-white/5 rounded-xl p-3 pl-10 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-bold appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#161622]">None / Other</option>
                        {activeCategory?.subCategories.map(s => <option key={s} value={s} className="bg-[#161622]">{s}</option>)}
                      </select>
                    </div>
                  </div>
               </div>
            </div>

            <div className="neu-convex rounded-[2rem] p-6 border border-white/5 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Memo / Reference</label>
                <input 
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Internal tracking details..."
                  className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-semibold"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center space-x-3">
                  <Truck size={18} className="text-emerald-400" />
                  <div>
                    <p className="text-sm font-bold">Tag as Inventory</p>
                    <p className="text-[10px] text-gray-500">Track for stock movement</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStock(!isStock)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${isStock ? 'bg-emerald-500' : 'bg-gray-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isStock ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Source Account Selection - VISIBLE FOR ALL ACTIONS */}
        <div className="neu-convex rounded-[2rem] p-6 border border-white/5 space-y-4">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Payout Source Account</label>
          <div className="space-y-2">
            {SOURCES.map(source => (
              <button
                key={source.id}
                type="button"
                onClick={() => setSourceId(source.id)}
                className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${
                  sourceId === source.id 
                    ? 'bg-purple-500/10 border-purple-500/30' 
                    : 'bg-[#1e1e2f] border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3 text-sm font-bold">
                  <source.icon size={18} className="text-purple-400" />
                  <span>{source.name}</span>
                </div>
                {sourceId === source.id && <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30"><Check size={12} className="text-white" /></div>}
              </button>
            ))}
          </div>
        </div>

        {/* Confirmation Button */}
        <button
          type="submit"
          disabled={isSuccess || !amount || !payeeId || isProcessing}
          className={`w-full p-6 rounded-[2.5rem] font-black text-xl shadow-2xl transition-all active:scale-95 flex items-center justify-center space-x-3 ${
            isSuccess 
              ? 'bg-emerald-500 shadow-emerald-500/30' 
              : 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-500/30 hover:scale-[1.02]'
          } disabled:opacity-50`}
        >
          {isProcessing ? (
             <>
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               <span>Processing...</span>
             </>
          ) : isSuccess ? (
             <>
               <CheckCircle2 size={24} />
               <span>Recorded Successfully</span>
             </>
          ) : (
             <>
               {payeeType === 'staff' && staffAction !== 'general' ? <HandCoins size={24} /> : <Receipt size={24} />}
               <span>Commit Transaction</span>
             </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Expenses;
