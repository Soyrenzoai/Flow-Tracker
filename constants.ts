import { Branch, Category } from './types';

export const BRANCHES: Branch[] = [
  'Giorlent Norte',
  'Giorlent Sur',
  'Giorlent Web',
  'Vistalent',
  'Óptica Plus'
];

export const BRANCH_THEMES: Record<Branch, { color: string; bg: string; border: string; text: string; light: string }> = {
  'Giorlent Norte': { 
    color: '#2563EB', // Blue
    bg: 'bg-blue-600',
    border: 'border-blue-200',
    text: 'text-blue-700',
    light: 'bg-blue-50'
  },
  'Giorlent Sur': { 
    color: '#16A34A', // Green
    bg: 'bg-green-600',
    border: 'border-green-200',
    text: 'text-green-700',
    light: 'bg-green-50'
  },
  'Giorlent Web': { 
    color: '#9333EA', // Purple
    bg: 'bg-purple-600',
    border: 'border-purple-200',
    text: 'text-purple-700',
    light: 'bg-purple-50'
  },
  'Vistalent': { 
    color: '#F59E0B', // Amber
    bg: 'bg-amber-500', // Amber 500 is better for text contrast than 400
    border: 'border-amber-200',
    text: 'text-amber-700',
    light: 'bg-amber-50'
  },
  'Óptica Plus': { 
    color: '#EF4444', // Red
    bg: 'bg-red-600',
    border: 'border-red-200',
    text: 'text-red-700',
    light: 'bg-red-50'
  }
};

export const CATEGORIES: Category[] = [
  '💰 Precios y Presupuestos',
  '📸 Consultas con Foto',
  '📝 Recetas y Graduaciones',
  '👨‍⚕️ Salud Visual / Obras Sociales',
  '🕒 Horarios y Atención',
  '📍 Ubicación y Envíos',
  '👓 Productos y Características',
  '🔄 Seguimiento de Pedidos',
  '📌 Mensajes Genéricos'
];

export const INITIAL_FLOW_STATE: any = {
  branch: 'Giorlent Norte',
  category: '💰 Precios y Presupuestos',
  author: '',
  date: '',
  createdAt: 0,
  nodes: [],
  objective: '',
  triggerPhrases: [],
  initialResponse: '',
  steps: [],
  informationFiltered: '',
  dataRecorded: {
    name: false,
    phone: false,
    branch: false,
    usage: false,
    hasRecipe: false,
    hasFrame: false,
    productOffered: false,
    budgetRange: false,
    observations: false,
    other: ''
  },
  derivation: {
    condition: '',
    toWhom: '',
    examples: ''
  },
  subCases: []
};

export const CATEGORY_EXAMPLES: Record<string, string[]> = {
   '💰 Precios y Presupuestos': ["Hola, precio?", "¿Presupuesto?"],
};