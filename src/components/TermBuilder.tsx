import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Term, VarState } from '../types';
import { cn } from '../lib/utils';

interface TermBuilderProps {
  terms: Term[];
  numVars: 2 | 3 | 4 | 5 | 6;
  varNames: string[];
  canonicalMode: 'SOP' | 'POS';
  onChange: (terms: Term[]) => void;
}

export const TermBuilder: React.FC<TermBuilderProps> = ({
  terms,
  numVars,
  varNames,
  canonicalMode,
  onChange,
}) => {
  const handleAddTerm = () => {
    onChange([...terms, Array(numVars).fill('Omitted')]);
  };

  const handleRemoveTerm = (index: number) => {
    onChange(terms.filter((_, i) => i !== index));
  };

  const cycleState = (current: VarState): VarState => {
    if (current === 'Omitted') return 'True';
    if (current === 'True') return 'Inverted';
    return 'Omitted';
  };

  const handleChipClick = (termIndex: number, varIndex: number) => {
    const newTerms = [...terms];
    const newTerm = [...newTerms[termIndex]];
    newTerm[varIndex] = cycleState(newTerm[varIndex]);
    newTerms[termIndex] = newTerm;
    onChange(newTerms);
  };

  const handleClearAll = () => onChange([]);

  const handleInvertAll = () => {
    const newTerms = terms.map(term =>
      term.map(state => {
        if (state === 'True') return 'Inverted';
        if (state === 'Inverted') return 'True';
        return state;
      })
    );
    onChange(newTerms);
  };

  const isSOP = canonicalMode === 'SOP';

  return (
    <div className="modern-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Visual Equation Builder</h2>
        <div className="flex gap-2">
          <button onClick={handleInvertAll} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
            Invert All
          </button>
          <button onClick={handleClearAll} className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
            Clear
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center min-h-[60px]">
        {terms.length === 0 && (
          <div className="text-slate-400 italic text-sm">No terms added. Click + Add Term.</div>
        )}
        
        {terms.map((term, tIdx) => (
          <React.Fragment key={tIdx}>
            {tIdx > 0 && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold">
                {isSOP ? '+' : '\u00B7'}
              </div>
            )}
            
            <div className="relative group flex p-2 bg-slate-50 border border-slate-200 rounded-lg gap-1.5 items-center pr-8">
              {isSOP ? null : <span className="text-slate-400 font-light text-lg">(</span>}
              {term.map((state, vIdx) => {
                const varName = varNames[vIdx];
                return (
                  <button
                    key={vIdx}
                    onClick={() => handleChipClick(tIdx, vIdx)}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-md font-medium transition-all select-none relative",
                      state === 'Omitted' ? "border-2 border-dashed border-slate-300 text-slate-400 bg-transparent hover:bg-slate-100" :
                      state === 'True' ? "bg-blue-500 text-white shadow-sm hover:bg-blue-600" :
                      "bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                    )}
                  >
                    {state === 'Inverted' && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full"></span>
                    )}
                    {varName}
                    {state === 'Inverted' && <span className="absolute -top-1 -right-1 text-xs opacity-0">'</span>}
                  </button>
                );
              })}
              {isSOP ? null : <span className="text-slate-400 font-light text-lg">)</span>}
              
              <button
                onClick={() => handleRemoveTerm(tIdx)}
                className="absolute right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove Term"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </React.Fragment>
        ))}

        <button
          onClick={handleAddTerm}
          className="flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors font-medium h-[58px]"
        >
          <Plus size={18} /> Add Term
        </button>
      </div>
    </div>
  );
};
