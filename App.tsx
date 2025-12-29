
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MoneyLab from './components/MoneyLab';
import DailyOps from './components/DailyOps';
import HikingBar from './components/HikingBar';
import Expenses from './components/Expenses';
import BillsAndExpenses from './components/BillsAndExpenses';
import Staff from './components/Staff';
import Settings from './components/Settings';
import Ledger from './components/Ledger';
import { AccountsProvider } from './context/AccountsContext';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'daily':
        return <DailyOps />;
      case 'expense':
        return <Expenses />;
      case 'bills':
        return <BillsAndExpenses />;
      case 'hiking':
        return <HikingBar />;
      case 'accounts':
        return <MoneyLab />;
      case 'staff':
        return <Staff />;
      case 'settings':
        return <Settings />;
      case 'history':
        return <Ledger />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AccountsProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </AccountsProvider>
  );
};

export default App;
