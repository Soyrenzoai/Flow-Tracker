import React, { useState } from 'react';
import { FlowData, Branch, Category, Step, SubCase } from '../types';
import { BRANCHES, CATEGORIES, CATEGORY_EXAMPLES } from '../constants';
import StepBuilder from '../components/StepBuilder';
import { Save, X, Plus, Trash2, MessageSquare, List, Target, Filter, FileText, Share2, AlertCircle, HelpCircle, MessageCircle } from 'lucide-react';

interface FlowFormProps {
  initialData: FlowData;
  onSave: (data: FlowData) => void;
  onCancel: () => void;
}

// Extracted Component to prevent re-renders losing focus
const FormSection = ({ id, title, icon: Icon, isOpen, onToggle, children }: any) => (
  <div className={`bg-white rounded-lg shadow-sm border ${isOpen ? 'border-teal-500 ring-1 ring-teal-500' : 'border-gray-200'} overflow-hidden mb-6 transition-all duration-200`}>
    <div 
      className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md ${isOpen ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-500'}`}>
          <Icon size={20} />
        </div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <span className="text-gray-400 text-2xl">{isOpen ? '−' : '+'}</span>
    </div>
    {isOpen && (
      <div className="p-6">
        {children}
      </div>
    )}
  </div>
);

const FlowForm: React.FC<FlowFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<FlowData>(initialData);
  const [errors, setErrors] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string>('general');

  // Helper to update simple fields
  const handleChange = (field: keyof FlowData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper for deep updates
  const handleDataRecordChange = (field: keyof FlowData['dataRecorded'], value: any) => {
    setFormData(prev => ({
      ...prev,
      dataRecorded: { ...prev.dataRecorded, [field]: value }
    }));
  };

  const handleDerivationChange = (field: keyof FlowData['derivation'], value: string) => {
    setFormData(prev => ({
      ...prev,
      derivation: { ...prev.derivation, [field]: value }
    }));
  };

  const addTriggerPhrase = () => {
    setFormData(prev => ({ ...prev, triggerPhrases: [...prev.triggerPhrases, ''] }));
  };

  const updateTriggerPhrase = (index: number, val: string) => {
    const newPhrases = [...formData.triggerPhrases];
    newPhrases[index] = val;
    setFormData(prev => ({ ...prev, triggerPhrases: newPhrases }));
  };

  const removeTriggerPhrase = (index: number) => {
    setFormData(prev => ({ ...prev, triggerPhrases: prev.triggerPhrases.filter((_, i) => i !== index) }));
  };

  const addSubCase = () => {
    const newSub: SubCase = { id: crypto.randomUUID(), name: '', steps: [] };
    setFormData(prev => ({ ...prev, subCases: [...(prev.subCases || []), newSub] }));
  };

  const updateSubCaseName = (id: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      subCases: prev.subCases.map(s => s.id === id ? { ...s, name } : s)
    }));
  };

  const updateSubCaseSteps = (id: string, steps: Step[]) => {
    setFormData(prev => ({
      ...prev,
      subCases: prev.subCases.map(s => s.id === id ? { ...s, steps } : s)
    }));
  };
  
  const removeSubCase = (id: string) => {
    setFormData(prev => ({ ...prev, subCases: prev.subCases.filter(s => s.id !== id) }));
  };

  const validateAndSave = () => {
    const errs = [];
    if (!formData.branch) errs.push('Debes seleccionar una sucursal.');
    if (!formData.category) errs.push('Debes seleccionar una categoría.');
    if (!formData.author) errs.push('Debes ingresar tu nombre.');
    if (!formData.initialResponse) errs.push('La respuesta inicial es obligatoria.');
    
    if (errs.length > 0) {
        setErrors(errs);
        window.scrollTo(0,0);
        return;
    }

    onSave(formData);
  };

  const toggleSection = (id: string) => {
      setActiveSection(activeSection === id ? '' : id);
  }

  const categoryExamples = formData.category ? CATEGORY_EXAMPLES[formData.category] : [];

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
            {initialData.id ? 'Editar Flujo' : 'Nuevo Flujo de Conversación'}
        </h2>
        <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 bg-white">Cancelar</button>
            <button onClick={validateAndSave} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex items-center gap-2">
                <Save size={18} /> Guardar Flujo
            </button>
        </div>
      </div>

      {errors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex gap-2 text-red-700 font-bold mb-2">
                  <AlertCircle size={20} /> Por favor corrige los siguientes errores:
              </div>
              <ul className="list-disc pl-8 text-red-600">
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
          </div>
      )}

      {/* 1. Datos Generales */}
      <FormSection 
        id="general" 
        title="1. Datos Generales" 
        icon={FileText} 
        isOpen={activeSection === 'general'} 
        onToggle={() => toggleSection('general')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
            <select 
              value={formData.branch || ''} 
              onChange={e => handleChange('branch', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border bg-white text-gray-900"
            >
              <option value="">Seleccionar...</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select 
              value={formData.category || ''} 
              onChange={e => handleChange('category', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border bg-white text-gray-900"
            >
              <option value="">Seleccionar...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            
            {/* Category Examples Popup/Cloud */}
            {categoryExamples && categoryExamples.length > 0 && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 relative shadow-sm">
                    {/* Little triangle pointing up */}
                    <div className="absolute -top-2 left-8 w-4 h-4 bg-blue-50 border-t border-l border-blue-200 transform rotate-45"></div>
                    
                    <h5 className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-1">
                        <MessageCircle size={14} /> Mensajes típicos del cliente (Ejemplos):
                    </h5>
                    <ul className="list-disc pl-4 space-y-1">
                        {categoryExamples.map((ex, i) => (
                            <li key={i} className="text-xs text-blue-700 italic">"{ex}"</li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tu Nombre</label>
            <input 
              type="text" 
              value={formData.author} 
              onChange={e => handleChange('author', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border bg-white text-gray-900"
              placeholder="Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input 
              type="date" 
              value={formData.date} 
              onChange={e => handleChange('date', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border bg-white text-gray-900"
            />
          </div>
        </div>
      </FormSection>

      {/* 2. Inicio de la Charla */}
      <FormSection 
        id="initial" 
        title="2. Inicio de la Conversación" 
        icon={MessageSquare}
        isOpen={activeSection === 'initial'} 
        onToggle={() => toggleSection('initial')}
      >
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Respuesta Inicial Típica
                </label>
                <p className="text-xs text-gray-500 mb-2">Escribí acá el mensaje que casi siempre mandás primero cuando te consultan esto. Copialo tal cual de WhatsApp.</p>
                <textarea 
                    rows={4}
                    value={formData.initialResponse}
                    onChange={e => handleChange('initialResponse', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border bg-white text-gray-900"
                    placeholder="Hola! Gracias por escribirnos. Para poder pasarte un presupuesto, necesitaría que..."
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frases que suelen decir los clientes (Opcional)</label>
                <div className="space-y-2">
                    {formData.triggerPhrases.map((phrase, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input 
                                type="text" 
                                value={phrase}
                                onChange={(e) => updateTriggerPhrase(idx, e.target.value)}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border bg-white text-gray-900"
                                placeholder="Ej: Hola, cuánto salen los multifocales?"
                            />
                            <button onClick={() => removeTriggerPhrase(idx)} className="text-red-400 hover:text-red-600"><X /></button>
                        </div>
                    ))}
                    <button onClick={addTriggerPhrase} type="button" className="text-sm text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1">
                        <Plus size={16} /> Agregar frase
                    </button>
                </div>
            </div>
        </div>
      </FormSection>

      {/* 3. Pasos del Flujo */}
      <FormSection 
        id="steps" 
        title="3. Pasos siguientes (Paso a Paso)" 
        icon={List}
        isOpen={activeSection === 'steps'} 
        onToggle={() => toggleSection('steps')}
      >
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <p className="text-sm text-blue-700">
                Agrega en orden las preguntas que hacés o las acciones que tomás (ej: "consultar sistema") para resolver esta consulta.
            </p>
        </div>
        <StepBuilder 
            steps={formData.steps} 
            onChange={(steps) => handleChange('steps', steps)} 
        />
      </FormSection>

      {/* 4. Objetivo y Filtros */}
      <FormSection 
        id="objective" 
        title="4. Objetivos y Decisiones" 
        icon={Target}
        isOpen={activeSection === 'objective'} 
        onToggle={() => toggleSection('objective')}
      >
         <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo Final</label>
                <p className="text-xs text-gray-500 mb-2">¿Qué querés lograr con esta conversación? (Ej: Que venga al local, Que mande foto, etc)</p>
                <input 
                    type="text"
                    value={formData.objective}
                    onChange={e => handleChange('objective', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border bg-white text-gray-900"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué decidís o filtras con las preguntas?</label>
                <p className="text-xs text-gray-500 mb-2">Ej: Decido si es monofocal o multifocal, decido si le ofrezco la línea económica...</p>
                <textarea 
                    rows={3}
                    value={formData.informationFiltered}
                    onChange={e => handleChange('informationFiltered', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border bg-white text-gray-900"
                />
            </div>
         </div>
      </FormSection>

       {/* 5. Datos Registrados */}
       <FormSection 
            id="data" 
            title="5. Datos que anotas en sistema" 
            icon={Filter}
            isOpen={activeSection === 'data'} 
            onToggle={() => toggleSection('data')}
        >
            <p className="text-sm text-gray-500 mb-4">Marca qué datos necesitas registrar SIEMPRE para este tipo de consulta.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {[
                    {k: 'name', l: 'Nombre y Apellido'},
                    {k: 'phone', l: 'Teléfono / WhatsApp'},
                    {k: 'branch', l: 'Sucursal de preferencia'},
                    {k: 'usage', l: 'Uso (Cerca/Lejos/Etc)'},
                    {k: 'hasRecipe', l: '¿Tiene Receta?'},
                    {k: 'hasFrame', l: '¿Tiene Armazón?'},
                    {k: 'productOffered', l: 'Producto Ofrecido'},
                    {k: 'budgetRange', l: 'Rango de Presupuesto'},
                    {k: 'observations', l: 'Observaciones'},
                ].map((item) => (
                    <label key={item.k} className="inline-flex items-center">
                        <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-teal-600 shadow-sm focus:border-teal-500 focus:ring-teal-500 h-4 w-4 bg-white"
                            checked={(formData.dataRecorded as any)[item.k]}
                            onChange={e => handleDataRecordChange(item.k as any, e.target.checked)}
                        />
                        <span className="ml-2 text-sm text-gray-700">{item.l}</span>
                    </label>
                ))}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Otros datos que anotas</label>
                <input 
                    type="text"
                    value={formData.dataRecorded.other}
                    onChange={e => handleDataRecordChange('other', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border bg-white text-gray-900"
                />
            </div>
       </FormSection>

       {/* 6. Derivación */}
       <FormSection 
            id="derivation" 
            title="6. Condiciones de Derivación" 
            icon={Share2}
            isOpen={activeSection === 'derivation'} 
            onToggle={() => toggleSection('derivation')}
        >
          <div className="grid grid-cols-1 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuándo derivas el caso?</label>
                <input 
                    type="text"
                    placeholder="Ej: Cuando pide financiación compleja o cuando es PAMI"
                    value={formData.derivation.condition}
                    onChange={e => handleDerivationChange('condition', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border bg-white text-gray-900"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿A quién?</label>
                <input 
                    type="text"
                    placeholder="Ej: Administración, Laboratorio..."
                    value={formData.derivation.toWhom}
                    onChange={e => handleDerivationChange('toWhom', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border bg-white text-gray-900"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ejemplos de derivación</label>
                <textarea 
                    rows={2}
                    value={formData.derivation.examples}
                    onChange={e => handleDerivationChange('examples', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border bg-white text-gray-900"
                />
            </div>
          </div>
       </FormSection>

       {/* 7. Variantes / Subcasos */}
       <FormSection 
            id="subcases" 
            title="7. Variantes y Casos Especiales" 
            icon={AlertCircle}
            isOpen={activeSection === 'subcases'} 
            onToggle={() => toggleSection('subcases')}
        >
            <p className="text-sm text-gray-500 mb-4">Si el flujo cambia drásticamente por una condición (ej: "Sin receta"), agregalo acá como un sub-caso.</p>
            
            <div className="space-y-6">
                {(formData.subCases || []).map((subCase, index) => (
                    <div key={subCase.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
                         <button 
                            onClick={() => removeSubCase(subCase.id)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="mb-4 pr-8">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Sub-caso / Condición</label>
                            <input 
                                type="text"
                                placeholder="Ej: Si el cliente NO tiene receta"
                                value={subCase.name}
                                onChange={(e) => updateSubCaseName(subCase.id, e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border bg-white text-gray-900"
                            />
                        </div>

                        <StepBuilder 
                            label="Pasos específicos para este caso"
                            steps={subCase.steps}
                            onChange={(steps) => updateSubCaseSteps(subCase.id, steps)}
                        />
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addSubCase}
                    className="w-full flex justify-center items-center px-4 py-2 border border-dashed border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 hover:border-teal-500 hover:text-teal-600 transition-colors bg-white"
                >
                    <Plus className="mr-2 h-5 w-5" /> Agregar Variante / Sub-caso
                </button>
            </div>
       </FormSection>
    </div>
  );
};

export default FlowForm;