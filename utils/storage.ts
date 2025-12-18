import { FlowData } from '../types';

const STORAGE_KEY = 'vistalli_flows_db';

export const storageService = {
  // Save all flows to local storage
  saveFlows: (flows: FlowData[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
    } catch (error) {
      console.error('Error saving to local storage', error);
    }
  },

  // Load flows from local storage
  loadFlows: (): FlowData[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading from local storage', error);
      return [];
    }
  },

  // Export data to a JSON file (Backup)
  exportBackup: (flows: FlowData[]) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flows, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const date = new Date().toISOString().split('T')[0];
    downloadAnchorNode.setAttribute("download", `Vistalli_Backup_${date}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  },

  // Import data logic is handled in the component via FileReader, 
  // but this helper validates the schema roughly
  validateImport: (data: any): data is FlowData[] => {
    return Array.isArray(data) && data.every(item => item.id && item.branch && item.category);
  }
};