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
    const activeLength = Math.pow(2, numVars);
    const activeVector = mintermVector.slice(0, activeLength);
    const minterms: number[] = [];
    const dontCares: number[] = [];
    activeVector.forEach((state, i) => {
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

  const getDiffs = (termStr: string) => {
    const diffs: number[] = [];
    for (let i = 0; i < termStr.length; i++) {
      if (termStr[i] === '-') {
        diffs.push(Math.pow(2, termStr.length - 1 - i));
      }
    }
    diffs.sort((a,b) => a-b);
    return diffs.length > 0 ? `(${diffs.join(',')})` : '';
  };

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
                <div className="p-2 border-r border-slate-300 font-semibold bg-slate-50 min-w-[12rem]">Minterms (Diffs)</div>
                <div className="p-2 font-semibold bg-slate-50 w-24">Binary</div>
              </div>
              
              {step.groups.map((group, gIdx) => {
                if (group.length === 0) return null;
                return (
                  <React.Fragment key={gIdx}>
                    {group.map((term, tIdx) => (
                      <div key={tIdx} className={`flex border-t border-slate-200 ${term.used ? 'text-slate-700' : 'font-semibold text-blue-700 bg-blue-50/30'}`}>
                        {tIdx === 0 ? (
                          <div className="p-2 border-r border-slate-300 w-12 text-center font-semibold text-slate-600 flex items-center justify-center">
                            {gIdx}
                          </div>
                        ) : (
                          <div className="p-2 border-r border-slate-300 w-12"></div>
                        )}
                        <div className="p-2 border-r border-slate-300 min-w-[12rem] text-sm flex items-center justify-between pr-4 gap-4">
                          <span>
                            {term.minterms.join(',')} <span className="text-slate-400 font-mono text-xs">{getDiffs(term.term)}</span>
                          </span>
                          {term.used ? (
                            <span className="text-xs font-bold text-slate-400 flex items-center">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-red-500">*PI</span>
                          )}
                        </div>
                        <div className="p-2 w-24 font-mono text-sm flex items-center tracking-widest">
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
                      {pi.minterms.join(', ')} <span className="text-slate-400 font-mono text-xs ml-1">{getDiffs(pi.term)}</span>
                    </td>
                    {steps.piChart.map(m => {
                      const covers = m.piIndices.includes(pIdx);
                      return (
                        <td key={m.minterm} className="border border-slate-300 p-2 text-center">
                          {covers && (
                            <div className="flex justify-center">
                              <svg className={`w-4 h-4 ${isEssential ? "text-blue-600" : "text-slate-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                          )}
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
            <p className="flex items-center gap-1">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              in the tables indicates the term was successfully combined.
            </p>
            <p>Highlighted blue rows in the chart are the Prime Implicants selected for the final minimized equation.</p>
          </div>
        </div>
      )}
    </div>
  );
};
