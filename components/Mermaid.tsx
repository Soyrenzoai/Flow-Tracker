import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
    });
  }, []);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = '';
      const id = `mermaid-${crypto.randomUUID()}`;
      try {
        mermaid.render(id, chart).then((result) => {
            if(ref.current) {
                ref.current.innerHTML = result.svg;
            }
        });
      } catch (error) {
        console.error('Mermaid rendering failed', error);
        ref.current.innerHTML = '<p class="text-red-500 text-sm">Error al generar diagrama. Verifica que los textos no tengan caracteres especiales extraños.</p>';
      }
    }
  }, [chart]);

  return <div className="w-full overflow-x-auto p-4 bg-white rounded-lg shadow-sm border border-gray-100" ref={ref} />;
};

export default Mermaid;
