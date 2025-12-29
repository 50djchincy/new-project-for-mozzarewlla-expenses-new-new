
import React, { useState, useMemo } from 'react';
import { useAccounts } from '../context/AccountsContext';
import { 
  History, TrendingUp, TrendingDown, Search, Filter, ArrowUpRight, 
  ArrowDownRight, Landmark, PieChart, BarChart3, Receipt, 
  ArrowRightLeft, Calendar, Download, ChevronRight, X 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell 
} from 'recharts';

type LedgerTab = 'feed' | 'pl' | 'categories';

const COLORS = ['#A855F7', '#EC4899', '#F43F5E', '#F59E0B', '#10B981', '#06B6D4', '#6366F1'];

const Ledger: React.FC = () => {
  const { transactions, accounts, expenseCategories } = useAccounts();
  const [activeTab, setActiveTab] = useState<LedgerTab>('pl');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  // Financial Analysis Logic
  const financialData = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const categoryTotals: Record<string, number> = {};

    transactions.forEach(tx => {
      const isExpense = tx.toAccountId === 'operating_expenses' || tx.toAccountId === 'hiking_bar_expenses' || tx.toAccountId === 'variance_short';
      const isIncome = tx.toAccountId === 'till_float' || tx.toAccountId === 'business_bank' || tx.toAccountId === 'variance_excess';
      
      // We only count external income/expense, not internal transfers
      const isInternal = accounts.some(a => a.id === tx.fromAccountId) && accounts.some(a => a.id === tx.toAccountId) && !isExpense;

      if (isExpense) {
        expenses += tx.amount;
        const cat = tx.metadata?.category || 'Uncategorized';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + tx.amount;
      } else if (isIncome && !isInternal) {
        income += tx.amount;
      }
    });

    const profit = income - expenses;
    const margin = income > 0 ? (profit / income) * 100 : 0;

    return { income, expenses, profit, margin, categoryTotals };
  }, [transactions, accounts]);

  // Chart Data Construction
  const trendData = useMemo(() => {
    const last30Days = [...Array(14)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      let dailyInc = 0;
      let dailyExp = 0;
      transactions.forEach(tx => {
        const txDate = new Date(tx.timestamp).toISOString().split('T')[0];
        if (txDate === date) {
          const isExpense = tx.toAccountId === 'operating_expenses' || tx.toAccountId === 'hiking_bar_expenses' || tx.toAccountId === 'variance_short';
          const isIncome = tx.toAccountId === 'till_float' || tx.toAccountId === 'business_bank' || tx.toAccountId === 'variance_excess';
          const isInternal = accounts.some(a => a.id === tx.fromAccountId) && accounts.some(a => a.id === tx.toAccountId) && !isExpense;

          if (isExpense) dailyExp += tx.amount;
          else if (isIncome && !isInternal) dailyInc += tx.amount;
        }
      });
      return { date: date.split('-')[2], profit: dailyInc - dailyExp, income: dailyInc, expenses: dailyExp };
    });
  }, [transactions, accounts]);

  const pieData = useMemo(() => {
    return Object.entries(financialData.categoryTotals).map(([name, value]) => ({ name, value }));
  }, [financialData]);

  // Filtered Transactions for the Feed
  const filteredFeed = useMemo(() => {
    return transactions
      .filter(tx => {
        const matchesSearch = tx.note?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tx.metadata?.category?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const isExpense = tx.toAccountId === 'operating_expenses' || tx.toAccountId === 'hiking_bar_expenses';
        const isIncome = tx.toAccountId === 'till_float' || tx.toAccountId === 'business_bank' || tx.toAccountId === 'variance_excess';
        const isTransfer = !isExpense && !isIncome && accounts.some(a => a.id === tx.fromAccountId) && accounts.some(a => a.id === tx.toAccountId);

        const matchesType = filterType === 'all' || 
                           (filterType === 'income' && isIncome && !isTransfer) ||
                           (filterType === 'expense' && isExpense) ||
                           (filterType === 'transfer' && isTransfer);

        return matchesSearch && matchesType;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, searchQuery, filterType, accounts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      <header className="flex justify-between items-center pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Financial Lab</h1>
          <p className="text-gray-400 text-sm font-medium">Profit & Ledger Analysis</p>
        </div>
        <div className="flex space-x-2 bg-white/5 p-1 rounded-2xl">
          {(['pl', 'categories', 'feed'] as LedgerTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab === 'pl' ? 'P&L' : tab === 'categories' ? 'Breakdown' : 'Feed'}
            </button>
          ))}
        </div>
      </header>

      {/* High-Level P&L Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="neu-convex rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full -mr-12 -mt-12" />
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center">
            <ArrowUpRight size={12} className="mr-1 text-emerald-500" /> Total Revenue
          </p>
          <h2 className="text-3xl font-black tracking-tighter text-white">{formatCurrency(financialData.income)}</h2>
        </div>
        <div className="neu-convex rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 blur-2xl rounded-full -mr-12 -mt-12" />
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center">
            <ArrowDownRight size={12} className="mr-1 text-rose-500" /> Operating Expenses
          </p>
          <h2 className="text-3xl font-black tracking-tighter text-white">{formatCurrency(financialData.expenses)}</h2>
        </div>
        <div className={`neu-convex rounded-[2rem] p-6 border relative overflow-hidden group ${financialData.profit >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
          <div className={`absolute top-0 right-0 w-24 h-24 blur-2xl rounded-full -mr-12 -mt-12 ${financialData.profit >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`} />
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Estimated Net Profit</p>
          <h2 className={`text-3xl font-black tracking-tighter ${financialData.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(financialData.profit)}
          </h2>
          <div className="mt-2 flex items-center space-x-2">
             <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${financialData.profit >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
               {financialData.margin.toFixed(1)}% Margin
             </span>
          </div>
        </div>
      </section>

      {activeTab === 'pl' && (
        <section className="space-y-6 animate-in slide-in-from-bottom duration-500">
           {/* Profit Trend Chart */}
           <div className="neu-convex rounded-[2.5rem] p-8 border border-white/5">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-lg font-bold">Profitability Trend</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Net daily gains over last 14 days</p>
                </div>
                <div className="flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-xl text-[10px] font-bold text-gray-400">
                  <Calendar size={12} />
                  <span>2 Weeks Scope</span>
                </div>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#161622', border: 'none', borderRadius: '16px', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      formatter={(val: number) => [formatCurrency(val), 'Profit']}
                    />
                    <Area type="monotone" dataKey="profit" stroke="#a855f7" strokeWidth={4} fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Metrics Grid */}
           <div className="grid grid-cols-2 gap-4">
              <div className="neu-convex rounded-3xl p-6 border border-white/5">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Cash Burn Efficiency</p>
                <div className="flex items-end justify-between">
                   <div>
                      <p className="text-2xl font-black text-white">{(financialData.expenses / (financialData.income || 1) * 100).toFixed(0)}%</p>
                      <p className="text-[8px] text-gray-600 font-bold uppercase mt-1">Opex vs Revenue Ratio</p>
                   </div>
                   <div className="w-12 h-12 rounded-full border-4 border-white/5 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                   </div>
                </div>
              </div>
              <div className="neu-convex rounded-3xl p-6 border border-white/5">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Daily Run Rate</p>
                <div className="flex items-end justify-between">
                   <div>
                      <p className="text-2xl font-black text-white">{formatCurrency(financialData.expenses / 30)}</p>
                      <p className="text-[8px] text-gray-600 font-bold uppercase mt-1">Avg operating cost per day</p>
                   </div>
                   <div className="w-12 h-12 rounded-full border-4 border-white/5 flex items-center justify-center">
                      <TrendingDown size={18} className="text-rose-400" />
                   </div>
                </div>
              </div>
           </div>
        </section>
      )}

      {activeTab === 'categories' && (
        <section className="space-y-6 animate-in slide-in-from-right duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="neu-convex rounded-[2.5rem] p-8 border border-white/5 flex flex-col items-center">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-8 self-start">Expense Distribution</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#161622', border: 'none', borderRadius: '16px', fontSize: '11px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(val: number) => [formatCurrency(val), 'Spent']}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="neu-convex rounded-[2.5rem] p-8 border border-white/5 space-y-4">
               <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">Category Ranking</h3>
               {pieData.sort((a,b) => b.value - a.value).map((item, idx) => (
                 <div key={item.name} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-xs font-bold text-gray-200">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-white">{formatCurrency(item.value)}</span>
                 </div>
               ))}
               {pieData.length === 0 && (
                 <div className="text-center py-20 opacity-20">
                    <Receipt size={48} className="mx-auto mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">No categorical data</p>
                 </div>
               )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'feed' && (
        <section className="space-y-4 animate-in slide-in-from-left duration-500">
           <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text"
                  placeholder="Search ledger..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm font-semibold"
                />
              </div>
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                {(['all', 'income', 'expense', 'transfer'] as const).map(type => (
                   <button 
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                   >
                     {type}
                   </button>
                ))}
              </div>
           </div>

           <div className="space-y-3">
              {filteredFeed.map(tx => {
                const isExpense = tx.toAccountId === 'operating_expenses' || tx.toAccountId === 'hiking_bar_expenses';
                const isIncome = tx.toAccountId === 'till_float' || tx.toAccountId === 'business_bank' || tx.toAccountId === 'variance_excess';
                const isTransfer = !isExpense && !isIncome && accounts.some(a => a.id === tx.fromAccountId) && accounts.some(a => a.id === tx.toAccountId);

                return (
                  <div key={tx.id} className="neu-convex rounded-3xl p-5 border border-white/5 flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3.5 rounded-2xl transition-all duration-300 ${
                        isTransfer ? 'bg-blue-500/10 text-blue-400' :
                        isIncome ? 'bg-emerald-500/10 text-emerald-500' : 
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {isTransfer ? <ArrowRightLeft size={22} /> : 
                         isIncome ? <ArrowUpRight size={22} /> : 
                         <ArrowDownRight size={22} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-100 line-clamp-1">{tx.note || 'Internal Transaction'}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-0.5">
                          {new Date(tx.timestamp).toLocaleDateString()} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-black tracking-tight ${
                        isTransfer ? 'text-blue-400' :
                        isIncome ? 'text-emerald-400' : 
                        'text-rose-400'
                      }`}>
                        {isTransfer ? '' : isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mt-0.5">
                        {tx.fromAccountId.split('_')[0]} → {tx.toAccountId.split('_')[0]}
                      </p>
                    </div>
                  </div>
                );
              })}
              {filteredFeed.length === 0 && (
                <div className="text-center py-20 opacity-30">
                  <History size={64} className="mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest text-xs">No ledger matches found</p>
                </div>
              )}
           </div>
        </section>
      )}
    </div>
  );
};

export default Ledger;
