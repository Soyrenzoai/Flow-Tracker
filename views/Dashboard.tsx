import React, { useState } from 'react';
import { FlowData, Branch, Category } from '../types';
import { BRANCHES, CATEGORIES, BRANCH_THEMES } from '../constants';
import { Edit, Trash2, Copy, Eye, Search } from 'lucide-react';

interface DashboardProps {
  flows: FlowData[];
  onEdit: (flow: FlowData) => void;
  onDuplicate: (flow: FlowData) => void;
  onDelete: (id: string) => void;
  onView: (flow: FlowData) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ flows, onEdit, onDuplicate, onDelete, onView }) => {
  const [filterBranch, setFilterBranch] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFlows = flows.filter(flow => {
    const matchesBranch = filterBranch === 'All' || flow.branch === filterBranch;
    const matchesCategory = filterCategory === 'All' || flow.category === filterCategory;
    const matchesSearch = flow.author.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (flow.initialResponse || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBranch && matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Sucursal</label>
            <select 
              className="rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 border bg-white text-gray-900"
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
            >
              <option value="All">Todas</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Categoría</label>
            <select 
              className="rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 border bg-white text-gray-900"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">Todas</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        
        <div className="w-full md:w-64 relative">
          <input 
             type="text"
             placeholder="Buscar por autor..."
             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredFlows.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No hay flujos registrados con estos filtros.</p>
          </div>
        ) : (
          filteredFlows.map(flow => {
            const theme = BRANCH_THEMES[flow.branch] || BRANCH_THEMES['Giorlent Norte'];
            
            return (
              <div key={flow.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex gap-2 items-center mb-2">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${theme.light} ${theme.text} border ${theme.border}`}
                      >
                        {flow.branch}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {flow.category}
                      </span>
                    </div>
                    {/* Visual Preview of nodes summary */}
                    <div className="mb-2">
                        {flow.nodes && flow.nodes.length > 0 ? (
                           <h3 className="text-lg font-medium text-gray-900 truncate">
                              {flow.nodes.find(n => n.type === 'trigger')?.title || 'Flujo sin Título'}
                           </h3>
                        ) : (
                           <h3 className="text-lg font-medium text-gray-900 truncate mb-1">
                            {flow.initialResponse || 'Sin respuesta inicial definida'}
                           </h3>
                        )}
                    </div>

                    <p className="text-sm text-gray-500">
                      Por <span className="font-semibold">{flow.author || 'Anónimo'}</span> el {flow.date}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span>{flow.nodes?.length || flow.steps.length} pasos</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t pt-4 md:pt-0 md:border-t-0">
                    <button onClick={() => onView(flow)} className="p-2 text-gray-400 hover:text-teal-600 rounded-full hover:bg-teal-50" title="Ver Detalles">
                      <Eye size={20} />
                    </button>
                    <button onClick={() => onEdit(flow)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50" title="Editar">
                      <Edit size={20} />
                    </button>
                    <button onClick={() => onDuplicate(flow)} className="p-2 text-gray-400 hover:text-purple-600 rounded-full hover:bg-purple-50" title="Duplicar">
                      <Copy size={20} />
                    </button>
                    <button onClick={() => onDelete(flow.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50" title="Eliminar">
                      <Trash2 size={20} />
                    </button>
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