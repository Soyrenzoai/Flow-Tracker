import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { FlowData, FlowNode, NodeType, Branch, Category } from '../types';
import { Save, Plus, X, ArrowRight, Trash2, FileText, ChevronRight, MessageSquare, AlertCircle, Copy, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { BRANCHES, CATEGORIES, BRANCH_THEMES, INITIAL_FLOW_STATE } from '../constants';
import { storageService } from '../utils/storage';

interface VisualBuilderProps {
  allFlows: FlowData[];
  initialBranch: Branch;
  initialFlowId: string | null;
  isSavingGlobal: boolean;
  onSave: (data: FlowData) => void;
  onDeleteFlow: (id: string) => void;
  onDuplicateFlow: (flow: FlowData, branch?: Branch) => void;
  onCancel: () => void;
}

const VisualBuilder: React.FC<VisualBuilderProps> = ({ 
  allFlows, 
  initialBranch, 
  initialFlowId, 
  isSavingGlobal,
  onSave, 
  onDeleteFlow,
  onDuplicateFlow,
  onCancel 
}) => {
  const [activeBranch, setActiveBranch] = useState<Branch>(initialBranch);
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(initialFlowId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Filter flows for the left sidebar
  const branchFlows = useMemo(() => 
    allFlows.filter(f => f.branch === activeBranch), 
    [allFlows, activeBranch]
  );

  // Find the flow being edited
  const activeFlow = useMemo(() => 
    allFlows.find(f => f.id === currentFlowId), 
    [allFlows, currentFlowId]
  );

  const theme = BRANCH_THEMES[activeBranch];

  // --- Core Flow Logic ---

  const handleCreateNewCase = () => {
    const newId = crypto.randomUUID();
    const newFlow: FlowData = {
      ...INITIAL_FLOW_STATE,
      id: newId,
      branch: activeBranch,
      author: 'Vendedor',
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      nodes: [{
        id: crypto.randomUUID(),
        type: 'trigger',
        title: 'Entrada Principal',
        content: '',
        position: { x: 100, y: 100 },
        next: []
      }]
    };
    onSave(newFlow);
    setCurrentFlowId(newId);
    setSelectedNodeId(null);
  };

  const updateActiveFlow = useCallback((updates: Partial<FlowData>) => {
    if (!activeFlow) return;
    onSave({ ...activeFlow, ...updates });
  }, [activeFlow, onSave]);

  const addNode = (type: NodeType, parentId?: string, x?: number, y?: number) => {
    if (!activeFlow) return;
    const id = crypto.randomUUID();
    const newNode: FlowNode = {
      id,
      type,
      title: type === 'trigger' ? 'Inicio' : type === 'condition' ? 'Decisión' : 'Paso',
      content: '',
      position: { x: x || 100, y: y || 100 },
      next: []
    };

    const newNodes = [...activeFlow.nodes, newNode];
    if (parentId) {
      const parentIdx = newNodes.findIndex(n => n.id === parentId);
      if (parentIdx >= 0) {
        newNodes[parentIdx] = { ...newNodes[parentIdx], next: [...newNodes[parentIdx].next, id] };
      }
    }
    updateActiveFlow({ nodes: newNodes });
    setSelectedNodeId(id);
  };

  const updateNode = (id: string, field: keyof FlowNode, value: any) => {
    if (!activeFlow) return;
    const updatedNodes = activeFlow.nodes.map(n => n.id === id ? { ...n, [field]: value } : n);
    updateActiveFlow({ nodes: updatedNodes });
  };

  const deleteNode = (id: string) => {
    if (!activeFlow || !window.confirm("¿Eliminar este paso?")) return;
    updateActiveFlow({
      nodes: activeFlow.nodes
        .filter(n => n.id !== id)
        .map(n => ({ ...n, next: n.next.filter(nextId => nextId !== id) }))
    });
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const connectNodes = (sourceId: string, targetId: string) => {
    if (!activeFlow || sourceId === targetId) return;
    const source = activeFlow.nodes.find(n => n.id === sourceId);
    if (source && !source.next.includes(targetId)) {
      updateActiveFlow({
        nodes: activeFlow.nodes.map(n => n.id === sourceId ? { ...n, next: [...n.next, targetId] } : n)
      });
    }
    setConnectingNodeId(null);
  };

  // --- Optimized Performance Drag & Drop ---
  
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (connectingNodeId) return;
    e.stopPropagation();
    const node = activeFlow?.nodes.find(n => n.id === id);
    if (node) {
      setDraggingNodeId(id);
      setDragOffset({ x: e.clientX - node.position.x, y: e.clientY - node.position.y });
    }
    setSelectedNodeId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId && activeFlow) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Update locally for smooth visual feedback
      const updatedNodes = activeFlow.nodes.map(n => 
        n.id === draggingNodeId ? { ...n, position: { x: newX, y: newY } } : n
      );
      
      // We don't call onSave on every move pixel to avoid lag
      // Instead we only update the parent state when it makes sense or on mouse up
      // But for better UX without using refs for everything, we just update local reference
      updateActiveFlow({ nodes: updatedNodes });
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  const renderConnections = () => {
    if (!activeFlow) return null;
    return activeFlow.nodes.map(node => 
      node.next.map(nextId => {
        const target = activeFlow.nodes.find(n => n.id === nextId);
        if (!target) return null;
        const startX = node.position.x + 280;
        const startY = node.position.y + 40;
        const endX = target.position.x;
        const endY = target.position.y + 40;
        const path = `M ${startX} ${startY} C ${startX + 60} ${startY}, ${endX - 60} ${endY}, ${endX} ${endY}`;
        return (
          <g key={`${node.id}-${target.id}`}>
            <path d={path} stroke="#cbd5e1" strokeWidth="4" fill="none" className="opacity-40" />
            <path d={path} stroke={selectedNodeId === node.id ? theme.color : "#94a3b8"} strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
          </g>
        );
      })
    );
  };

  const selectedNode = activeFlow?.nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-100 overflow-hidden select-none" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      
      {/* COLUMN 1: SUCURSALES Y LISTA DE CASOS */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col z-20 shadow-2xl">
        <div className="p-5 bg-slate-50 border-b border-slate-200">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Sucursal Seleccionada</label>
            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                <div className={`w-4 h-4 rounded-full ${theme.bg} ring-4 ring-offset-2 ring-slate-100`} />
                <select 
                    value={activeBranch} 
                    onChange={e => {
                        setActiveBranch(e.target.value as Branch);
                        setCurrentFlowId(null);
                        setSelectedNodeId(null);
                    }}
                    className="flex-1 font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0 cursor-pointer text-sm"
                >
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="px-5 py-4 flex justify-between items-center bg-white sticky top-0 z-10 border-b border-slate-50">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Mis Casos Guardados</h3>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-bold border border-slate-200">{branchFlows.length}</span>
            </div>
            
            <div className="px-3 py-2 space-y-2">
                {branchFlows.length === 0 ? (
                    <div className="py-12 px-6 text-center">
                        <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText size={20} className="text-slate-300" />
                        </div>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">No hay flujos diseñados para esta sucursal todavía.</p>
                    </div>
                ) : (
                    branchFlows.map(flow => (
                        <div 
                            key={flow.id}
                            onClick={() => { setCurrentFlowId(flow.id); setSelectedNodeId(null); }}
                            className={`group relative p-4 rounded-2xl cursor-pointer transition-all border-2
                                ${currentFlowId === flow.id ? `bg-white border-slate-900 shadow-lg shadow-slate-200` : 'bg-white border-transparent hover:border-slate-100 hover:bg-slate-50'}
                            `}
                        >
                            <div className="flex-1 min-w-0">
                                <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${currentFlowId === flow.id ? 'text-teal-600' : 'text-slate-400'}`}>
                                    {flow.category.split(' ')[1] || flow.category}
                                </span>
                                <h4 className={`text-sm font-bold truncate ${currentFlowId === flow.id ? 'text-slate-900' : 'text-slate-600'}`}>
                                    {flow.nodes.find(n=>n.type==='trigger')?.title || 'Sin título'}
                                </h4>
                            </div>
                            <ChevronRight size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:translate-x-1 transition-transform ${currentFlowId === flow.id ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                    ))
                )}
            </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50/50">
            <button 
                onClick={handleCreateNewCase}
                className={`w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all ${theme.bg}`}
            >
                <Plus size={20} /> Nuevo Flujo
            </button>
        </div>
      </div>

      {/* COLUMN 2: CANVAS (EDITOR PRINCIPAL) */}
      <div className="flex-1 relative flex flex-col">
        {!activeFlow ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-100">
                <div className="text-center max-w-sm p-12 bg-white rounded-[40px] shadow-2xl border border-white">
                    <div className={`w-20 h-20 rounded-3xl ${theme.light} flex items-center justify-center mx-auto mb-6`}>
                        <MessageSquare className={theme.text} size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Diseña tu estrategia</h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">Selecciona un caso existente o crea uno nuevo para empezar a documentar el flujo de ventas de {activeBranch}.</p>
                    <button 
                        onClick={handleCreateNewCase}
                        className={`inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-bold text-sm ${theme.bg} shadow-lg shadow-teal-100 transition-transform hover:scale-105`}
                    >
                        <Plus size={20} /> Crear Primer Flujo
                    </button>
                </div>
            </div>
        ) : (
            <>
                {/* Cabecera del Editor */}
                <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
                    <div className="flex items-center gap-6">
                        <select 
                            value={activeFlow.category}
                            onChange={e => updateActiveFlow({ category: e.target.value as Category })}
                            className="text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-50 border-none rounded-full px-5 py-2 cursor-pointer focus:ring-0"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="flex items-center gap-2">
                          {isSavingGlobal ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-teal-600 uppercase tracking-widest animate-pulse">
                              <RefreshCw size={12} className="animate-spin" /> Guardando...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <CheckCircle2 size={12} /> Sincronizado
                            </span>
                          )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-1.5 border border-slate-100">
                            <span className="text-[10px] font-black text-slate-300 px-2 uppercase">Clonar a:</span>
                            {BRANCHES.filter(b => b !== activeBranch).map(b => (
                                <button 
                                    key={b}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`¿Copiar este flujo a ${b}?`)) {
                                          onDuplicateFlow(activeFlow, b);
                                        }
                                    }}
                                    className={`text-[9px] font-black px-3 py-1.5 rounded-lg transition-all hover:scale-105 ${BRANCH_THEMES[b].bg} text-white shadow-sm`}
                                >
                                    {b.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                        <div className="h-8 w-px bg-slate-100" />
                        <button 
                            onClick={() => onDeleteFlow(activeFlow.id)} 
                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Eliminar este flujo completo"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>

                {/* Área del Canvas */}
                <div 
                    ref={canvasRef}
                    className="flex-1 relative overflow-auto bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:32px_32px] transition-all"
                    onClick={() => { setSelectedNodeId(null); setConnectingNodeId(null); }}
                >
                    <svg className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none z-0">
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={theme.color} />
                            </marker>
                        </defs>
                        {renderConnections()}
                    </svg>

                    {activeFlow.nodes.map(node => (
                        <div
                            key={node.id}
                            className={`absolute w-[280px] rounded-[24px] shadow-xl border-2 transition-all z-10 group bg-white cursor-grab active:cursor-grabbing
                                ${selectedNodeId === node.id ? 'scale-[1.05] shadow-2xl z-20' : 'hover:scale-[1.02] shadow-slate-200'}
                                ${connectingNodeId === node.id ? 'ring-4 ring-teal-400' : ''}
                                ${draggingNodeId === node.id ? 'opacity-90 shadow-2xl' : ''}
                            `}
                            style={{ 
                                left: node.position.x, 
                                top: node.position.y,
                                borderColor: selectedNodeId === node.id ? theme.color : '#ffffff' 
                            }}
                            onMouseDown={(e) => handleMouseDown(e, node.id)}
                            onClick={(e) => e.stopPropagation()} 
                        >
                            <div className={`px-5 py-3.5 flex justify-between items-center rounded-t-[22px] ${node.type === 'trigger' ? theme.bg : 'bg-slate-50 border-b border-slate-100'}`}>
                                <span className={`font-black text-[10px] uppercase tracking-widest truncate max-w-[160px] ${node.type === 'trigger' ? 'text-white' : 'text-slate-500'}`}>{node.title}</span>
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); setConnectingNodeId(node.id); }} className={`p-1.5 rounded-lg ${node.type === 'trigger' ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 text-slate-500'}`}><ArrowRight size={14} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); addNode('message', node.id, node.position.x + 350, node.position.y); }} className={`p-1.5 rounded-lg ${node.type === 'trigger' ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 text-slate-500'}`}><Plus size={14} /></button>
                                </div>
                            </div>
                            <div className="p-5 text-xs text-slate-600 font-medium line-clamp-4 leading-relaxed min-h-[80px]">
                                {node.content || <span className="italic text-slate-300 font-normal">Haz clic para editar...</span>}
                            </div>
                            {connectingNodeId && connectingNodeId !== node.id && (
                                <div onClick={(e) => { e.stopPropagation(); connectNodes(connectingNodeId, node.id); }} className="absolute inset-0 bg-teal-500/20 cursor-crosshair rounded-[22px] flex items-center justify-center font-black text-xs text-teal-700 backdrop-blur-[2px] border-2 border-teal-500 border-dashed uppercase tracking-widest">Conectar</div>
                            )}
                        </div>
                    ))}
                    
                    {/* Botón Flotante para nuevos nodos */}
                    <div className="fixed bottom-10 right-10 z-30 flex flex-col gap-3">
                        <button 
                            onClick={(e) => { e.stopPropagation(); addNode('trigger', undefined, 200, 200); }}
                            className={`p-5 rounded-full text-white shadow-2xl hover:scale-110 active:scale-90 transition-all ${theme.bg}`}
                            title="Agregar nuevo punto de entrada"
                        >
                            <Plus size={32} />
                        </button>
                    </div>
                </div>
            </>
        )}
      </div>

      {/* COLUMN 3: INSPECTOR DE NODO */}
      {activeFlow && selectedNode && (
          <div className="w-80 bg-white border-l border-slate-200 p-8 flex flex-col shadow-2xl z-30 animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-10">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Configuración</h3>
                  <button onClick={() => setSelectedNodeId(null)} className="text-slate-300 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors"><X size={24} /></button>
              </div>

              <div className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Contexto / Título</label>
                      <input 
                          type="text" 
                          className="w-full rounded-2xl border-slate-200 shadow-sm focus:ring-4 p-4 border text-sm font-bold bg-white text-slate-900 transition-all"
                          style={{ focusRingColor: theme.color + '40', borderColor: theme.color }}
                          value={selectedNode.title}
                          onChange={(e) => updateNode(selectedNode.id, 'title', e.target.value)}
                          placeholder="Ej: Pedir receta"
                      />
                  </div>
                  
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mensaje Real de WhatsApp</label>
                      <textarea 
                          rows={10}
                          className="w-full rounded-2xl border-slate-200 shadow-sm focus:ring-4 p-4 border text-sm bg-white text-slate-900 leading-relaxed font-medium transition-all"
                          style={{ focusRingColor: theme.color + '40', borderColor: theme.color }}
                          value={selectedNode.content}
                          onChange={(e) => updateNode(selectedNode.id, 'content', e.target.value)}
                          placeholder="Hola! Para pasarte presupuesto necesito..."
                      />
                      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400 font-bold bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <AlertCircle size={14} className="text-teal-500" />
                          <span>Usa {'{{nombre}}'} o {'{{sucursal}}'}</span>
                      </div>
                  </div>

                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Categoría de Paso</label>
                      <div className="grid grid-cols-2 gap-3">
                          {[
                              {v: 'trigger', l: '⚡ Inicio', c: theme.color},
                              {v: 'message', l: '💬 Mensaje', c: '#64748b'},
                              {v: 'action', l: '⚙️ Acción', c: '#2563eb'},
                              {v: 'condition', l: '❓ Decisión', c: '#d97706'}
                          ].map(t => (
                              <button 
                                key={t.v}
                                onClick={() => updateNode(selectedNode.id, 'type', t.v)}
                                className={`py-4 px-1 text-[10px] font-black rounded-2xl border-2 transition-all flex flex-col items-center gap-2
                                    ${selectedNode.type === t.v ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200 hover:bg-slate-50'}
                                `}
                              >
                                {t.l}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="pt-8 border-t border-slate-100 mt-6">
                  <button 
                    onClick={() => deleteNode(selectedNode.id)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all text-[11px] font-black uppercase tracking-widest active:scale-95"
                  >
                      <Trash2 size={18} /> Eliminar Paso
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default VisualBuilder;