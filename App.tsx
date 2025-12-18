import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, PlusCircle, LayoutDashboard, Download, Upload } from 'lucide-react';
import { FlowData, Branch } from './types';
import { INITIAL_FLOW_STATE } from './constants';
import { storageService } from './utils/storage';
import { apiService } from './utils/api';
import { SERVER_CONFIG } from './config';
import Dashboard from './views/Dashboard';
import VisualBuilder from './views/VisualBuilder';
import ResultView from './views/ResultView';

type View = 'dashboard' | 'builder' | 'result';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [flows, setFlows] = useState<FlowData[]>([]);
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
  const [activeBranch, setActiveBranch] = useState<Branch>('Giorlent Norte');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      if (SERVER_CONFIG.USE_SERVER) {
        const serverData = await apiService.fetchFlows();
        setFlows(serverData);
      } else {
        const localData = storageService.loadFlows();
        setFlows(localData);
      }
    };
    loadData();
  }, []);

  const persistData = useCallback(async (newFlows: FlowData[]) => {
    setIsSaving(true);
    setFlows([...newFlows]); // Force new reference
    if (SERVER_CONFIG.USE_SERVER) {
      await apiService.saveAllFlows(newFlows);
    } else {
      storageService.saveFlows(newFlows);
    }
    // Artificial delay for UX feedback
    setTimeout(() => setIsSaving(false), 800);
  }, []);

  const handleSaveFlow = useCallback(async (updatedFlow: FlowData) => {
    setFlows(prev => {
      const existingIndex = prev.findIndex(f => f.id === updatedFlow.id);
      let nextFlows;
      if (existingIndex >= 0) {
        nextFlows = [...prev];
        nextFlows[existingIndex] = { ...updatedFlow, createdAt: Date.now() };
      } else {
        nextFlows = [...prev, updatedFlow];
      }
      persistData(nextFlows);
      return nextFlows;
    });
  }, [persistData]);

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este flujo?')) {
      const updatedFlows = flows.filter(f => f.id !== id);
      persistData(updatedFlows);
      if (currentFlowId === id) setCurrentFlowId(null);
    }
  }, [flows, currentFlowId, persistData]);

  const handleDuplicate = useCallback((flow: FlowData, targetBranch?: Branch) => {
    const duplicated: FlowData = {
      ...flow,
      id: crypto.randomUUID(),
      branch: targetBranch || flow.branch,
      createdAt: Date.now(),
      date: new Date().toISOString().split('T')[0],
      category: flow.category + (targetBranch ? '' : ' (Copia)'),
    };
    const nextFlows = [...flows, duplicated];
    persistData(nextFlows);
    return duplicated;
  }, [flows, persistData]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (storageService.validateImport(imported)) {
          if (window.confirm(`Se importarán ${imported.length} flujos. ¿Fusionar con los actuales?`)) {
            const merged = [...flows];
            imported.forEach(imp => { if (!merged.find(f => f.id === imp.id)) merged.push(imp); });
            persistData(merged);
          }
        }
      } catch (err) { alert("Archivo inválido."); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 h-16 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="bg-teal-600 p-2 rounded-lg text-white shadow-md shadow-teal-100"><Activity size={24} /></div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Vistalli <span className="text-teal-600">Flow</span></h1>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Workspace</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => storageService.exportBackup(flows)} className="text-slate-500 hover:text-teal-600 flex items-center gap-1.5 text-sm font-semibold transition-colors"><Download size={18} /> Backup</button>
            <button onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-teal-600 flex items-center gap-1.5 text-sm font-semibold transition-colors"><Upload size={18} /> Importar</button>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            {view === 'dashboard' ? (
              <button onClick={() => setView('builder')} className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95"><PlusCircle className="-ml-1 mr-2 h-5 w-5" /> Abrir Editor</button>
            ) : (
              <button onClick={() => setView('dashboard')} className="text-slate-500 hover:text-teal-600 flex items-center gap-1.5 text-sm font-semibold transition-colors"><LayoutDashboard size={18} /> Dashboard</button>
            )}
          </div>
        </div>
      </header>

      <main className={`${view === 'dashboard' ? 'max-w-7xl mx-auto px-4 py-8' : 'w-full'}`}>
        {view === 'dashboard' && (
          <Dashboard 
            flows={flows} 
            onEdit={(f) => { setActiveBranch(f.branch); setCurrentFlowId(f.id); setView('builder'); }} 
            onDelete={handleDelete}
            onDuplicate={(f) => handleDuplicate(f)}
            onView={(f) => { setCurrentFlowId(f.id); setView('result'); }}
          />
        )}
        
        {view === 'builder' && (
          <VisualBuilder 
            allFlows={flows}
            initialBranch={activeBranch}
            initialFlowId={currentFlowId}
            isSavingGlobal={isSaving}
            onSave={handleSaveFlow} 
            onDeleteFlow={handleDelete}
            onDuplicateFlow={(f, branch) => {
              const dup = handleDuplicate(f, branch);
              setCurrentFlowId(dup.id);
              if (branch) setActiveBranch(branch);
            }}
            onCancel={() => setView('dashboard')} 
          />
        )}

        {view === 'result' && currentFlowId && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <ResultView 
                flow={flows.find(f => f.id === currentFlowId)!} 
                onBack={() => setView('dashboard')}
                onEdit={() => setView('builder')}
            />
          </div>
        )}
      </main>
    </div>
  );
}