import React from 'react';
import { Sparkles, TerminalSquare, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProblemInputProps {
  currentNumVars: 2 | 3 | 4 | 5 | 6;
  varNames: string[];
  onVarNameChange: (index: number, newName: string) => void;
  onRequestNumVarsChange: (newNumVars: 2 | 3 | 4 | 5 | 6) => void;
  onParse: (numVars: 2 | 3 | 4 | 5 | 6 | null, minterms: number[], dontCares: number[], isPOS: boolean, naming: 'letters' | 'subscripts' | null) => void;
  funcName: string;
  setFuncName: (name: string) => void;
  mainTermInputs: string[];
  setMainTermInputs: React.Dispatch<React.SetStateAction<string[]>>;
  dcInputs: string[];
  setDcInputs: React.Dispatch<React.SetStateAction<string[]>>;
  isPOS: boolean;
  setIsPOS: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ProblemInput: React.FC<ProblemInputProps> = ({ 
  currentNumVars, 
  varNames, 
  onVarNameChange, 
  onRequestNumVarsChange, 
  onParse, 
  funcName, 
  setFuncName,
  mainTermInputs,
  setMainTermInputs,
  dcInputs,
  setDcInputs,
  isPOS,
  setIsPOS
}) => {

  React.useEffect(() => {
    const mainArr = mainTermInputs.map(s => parseInt(s)).filter(n => !isNaN(n));
    const dcArr = dcInputs.map(s => parseInt(s)).filter(n => !isNaN(n));
    const maxTerm = Math.max(...mainArr, ...dcArr, 0);
    
    let requiredVars = currentNumVars;
    if (maxTerm > 31) requiredVars = 6;
    else if (maxTerm > 15 && currentNumVars < 5) requiredVars = 5;
    else if (maxTerm > 7 && currentNumVars < 4) requiredVars = 4;
    else if (maxTerm > 3 && currentNumVars < 3) requiredVars = 3;
    
    if (requiredVars > currentNumVars) {
      onRequestNumVarsChange(requiredVars as 2 | 3 | 4 | 5 | 6);
    }
  }, [mainTermInputs, dcInputs, currentNumVars, onRequestNumVarsChange]);

  const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    const text = e.clipboardData.getData('text');
    if (text.includes(',')) {
      e.preventDefault();
      const parts = text.split(',').map(s => s.trim()).filter(Boolean);
      setter(prev => {
        const cleanPrev = prev.filter(Boolean);
        return [...cleanPrev, ...parts, ''];
      });
    }
  };

  const handleInputChange = (
    index: number, 
    val: string, 
    inputs: string[], 
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    const newInputs = [...inputs];
    newInputs[index] = cleanVal;
    
    if (index === newInputs.length - 1 && cleanVal !== '') {
      newInputs.push('');
    }
    
    const filtered = newInputs.filter((v, i) => v !== '' || i === newInputs.length - 1);
    
    if (filtered.length === 0 || filtered[filtered.length - 1] !== '') {
      filtered.push('');
    }
    
    setter(filtered);
  };

  const handleSolve = () => {
    const mainArr = mainTermInputs.map(s => parseInt(s)).filter(n => !isNaN(n));
    const dcArr = dcInputs.map(s => parseInt(s)).filter(n => !isNaN(n));
    onParse(currentNumVars, mainArr, dcArr, isPOS, null);
  };

  const renderInputBoxes = (
    inputs: string[], 
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    return inputs.map((val, i) => (
      <React.Fragment key={i}>
        <input 
          type="text" 
          value={val}
          onChange={e => handleInputChange(i, e.target.value, inputs, setter)}
          onPaste={e => handleInputPaste(e, setter)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSolve();
            if (e.key === 'Backspace' && val === '' && i > 0 && i === inputs.length - 1) {
              e.preventDefault();
              const newInputs = [...inputs];
              newInputs.splice(i - 1, 1);
              setter(newInputs);
            }
          }}
          className={cn(
            "w-10 text-center bg-white border rounded focus:ring-2 focus:ring-indigo-500 outline-none p-1 shadow-sm transition-all",
            val === '' ? "border-dashed border-slate-300 bg-slate-50 dark:bg-slate-900/50" : "border-slate-300 font-semibold text-slate-700 dark:text-slate-300"
          )}
        />
        {i < inputs.length - 1 && <span className="text-slate-400 font-normal">,</span>}
      </React.Fragment>
    ));
  };

  return (
    <div className="modern-card p-6 mb-6 bg-gradient-to-br from-white to-indigo-50/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <TerminalSquare size={20} className="text-indigo-500" />
          <h2 className="text-lg font-semibold text-indigo-900">Interactive Equation Builder</h2>
        </div>
        <button
          onClick={handleSolve}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <Sparkles size={16} />
          Solve
        </button>
      </div>
      
      <div className="flex flex-wrap items-center gap-x-2 gap-y-4 font-mono text-[1.1rem] md:text-xl text-slate-800 dark:text-slate-200">
        <input 
          type="text" 
          value={funcName}
          onChange={e => setFuncName(e.target.value)}
          className="w-12 text-center bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none p-1 shadow-sm font-bold text-indigo-700" 
        />
        <span>(</span>
        
        {varNames.map((v, i) => (
          <React.Fragment key={i}>
            <input 
              value={v}
              onChange={e => onVarNameChange(i, e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Backspace' && v === '' && i === currentNumVars - 1 && currentNumVars > 2) {
                  e.preventDefault();
                  onRequestNumVarsChange((currentNumVars - 1) as any);
                }
              }}
              className="w-8 text-center bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none p-1 shadow-sm font-semibold text-indigo-700 transition-colors"
            />
            {i < currentNumVars - 1 && <span className="text-slate-400">,</span>}
          </React.Fragment>
        ))}
        
        {currentNumVars < 6 && (
          <>
            <span className="text-slate-400">,</span>
            <button 
              onClick={() => onRequestNumVarsChange((currentNumVars + 1) as any)}
              className="w-8 h-9 flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 rounded hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
              title="Add Variable"
            >
              <Plus size={16} />
            </button>
          </>
        )}
        
        <span>)</span>
        <span className="mx-2">=</span>
        
        <select 
          value={isPOS ? "POS" : "SOP"}
          onChange={e => setIsPOS(e.target.value === "POS")}
          className="bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none p-1 cursor-pointer font-bold text-indigo-700 shadow-sm"
        >
          <option value="SOP">Σm</option>
          <option value="POS">ΠM</option>
        </select>
        
        <span>(</span>
        <div className="flex flex-wrap items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 shadow-inner min-h-[46px]">
          {renderInputBoxes(mainTermInputs, setMainTermInputs)}
        </div>
        <span>)</span>
        
        <span className="mx-2">+ d (</span>
        <div className="flex flex-wrap items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 shadow-inner min-h-[46px]">
          {renderInputBoxes(dcInputs, setDcInputs)}
        </div>
        <span>)</span>
      </div>
    </div>
  );
};
