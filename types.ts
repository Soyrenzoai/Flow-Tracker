export type Branch = 
  | 'Giorlent Norte' 
  | 'Giorlent Sur' 
  | 'Giorlent Web' 
  | 'Vistalent' 
  | 'Óptica Plus';

export type Category = 
  | '💰 Precios y Presupuestos'
  | '📸 Consultas con Foto'
  | '📝 Recetas y Graduaciones'
  | '👨‍⚕️ Salud Visual / Obras Sociales'
  | '🕒 Horarios y Atención'
  | '📍 Ubicación y Envíos'
  | '👓 Productos y Características'
  | '🔄 Seguimiento de Pedidos'
  | '📌 Mensajes Genéricos'
  | string;

export type NodeType = 'trigger' | 'action' | 'message' | 'condition';

export interface FlowNode {
  id: string;
  type: NodeType;
  title: string; // Contexto o Título del paso (Ej: "Pedir Receta")
  content: string; // El mensaje real o descripción de la acción
  position: { x: number; y: number };
  next: string[]; // IDs of connected nodes
}

export type StepType = 'question' | 'action' | 'message';

export interface Step {
  id: string;
  type: StepType;
  text: string;
  condition?: string;
}

export interface SubCase {
  id: string;
  name: string;
  steps: Step[];
}

export interface DataRecorded {
  name: boolean;
  phone: boolean;
  branch: boolean;
  usage: boolean;
  hasRecipe: boolean;
  hasFrame: boolean;
  productOffered: boolean;
  budgetRange: boolean;
  observations: boolean;
  other: string;
}

export interface Derivation {
  condition: string;
  toWhom: string;
  examples: string;
}

export interface FlowData {
  id: string;
  branch: Branch;
  category: Category;
  author: string;
  date: string;
  createdAt: number;
  
  // Graph Data
  nodes: FlowNode[];
  
  // Metadata maintained for consistency
  objective?: string;

  // Form Data (Legacy or Alternative View)
  triggerPhrases: string[];
  initialResponse: string;
  steps: Step[];
  informationFiltered: string;
  dataRecorded: DataRecorded;
  derivation: Derivation;
  subCases: SubCase[];
}