import React, { useState, useRef, useEffect } from 'react';
import { FlowData, FlowNode, NodeType, Branch } from '../types';
import { Save, Plus, X, ArrowRight, Move, MousePointer2, Trash2, GitBranch, MessageSquare, Settings, MapPin } from 'lucide-react';
import { BRANCHES, CATEGORIES, BRANCH_THEMES } from '../constants';

interface VisualBuilderProps {
  initialData: FlowData;
  onSave: (data: FlowData) => void;
  onCancel: () => void;
}

const VisualBuilder: React.FC<VisualBuilderProps> = ({ initialData, onSave, onCancel }) => {
  const [data, setData] = useState<FlowData>(initialData);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Get current theme based on selected branch
  const theme = BRANCH_THEMES[data.branch] || BRANCH_THEMES['Giorlent Norte'];

  // --- Node Operations ---

  const addNode = (type: NodeType, parentId?: string, x?: number, y?: number) => {
    const id = crypto.randomUUID();
    const newNode: FlowNode = {
      id,
      type,
      title: type === 'trigger' ? 'Nuevo Caso de Entrada' : 'Nuevo Paso',
      content: '',
      position: { x: x || 100, y: y || 100 },
      next: []
    };

    setData(prev => {
      const newNodes = [...prev.nodes, newNode];
      // Auto connect if parent exists
      if (parentId) {
        const parentIndex = newNodes.findIndex(n => n.id === parentId);
        if (parentIndex >= 0) {
          newNodes[parentIndex] = {
            ...newNodes[parentIndex],
            next: [...newNodes[parentIndex].next, id]
          };
        }
      }
      return { ...prev, nodes: newNodes };
    });
    setSelectedNodeId(id);
  };

  const updateNode = (id: string, field: keyof FlowNode, value: any) => {
    setData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === id ? { ...n, [field]: value } : n)
    }));
  };

  const deleteNode = (id: string) => {
    if(!window.confirm("¿Eliminar este paso y sus conexiones?")) return;
    setData(prev => ({
      ...prev,
      nodes: prev.nodes
        .filter(n => n.id !== id) // Remove node
        .map(n => ({ ...n, next: n.next.filter(nextId => nextId !== id) })) // Remove connections to it
    }));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const connectNodes = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setData(prev => {
       const source = prev.nodes.find(n => n.id === sourceId);
       if (source && !source.next.includes(targetId)) {
           return {
               ...prev,
               nodes: prev.nodes.map(n => n.id === sourceId ? { ...n, next: [...n.next, targetId] } : n)
           };
       }
       return prev;
    });
    setConnectingNodeId(null);
  };

  // --- Drag & Drop Logic ---

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (connectingNodeId) return; // Don't drag if connecting
    e.stopPropagation();
    const node = data.nodes.find(n => n.id === id);
    if (node) {
      setDraggingNode(id);
      // Calculate offset inside the node to prevent jumping
      setDragOffset({
        x: e.clientX - node.position.x,
        y: e.clientY - node.position.y
      });
    }
    setSelectedNodeId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      updateNode(draggingNode, 'position', { x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  // --- Rendering Helpers ---

  const renderConnections = () => {
    return data.nodes.map(node => {
        return node.next.map(nextId => {
            const target = data.nodes.find(n => n.id === nextId);
            if (!target) return null;

            // Simple Bezier Curve
            const startX = node.position.x + 280; // Right side of card
            const startY = node.position.y + 50;  // Middle of card
            const endX = target.position.x;
            const endY = target.position.y + 50;

            const controlPoint1X = startX + 50;
            const controlPoint1Y = startY;
            const controlPoint2X = endX - 50;
            const controlPoint2Y = endY;

            const path = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;

            return (
                <g key={`${node.id}-${target.id}`}>
                    <path d={path} stroke="#cbd5e1" strokeWidth="3" fill="none" />
                    <path d={path} stroke={selectedNodeId === node.id ? theme.color : "#94a3b8"} strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" />
                </g>
            );
        });
    });
  };

  const selectedNode = data.nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex h-[calc(100vh-100px)] bg-slate-50 overflow-hidden border border-slate-200 rounded-lg shadow-sm" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      
      {/* LEFT SIDEBAR: Config & Triggers */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col z-10 shadow-sm">
         
         {/* Branch Selector Header */}
         <div className="p-4 border-b border-slate-100 bg-slate-50">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                <MapPin size={12} /> Sucursal Activa
            </label>
            <select 
                value={data.branch} 
                onChange={e => setData({...data, branch: e.target.value as Branch})}
                className="w-full rounded-md border-slate-300 shadow-sm focus:ring-2 p-2 border text-sm font-medium bg-white text-slate-900"
                style={{ borderColor: theme.color, outlineColor: theme.color }}
            >
                {BRANCHES.map(b => (
                    <option key={b} value={b}>{b}</option>
                ))}
            </select>
            {/* Theme Indicator */}
            <div className={`mt-2 h-1 w-full rounded-full ${theme.bg}`}></div>
         </div>

         {/* Triggers List */}
         <div className="flex-1 overflow-y-auto p-4 flex flex-col">
             <h3 className="font-bold text-slate-700 mb-2 text-sm">Casos de Entrada</h3>
             <div className="space-y-2 mb-4">
                {data.nodes.filter(n => n.type === 'trigger').map(node => (
                     <div 
                        key={node.id} 
                        onClick={() => setSelectedNodeId(node.id)} 
                        className={`p-3 rounded-lg border-l-4 text-sm cursor-pointer shadow-sm transition-all
                            ${selectedNodeId === node.id ? 'bg-white shadow-md' : 'bg-white hover:bg-slate-50'}
                        `}
                        style={{ borderLeftColor: theme.color }}
                     >
                        <div className="font-bold text-slate-700 truncate">{node.title}</div>
                        <div className="text-slate-400 truncate text-xs">{node.content || "Sin descripción"}</div>
                     </div>
                ))}
             </div>
             
             <button 
                onClick={() => addNode('trigger', undefined, 50, 50 + (data.nodes.filter(n=>n.type ==='trigger').length * 120))}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-slate-700 hover:border-slate-400 transition-all text-sm font-medium mt-auto"
            >
                <Plus size={16} /> Agregar Caso
            </button>
         </div>
         
         {/* Metadata Form Mini */}
         <div className="p-4 border-t border-slate-200 bg-slate-50">
             <label className="text-xs font-bold text-slate-500 uppercase">Autor</label>
             <input 
                className="w-full mt-1 mb-2 text-sm p-1 border rounded bg-white text-slate-900" 
                placeholder="Nombre del vendedor" 
                value={data.author} 
                onChange={e => setData({...data, author: e.target.value})} 
             />
             <div className="flex gap-2">
                <button onClick={onCancel} className="flex-1 py-1 px-2 border border-slate-300 rounded text-xs text-slate-600 hover:bg-slate-100">Salir</button>
                <button 
                    onClick={() => onSave(data)} 
                    className="flex-1 py-1 px-2 text-white rounded text-xs flex items-center justify-center gap-1 hover:opacity-90"
                    style={{ backgroundColor: theme.color }}
                >
                    <Save size={12} /> Guardar
                </button>
             </div>
         </div>
      </div>

      {/* MAIN CANVAS */}
      <div 
        ref={canvasRef}
        className="flex-1 relative overflow-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]"
        onClick={() => {
            setSelectedNodeId(null);
            setConnectingNodeId(null);
        }}
      >
         {/* Connections Layer */}
         <svg className="absolute top-0 left-0 w-[4000px] h-[4000px] pointer-events-none z-0">
             <defs>
                 <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                     <polygon points="0 0, 10 3.5, 0 7" fill={theme.color} />
                 </marker>
             </defs>
             {renderConnections()}
             {connectingNodeId && (
                 /* Temporary line while connecting */
                 (() => {
                    const source = data.nodes.find(n => n.id === connectingNodeId);
                    if (!source) return null;
                    return (
                        <line 
                           x1={source.position.x + 280} 
                           y1={source.position.y + 50} 
                           x2={dragOffset.x || source.position.x + 280}
                           y2={dragOffset.y || source.position.y + 50} 
                           stroke={theme.color} 
                           strokeWidth="2" 
                           strokeDasharray="5,5" 
                        />
                    )
                 })()
             )}
         </svg>

         {/* Nodes Layer */}
         {data.nodes.map(node => (
             <div
                key={node.id}
                className={`absolute w-[280px] rounded-lg shadow-sm border-2 transition-shadow z-10 group bg-white
                    ${selectedNodeId === node.id ? 'shadow-lg' : 'hover:shadow-md'}
                    ${connectingNodeId === node.id ? 'ring-2 ring-yellow-400' : ''}
                `}
                style={{ 
                    left: node.position.x, 
                    top: node.position.y,
                    borderColor: selectedNodeId === node.id ? theme.color : '#e2e8f0' 
                }}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onClick={(e) => e.stopPropagation()} 
             >
                 {/* Header */}
                 <div 
                    className={`px-3 py-2 border-b flex justify-between items-center rounded-t-md`}
                    style={{ 
                        backgroundColor: node.type === 'trigger' ? theme.color : '#f8fafc',
                        color: node.type === 'trigger' ? 'white' : '#334155'
                    }}
                 >
                     <span className="font-bold text-sm truncate max-w-[180px]" title={node.title}>{node.title}</span>
                     
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         {connectingNodeId === null && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setConnectingNodeId(node.id); }}
                                className={`p-1 rounded ${node.type === 'trigger' ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 text-slate-500'}`}
                                title="Conectar a otro"
                            >
                                <ArrowRight size={14} />
                            </button>
                         )}
                         {/* Quick Add Child */}
                         <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                addNode('message', node.id, node.position.x + 350, node.position.y); 
                            }} 
                            className={`p-1 rounded ${node.type === 'trigger' ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 text-slate-500'}`}
                            title="Agregar paso siguiente"
                         >
                             <Plus size={14} />
                         </button>
                     </div>
                 </div>
                 
                 {/* Content Preview */}
                 <div className="p-3 text-xs text-slate-600 max-h-[80px] overflow-hidden leading-relaxed">
                     {node.content || <span className="italic text-slate-400">Sin descripción...</span>}
                 </div>

                 {/* Connection Target Area (Transparent overlay to easier dropping) */}
                 {connectingNodeId && connectingNodeId !== node.id && (
                     <div 
                        className="absolute inset-0 bg-yellow-100/30 cursor-crosshair rounded-lg flex items-center justify-center font-bold text-yellow-700"
                        onClick={(e) => {
                            e.stopPropagation();
                            connectNodes(connectingNodeId, node.id);
                        }}
                     >
                         Conectar aquí
                     </div>
                 )}
             </div>
         ))}
      </div>

      {/* RIGHT SIDEBAR: Inspector / Editor */}
      {selectedNode && (
          <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col shadow-xl z-20">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Editar Nodo</h3>
                  <button onClick={() => setSelectedNodeId(null)} className="text-slate-400 hover:text-slate-600">
                      <X size={20} />
                  </button>
              </div>

              <div className="space-y-4 flex-1">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contexto / Título</label>
                      <input 
                          type="text" 
                          className="w-full rounded-md border-slate-300 shadow-sm focus:ring-2 p-2 border text-sm bg-white text-slate-900"
                          style={{ focusRingColor: theme.color }}
                          value={selectedNode.title}
                          onChange={(e) => updateNode(selectedNode.id, 'title', e.target.value)}
                          placeholder="Ej: Saludo Inicial"
                      />
                  </div>
                  
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mensaje / Acción</label>
                      <textarea 
                          rows={8}
                          className="w-full rounded-md border-slate-300 shadow-sm focus:ring-2 p-2 border text-sm bg-white text-slate-900"
                          style={{ focusRingColor: theme.color }}
                          value={selectedNode.content}
                          onChange={(e) => updateNode(selectedNode.id, 'content', e.target.value)}
                          placeholder="Escribe aquí qué se le responde al cliente o qué acción interna se realiza..."
                      />
                      <div className="text-xs text-gray-400 mt-1">
                          Puedes usar variables como {'{{nombre}}'}, {'{{dni}}'}.
                      </div>
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Nodo</label>
                      <select
                        className="w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm bg-white text-slate-900"
                        value={selectedNode.type}
                        onChange={(e) => updateNode(selectedNode.id, 'type', e.target.value)}
                      >
                          <option value="trigger">⚡ Caso de Entrada</option>
                          <option value="message">💬 Mensaje</option>
                          <option value="action">⚙️ Acción Interna</option>
                          <option value="condition">❓ Condición / Pregunta</option>
                      </select>
                  </div>

                  <div className="pt-6 border-t mt-4">
                      <button 
                        onClick={() => deleteNode(selectedNode.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                      >
                          <Trash2 size={16} /> Eliminar Nodo
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default VisualBuilder;