import React, { useState } from 'react';
import { FlowData, Branch, Category } from '../types';
import { BRANCHES, CATEGORIES, BRANCH_THEMES } from '../constants';
import { Edit, Trash2, Copy, Eye, Search, FileText } from 'lucide-react';

interface DashboardProps {
  flows: FlowData[];
  onEdit: (flow: FlowData) => void;
  onDuplicate: (flow: FlowData) => void;
  onDelete: (id: string) => void;
  onView: (flow: FlowData) => void;
  isDarkMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ flows, onEdit, onDuplicate, onDelete, onView, isDarkMode }) => {
  const [filterBranch, setFilterBranch] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFlows = flows.filter(flow => {
    const matchesBranch = filterBranch === 'All' || flow.branch === filterBranch;
    const matchesCategory = filterCategory === 'All' || flow.category === filterCategory;
    const matchesSearch = (flow.author || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (flow.nodes?.[0]?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (flow.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBranch && matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-end md:items-center justify-between transition-colors">
        <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Sucursal</label>
            <select 
              className="rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-3 border bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors"
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
            >
              <option value="All">Todas</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Categoría</label>
            <select 
              className="rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-3 border bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">Todas</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        
        <div className="w-full md:w-80 relative">
          <input 
             type="text"
             placeholder="Buscar flujos..."
             className="w-full pl-12 pr-6 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-4 text-slate-400" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredFlows.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <FileText size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
            <p className="text-slate-400 dark:text-slate-500 font-medium">No hay flujos registrados.</p>
          </div>
        ) : (
          filteredFlows.map(flow => {
            const theme = BRANCH_THEMES[flow.branch] || BRANCH_THEMES['Giorlent Norte'];
            
            return (
              <div key={flow.id} className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-lg shadow-slate-100 dark:shadow-none border border-slate-100 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-600 transition-all hover:translate-y-[-4px]">
                <div className="flex flex-col h-full">
                  <div className="flex gap-2 items-center mb-5">
                    <span 
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${theme.light} dark:bg-slate-800 ${theme.text} dark:text-teal-500 border border-transparent dark:border-slate-700`}
                    >
                      {flow.branch}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {flow.category.split(' ')[1] || flow.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-2 leading-tight min-h-[3.5rem] line-clamp-2">
                    {flow.nodes?.find(n => n.type === 'trigger')?.title || 'Flujo sin Título'}
                  </h3>

                  <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-50 dark:border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Autor</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{flow.author || 'Vendedor'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button onClick={() => onView(flow)} className="p-2.5 text-slate-400 hover:text-teal-600 dark:hover:bg-slate-800 rounded-xl transition-all" title="Vista Previa"><Eye size={20} /></button>
                      <button onClick={() => onEdit(flow)} className="p-2.5 text-slate-400 hover:text-blue-600 dark:hover:bg-slate-800 rounded-xl transition-all" title="Editar"><Edit size={20} /></button>
                      <button onClick={() => onDuplicate(flow)} className="p-2.5 text-slate-400 hover:text-purple-600 dark:hover:bg-slate-800 rounded-xl transition-all" title="Duplicar"><Copy size={20} /></button>
                      <button onClick={() => onDelete(flow.id)} className="p-2.5 text-slate-400 hover:text-red-500 dark:hover:bg-slate-800 rounded-xl transition-all" title="Borrar"><Trash2 size={20} /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Dashboard;