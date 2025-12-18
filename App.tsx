import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, PlusCircle, LayoutDashboard, Download, Upload, Moon, Sun } from 'lucide-react';
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

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

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

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const persistData = useCallback(async (newFlows: FlowData[]) => {
    setIsSaving(true);
    if (SERVER_CONFIG.USE_SERVER) {
      await apiService.saveAllFlows(newFlows);
    } else {
      storageService.saveFlows(newFlows);
    }
    setTimeout(() => setIsSaving(false), 800);
  }, []);

  const handleSaveFlow = useCallback((updatedFlow: FlowData) => {
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

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este flujo?')) {
      setFlows(prev => {
        const next = prev.filter(f => f.id !== id);
        persistData(next);
        return next;
      });
      if (currentFlowId === id) setCurrentFlowId(null);
    }
  }, [currentFlowId, persistData]);

  const handleDuplicate = useCallback((flow: FlowData, targetBranch?: Branch) => {
    const duplicated: FlowData = {
      ...flow,
      id: crypto.randomUUID(),
      branch: targetBranch || flow.branch,
      createdAt: Date.now(),
      date: new Date().toISOString().split('T')[0],
      category: flow.category + (targetBranch ? '' : ' (Copia)'),
    };
    setFlows(prev => {
      const next = [...prev, duplicated];
      persistData(next);
      return next;
    });
    return duplicated;
  }, [persistData]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (storageService.validateImport(imported)) {
          if (window.confirm(`Se importarán ${imported.length} flujos. ¿Fusionar?`)) {
            setFlows(prev => {
              const merged = [...prev];
              imported.forEach((imp: FlowData) => { 
                if (!merged.find(f => f.id === imp.id)) merged.push(imp); 
              });
              persistData(merged);
              return merged;
            });
          }
        }
      } catch (err) { alert("Archivo inválido."); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />

      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 h-16 shadow-sm transition-colors">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="bg-teal-600 p-2 rounded-lg text-white shadow-md shadow-teal-100 dark:shadow-none"><Activity size={24} /></div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Vistalli <span className="text-teal-600">Flow</span></h1>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Workspace</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-slate-500 hover:text-teal-600 dark:text-slate-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Alternar modo oscuro"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
            <button onClick={() => storageService.exportBackup(flows)} className="hidden md:flex text-slate-500 hover:text-teal-600 dark:text-slate-400 items-center gap-1.5 text-sm font-semibold transition-colors"><Download size={18} /> Backup</button>
            <button onClick={() => fileInputRef.current?.click()} className="hidden md:flex text-slate-500 hover:text-teal-600 dark:text-slate-400 items-center gap-1.5 text-sm font-semibold transition-colors"><Upload size={18} /> Importar</button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
            {view === 'dashboard' ? (
              <button onClick={() => setView('builder')} className="inline-flex items-center px-4 py-2 bg-slate-900 dark:bg-teal-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-slate-800 dark:hover:bg-teal-700 transition-all active:scale-95"><PlusCircle className="-ml-1 mr-2 h-5 w-5" /> Abrir Editor</button>
            ) : (
              <button onClick={() => setView('dashboard')} className="text-slate-500 hover:text-teal-600 dark:text-slate-400 flex items-center gap-1.5 text-sm font-semibold transition-colors"><LayoutDashboard size={18} /> Dashboard</button>
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
            isDarkMode={isDarkMode}
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
            isDarkMode={isDarkMode}
          />
        )}

        {view === 'result' && currentFlowId && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <ResultView 
                flow={flows.find(f => f.id === currentFlowId)!} 
                onBack={() => setView('dashboard')}
                onEdit={() => setView('builder')}
                isDarkMode={isDarkMode}
            />
          </div>
        )}
      </main>
    </div>
  );
}