
export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' | 'Receivable' | 'Payable';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  description?: string;
  iconName: string;
  gradient: string;
}

export interface Transaction {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note: string;
  timestamp: number;
  category?: string;
  isReconciled?: boolean;
  metadata?: {
    isStock?: boolean;
    isLoan?: boolean;
    isAdvance?: boolean;
    staffId?: string;
    vendorId?: string;
    payeeName?: string;
    isSalaryPayout?: boolean;
    isSCPayout?: boolean;
    loanDeduction?: number;
    advanceDeduction?: number;
    partner?: string;
    isRecurring?: boolean;
    templateId?: string;
    // Added category and subCategory to metadata as they are used in expense logging and ledger analysis
    category?: string;
    subCategory?: string;
  };
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone?: string;
  baseSalary: number;
  loanBalance: number;
  initialLoanAmount: number;
  monthlyLoanInstallment: number;
  advanceBalance: number;
  joinedDate: string;
}

export interface StaffHoliday {
  id: string;
  staffId: string;
  date: string; 
  type: 'Full Day' | 'Half Day' | 'Sick Leave';
}

export interface PaymentTemplate {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  subCategory: string;
  sourceId: string;
  payeeType: 'vendor' | 'staff';
  payeeId: string;
  note: string;
  isStock: boolean;
}

export interface RecurringPayment extends PaymentTemplate {
  frequency: 'Daily' | 'Weekly' | 'Fortnightly' | 'Monthly';
  nextDueDate: number;
  isActive: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  category?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  subCategories: string[];
}

export interface DailyLog {
  id: string;
  date: string;
  openingFloat: number;
  totalSales: number;
  cardPayments: number;
  creditBills: number;
  hikingBarSales: number;
  foreignCurrency: number;
  foreignCurrencyNote?: string;
  expensesCash: number;
  expectedCash: number;
  actualCash?: number;
  isClosed: boolean;
  timestamp: number;
}
