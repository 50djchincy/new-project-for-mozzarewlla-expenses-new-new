
import React, { useMemo, useState } from 'react';
import { useAccounts } from '../context/AccountsContext';
import StatCard from './StatCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Banknote, HandCoins, ReceiptText, History } from 'lucide-react';
import AccountJournal from './AccountJournal';
import { Account } from '../types';

const Dashboard: React.FC = () => {
  const { accounts, transactions, totalAssets, totalLiabilities } = useAccounts();
  const [selectedJournalAccount, setSelectedJournalAccount] = useState<Account | null>(null);

  const tillAccount = accounts.find(a => a.id === 'till_float');
  const hbAccount = accounts.find(a => a.id === 'hiking_bar_rec');
  const billsAccount = accounts.find(a => a.id === 'pending_bills');

  // Mock Trend Data for "Revenue vs Expenses"
  const chartData = [
    { name: 'Mon', rev: 400, exp: 240 },
    { name: 'Tue', rev: 300, exp: 139 },
    { name: 'Wed', rev: 200, exp: 980 },
    { name: 'Thu', rev: 278, exp: 390 },
    { name: 'Fri', rev: 189, exp: 480 },
    { name: 'Sat', rev: 239, exp: 380 },
    { name: 'Sun', rev: 349, exp: 430 },
  ];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const getTxType = (tx: any) => {
    if (tx.toAccountId === 'operating_expenses' || tx.toAccountId === 'variance_short' || tx.toAccountId === 'hiking_bar_expenses') {
      return 'expense';
    }
    if (tx.toAccountId === 'till_float' || tx.toAccountId === 'business_bank' || tx.toAccountId === 'variance_excess') {
      return 'income';
    }
    return 'transfer';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Lab</h1>
          <p className="text-gray-400 text-sm font-medium">Restaurant Performance Hub</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
          <span className="text-xl">📊</span>
        </div>
      </header>

      {/* Key Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="text-left w-full block transition-transform active:scale-[0.98]" onClick={() => tillAccount && setSelectedJournalAccount(tillAccount)}>
          <StatCard 
            label="Cash in Hand" 
            value={formatCurrency(tillAccount?.balance || 0)} 
            icon="Banknote" 
            gradient="from-emerald-400 to-teal-500" 
            subValue="Physical till float"
          />
        </button>
        <button className="text-left w-full block transition-transform active:scale-[0.98]" onClick={() => hbAccount && setSelectedJournalAccount(hbAccount)}>
          <StatCard 
            label="Hiking Bar Debt" 
            value={formatCurrency(hbAccount?.balance || 0)} 
            icon="HandCoins" 
            gradient="from-blue-400 to-indigo-500" 
            subValue="Accounts receivable"
          />
        </button>
        <button className="text-left w-full block transition-transform active:scale-[0.98]" onClick={() => billsAccount && setSelectedJournalAccount(billsAccount)}>
          <StatCard 
            label="Pending Bills" 
            value={formatCurrency(billsAccount?.balance || 0)} 
            icon="ReceiptText" 
            gradient="from-rose-400 to-pink-500" 
            subValue="Accounts payable"
          />
        </button>
      </div>

      {/* Journal Modal */}
      {selectedJournalAccount && (
        <AccountJournal 
          account={selectedJournalAccount}
          transactions={transactions}
          onClose={() => setSelectedJournalAccount(null)}
        />
      )}

      {/* Chart: Revenue vs Expenses */}
      <section className="neu-convex rounded-[2.5rem] p-8 border border-white/5">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-lg font-bold">Flow Analysis</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Revenue vs Operating Expenses</p>
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">Revenue</span>
             </div>
             <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">Expenses</span>
             </div>
          </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} dy={10} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#161622', border: 'none', borderRadius: '16px', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="rev" stroke="#a855f7" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              <Area type="monotone" dataKey="exp" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="pb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Ledger Feed</h2>
          <button className="px-4 py-2 rounded-xl bg-white/5 text-[10px] font-bold uppercase tracking-widest text-purple-400 hover:bg-white/10 transition-all">View Analytics</button>
        </div>
        <div className="space-y-4">
          {transactions.slice(0, 10).map((tx) => {
            const type = getTxType(tx);
            return (
              <div key={tx.id} className="neu-convex rounded-3xl p-5 flex items-center justify-between border border-white/5 group hover:bg-white/[0.02] transition-all">
                <div className="flex items-center space-x-4">
                  <div className={`p-3.5 rounded-2xl transition-all duration-300 ${
                    type === 'income' 
                      ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/5' 
                      : type === 'expense'
                      ? 'bg-rose-500/10 text-rose-500 shadow-rose-500/5'
                      : 'bg-white/5 text-gray-400'
                  }`}>
                    {type === 'income' ? <ArrowUpRight size={22} /> : type === 'expense' ? <ArrowDownRight size={22} /> : <HandCoins size={22} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-100 line-clamp-1">{tx.note || 'Internal Transfer'}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-0.5">
                      {new Date(tx.timestamp).toLocaleDateString()} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-base font-black tracking-tight ${
                    type === 'income' ? 'text-emerald-400' : type === 'expense' ? 'text-rose-400' : 'text-gray-300'
                  }`}>
                    {type === 'income' ? '+' : type === 'expense' ? '-' : ''}{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-[9px] text-gray-600 uppercase font-black tracking-[0.15em] mt-0.5">
                    {tx.fromAccountId.split('_')[0]} → {tx.toAccountId.split('_')[0]}
                  </p>
                </div>
              </div>
            );
          })}
          {transactions.length === 0 && (
            <div className="neu-concave rounded-[2.5rem] p-16 text-center text-gray-500 border border-white/5 space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
                <History size={32} />
              </div>
              <p className="font-bold tracking-tight text-sm uppercase opacity-30">No transaction data detected</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
