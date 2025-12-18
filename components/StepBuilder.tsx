import React from 'react';
import { Step, StepType } from '../types';
import { Plus, Trash2, ArrowDown, ArrowUp } from 'lucide-react';

interface StepBuilderProps {
  steps: Step[];
  onChange: (steps: Step[]) => void;
  label?: string;
  description?: string;
}

const StepBuilder: React.FC<StepBuilderProps> = ({ steps, onChange, label, description }) => {
  
  const addStep = () => {
    const newStep: Step = {
      id: crypto.randomUUID(),
      type: 'question',
      text: '',
      condition: ''
    };
    onChange([...steps, newStep]);
  };

  const updateStep = (id: string, field: keyof Step, value: string) => {
    onChange(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeStep = (id: string) => {
    onChange(steps.filter(s => s.id !== id));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;
    
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    onChange(newSteps);
  };

  return (
    <div className="space-y-4">
      {(label || description) && (
        <div>
          {label && <h4 className="text-md font-semibold text-gray-800">{label}</h4>}
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      )}

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex flex-col gap-1 pt-1 text-gray-400">
              <span className="text-xs font-mono font-bold w-6 text-center">{index + 1}</span>
              <div className="flex flex-col">
                <button type="button" onClick={() => moveStep(index, 'up')} disabled={index === 0} className="hover:text-blue-600 disabled:opacity-20"><ArrowUp size={14} /></button>
                <button type="button" onClick={() => moveStep(index, 'down')} disabled={index === steps.length - 1} className="hover:text-blue-600 disabled:opacity-20"><ArrowDown size={14} /></button>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <select 
                  className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 border bg-white text-gray-900"
                  value={step.type}
                  onChange={(e) => updateStep(step.id, 'type', e.target.value as StepType)}
                >
                  <option value="question">❓ Pregunta al cliente</option>
                  <option value="action">⚙️ Acción interna</option>
                  <option value="message">💬 Mensaje de respuesta</option>
                </select>
                <input
                  type="text"
                  placeholder="Ej: Si tiene receta..."
                  className="block w-2/3 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 border bg-white text-gray-900"
                  value={step.condition || ''}
                  onChange={(e) => updateStep(step.id, 'condition', e.target.value)}
                />
              </div>
              <textarea
                rows={2}
                placeholder={step.type === 'action' ? 'Ej: Revisar stock en sistema' : 'Ej: ¿Qué tipo de lente estás buscando?'}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 border bg-white text-gray-900"
                value={step.text}
                onChange={(e) => updateStep(step.id, 'text', e.target.value)}
              />
            </div>

            <button 
              type="button" 
              onClick={() => removeStep(step.id)}
              className="text-red-400 hover:text-red-600 p-1"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addStep}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-teal-700 bg-teal-100 hover:bg-teal-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
      >
        <Plus className="-ml-0.5 mr-2 h-4 w-4" /> Agregar Paso
      </button>
    </div>
  );
};

export default StepBuilder;