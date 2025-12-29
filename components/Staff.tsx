
import React, { useState, useMemo } from 'react';
import { useAccounts } from '../context/AccountsContext';
import { 
  User, DollarSign, HandCoins, History, ArrowRight, X, UserPlus, 
  Briefcase, Calendar as CalendarIcon, CheckCircle2, Save,
  PiggyBank, Receipt, Clock, Edit3, Banknote, Landmark, CreditCard,
  Phone, UserCog
} from 'lucide-react';
import { Staff as StaffType, Transaction } from '../types';

const STAFF_COLORS = [
  '#A855F7', '#F59E0B', '#10B981', '#06B6D4', '#F43F5E', '#6366F1', '#EC4899', '#84CC16',
];

const SOURCES = [
  { id: 'till_float', name: 'Till Cash', icon: Banknote },
  { id: 'business_bank', name: 'Business Bank', icon: Landmark },
  { id: 'staff_bank_card', name: 'Staff Bank Card', icon: CreditCard },
];

const Staff: React.FC = () => {
  const { 
    staff, staffHolidays, transactions, 
    manageStaffLoan, manageStaffAdvance, commitPayroll, updateStaffInstallment,
    updateStaffDetails, toggleStaffHoliday 
  } = useAccounts();
  
  const [selectedStaff, setSelectedStaff] = useState<StaffType | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'profiles'>('profiles');
  const [modalMode, setModalMode] = useState<'loan' | 'advance' | 'payroll' | 'edit_installment' | 'edit_profile' | null>(null);
  
  // Modal States
  const [payrollCycle, setPayrollCycle] = useState<'1st' | '15th'>('1st');
  const [amount, setAmount] = useState(''); // Multi-purpose amount
  const [initialLoanAmount, setInitialLoanAmount] = useState('');
  const [loanDeductionInput, setLoanDeductionInput] = useState('');
  const [advanceDeductionInput, setAdvanceDeductionInput] = useState('');
  const [sourceId, setSourceId] = useState('business_bank');
  
  // Profile Edit States
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBaseSalary, setEditBaseSalary] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  // Roster State
  const [rosterStaffId, setRosterStaffId] = useState<string>(staff[0]?.id || '');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const staffColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    staff.forEach((s, i) => { map[s.id] = STAFF_COLORS[i % STAFF_COLORS.length]; });
    return map;
  }, [staff]);

  const holidayDates = useMemo(() => {
    const dates: Date[] = [];
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 15);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    let current = new Date(startDate);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, []);

  const handleStaffAction = async () => {
    if (!selectedStaff || isProcessing) return;
    setIsProcessing(true);

    if (modalMode === 'loan') {
      await manageStaffLoan(selectedStaff.id, parseFloat(amount), parseFloat(initialLoanAmount), sourceId);
    } else if (modalMode === 'advance') {
      await manageStaffAdvance(selectedStaff.id, parseFloat(amount), sourceId);
    } else if (modalMode === 'edit_installment') {
      await updateStaffInstallment(selectedStaff.id, parseFloat(amount));
    } else if (modalMode === 'payroll') {
      const gross = parseFloat(amount) || 0;
      const loanDed = parseFloat(loanDeductionInput) || 0;
      const advDed = parseFloat(advanceDeductionInput) || 0;
      await commitPayroll(selectedStaff.id, payrollCycle, gross, loanDed, advDed, sourceId);
    } else if (modalMode === 'edit_profile') {
      updateStaffDetails(selectedStaff.id, {
        name: editName,
        role: editRole,
        phone: editPhone,
        baseSalary: parseFloat(editBaseSalary) || 0
      });
    }

    setIsProcessing(false);
    closeModal();
  };

  const openPayroll = (s: StaffType) => {
    setSelectedStaff(s);
    setPayrollCycle('1st');
    setAmount(s.baseSalary.toString());
    setLoanDeductionInput(Math.min(s.monthlyLoanInstallment, s.loanBalance).toString());
    setAdvanceDeductionInput(s.advanceBalance.toString());
    setModalMode('payroll');
  };

  const openEditProfile = (s: StaffType) => {
    setSelectedStaff(s);
    setEditName(s.name);
    setEditRole(s.role);
    setEditPhone(s.phone || '');
    setEditBaseSalary(s.baseSalary.toString());
    setModalMode('edit_profile');
  };

  const closeModal = () => {
    setSelectedStaff(null);
    setModalMode(null);
    setAmount('');
    setInitialLoanAmount('');
    setLoanDeductionInput('');
    setAdvanceDeductionInput('');
    setEditName('');
    setEditRole('');
    setEditPhone('');
    setEditBaseSalary('');
  };

  const getHolidaysForDate = (date: Date) => {
    const dStr = date.toISOString().split('T')[0];
    return staffHolidays.filter(h => h.date === dStr);
  };

  const staffLedger = useMemo(() => {
    if (!selectedStaff) return [];
    return transactions
      .filter(tx => tx.metadata?.staffId === selectedStaff.id)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, selectedStaff]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      <header className="flex justify-between items-center pt-4">
        <div>
          <h1 className="text-3xl font-bold">Team Command</h1>
          <p className="text-gray-400 text-sm">HR & Payroll Ledger</p>
        </div>
        <div className="flex space-x-2">
           <button onClick={() => setActiveTab('profiles')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'profiles' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-gray-500'}`}>Profiles</button>
           <button onClick={() => setActiveTab('roster')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'roster' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-gray-500'}`}>Holiday Lab</button>
        </div>
      </header>

      {activeTab === 'roster' ? (
        <section className="space-y-6 animate-in slide-in-from-right duration-300">
           <div className="neu-convex rounded-[2rem] p-6 border border-amber-500/20 bg-amber-500/5">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-black"><UserPlus size={24} /></div>
                  <div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Currently Editing</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: staffColorMap[rosterStaffId] }} />
                      <select value={rosterStaffId} onChange={(e) => setRosterStaffId(e.target.value)} className="bg-transparent border-none outline-none text-lg font-black text-gray-100 cursor-pointer">
                        {staff.map(s => <option key={s.id} value={s.id} className="bg-[#161622]">{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
           </div>

           <div className="neu-convex rounded-[2.5rem] p-6 border border-white/5 overflow-hidden">
              <div className="flex justify-between items-center mb-6 px-2">
                <h2 className="text-xl font-bold flex items-center"><CalendarIcon size={20} className="mr-2 text-amber-500" /> Unified Holiday Roster</h2>
                <div className="flex space-x-1 overflow-x-auto no-scrollbar max-w-[50%]">
                  {staff.map(s => (
                    <div key={s.id} className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: staffColorMap[s.id] }} />
                      <span className="text-[6px] font-black uppercase text-gray-500">{s.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {holidayDates.map((date) => {
                  const dStr = date.toISOString().split('T')[0];
                  const holidays = getHolidaysForDate(date);
                  const activeForCurrent = holidays.some(h => h.staffId === rosterStaffId);
                  return (
                    <button key={dStr} onClick={() => toggleStaffHoliday(rosterStaffId, dStr)} className={`min-h-[90px] p-3 rounded-2xl border transition-all flex flex-col items-center justify-between relative group ${activeForCurrent ? 'bg-amber-500/10 border-amber-500/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase tracking-tighter opacity-50 mb-0.5">{date.toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-xl font-black text-gray-100">{date.getDate()}</span>
                      </div>
                      <div className="flex flex-wrap justify-center gap-1 mt-2">
                        {holidays.map(h => (
                          <div key={h.id} className="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-black/20" style={{ backgroundColor: staffColorMap[h.staffId] }} />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
           </div>
        </section>
      ) : (
        <div className="grid gap-4 animate-in slide-in-from-left duration-300">
          {staff.map(member => (
            <div key={member.id} className="neu-convex rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg" style={{ backgroundColor: `${staffColorMap[member.id]}20` }}><User size={28} style={{ color: staffColorMap[member.id] }} /></div>
                  <div>
                    <h3 className="text-lg font-bold">{member.name}</h3>
                    <p className="text-xs text-gray-500 font-medium">{member.role}</p>
                    {member.phone && <p className="text-[9px] text-gray-400 mt-1 flex items-center"><Phone size={8} className="mr-1" />{member.phone}</p>}
                  </div>
                </div>
                <button onClick={() => setSelectedStaff(member)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-gray-500 hover:text-white transition-all">
                  <ArrowRight size={20} />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                 <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Loan</p>
                    <p className={`text-lg font-black ${member.loanBalance > 0 ? 'text-amber-500' : 'text-gray-400'}`}>{formatCurrency(member.loanBalance)}</p>
                 </div>
                 <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Unsettled Advances</p>
                    <p className={`text-lg font-black ${member.advanceBalance > 0 ? 'text-blue-400' : 'text-gray-400'}`}>{formatCurrency(member.advanceBalance)}</p>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deep-Dive Modal */}
      {selectedStaff && modalMode === null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-[#161622] rounded-[3rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <button onClick={closeModal} className="absolute top-8 right-8 p-2 text-gray-500 hover:text-white transition-all"><X size={24} /></button>
            <button 
              onClick={() => openEditProfile(selectedStaff)}
              className="absolute top-8 right-20 p-2 text-gray-500 hover:text-purple-400 transition-all flex items-center space-x-1"
            >
              <UserCog size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Edit Details</span>
            </button>

            <header className="flex flex-col items-center mb-8">
               <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-lg mb-4" style={{ backgroundColor: `${staffColorMap[selectedStaff.id]}20` }}>
                  <User size={40} style={{ color: staffColorMap[selectedStaff.id] }} />
               </div>
               <h2 className="text-2xl font-black">{selectedStaff.name}</h2>
               <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">{selectedStaff.role}</p>
               {selectedStaff.phone && <p className="text-xs text-gray-400 mt-1 flex items-center opacity-60"><Phone size={12} className="mr-1" /> {selectedStaff.phone}</p>}
            </header>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
               <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => openPayroll(selectedStaff)} className="bg-purple-500 text-white p-4 rounded-2xl flex flex-col items-center space-y-2 hover:scale-[1.02] transition-all">
                    <DollarSign size={20} /><span className="text-[9px] font-black uppercase">Payroll</span>
                  </button>
                  <button onClick={() => setModalMode('advance')} className="bg-blue-500 text-white p-4 rounded-2xl flex flex-col items-center space-y-2 hover:scale-[1.02] transition-all">
                    <Clock size={20} /><span className="text-[9px] font-black uppercase">Advance</span>
                  </button>
                  <button onClick={() => setModalMode('loan')} className="bg-amber-500 text-black p-4 rounded-2xl flex flex-col items-center space-y-2 hover:scale-[1.02] transition-all">
                    <PiggyBank size={20} /><span className="text-[9px] font-black uppercase">Loan</span>
                  </button>
               </div>

               <div className="neu-convex rounded-3xl p-6 border border-white/5">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Installment Control</h3>
                     <button onClick={() => setModalMode('edit_installment')} className="p-2 bg-white/5 rounded-lg text-amber-500 hover:bg-amber-500 hover:text-black transition-all"><Edit3 size={14} /></button>
                  </div>
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-[9px] text-gray-500 uppercase font-black">Monthly Installment</p>
                        <p className="text-xl font-black text-amber-500">{formatCurrency(selectedStaff.monthlyLoanInstallment)}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] text-gray-500 uppercase font-black">Balance</p>
                        <p className="text-xl font-black text-white">{formatCurrency(selectedStaff.loanBalance)}</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center"><History size={14} className="mr-2" /> Financial History</h3>
                  {staffLedger.map(tx => (
                    <div key={tx.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center group">
                       <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-xl ${tx.metadata?.isSalaryPayout || tx.metadata?.isSCPayout ? 'bg-purple-500/20 text-purple-400' : 'bg-amber-500/20 text-amber-400'}`}><Receipt size={14} /></div>
                          <div>
                             <p className="text-xs font-bold text-gray-200">{tx.note}</p>
                             <p className="text-[9px] text-gray-500 font-bold uppercase">{new Date(tx.timestamp).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <p className="text-sm font-black text-white">{formatCurrency(tx.amount)}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modals */}
      {selectedStaff && modalMode !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setModalMode(null)} />
          <div className="relative w-full max-w-md bg-[#161622] rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <button onClick={() => setModalMode(null)} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-all"><X size={20} /></button>
            <header className="text-center mb-8">
               <h2 className="text-2xl font-black tracking-tight">
                  {modalMode === 'payroll' ? 'Process Payroll' : 
                   modalMode === 'loan' ? 'Staff Loan' : 
                   modalMode === 'edit_installment' ? 'Change Installment' : 
                   modalMode === 'edit_profile' ? 'Edit Profile' : 'Issue Advance'}
               </h2>
               <p className="text-xs text-purple-400 font-bold uppercase tracking-widest mt-1">{selectedStaff.name}</p>
            </header>

            <div className="space-y-6">
               {modalMode === 'payroll' && (
                  <>
                     <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button onClick={() => { setPayrollCycle('1st'); setAmount(selectedStaff.baseSalary.toString()); }} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${payrollCycle === '1st' ? 'bg-purple-500 text-white' : 'text-gray-500'}`}>1st (Salary)</button>
                        <button onClick={() => { setPayrollCycle('15th'); setAmount(''); }} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${payrollCycle === '15th' ? 'bg-purple-500 text-white' : 'text-gray-500'}`}>15th (SC)</button>
                     </div>
                     
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">{payrollCycle === '1st' ? 'Gross Salary' : 'Entitled SC Amount'}</label>
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 text-2xl font-black outline-none focus:ring-2 focus:ring-purple-500" />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-rose-400 uppercase ml-2 tracking-widest">Adv Deduction</label>
                          <input type="number" value={advanceDeductionInput} onChange={(e) => setAdvanceDeductionInput(e.target.value)} className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-3 text-sm font-bold outline-none text-rose-400" />
                          <p className="text-[8px] text-gray-600 ml-2">Total Owed: {formatCurrency(selectedStaff.advanceBalance)}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-amber-500 uppercase ml-2 tracking-widest">Loan Deduction</label>
                          <input type="number" value={loanDeductionInput} onChange={(e) => setLoanDeductionInput(e.target.value)} className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-3 text-sm font-bold outline-none text-amber-500" />
                          <p className="text-[8px] text-gray-600 ml-2">Loan Bal: {formatCurrency(selectedStaff.loanBalance)}</p>
                        </div>
                     </div>

                     <div className="neu-concave rounded-3xl p-6 border border-white/5 space-y-2 bg-black/20">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black text-gray-500 uppercase">Net Payout</span>
                           <span className="text-2xl font-black text-emerald-400">{formatCurrency(parseFloat(amount || '0') - (parseFloat(loanDeductionInput) || 0) - (parseFloat(advanceDeductionInput) || 0))}</span>
                        </div>
                     </div>
                  </>
               )}

               {modalMode === 'edit_profile' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Full Name</label>
                       <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-1 focus:ring-purple-500" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Role / Designation</label>
                       <input type="text" value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-1 focus:ring-purple-500" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Phone Number</label>
                       <div className="relative">
                          <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-1 focus:ring-purple-500" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Basic Monthly Salary</label>
                       <div className="relative">
                          <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
                          <input type="number" value={editBaseSalary} onChange={(e) => setEditBaseSalary(e.target.value)} className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 pl-12 text-sm font-black outline-none focus:ring-1 focus:ring-purple-500" />
                       </div>
                    </div>
                  </div>
               )}

               {modalMode === 'loan' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Initial Loan Amount</label>
                       <input type="number" value={initialLoanAmount} onChange={(e) => setInitialLoanAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 text-xl font-black outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Amount to Dispense Now</label>
                       <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 text-xl font-black outline-none" />
                    </div>
                  </div>
               )}

               {(modalMode === 'advance' || modalMode === 'edit_installment') && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Amount</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 text-2xl font-black outline-none" />
                  </div>
               )}

               {modalMode !== 'edit_installment' && modalMode !== 'edit_profile' && (
                 <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Payment Source</label>
                    <div className="grid grid-cols-1 gap-2">
                      {SOURCES.map(s => (
                        <button key={s.id} onClick={() => setSourceId(s.id)} className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${sourceId === s.id ? 'bg-purple-500/10 border-purple-500/30' : 'bg-[#1e1e2f] border-white/5 opacity-60'}`}>
                          <div className="flex items-center space-x-3 text-xs font-bold"><s.icon size={16} className="text-purple-400" /><span>{s.name}</span></div>
                          {sourceId === s.id && <CheckCircle2 size={16} className="text-purple-500" />}
                        </button>
                      ))}
                    </div>
                 </div>
               )}

               <button 
                onClick={handleStaffAction} 
                disabled={isProcessing} 
                className={`w-full p-6 rounded-[2rem] font-black text-lg shadow-xl shadow-purple-500/20 active:scale-95 transition-all uppercase tracking-widest ${modalMode === 'edit_profile' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
               >
                  {isProcessing ? 'Processing...' : modalMode === 'edit_profile' ? 'Update Profile' : 'Confirm Transaction'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
