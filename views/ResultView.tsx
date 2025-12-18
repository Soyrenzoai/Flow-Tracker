import React, { useMemo, useState } from 'react';
import { FlowData } from '../types';
import Mermaid from '../components/Mermaid';
import { generateMermaidChart } from '../utils/mermaidGenerator';
import { ArrowLeft, Edit, Download, Code, GitMerge, FileText, Copy, Check } from 'lucide-react';

interface ResultViewProps {
  flow: FlowData;
  onBack: () => void;
  onEdit: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ flow, onBack, onEdit }) => {
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
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={20} className="mr-1" /> Volver al Dashboard
         </button>
         <div className="flex gap-2">
             <button onClick={onEdit} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Edit size={16} className="mr-2" /> Editar
             </button>
         </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between mb-4 border-b border-gray-100 pb-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{flow.category}</h2>
                <p className="text-teal-600 font-medium">{flow.branch}</p>
            </div>
            <div className="text-right mt-2 md:mt-0">
                 <p className="text-sm text-gray-500">Autor: {flow.author}</p>
                 <p className="text-sm text-gray-500">Fecha: {flow.date}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                 <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Respuesta Inicial</h4>
                 <div className="p-3 bg-gray-50 rounded text-gray-800 italic border border-gray-200">
                    "{flow.initialResponse}"
                 </div>
             </div>
             <div>
                 <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Objetivo</h4>
                 <div className="p-3 bg-green-50 rounded text-green-900 border border-green-100">
                    {flow.objective || 'Sin definir'}
                 </div>
             </div>
          </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setTab('chart')}
            className={`${
              tab === 'chart'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <GitMerge size={18} className="mr-2" /> Diagrama Visual
          </button>
          <button
            onClick={() => setTab('code')}
            className={`${
              tab === 'code'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FileText size={18} className="mr-2" /> Código Mermaid (Texto)
          </button>
          <button
            onClick={() => setTab('json')}
            className={`${
              tab === 'json'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Code size={18} className="mr-2" /> JSON Datos
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
          {tab === 'chart' && (
              <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded text-sm text-blue-800 flex flex-col md:flex-row gap-4 justify-between">
                     <p>Este diagrama se genera automáticamente en base a los pasos y condiciones ingresadas.</p>
                     <div className="flex gap-4 text-xs font-bold">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#bbf] border border-[#333] inline-block"></span> Acción Interna</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#aff] border border-[#333] inline-block"></span> Mensaje</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#f9f] border border-[#333] transform rotate-45 inline-block scale-75"></span> Pregunta</span>
                     </div>
                  </div>
                  <Mermaid chart={mermaidChart} />
              </div>
          )}

          {tab === 'code' && (
              <div className="relative">
                  <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-500">
                          Copia este código y pégalo en cualquier editor compatible con Mermaid (Notion, GitHub, Obsidian, etc).
                      </p>
                      <button 
                        onClick={copyToClipboard}
                        className={`flex items-center px-3 py-1.5 rounded text-sm font-medium transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                          {copied ? <Check size={16} className="mr-1.5" /> : <Copy size={16} className="mr-1.5" />}
                          {copied ? 'Copiado!' : 'Copiar Código'}
                      </button>
                  </div>
                  <textarea 
                    readOnly
                    value={mermaidChart}
                    className="w-full h-[500px] p-4 font-mono text-sm bg-gray-900 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
              </div>
          )}

          {tab === 'json' && (
              <div className="relative">
                 <div className="flex justify-end mb-2">
                    <button onClick={downloadJSON} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-teal-600 hover:bg-teal-700">
                        <Download size={16} className="mr-2" /> Descargar Archivo .json
                    </button>
                 </div>
                 <div className="bg-gray-900 rounded-lg p-6 overflow-auto max-h-[600px] shadow-inner">
                    <pre className="text-green-400 font-mono text-sm">
                        {JSON.stringify(flow, null, 2)}
                    </pre>
                 </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default ResultView;