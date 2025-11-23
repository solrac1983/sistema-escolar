import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface SaveScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  initialName?: string;
}

export const SaveScheduleModal: React.FC<SaveScheduleModalProps> = ({ isOpen, onClose, onSave, initialName = '' }) => {
  const [name, setName] = useState(initialName);

  // Reset name when modal opens/closes or initialName changes
  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">Salvar Horário</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-4">Dê um nome para identificar esta versão do horário no histórico.</p>
        
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Versão</label>
          <input
            autoFocus
            type="text"
            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Ex: Horário Final 2024 - v1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && onSave(name)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={() => name.trim() && onSave(name)}
            disabled={!name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
