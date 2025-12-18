import { FlowData } from '../types';
import { SERVER_CONFIG } from '../config';

export const apiService = {
  // GET: Obtener todos los flujos del servidor
  fetchFlows: async (): Promise<FlowData[]> => {
    try {
      const response = await fetch(`${SERVER_CONFIG.API_URL}/flows`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': SERVER_CONFIG.API_KEY
        }
      });
      
      if (!response.ok) throw new Error('Error al conectar con el servidor');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      alert('No se pudo conectar con el servidor. Verifica la URL en config.ts');
      return [];
    }
  },

  // POST: Guardar (Sobrescribir) la base de datos completa
  // Nota: En una app real haríamos POST/PUT individuales, pero para mantener la simplicidad
  // enviamos todo el array como si fuera el archivo JSON.
  saveAllFlows: async (flows: FlowData[]): Promise<boolean> => {
    try {
      const response = await fetch(`${SERVER_CONFIG.API_URL}/flows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': SERVER_CONFIG.API_KEY
        },
        body: JSON.stringify({ flows }) 
      });

      if (!response.ok) throw new Error('Error guardando datos');
      return true;
    } catch (error) {
      console.error('API Error:', error);
      alert('Error al guardar en el servidor. Tus cambios no se han sincronizado.');
      return false;
    }
  }
};