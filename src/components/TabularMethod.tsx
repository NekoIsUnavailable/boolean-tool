import React, { useMemo } from 'react';
import type { OutputState } from '../types';
import { getQuineMcCluskeySteps } from '../lib/quineMcCluskey';

interface TabularMethodProps {
  numVars: number;
  varNames: string[];
  mintermVector: OutputState[];
}

export const TabularMethod: React.FC<TabularMethodProps> = ({ numVars, mintermVector }) => {
  const steps = useMemo(() => {
    const minterms: number[] = [];
    const dontCares: number[] = [];
    mintermVector.forEach((state, i) => {
      if (state === '1') minterms.push(i);
      else if (state === 'X') dontCares.push(i);
    });
    return getQuineMcCluskeySteps(minterms, dontCares, numVars);
  }, [mintermVector, numVars]);

  if (steps.stepTables.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">Quine-McCluskey Tabular Method</h2>
        <p className="text-slate-500">No minterms to process.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <h2 className="text-lg font-semibold mb-6">Quine-McCluskey Tabular Method</h2>
      
      {/* Implicant Generation Tables */}
      <div className="flex flex-wrap gap-6 mb-8 overflow-x-auto pb-4">
        {steps.stepTables.map((step, idx) => {
          let allEmpty = step.groups.every(g => g.length === 0);
          if (allEmpty) return null;
          
          return (
            <div key={idx} className="min-w-fit flex flex-col border border-slate-300">
              <div className="bg-slate-100 font-semibold p-2 border-b border-slate-300 text-center">
                {step.cubes}-CUBES
              </div>
              <div className="flex">
                <div className="p-2 border-r border-slate-300 font-semibold bg-slate-50 w-12 text-center"># 1s</div>
                <div className="p-2 border-r border-slate-300 font-semibold bg-slate-50 w-40">Minterms</div>
                <div className="p-2 font-semibold bg-slate-50 w-32">Binary</div>
              </div>
              
              {step.groups.map((group, gIdx) => {
                if (group.length === 0) return null;
                return (
                  <React.Fragment key={gIdx}>
                    {group.map((term, tIdx) => (
                      <div key={tIdx} className={`flex border-t border-slate-200 ${term.used ? 'text-slate-500' : 'font-semibold text-blue-700'}`}>
                        {tIdx === 0 ? (
                          <div className="p-2 border-r border-slate-300 w-12 text-center font-semibold text-slate-600 flex items-center justify-center">
                            {gIdx}
                          </div>
                        ) : (
                          <div className="p-2 border-r border-slate-300 w-12"></div>
                        )}
                        <div className="p-2 border-r border-slate-300 w-40 text-sm flex items-center justify-between pr-4">
                          <span>{term.minterms.join(', ')}</span>
                          {term.used ? (
                            <span className="text-xs font-bold text-slate-400">✓</span>
                          ) : (
                            <span className="text-xs font-bold text-red-500">*PI</span>
                          )}
                        </div>
                        <div className="p-2 w-32 font-mono text-sm flex items-center">
                          {term.term}
                        </div>
                      </div>
                    ))}
                    {gIdx < step.groups.length - 1 && step.groups.slice(gIdx + 1).some(g => g.length > 0) && (
                      <div className="h-1 bg-slate-300 w-full"></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Prime Implicant Chart */}
      {steps.piChart.length > 0 && (
        <div className="overflow-x-auto">
          <h3 className="font-semibold mb-3">Prime Implicant Chart</h3>
          <table className="border-collapse border border-slate-300 text-sm w-full max-w-4xl">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2 text-left w-12">P.I.</th>
                <th className="border border-slate-300 p-2 text-left">Minterms</th>
                {steps.piChart.map(m => (
                  <th key={m.minterm} className="border border-slate-300 p-2 w-8 text-center">{m.minterm}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {steps.primeImplicants.map((pi, pIdx) => {
                const isEssential = steps.essentialPIs.includes(pIdx);
                const isFinal = steps.finalEquationPIs.includes(pi.term);
                return (
                  <tr key={pIdx} className={isFinal ? 'bg-blue-50' : ''}>
                    <td className="border border-slate-300 p-2 font-semibold">
                      {String.fromCharCode(97 + pIdx)} {isEssential ? <span className="text-red-500">*</span> : ''}
                    </td>
                    <td className="border border-slate-300 p-2 text-xs">
                      {pi.minterms.join(', ')}
                    </td>
                    {steps.piChart.map(m => {
                      const covers = m.piIndices.includes(pIdx);
                      return (
                        <td key={m.minterm} className="border border-slate-300 p-2 text-center">
                          {covers && <span className="text-blue-600 font-bold">✓</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-4 text-sm text-slate-600 flex flex-col gap-1">
            <p><span className="text-red-500 font-bold">*</span> Indicates an Essential Prime Implicant.</p>
            <p><span className="font-bold text-red-500">*PI</span> in the tables indicates an uncombined term (a Prime Implicant).</p>
            <p><span className="text-slate-400 font-bold">✓</span> in the tables indicates the term was successfully combined.</p>
            <p>Highlighted blue rows in the chart are the Prime Implicants selected for the final minimized equation.</p>
          </div>
        </div>
      )}
    </div>
  );
};
