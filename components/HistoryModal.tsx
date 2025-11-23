
import React from 'react';
import { SavedSchedule } from '../types';
import { X, Calendar, Clock, Trash2, Upload, FileClock } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: SavedSchedule[];
  onLoad: (schedule: SavedSchedule) => void;
  onDelete: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ 
  isOpen, onClose, schedules, onLoad, onDelete 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh] animate-fade-in">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <FileClock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-800">Histórico de Horários</h3>
              <p className="text-sm text-slate-500">Consulte, recupere ou exclua horários salvos.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          {schedules.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <FileClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhum horário salvo ainda.</p>
              <p className="text-xs text-slate-400 mt-1">Gere um horário e clique em "Salvar" para vê-lo aqui.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-bold">Nome da Versão</th>
                    <th className="px-6 py-4 font-bold">Data de Criação</th>
                    <th className="px-6 py-4 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedules.slice().reverse().map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800 block">{item.name}</span>
                        <span className="text-xs text-slate-400">{item.data.schedule.length} aulas alocadas</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1 text-xs">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { onLoad(item); onClose(); }}
                            className="flex items-center gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors"
                            title="Carregar este horário"
                          >
                            <Upload className="w-3 h-3" /> Carregar
                          </button>
                          <button 
                            onClick={() => onDelete(item.id)}
                            className="flex items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors"
                            title="Excluir permanentemente"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800 font-medium">
            Fechar Janela
          </button>
        </div>

      </div>
    </div>
  );
};
