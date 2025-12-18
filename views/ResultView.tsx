import React, { useMemo, useState } from 'react';
import { FlowData } from '../types';
import Mermaid from '../components/Mermaid';
import { generateMermaidChart } from '../utils/mermaidGenerator';
import { ArrowLeft, Edit, Download, Code, GitMerge, FileText, Copy, Check } from 'lucide-react';

interface ResultViewProps {
  flow: FlowData;
  onBack: () => void;
  onEdit: () => void;
  isDarkMode: boolean;
}

const ResultView: React.FC<ResultViewProps> = ({ flow, onBack, onEdit, isDarkMode }) => {
  const [tab, setTab] = useState<'chart' | 'code' | 'json'>('chart');
  const [copied, setCopied] = useState(false);
  
  const mermaidChart = useMemo(() => generateMermaidChart(flow), [flow]);
  
  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flow, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `flow_${flow.branch}_${flow.category.replace(/ /g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mermaidChart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabecera de Acciones */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <button onClick={onBack} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-teal-600 font-bold text-sm transition-colors group">
            <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
         </button>
         <div className="flex gap-2">
             <button onClick={onEdit} className="inline-flex items-center px-6 py-2.5 bg-slate-900 dark:bg-teal-600 text-white text-sm font-bold rounded-xl shadow-lg hover:opacity-90 transition-all">
                <Edit size={16} className="mr-2" /> Seguir Editando
             </button>
         </div>
      </div>

      {/* Tarjeta de Información General */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex flex-col md:flex-row justify-between mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
            <div className="max-w-2xl">
                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-2 block">{flow.branch}</span>
                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2 leading-tight">
                  {flow.category}
                </h2>
                <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500 font-medium text-sm">
                  <span>Autor: {flow.author || 'Vendedor'}</span>
                  <span>•</span>
                  <span>Fecha: {new Date(flow.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
            </div>
          </div>

          {/* Diagrama y Secciones de Datos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="md:col-span-2">
                 <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secuencia del Diagrama</h4>
                    <div className="flex gap-3 text-[10px] font-bold">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Acción</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500"></span> Mensaje</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Decisión</span>
                    </div>
                 </div>
                 <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <Mermaid chart={mermaidChart} />
                 </div>
             </div>
             
             <div className="space-y-6">
                 <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Exportación</h4>
                    <div className="grid grid-cols-1 gap-3">
                        <button 
                          onClick={() => setTab('chart')}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all font-bold text-sm
                            ${tab === 'chart' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
                          `}
                        >
                          <div className="flex items-center gap-3"><GitMerge size={18} /> Ver Diagrama</div>
                        </button>
                        <button 
                          onClick={() => setTab('code')}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all font-bold text-sm
                            ${tab === 'code' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
                          `}
                        >
                          <div className="flex items-center gap-3"><FileText size={18} /> Código Mermaid</div>
                        </button>
                        <button 
                          onClick={() => setTab('json')}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all font-bold text-sm
                            ${tab === 'json' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
                          `}
                        >
                          <div className="flex items-center gap-3"><Code size={18} /> Estructura JSON</div>
                        </button>
                    </div>
                 </div>

                 <div className="bg-teal-600 p-6 rounded-[2rem] text-white shadow-xl shadow-teal-500/20">
                    <Download className="mb-4" size={24} />
                    <h5 className="font-black text-sm uppercase tracking-widest mb-2">Descargar Datos</h5>
                    <p className="text-[10px] text-teal-100 leading-relaxed mb-6 font-medium">Descarga el archivo estructurado para respaldos o integración con bots.</p>
                    <button onClick={downloadJSON} className="w-full bg-white text-teal-600 font-black py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-teal-50 transition-colors">Guardar .JSON</button>
                 </div>
             </div>
          </div>
          
          {tab !== 'chart' && (
            <div className="mt-12 p-8 bg-slate-900 dark:bg-slate-950 rounded-[2rem] border border-slate-800 animate-in slide-in-from-top-4 duration-300 relative">
               <button 
                  onClick={copyToClipboard}
                  className="absolute top-6 right-6 flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700"
               >
                 {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : 'Copiar'}
               </button>
               <pre className="text-teal-400 font-mono text-xs overflow-x-auto custom-scrollbar leading-loose pt-4">
                 {tab === 'code' ? mermaidChart : JSON.stringify(flow, null, 2)}
               </pre>
            </div>
          )}
      </div>
    </div>
  );
};

export default ResultView;
