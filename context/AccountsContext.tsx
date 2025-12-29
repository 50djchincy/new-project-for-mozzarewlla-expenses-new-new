
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Account, Transaction, DailyLog, Staff, Vendor, ExpenseCategory, PaymentTemplate, RecurringPayment, StaffHoliday } from '../types';

interface AccountsContextType {
  accounts: Account[];
  transactions: Transaction[];
  dailyLogs: DailyLog[];
  staff: Staff[];
  staffHolidays: StaffHoliday[];
  vendors: Vendor[];
  expenseCategories: ExpenseCategory[];
  templates: PaymentTemplate[];
  recurringPayments: RecurringPayment[];
  creditPartners: string[];
  transferFunds: (fromId: string, toId: string, amount: number, note: string, isReconciled?: boolean, metadata?: any) => Promise<void>;
  reconcileTransaction: (transactionId: string, reconciliationData: { cash: number, card: number, serviceCharge: number, contra: number }) => Promise<void>;
  reconcileCardSettlement: (transactionIds: string[], sourceAccountId: string, netAmount: number, feeAmount: number, note: string) => Promise<void>;
  reconcileCreditBill: (transactionIds: string[], destinationAccountId: string, note: string) => Promise<void>;
  addExpense: (data: any) => Promise<void>;
  deleteTemplate: (id: string) => void;
  toggleRecurring: (id: string) => void;
  deleteRecurring: (id: string) => void;
  manageStaffLoan: (staffId: string, amount: number, initialAmount: number, sourceId: string) => Promise<void>;
  manageStaffAdvance: (staffId: string, amount: number, sourceId: string) => Promise<void>;
  commitPayroll: (staffId: string, cycle: '1st' | '15th', gross: number, loanDed: number, advDed: number, sourceId: string) => Promise<void>;
  updateStaffInstallment: (staffId: string, amount: number) => void;
  updateStaffDetails: (staffId: string, updates: Partial<Staff>) => void;
  toggleStaffHoliday: (staffId: string, date: string) => void;
  addCreditPartner: (name: string) => void;
  deleteCreditPartner: (name: string) => void;
  addVendor: (name: string) => void;
  deleteVendor: (id: string) => void;
  addExpenseCategory: (name: string) => void;
  deleteExpenseCategory: (id: string) => void;
  addSubCategory: (categoryId: string, name: string) => void;
  deleteSubCategory: (categoryId: string, name: string) => void;
  openDay: (openingFloat: number) => Promise<void>;
  closeDay: (closingData: Partial<DailyLog> & { creditBillsList?: { partner: string, amount: number }[] }) => Promise<void>;
  totalAssets: number;
  totalReceivables: number;
  totalLiabilities: number;
  currentLog: DailyLog | null;
  loading: boolean;
}

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'till_float', name: 'Till Float', type: 'Asset', balance: 500, iconName: 'Banknote', gradient: 'from-purple-500 to-indigo-600' },
  { id: 'business_bank', name: 'Business Bank', type: 'Asset', balance: 12000, iconName: 'Landmark', gradient: 'from-blue-600 to-cyan-500' },
  { id: 'owner_equity', name: 'Owner Equity', type: 'Equity', balance: 5000, iconName: 'UserCircle', gradient: 'from-pink-500 to-rose-600' },
  { id: 'hiking_bar_rec', name: 'Hiking Bar Rec.', type: 'Receivable', balance: 0, iconName: 'HandCoins', gradient: 'from-blue-500 to-cyan-600' },
  { id: 'mozzarella_card_payment', name: 'Card Payments', type: 'Receivable', balance: 0, iconName: 'CreditCard', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'hiking_bar_card_payment', name: 'Hiking Bar Card Payment', type: 'Receivable', balance: 0, iconName: 'ArrowDownLeft', gradient: 'from-amber-500 to-orange-600' },
  { id: 'foreign_currency', name: 'Foreign Currency Received', type: 'Asset', balance: 0, iconName: 'Globe', gradient: 'from-violet-500 to-purple-600' },
  { id: 'pending_bills', name: 'Credit Bills/Payables', type: 'Receivable', balance: 0, iconName: 'ReceiptText', gradient: 'from-red-500 to-pink-600' },
  { id: 'staff_bank_card', name: 'Staff Bank Card', type: 'Asset', balance: 100, iconName: 'ShoppingBag', gradient: 'from-sky-500 to-blue-600' },
  { id: 'staff_loans', name: 'Staff Obligations', type: 'Asset', balance: 0, iconName: 'HandCoins', gradient: 'from-orange-400 to-yellow-500' },
  { id: 'variance_short', name: 'Variance Shortage', type: 'Expense', balance: 0, iconName: 'TrendingDown', gradient: 'from-rose-400 to-red-600' },
  { id: 'variance_excess', name: 'Variance Excess', type: 'Revenue', balance: 0, iconName: 'TrendingUp', gradient: 'from-teal-400 to-emerald-600' },
  { id: 'operating_expenses', name: 'Operating Expenses', type: 'Expense', balance: 0, iconName: 'Receipt', gradient: 'from-gray-500 to-slate-700' },
  { id: 'hiking_bar_expenses', name: 'Hiking Bar Expenses', type: 'Expense', balance: 0, iconName: 'GlassWater', gradient: 'from-orange-400 to-red-500' },
];

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export const AccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [staffHolidays, setStaffHolidays] = useState<StaffHoliday[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [templates, setTemplates] = useState<PaymentTemplate[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [creditPartners, setCreditPartners] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const savedAccounts = localStorage.getItem('mozz_accounts');
      const savedTransactions = localStorage.getItem('mozz_transactions');
      const savedLogs = localStorage.getItem('mozz_daily_logs');
      const savedStaff = localStorage.getItem('mozz_staff');
      const savedHolidays = localStorage.getItem('mozz_staff_holidays');
      const savedVendors = localStorage.getItem('mozz_vendors');
      const savedCategories = localStorage.getItem('mozz_expense_categories');
      const savedTemplates = localStorage.getItem('mozz_templates');
      const savedRecurring = localStorage.getItem('mozz_recurring');
      const savedPartners = localStorage.getItem('mozz_credit_partners');
      
      if (savedAccounts) setAccounts(JSON.parse(savedAccounts));
      else {
        setAccounts(INITIAL_ACCOUNTS);
        localStorage.setItem('mozz_accounts', JSON.stringify(INITIAL_ACCOUNTS));
      }

      if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
      if (savedLogs) setDailyLogs(JSON.parse(savedLogs));
      
      if (savedStaff) setStaff(JSON.parse(savedStaff));
      else {
        const INITIAL_STAFF: Staff[] = [
          { id: 's1', name: 'Dinesh', role: 'Head Chef', phone: '+123456789', baseSalary: 1200, loanBalance: 0, initialLoanAmount: 0, monthlyLoanInstallment: 100, advanceBalance: 0, joinedDate: '2023-01-10' },
          { id: 's2', name: 'Amara', role: 'Server', phone: '+123456789', baseSalary: 600, loanBalance: 0, initialLoanAmount: 0, monthlyLoanInstallment: 50, advanceBalance: 0, joinedDate: '2023-05-22' },
          { id: 's3', name: 'Sohan', role: 'Kitchen Asst', phone: '+123456789', baseSalary: 550, loanBalance: 0, initialLoanAmount: 0, monthlyLoanInstallment: 50, advanceBalance: 0, joinedDate: '2023-06-15' },
          { id: 's4', name: 'Leela', role: 'Server', phone: '+123456789', baseSalary: 600, loanBalance: 0, initialLoanAmount: 0, monthlyLoanInstallment: 50, advanceBalance: 0, joinedDate: '2023-07-01' },
          { id: 's5', name: 'Nimal', role: 'Bartender', phone: '+123456789', baseSalary: 750, loanBalance: 0, initialLoanAmount: 0, monthlyLoanInstallment: 75, advanceBalance: 0, joinedDate: '2023-08-10' },
          { id: 's6', name: 'Kavindu', role: 'Manager', phone: '+123456789', baseSalary: 1500, loanBalance: 0, initialLoanAmount: 0, monthlyLoanInstallment: 150, advanceBalance: 0, joinedDate: '2022-12-01' }
        ];
        setStaff(INITIAL_STAFF);
        localStorage.setItem('mozz_staff', JSON.stringify(INITIAL_STAFF));
      }

      if (savedHolidays) setStaffHolidays(JSON.parse(savedHolidays));
      if (savedVendors) setVendors(JSON.parse(savedVendors));
      if (savedCategories) setExpenseCategories(JSON.parse(savedCategories));
      if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
      if (savedRecurring) setRecurringPayments(JSON.parse(savedRecurring));
      if (savedPartners) setCreditPartners(JSON.parse(savedPartners));
      
      setLoading(false);
    };
    loadData();
  }, []);

  const transferFunds = useCallback(async (fromId: string, toId: string, amount: number, note: string, isReconciled = false, metadata?: any) => {
    if (amount === 0) return;
    const absAmount = Math.abs(amount);

    setAccounts(prev => {
      const updated = prev.map(acc => {
        if (acc.id === fromId) return { ...acc, balance: acc.balance - absAmount };
        if (acc.id === toId) return { ...acc, balance: acc.balance + absAmount };
        return acc;
      });
      localStorage.setItem('mozz_accounts', JSON.stringify(updated));
      return updated;
    });

    const newTransaction: Transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      fromAccountId: fromId,
      toAccountId: toId,
      amount: absAmount,
      note,
      timestamp: Date.now(),
      isReconciled,
      metadata
    };

    setTransactions(prev => {
      const updated = [newTransaction, ...prev];
      localStorage.setItem('mozz_transactions', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const manageStaffAdvance = async (staffId: string, amount: number, sourceId: string) => {
    await transferFunds(sourceId, 'staff_loans', amount, `Staff Advance given`, false, { 
      isAdvance: true, 
      staffId 
    });
    setStaff(prev => {
      const updated = prev.map(s => s.id === staffId ? { ...s, advanceBalance: s.advanceBalance + amount } : s);
      localStorage.setItem('mozz_staff', JSON.stringify(updated));
      return updated;
    });
  };

  const manageStaffLoan = async (staffId: string, amount: number, initialAmount: number, sourceId: string) => {
    await transferFunds(sourceId, 'staff_loans', amount, `Loan issued to staff`, false, { isLoan: true, staffId });
    setStaff(prev => {
      const updated = prev.map(s => s.id === staffId ? { 
        ...s, 
        loanBalance: s.loanBalance + amount,
        initialLoanAmount: initialAmount > 0 ? initialAmount : s.initialLoanAmount + amount
      } : s);
      localStorage.setItem('mozz_staff', JSON.stringify(updated));
      return updated;
    });
  };

  const commitPayroll = async (staffId: string, cycle: '1st' | '15th', gross: number, loanDed: number, advDed: number, sourceId: string) => {
    const s = staff.find(st => st.id === staffId);
    if (!s) return;
    
    const netPayout = gross - loanDed - advDed;
    const note = cycle === '1st' ? `Monthly Salary: ${s.name}` : `Service Charge: ${s.name}`;

    await transferFunds(sourceId, 'operating_expenses', netPayout, note, false, { 
      isSalaryPayout: cycle === '1st', 
      isSCPayout: cycle === '15th',
      staffId,
      loanDeduction: loanDed,
      advanceDeduction: advDed
    });

    if (loanDed > 0) {
      await transferFunds('staff_loans', 'operating_expenses', loanDed, `Loan deduction: ${s.name}`, true, { staffId, isLoan: true });
    }
    if (advDed > 0) {
      await transferFunds('staff_loans', 'operating_expenses', advDed, `Advance deduction: ${s.name}`, true, { staffId, isAdvance: true });
    }

    setStaff(prev => {
      const updated = prev.map(st => {
        if (st.id === staffId) {
          return {
            ...st,
            loanBalance: Math.max(0, st.loanBalance - loanDed),
            advanceBalance: Math.max(0, st.advanceBalance - advDed)
          };
        }
        return st;
      });
      localStorage.setItem('mozz_staff', JSON.stringify(updated));
      return updated;
    });
  };

  const updateStaffInstallment = (staffId: string, amount: number) => {
    setStaff(prev => {
      const updated = prev.map(s => s.id === staffId ? { ...s, monthlyLoanInstallment: amount } : s);
      localStorage.setItem('mozz_staff', JSON.stringify(updated));
      return updated;
    });
  };

  const updateStaffDetails = (staffId: string, updates: Partial<Staff>) => {
    setStaff(prev => {
      const updated = prev.map(s => s.id === staffId ? { ...s, ...updates } : s);
      localStorage.setItem('mozz_staff', JSON.stringify(updated));
      return updated;
    });
  };

  const addExpense = async (data: any) => {
    const payeeName = (data.payeeType && data.payeeId)
      ? (data.payeeType === 'staff' ? staff.find(s => s.id === data.payeeId)?.name : vendors.find(v => v.id === data.payeeId)?.name)
      : undefined;
    const metadata: any = { isStock: data.isStock, category: data.category, subCategory: data.subCategory, payeeName };
    if (data.payeeType && data.payeeId) metadata[data.payeeType + 'Id'] = data.payeeId;
    await transferFunds(data.sourceId, 'operating_expenses', data.amount, `${data.category}: ${data.note}`, false, metadata);
  };

  const toggleStaffHoliday = (staffId: string, date: string) => {
    setStaffHolidays(prev => {
      const exists = prev.find(h => h.staffId === staffId && h.date === date);
      let updated;
      if (exists) updated = prev.filter(h => h.id !== exists.id);
      else updated = [...prev, { id: `hol_${Date.now()}`, staffId, date, type: 'Full Day' }];
      localStorage.setItem('mozz_staff_holidays', JSON.stringify(updated));
      return updated;
    });
  };

  const addCreditPartner = (name: string) => {
    setCreditPartners(prev => {
      const updated = [...prev, name];
      localStorage.setItem('mozz_credit_partners', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteCreditPartner = (name: string) => {
    setCreditPartners(prev => {
      const updated = prev.filter(p => p !== name);
      localStorage.setItem('mozz_credit_partners', JSON.stringify(updated));
      return updated;
    });
  };

  const addVendor = (name: string) => {
    setVendors(prev => {
      const updated = [...prev, { id: 'v_' + Date.now(), name }];
      localStorage.setItem('mozz_vendors', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteVendor = (id: string) => {
    setVendors(prev => {
      const updated = prev.filter(v => v.id !== id);
      localStorage.setItem('mozz_vendors', JSON.stringify(updated));
      return updated;
    });
  };

  const addExpenseCategory = (name: string) => {
    setExpenseCategories(prev => {
      const updated = [...prev, { id: 'cat_' + Date.now(), name, subCategories: [] }];
      localStorage.setItem('mozz_expense_categories', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteExpenseCategory = (id: string) => {
    setExpenseCategories(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('mozz_expense_categories', JSON.stringify(updated));
      return updated;
    });
  };

  const addSubCategory = (categoryId: string, name: string) => {
    setExpenseCategories(prev => {
      const updated = prev.map(c => c.id === categoryId ? { ...c, subCategories: [...c.subCategories, name] } : c);
      localStorage.setItem('mozz_expense_categories', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteSubCategory = (categoryId: string, name: string) => {
    setExpenseCategories(prev => {
      const updated = prev.map(c => c.id === categoryId ? { ...c, subCategories: c.subCategories.filter(s => s !== name) } : c);
      localStorage.setItem('mozz_expense_categories', JSON.stringify(updated));
      return updated;
    });
  };

  const reconcileTransaction = useCallback(async (transactionId: string, data: { cash: number, card: number, serviceCharge: number, contra: number }) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx) return;
    if (data.cash > 0) await transferFunds('hiking_bar_rec', 'till_float', data.cash, `HB Cash: ${tx.id}`);
    if (data.card > 0) await transferFunds('hiking_bar_rec', 'hiking_bar_card_payment', data.card, `HB Card: ${tx.id}`);
    const deductions = data.serviceCharge + data.contra;
    if (deductions > 0) await transferFunds('hiking_bar_rec', 'hiking_bar_expenses', deductions, `HB Deduction: ${tx.id}`);
    setTransactions(prev => {
      const updated = prev.map(t => t.id === transactionId ? { ...t, isReconciled: true } : t);
      localStorage.setItem('mozz_transactions', JSON.stringify(updated));
      return updated;
    });
  }, [transactions, transferFunds]);

  const reconcileCardSettlement = async (transactionIds: string[], sourceAccountId: string, netAmount: number, feeAmount: number, note: string) => {
    setTransactions(prev => {
      const updated = prev.map(tx => transactionIds.includes(tx.id) ? { ...tx, isReconciled: true } : tx);
      localStorage.setItem('mozz_transactions', JSON.stringify(updated));
      return updated;
    });
    if (feeAmount > 0) await transferFunds(sourceAccountId, 'operating_expenses', feeAmount, `Bank Fee: ${note}`, true);
  };

  const reconcileCreditBill = async (transactionIds: string[], destinationAccountId: string, note: string) => {
    const subset = transactions.filter(t => transactionIds.includes(t.id));
    const total = subset.reduce((sum, t) => sum + t.amount, 0);
    if (total > 0) {
      await transferFunds('pending_bills', destinationAccountId, total, `Bill Settle: ${note}`);
      setTransactions(prev => {
        const updated = prev.map(tx => transactionIds.includes(tx.id) ? { ...tx, isReconciled: true } : tx);
        localStorage.setItem('mozz_transactions', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const openDay = async (openingFloat: number) => {
    const newLog: DailyLog = { id: `log_${Date.now()}`, date: new Date().toLocaleDateString(), openingFloat, totalSales: 0, cardPayments: 0, creditBills: 0, hikingBarSales: 0, foreignCurrency: 0, expensesCash: 0, expectedCash: openingFloat, isClosed: false, timestamp: Date.now() };
    setDailyLogs(prev => {
      const updated = [newLog, ...prev];
      localStorage.setItem('mozz_daily_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const closeDay = async (closingData: Partial<DailyLog>) => {
    const current = dailyLogs[0];
    if (!current) return;
    setDailyLogs(prev => {
      const updated = prev.map(log => log.id === current.id ? { ...log, ...closingData, isClosed: true } : log);
      localStorage.setItem('mozz_daily_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem('mozz_templates', JSON.stringify(updated));
      return updated;
    });
  };

  const currentLog = dailyLogs.length > 0 && !dailyLogs[0].isClosed ? dailyLogs[0] : null;
  const totalAssets = accounts.filter(a => a.type === 'Asset').reduce((sum, a) => sum + a.balance, 0);
  const totalReceivables = accounts.filter(a => a.type === 'Receivable').reduce((sum, a) => sum + a.balance, 0);

  return (
    <AccountsContext.Provider value={{ 
      accounts, transactions, dailyLogs, staff, staffHolidays, vendors, expenseCategories, templates, recurringPayments, creditPartners,
      transferFunds, reconcileTransaction, reconcileCardSettlement, reconcileCreditBill, addExpense, deleteTemplate, toggleRecurring: () => {}, deleteRecurring: () => {},
      manageStaffLoan, manageStaffAdvance, commitPayroll, updateStaffInstallment, updateStaffDetails, toggleStaffHoliday, addCreditPartner, deleteCreditPartner, addVendor, deleteVendor,
      addExpenseCategory, deleteExpenseCategory, addSubCategory, deleteSubCategory, openDay, closeDay, totalAssets, totalReceivables, totalLiabilities: 0, currentLog, loading 
    }}>
      {children}
    </AccountsContext.Provider>
  );
};

export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (!context) throw new Error('useAccounts must be used within AccountsProvider');
  return context;
};
