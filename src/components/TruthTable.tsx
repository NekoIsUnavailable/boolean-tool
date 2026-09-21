import React from 'react';
import type { OutputState } from '../types';
import { cn } from '../lib/utils';

interface TruthTableProps {
  numVars: 2 | 3 | 4 | 5 | 6;
  varNames: string[];
  mintermVector: OutputState[];
  onChange: (index: number, newState: OutputState) => void;
}

export const TruthTable: React.FC<TruthTableProps> = ({
  numVars,
  varNames,
  mintermVector,
  onChange
}) => {
  const cycleState = (state: OutputState): OutputState => {
    if (state === '0') return '1';
    if (state === '1') return 'X';
    return '0';
  };

  const rows = Math.pow(2, numVars);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold mb-4">Truth Table</h2>
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 border-b border-slate-200">m</th>
              {varNames.map((name, i) => (
                <th key={i} className="px-4 py-3 border-b border-slate-200 text-center">
                  {name}
                </th>
              ))}
              <th className="px-4 py-3 border-b border-slate-200 text-center border-l-2 border-slate-300">Out</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => {
              const bin = rowIndex.toString(2).padStart(numVars, '0');
              const outState = mintermVector[rowIndex] || '0';
              
              return (
                <tr key={rowIndex} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2 font-mono text-slate-500">{rowIndex}</td>
                  {bin.split('').map((bit, bitIdx) => (
                    <td key={bitIdx} className="px-4 py-2 text-center font-mono">
                      {bit}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-center border-l-2 border-slate-300">
                    <button
                      onClick={() => onChange(rowIndex, cycleState(outState))}
                      className={cn(
                        "w-8 h-8 rounded-md font-bold transition-all shadow-sm flex items-center justify-center mx-auto",
                        outState === '1' ? "bg-blue-500 text-white hover:bg-blue-600" :
                        outState === '0' ? "bg-slate-200 text-slate-700 hover:bg-slate-300" :
                        "bg-amber-400 text-white hover:bg-amber-500"
                      )}
                    >
                      {outState}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
