
import React, { useState } from 'react';
import { useAccounts } from '../context/AccountsContext';
import { Settings as SettingsIcon, Plus, Trash2, ShieldCheck, UserCircle, ReceiptText, Truck, Layers, PlusCircle, X } from 'lucide-react';

const Settings: React.FC = () => {
  const { 
    creditPartners, addCreditPartner, deleteCreditPartner,
    vendors, addVendor, deleteVendor,
    expenseCategories, addExpenseCategory, deleteExpenseCategory, addSubCategory, deleteSubCategory
  } = useAccounts();
  
  const [newPartner, setNewPartner] = useState('');
  const [newVendor, setNewVendor] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSubCategory, setNewSubCategory] = useState<{ catId: string, name: string }>({ catId: '', name: '' });

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.trim()) return;
    addCreditPartner(newPartner.trim());
    setNewPartner('');
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.trim()) return;
    addVendor(newVendor.trim());
    setNewVendor('');
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    addExpenseCategory(newCategory.trim());
    setNewCategory('');
  };

  const handleAddSub = (e: React.FormEvent, catId: string) => {
    e.preventDefault();
    if (!newSubCategory.name.trim()) return;
    addSubCategory(catId, newSubCategory.name.trim());
    setNewSubCategory({ catId: '', name: '' });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-32">
      <header className="flex justify-between items-center pt-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-gray-400 text-sm">Configure core restaurant profiles</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-purple-400">
          <SettingsIcon size={24} />
        </div>
      </header>

      {/* Vendor Management */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
            <Truck size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Vendor Profiles</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Entities you pay for goods & services</p>
          </div>
        </div>

        <div className="neu-convex rounded-[2.5rem] p-8 border border-white/5 space-y-6">
          <form onSubmit={handleAddVendor} className="flex space-x-4">
            <div className="relative flex-1">
              <PlusCircle size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text"
                placeholder="New Vendor Name..."
                value={newVendor}
                onChange={(e) => setNewVendor(e.target.value)}
                className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-orange-500 outline-none text-sm font-semibold"
              />
            </div>
            <button type="submit" className="bg-orange-500 text-white px-8 rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/20 active:scale-95">Add</button>
          </form>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map(v => (
              <div key={v.id} className="bg-white/5 rounded-2xl p-4 flex justify-between items-center group">
                <span className="text-sm font-bold">{v.name}</span>
                <button onClick={() => deleteVendor(v.id)} className="text-gray-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><X size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expense Categories Management */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Category Lab</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Expense classification tree</p>
          </div>
        </div>

        <div className="neu-convex rounded-[2.5rem] p-8 border border-white/5 space-y-8">
          <form onSubmit={handleAddCategory} className="flex space-x-4">
            <input 
              type="text"
              placeholder="New Primary Category..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
            />
            <button type="submit" className="bg-blue-500 text-white px-8 rounded-2xl font-bold shadow-lg shadow-blue-500/20">Create</button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {expenseCategories.map(cat => (
              <div key={cat.id} className="bg-black/20 rounded-[2rem] p-6 border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-blue-400 uppercase tracking-widest text-xs">{cat.name}</h3>
                  <button onClick={() => deleteExpenseCategory(cat.id)} className="text-gray-600 hover:text-rose-500"><Trash2 size={16} /></button>
                </div>
                
                <div className="space-y-2">
                  {cat.subCategories.map(sub => (
                    <div key={sub} className="flex justify-between items-center bg-white/5 p-2 px-3 rounded-xl">
                      <span className="text-xs text-gray-400">{sub}</span>
                      <button onClick={() => deleteSubCategory(cat.id, sub)} className="text-gray-700 hover:text-rose-500"><X size={12} /></button>
                    </div>
                  ))}
                  
                  <form onSubmit={(e) => handleAddSub(e, cat.id)} className="flex space-x-2 pt-2">
                    <input 
                      type="text"
                      placeholder="Add sub..."
                      value={newSubCategory.catId === cat.id ? newSubCategory.name : ''}
                      onChange={(e) => setNewSubCategory({ catId: cat.id, name: e.target.value })}
                      className="flex-1 bg-white/5 border-none rounded-xl p-2 px-3 text-[10px] outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button type="submit" className="text-blue-400 hover:text-blue-300"><Plus size={16} /></button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credit Bills Profiles Section */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <ReceiptText size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Partner Billing Profiles</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Profiles for external credit bills</p>
          </div>
        </div>

        <div className="neu-convex rounded-[2.5rem] p-8 border border-white/5 space-y-6">
          <form onSubmit={handleAddPartner} className="flex space-x-4">
            <div className="relative flex-1">
              <UserCircle size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text"
                placeholder="Partner Entity Name..."
                value={newPartner}
                onChange={(e) => setNewPartner(e.target.value)}
                className="w-full bg-[#1e1e2f] border border-white/5 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-semibold"
              />
            </div>
            <button type="submit" className="bg-purple-500 text-white px-8 rounded-2xl font-bold shadow-lg shadow-purple-500/20">Add</button>
          </form>
          <div className="flex flex-wrap gap-3">
            {creditPartners.map(p => (
              <div key={p} className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl flex items-center space-x-3 group">
                <span className="text-xs font-bold">{p}</span>
                <button onClick={() => deleteCreditPartner(p)} className="text-gray-600 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & System Info */}
      <section className="neu-convex rounded-[2.5rem] p-8 border border-white/5 bg-black/10">
        <div className="flex items-center space-x-4 mb-4">
          <ShieldCheck size={20} className="text-emerald-400" />
          <h3 className="font-bold">System Integrity</h3>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Operational configurations are managed via localized state keys. 
          Audits for expenditure are logged immediately to the general ledger with high-precision timestamps.
        </p>
        <div className="mt-6 flex space-x-4">
          <div className="bg-white/5 px-4 py-2 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest">v2.5.0-Titan</div>
          <div className="bg-white/5 px-4 py-2 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest">Core: Unified Expenditure</div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
