import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { FlowData, FlowNode, NodeType, Branch, Category } from '../types';
import { Save, Plus, X, ArrowRight, Trash2, FileText, ChevronRight, MessageSquare, AlertCircle, Copy, Download, RefreshCw, CheckCircle2, Move } from 'lucide-react';
import { BRANCHES, CATEGORIES, BRANCH_THEMES, INITIAL_FLOW_STATE } from '../constants';

interface VisualBuilderProps {
  allFlows: FlowData[];
  initialBranch: Branch;
  initialFlowId: string | null;
  isSavingGlobal: boolean;
  onSave: (data: FlowData) => void;
  onDeleteFlow: (id: string) => void;
  onDuplicateFlow: (flow: FlowData, branch?: Branch) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

const VisualBuilder: React.FC<VisualBuilderProps> = ({ 
  allFlows, 
  initialBranch, 
  initialFlowId, 
  isSavingGlobal,
  onSave, 
  onDeleteFlow,
  onDuplicateFlow,
  onCancel,
  isDarkMode
}) => {
  const [activeBranch, setActiveBranch] = useState<Branch>(initialBranch);
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(initialFlowId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  
  // Panning State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  const branchFlows = useMemo(() => 
    allFlows.filter(f => f.branch === activeBranch), 
    [allFlows, activeBranch]
  );

  const activeFlow = useMemo(() => 
    allFlows.find(f => f.id === currentFlowId), 
    [allFlows, currentFlowId]
  );

  const theme = BRANCH_THEMES[activeBranch] || BRANCH_THEMES['Giorlent Norte'];

  const updateActiveFlow = useCallback((updates: Partial<FlowData>) => {
    if (!activeFlow) return;
    onSave({ ...activeFlow, ...updates });
  }, [activeFlow, onSave]);

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

  const addNode = (type: NodeType, parentId?: string, x?: number, y?: number) => {
    if (!activeFlow) return;
    const id = crypto.randomUUID();
    const newNode: FlowNode = {
      id,
      type,
      title: type === 'trigger' ? 'Inicio' : type === 'condition' ? 'Decisión' : 'Paso',
      content: '',
      position: { x: (x || 100) - pan.x, y: (y || 100) - pan.y },
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

  const deleteNode = useCallback((id: string) => {
    if (!activeFlow || !id || !window.confirm("¿Eliminar este paso del diagrama?")) return;
    
    const updatedNodes = activeFlow.nodes
      .filter(n => n.id !== id)
      .map(n => ({ ...n, next: (n.next || []).filter(nextId => nextId !== id) }));
    
    updateActiveFlow({ nodes: updatedNodes });
    if (selectedNodeId === id) setSelectedNodeId(null);
  }, [activeFlow, updateActiveFlow, selectedNodeId]);

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

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).id === 'infinite-canvas') {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      setSelectedNodeId(null);
      setConnectingNodeId(null);
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
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
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    if (draggingNodeId && activeFlow) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      const updatedNodes = activeFlow.nodes.map(n => 
        n.id === draggingNodeId ? { ...n, position: { x: newX, y: newY } } : n
      );
      updateActiveFlow({ nodes: updatedNodes });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const renderConnections = () => {
    if (!activeFlow) return null;
    return activeFlow.nodes.map(node => 
      (node.next || []).map(nextId => {
        const target = activeFlow.nodes.find(n => n.id === nextId);
        if (!target) return null;
        const startX = node.position.x + 280;
        const startY = node.position.y + 40;
        const endX = target.position.x;
        const endY = target.position.y + 40;
        const path = `M ${startX} ${startY} C ${startX + 60} ${startY}, ${endX - 60} ${endY}, ${endX} ${endY}`;
        return (
          <g key={`${node.id}-${target.id}`}>
            <path d={path} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} strokeWidth="6" fill="none" className="opacity-40" />
            <path d={path} stroke={selectedNodeId === node.id ? theme.color : (isDarkMode ? "#475569" : "#cbd5e1")} strokeWidth="2.5" fill="none" markerEnd="url(#arrowhead)" />
          </g>
        );
      })
    );
  };

  const selectedNode = activeFlow?.nodes.find(n => n.id === selectedNodeId);

  return (
    <div className={`flex h-[calc(100vh-64px)] overflow-hidden select-none transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      
      {/* Sidebar de Sucursales */}
      <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-20 shadow-2xl transition-colors">
        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 block">Sucursal Activa</label>
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className={`w-4 h-4 rounded-full ${theme.bg} ring-4 ring-offset-2 ring-slate-100 dark:ring-slate-800`} />
                <select 
                    value={activeBranch} 
                    onChange={e => {
                        setActiveBranch(e.target.value as Branch);
                        setCurrentFlowId(null);
                        setSelectedNodeId(null);
                        setPan({ x: 0, y: 0 });
                    }}
                    className="flex-1 font-bold text-slate-800 dark:text-slate-200 bg-transparent border-none focus:ring-0 p-0 cursor-pointer text-sm"
                >
                    {BRANCHES.map(b => <option key={b} value={b} className="dark:bg-slate-900">{b}</option>)}
                </select>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="px-5 py-4 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-50 dark:border-slate-800/50">
                <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mis Casos</h3>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">{branchFlows.length}</span>
            </div>
            
            <div className="px-3 py-2 space-y-2">
                {branchFlows.length === 0 ? (
                    <div className="py-12 px-6 text-center">
                        <FileText size={24} className="mx-auto text-slate-200 dark:text-slate-800 mb-3" />
                        <p className="text-xs text-slate-400 dark:text-slate-600 font-medium leading-relaxed">No hay flujos para esta sucursal.</p>
                    </div>
                ) : (
                    branchFlows.map(flow => (
                        <div 
                            key={flow.id}
                            onClick={() => { setCurrentFlowId(flow.id); setSelectedNodeId(null); }}
                            className={`group relative p-4 rounded-2xl cursor-pointer transition-all border-2
                                ${currentFlowId === flow.id 
                                  ? `bg-white dark:bg-slate-800 border-slate-900 dark:border-teal-500 shadow-lg` 
                                  : 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-100 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                            `}
                        >
                            <div className="flex-1 min-w-0">
                                <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${currentFlowId === flow.id ? 'text-teal-600' : 'text-slate-400 dark:text-slate-500'}`}>
                                    {flow.category.split(' ')[1] || flow.category}
                                </span>
                                <h4 className={`text-sm font-bold truncate ${currentFlowId === flow.id ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {flow.nodes.find(n=>n.type==='trigger')?.title || 'Sin título'}
                                </h4>
                            </div>
                            <ChevronRight size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700 group-hover:translate-x-1 transition-transform ${currentFlowId === flow.id ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                    ))
                )}
            </div>
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <button 
                onClick={handleCreateNewCase}
                className={`w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all ${theme.bg}`}
            >
                <Plus size={20} /> Nuevo Flujo
            </button>
        </div>
      </div>

      {/* Canvas del Editor */}
      <div className="flex-1 relative flex flex-col h-full cursor-crosshair overflow-hidden" 
           ref={canvasRef} 
           onMouseDown={handleCanvasMouseDown}
           id="infinite-canvas"
      >
        {!activeFlow ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-950 pointer-events-none transition-colors">
                <div className="text-center max-w-sm p-12 bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 pointer-events-auto">
                    <div className={`w-20 h-20 rounded-3xl ${theme.light} dark:bg-slate-800 flex items-center justify-center mx-auto mb-6`}>
                        <MessageSquare className={theme.text} size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">Vistalli Studio</h2>
                    <p className="text-slate-400 dark:text-slate-500 text-sm leading-relaxed mb-8">Diseña una nueva estrategia de ventas seleccionando un flujo existente o creando uno nuevo.</p>
                    <button onClick={handleCreateNewCase} className={`inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-bold text-sm ${theme.bg} shadow-lg transition-transform hover:scale-105`}>
                        <Plus size={20} /> Crear Flujo
                    </button>
                </div>
            </div>
        ) : (
            <>
                <div className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-30 absolute top-0 left-0 right-0 transition-colors">
                    <div className="flex items-center gap-6">
                        <select 
                            value={activeFlow.category}
                            onChange={e => updateActiveFlow({ category: e.target.value as Category })}
                            className="text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 border-none rounded-full px-5 py-2 cursor-pointer focus:ring-0 dark:text-slate-400"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c} className="dark:bg-slate-900">{c}</option>)}
                        </select>
                        <div className="flex items-center gap-2">
                          {isSavingGlobal ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-teal-600 uppercase tracking-widest animate-pulse">
                              <RefreshCw size={12} className="animate-spin" /> Guardando...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                              <CheckCircle2 size={12} /> Sincronizado
                            </span>
                          )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-2xl p-1.5 border border-slate-100 dark:border-slate-700">
                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-500 px-2 uppercase">Clonar a:</span>
                            {BRANCHES.filter(b => b !== activeBranch).map(b => (
                                <button 
                                    key={b}
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        onDuplicateFlow(activeFlow, b);
                                    }}
                                    className={`text-[9px] font-black px-3 py-1.5 rounded-lg transition-all hover:scale-105 ${BRANCH_THEMES[b].bg} text-white shadow-sm`}
                                >
                                    {b.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteFlow(activeFlow.id); }} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all">
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>

                <div 
                  className={`w-full h-full relative transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}
                  style={{ 
                    backgroundImage: `radial-gradient(${isDarkMode ? '#1e293b' : '#e2e8f0'} 1.5px, transparent 1.5px)`,
                    backgroundSize: '40px 40px',
                    backgroundPosition: `${pan.x}px ${pan.y}px`
                  }}
                >
                  <div 
                    className="absolute inset-0 transition-transform duration-75 ease-out"
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
                  >
                    <svg className="absolute top-0 left-0 w-[10000px] h-[10000px] pointer-events-none z-0 overflow-visible">
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
                            className={`absolute w-[280px] rounded-[24px] shadow-2xl border-2 transition-all z-10 group bg-white dark:bg-slate-900 cursor-grab active:cursor-grabbing
                                ${selectedNodeId === node.id ? 'scale-[1.05] z-20' : 'hover:scale-[1.02] shadow-slate-200/50 dark:shadow-none'}
                                ${connectingNodeId === node.id ? 'ring-4 ring-teal-400' : ''}
                                ${draggingNodeId === node.id ? 'opacity-90 scale-[1.05]' : ''}
                            `}
                            style={{ 
                                left: node.position.x, 
                                top: node.position.y,
                                borderColor: selectedNodeId === node.id ? theme.color : (isDarkMode ? '#1e293b' : '#f1f5f9') 
                            }}
                            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                            onClick={(e) => e.stopPropagation()} 
                        >
                            <div className={`px-5 py-3.5 flex justify-between items-center rounded-t-[22px] ${node.type === 'trigger' ? theme.bg : 'bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700'}`}>
                                <span className={`font-black text-[10px] uppercase tracking-widest truncate max-w-[160px] ${node.type === 'trigger' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{node.title}</span>
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); setConnectingNodeId(node.id); }} className={`p-1.5 rounded-lg ${node.type === 'trigger' ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500'}`}><ArrowRight size={14} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); addNode('message', node.id, node.position.x + 350, node.position.y); }} className={`p-1.5 rounded-lg ${node.type === 'trigger' ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500'}`}><Plus size={14} /></button>
                                </div>
                            </div>
                            <div className="p-5 text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-4 leading-relaxed min-h-[80px]">
                                {node.content || <span className="italic text-slate-300 dark:text-slate-700 font-normal">Sin mensaje definido...</span>}
                            </div>
                            {connectingNodeId && connectingNodeId !== node.id && (
                                <div onClick={(e) => { e.stopPropagation(); connectNodes(connectingNodeId, node.id); }} className="absolute inset-0 bg-teal-500/10 cursor-crosshair rounded-[22px] flex items-center justify-center font-black text-xs text-teal-700 backdrop-blur-[2px] border-2 border-teal-500 border-dashed uppercase tracking-widest">Soltar para Conectar</div>
                            )}
                        </div>
                    ))}
                  </div>

                  <div className="fixed bottom-10 right-10 z-30 flex flex-col gap-3">
                      <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl mb-2">
                        <span className="text-[10px] font-bold text-slate-400 px-2 uppercase flex items-center gap-1"><Move size={12} /> {Math.round(pan.x)}, {Math.round(pan.y)}</span>
                        <button onClick={() => setPan({x:0, y:0})} className="p-2 text-slate-400 hover:text-teal-600 transition-colors" title="Centrar"><RefreshCw size={16} /></button>
                      </div>
                      <button 
                          onClick={(e) => { e.stopPropagation(); addNode('trigger', undefined, window.innerWidth/2 - pan.x - 140, window.innerHeight/2 - pan.y - 40); }}
                          className={`p-5 rounded-full text-white shadow-2xl hover:scale-110 active:scale-90 transition-all ${theme.bg}`}
                          title="Nuevo Punto"
                      >
                          <Plus size={32} />
                      </button>
                  </div>
                </div>
            </>
        )}
      </div>

      {/* Inspector de Nodos */}
      {activeFlow && selectedNode && (
          <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-8 flex flex-col shadow-2xl z-40 animate-in slide-in-from-right duration-300 transition-colors">
              <div className="flex justify-between items-center mb-10">
                  <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Configuración</h3>
                  <button onClick={() => setSelectedNodeId(null)} className="text-slate-300 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><X size={24} /></button>
              </div>

              <div className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Contexto (Título)</label>
                      <input 
                          type="text" 
                          className="w-full rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm focus:ring-4 p-4 border text-sm font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all"
                          style={{ focusRingColor: theme.color + '40', borderColor: theme.color }}
                          value={selectedNode.title}
                          onChange={(e) => updateNode(selectedNode.id, 'title', e.target.value)}
                          placeholder="Ej: Pedir receta"
                      />
                  </div>
                  
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Mensaje WhatsApp</label>
                      <textarea 
                          rows={8}
                          className="w-full rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm focus:ring-4 p-4 border text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 leading-relaxed font-medium transition-all"
                          style={{ focusRingColor: theme.color + '40', borderColor: theme.color }}
                          value={selectedNode.content}
                          onChange={(e) => updateNode(selectedNode.id, 'content', e.target.value)}
                          placeholder="Escribe el mensaje real..."
                      />
                  </div>

                  <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Tipo de Paso</label>
                      <div className="grid grid-cols-2 gap-3">
                          {[
                              {v: 'trigger', l: '⚡ Inicio', c: theme.color},
                              {v: 'message', l: '💬 Mensaje', c: '#64748b'},
                              {v: 'action', l: '⚙️ Acción', c: '#2563eb'},
                              {v: 'condition', l: '❓ Decisión', c: '#d97706'}
                          ].map(t => (
                              <button 
                                key={t.v}
                                onClick={() => updateNode(selectedNode.id, 'type', t.v as NodeType)}
                                className={`py-4 px-1 text-[10px] font-black rounded-2xl border-2 transition-all flex flex-col items-center gap-2
                                    ${selectedNode.type === t.v ? 'bg-slate-900 dark:bg-teal-600 text-white border-slate-900 dark:border-teal-600 shadow-lg' : 'bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-500 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}
                                `}
                              >
                                {t.l}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="pt-8 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNode(selectedNode.id); }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-2xl hover:bg-red-100 dark:hover:bg-red-950/40 transition-all text-[11px] font-black uppercase tracking-widest active:scale-95"
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