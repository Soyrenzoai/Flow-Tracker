import { FlowData, FlowNode } from '../types';

const escape = (text: string) => {
  if (!text) return '';
  let safe = text.replace(/"/g, "'").replace(/\n/g, ' ');
  if (safe.length > 50) {
    safe = safe.substring(0, 47) + '...';
  }
  return safe;
};

export const generateMermaidChart = (flow: FlowData): string => {
  if (!flow.nodes || flow.nodes.length === 0) {
      return 'graph TD\n    Start[Inicio] --> End[Fin: Sin datos]';
  }

  let chart = 'graph LR\n';
  
  // Styles
  chart += '    classDef trigger fill:#f3e8ff,stroke:#9333ea,stroke-width:2px,color:black;\n';
  chart += '    classDef action fill:#bbf,stroke:#333,stroke-width:1px,color:black;\n';
  chart += '    classDef message fill:#fff,stroke:#333,stroke-width:1px,color:black;\n';
  chart += '    classDef condition fill:#fef08a,stroke:#eab308,stroke-width:2px,color:black;\n';

  // Nodes
  flow.nodes.forEach(node => {
      let shapeStart = '[';
      let shapeEnd = ']';
      let className = 'message';

      if (node.type === 'trigger') {
          shapeStart = '{{';
          shapeEnd = '}}';
          className = 'trigger';
      } else if (node.type === 'condition') {
          shapeStart = '{';
          shapeEnd = '}';
          className = 'condition';
      } else if (node.type === 'action') {
          shapeStart = '(';
          shapeEnd = ')';
          className = 'action';
      }

      // Format: ID[Title <br/> Content]
      const label = `"${escape(node.title)}${node.content ? '<br/>' + escape(node.content) : ''}"`;
      chart += `    ${node.id}${shapeStart}${label}${shapeEnd}:::${className}\n`;
  });

  // Connections
  flow.nodes.forEach(node => {
      if (node.next && node.next.length > 0) {
          node.next.forEach(targetId => {
              // Ensure target exists
              if (flow.nodes.find(n => n.id === targetId)) {
                  chart += `    ${node.id} --> ${targetId}\n`;
              }
          });
      }
  });

  return chart;
};