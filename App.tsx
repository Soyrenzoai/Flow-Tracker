import React, { useState, useEffect, useRef } from 'react';
import { Activity, PlusCircle, LayoutDashboard, Database, Upload, Download, Cloud, CloudOff } from 'lucide-react';
import { FlowData } from './types';
import { INITIAL_FLOW_STATE } from './constants';
import { storageService } from './utils/storage';
import { apiService } from './utils/api';
import { SERVER_CONFIG } from './config';
import Dashboard from './views/Dashboard';
import VisualBuilder from './views/VisualBuilder'; // Changed from FlowForm
import ResultView from './views/ResultView';

// Simple mocked router using state
type View = 'dashboard' | 'create' | 'edit' | 'result';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [flows, setFlows] = useState<FlowData[]>([]);
  const [currentFlow, setCurrentFlow] = useState<FlowData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data logic
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (SERVER_CONFIG.USE_SERVER) {
        // Cargar desde Servidor
        const serverData = await apiService.fetchFlows();
        setFlows(serverData);
      } else {
        // Cargar Local
        const localData = storageService.loadFlows();
        setFlows(localData);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Save logic helper
  const persistData = async (newFlows: FlowData[]) => {
    setFlows(newFlows); // Actualizar UI inmediatamente
    
    if (SERVER_CONFIG.USE_SERVER) {
      setIsLoading(true);
      await apiService.saveAllFlows(newFlows);
      setIsLoading(false);
    } else {
      storageService.saveFlows(newFlows);
    }
  };

  const handleCreateNew = () => {
    setCurrentFlow({
      ...INITIAL_FLOW_STATE,
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      nodes: [], // New graph structure
    } as FlowData);
    setView('create');
  };

  const handleSaveFlow = async (flow: FlowData) => {
    const existingIndex = flows.findIndex(f => f.id === flow.id);
    let updatedFlows;
    
    if (existingIndex >= 0) {
      updatedFlows = [...flows];
      updatedFlows[existingIndex] = flow;
    } else {
      updatedFlows = [...flows, flow];
    }

    await persistData(updatedFlows);
    setCurrentFlow(flow);
    // After saving a visual flow, we might want to stay in edit or go to result. 
    // Since ResultView generates mermaid from data, we can go there to see the static summary
    setView('result'); 
  };

  const handleEdit = (flow: FlowData) => {
    setCurrentFlow(flow);
    setView('edit');
  };

  const handleDuplicate = (flow: FlowData) => {
    const duplicated: FlowData = {
      ...flow,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      date: new Date().toISOString().split('T')[0],
      category: flow.category + ' (Copia)',
    };
    setCurrentFlow(duplicated);
    setView('create'); 
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este flujo?')) {
      const updatedFlows = flows.filter(f => f.id !== id);
      await persistData(updatedFlows);
      
      if (currentFlow?.id === id) {
        setView('dashboard');
        setCurrentFlow(null);
      }
    }
  };

  const handleViewResult = (flow: FlowData) => {
      setCurrentFlow(flow);
      setView('result');
  }

  // Database / Backup Handlers
  const handleExport = () => {
    storageService.exportBackup(flows);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (storageService.validateImport(json)) {
          if (window.confirm(`Se encontrarón ${json.length} flujos. ¿Deseas reemplazar tu base de datos actual con esta copia?`)) {
            await persistData(json);
            alert('Base de datos restaurada correctamente.');
          }
        } else {
          alert('El archivo no tiene el formato correcto.');
        }
      } catch (err) {
        console.error(err);
        alert('Error al leer el archivo.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".json"
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 h-16">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between h-full items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
              <div className="bg-teal-600 p-2 rounded-lg text-white">
                <Activity size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Vistalli Flow</h1>
                <div className="flex items-center gap-1 text-xs text-slate-500 hidden md:flex">
                    Editor Visual
                    {SERVER_CONFIG.USE_SERVER ? (
                        <span className="text-green-600 flex items-center gap-0.5 ml-2 font-bold"><Cloud size={10} /> Online</span>
                    ) : (
                        <span className="text-gray-400 flex items-center gap-0.5 ml-2"><CloudOff size={10} /> Local</span>
                    )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              {view === 'dashboard' ? (
                <>
                  <div className="hidden md:flex items-center border-r border-gray-300 pr-4 mr-2 gap-2">
                    <button 
                      onClick={handleImportClick}
                      disabled={isLoading}
                      className="text-slate-600 hover:text-teal-700 p-2 rounded-md hover:bg-slate-100 flex items-center gap-1 text-xs font-medium disabled:opacity-50"
                    >
                      <Upload size={16} /> Restaurar
                    </button>
                    <button 
                      onClick={handleExport}
                      disabled={isLoading}
                      className="text-slate-600 hover:text-teal-700 p-2 rounded-md hover:bg-slate-100 flex items-center gap-1 text-xs font-medium disabled:opacity-50"
                    >
                      <Download size={16} /> Backup
                    </button>
                  </div>
                  <button
                    onClick={handleCreateNew}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                  >
                    {isLoading ? '...' : <><PlusCircle className="-ml-1 mr-2 h-5 w-5" /> Nuevo</>}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setView('dashboard')}
                  className="text-slate-500 hover:text-teal-600 flex items-center gap-1 text-sm font-medium"
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full width for Visual Builder */}
      <main className={`h-[calc(100vh-64px)] ${view === 'dashboard' ? 'max-w-7xl mx-auto px-4 py-8' : 'w-full'}`}>
        
        {view === 'dashboard' && (
          <Dashboard 
            flows={flows} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onView={handleViewResult}
          />
        )}
        
        {(view === 'create' || view === 'edit') && currentFlow && (
          <VisualBuilder 
            initialData={currentFlow} 
            onSave={handleSaveFlow} 
            onCancel={() => setView('dashboard')} 
          />
        )}

        {view === 'result' && currentFlow && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <ResultView 
                flow={currentFlow} 
                onBack={() => setView('dashboard')}
                onEdit={() => setView('edit')}
            />
          </div>
        )}
      </main>
    </div>
  );
}