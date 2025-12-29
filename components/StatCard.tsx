
import React from 'react';
import * as Icons from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: keyof typeof Icons;
  gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon, gradient }) => {
  const IconComponent = Icons[icon] as React.ElementType;

  return (
    <div className="neu-convex rounded-[2.5rem] p-7 relative overflow-hidden group border border-white/5 hover:border-white/10 transition-all">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
      
      <div className="flex flex-col h-full justify-between space-y-6">
        <div className="flex items-center justify-between">
          <div className={`p-4 rounded-[1.5rem] bg-gradient-to-br ${gradient} shadow-2xl shadow-black/40`}>
            <IconComponent size={24} className="text-white" />
          </div>
          <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
        </div>
        
        <div className="relative z-10">
          <h3 className="text-3xl font-black tracking-tighter text-white">{value}</h3>
          {subValue && <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-60">{subValue}</p>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
