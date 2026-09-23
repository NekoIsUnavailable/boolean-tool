import React from 'react';
import { Clock, Trash2, X } from 'lucide-react';
import type { SavedProblem } from '../App';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: SavedProblem[];
  onLoad: (problem: SavedProblem) => void;
  onClear: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, history, onLoad, onClear }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold">
            <Clock size={18} className="text-indigo-600" />
            <h2>Solving History</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Clock size={32} className="opacity-20" />
              <p>No history yet</p>
              <p className="text-sm text-center">Solve a problem to save it here.</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id} 
                onClick={() => {
                  onLoad(item);
                  onClose();
                }}
                className="group p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all bg-white dark:bg-slate-800"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">
                    {item.funcName}({item.varNames.join(', ')})
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="font-mono text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  <span className="text-indigo-500 font-semibold">{item.canonicalMode === 'SOP' ? 'Σm' : 'ΠM'}</span>
                  ({item.mainTermInputs.join(',')})
                  {item.dcInputs.some(v => v !== '') && (
                    <> <span className="text-indigo-500 font-semibold">+ d</span>({item.dcInputs.join(',')})</>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div className="p-4 border-t border-slate-100">
            <button 
              onClick={onClear}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              <Trash2 size={16} />
              Clear History
            </button>
          </div>
        )}
      </div>
    </>
  );
};
