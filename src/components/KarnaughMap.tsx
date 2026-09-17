import React from 'react';
import type { OutputState } from '../types';
import { cn } from '../lib/utils';

interface KarnaughMapProps {
  numVars: 2 | 3 | 4 | 5 | 6;
  varNames: string[];
  mintermVector: OutputState[];
  primeImplicants: string[];
  onChange: (index: number, newState: OutputState) => void;
  hoveredTermIndex: number | null;
  setHoveredTermIndex: (idx: number | null) => void;
}

const groupColors = [
  'bg-red-300', 'bg-blue-300', 'bg-green-300', 'bg-yellow-300',
  'bg-purple-300', 'bg-pink-300', 'bg-teal-300', 'bg-orange-300'
];
const borderColors = [
  'border-red-500', 'border-blue-500', 'border-green-500', 'border-yellow-500',
  'border-purple-500', 'border-pink-500', 'border-teal-500', 'border-orange-500'
];

function termCovers(pi: string, minterm: number, numVars: number): boolean {
  const bin = minterm.toString(2).padStart(numVars, '0');
  for (let i = 0; i < numVars; i++) {
    if (pi[i] !== '-' && pi[i] !== bin[i]) return false;
  }
  return true;
}

export const KarnaughMap: React.FC<KarnaughMapProps> = ({
  numVars,
  varNames,
  mintermVector,
  primeImplicants,
  onChange,
  hoveredTermIndex,
  setHoveredTermIndex
}) => {
  let numCols = 4;
  let numRows = 4;
  if (numVars === 2) { numCols = 2; numRows = 2; }
  else if (numVars === 3) { numCols = 4; numRows = 2; }
  else if (numVars === 4) { numCols = 4; numRows = 4; }
  else if (numVars === 5) { numCols = 8; numRows = 4; }
  else if (numVars === 6) { numCols = 8; numRows = 8; }

  const gray1 = [0, 1];
  const gray2 = [0, 1, 3, 2];

  const grid: number[][] = [];
  for (let r = 0; r < numRows; r++) {
    const rowGroup: number[] = [];
    for (let c = 0; c < numCols; c++) {
      let minterm = 0;
      if (numVars === 2) {
        minterm = (gray1[r] << 1) | gray1[c];
      } else if (numVars === 3) {
        minterm = (gray1[r] << 2) | gray2[c];
      } else if (numVars === 4) {
        minterm = (gray2[r] << 2) | gray2[c];
      } else if (numVars === 5) {
        const A = c < 4 ? 0 : 1;
        const BC = gray2[c % 4];
        const DE = gray2[r];
        minterm = (A << 4) | (BC << 2) | DE;
      } else if (numVars === 6) {
        const A = r < 4 ? 0 : 1;
        const B = c < 4 ? 0 : 1;
        const CD = gray2[c % 4];
        const EF = gray2[r % 4];
        minterm = (A << 5) | (B << 4) | (CD << 2) | EF;
      }
      rowGroup.push(minterm);
    }
    grid.push(rowGroup);
  }

  const cycleState = (state: OutputState): OutputState => {
    if (state === '0') return '1';
    if (state === '1') return 'X';
    return '0';
  };

  const vNames = varNames;
  
  // Layout helpers
  const showTopQuadrants = numVars >= 5;
  const showSideQuadrants = numVars === 6;

  // For 5/6 vars, subgrids are 4x4.
  const innerColLabels = numVars >= 3 ? ['00', '01', '11', '10'] : ['0', '1'];
  const innerRowLabels = numVars >= 4 ? ['00', '01', '11', '10'] : ['0', '1'];

  const cornerLabel = numVars === 2 ? `${vNames[0]} \\ ${vNames[1]}` :
                      numVars === 3 ? `${vNames[0]} \\ ${vNames[1]}${vNames[2]}` :
                      numVars === 4 ? `${vNames[0]}${vNames[1]} \\ ${vNames[2]}${vNames[3]}` :
                      numVars === 5 ? `${vNames[3]}${vNames[4]} \\ ${vNames[1]}${vNames[2]}` :
                      `${vNames[4]}${vNames[5]} \\ ${vNames[2]}${vNames[3]}`;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold mb-6">Karnaugh Map</h2>
      <div className="flex justify-center overflow-x-auto pb-4">
        <table className="border-collapse">
          <thead>
            {showTopQuadrants && (
              <tr>
                <th colSpan={showSideQuadrants ? 2 : 1}></th>
                <th colSpan={4} className="text-center font-bold text-slate-800 pb-2 text-lg">
                  {vNames[numVars === 6 ? 1 : 0]} = 0
                </th>
                <th className="w-4"></th>{/* Spacer */}
                <th colSpan={4} className="text-center font-bold text-slate-800 pb-2 text-lg">
                  {vNames[numVars === 6 ? 1 : 0]} = 1
                </th>
              </tr>
            )}
            <tr>
              {showSideQuadrants && <th></th>}
              <th className="p-2 text-slate-500 font-medium text-sm text-right align-bottom border-b-2 border-r-2 border-slate-500">
                {cornerLabel}
              </th>
              {Array(numCols).fill(0).map((_, i) => (
                <React.Fragment key={i}>
                  <th className="p-2 text-center text-slate-700 font-mono text-sm border-b-2 border-slate-500">
                    {innerColLabels[i % 4]}
                  </th>
                  {showTopQuadrants && i === 3 && <th className="w-4"></th>}
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, rIdx) => (
              <React.Fragment key={rIdx}>
                <tr>
                  {showSideQuadrants && rIdx === 0 && (
                    <th rowSpan={4} className="px-2 text-center font-bold text-slate-800 text-lg">
                      <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        {vNames[0]} = 0
                      </div>
                    </th>
                  )}
                  {showSideQuadrants && rIdx === 4 && (
                    <th rowSpan={4} className="px-2 text-center font-bold text-slate-800 text-lg">
                      <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        {vNames[0]} = 1
                      </div>
                    </th>
                  )}
                  <th className="p-2 text-right text-slate-700 font-mono text-sm border-r-2 border-slate-500 align-middle">
                    {innerRowLabels[rIdx % 4]}
                  </th>
                  {row.map((minterm, cIdx) => {
                    const state = mintermVector[minterm];
                    
                    const coveringPIs = primeImplicants
                      .map((pi, idx) => termCovers(pi, minterm, numVars) ? idx : -1)
                      .filter(idx => idx !== -1);
                    
                    return (
                      <React.Fragment key={cIdx}>
                        <td 
                          className={cn(
                            "p-0 border border-slate-300 relative w-12 h-12 sm:w-16 sm:h-16 cursor-pointer transition-colors",
                            state === '1' ? 'bg-indigo-50' : state === 'X' ? 'bg-slate-50' : 'bg-white',
                            "hover:bg-slate-100"
                          )}
                          onClick={() => onChange(minterm, cycleState(state))}
                          onMouseEnter={() => setHoveredTermIndex(coveringPIs.length > 0 ? coveringPIs[0] : null)}
                          onMouseLeave={() => setHoveredTermIndex(null)}
                        >
                      {/* Interactive Button */}
                      <button
                        onClick={() => onChange(minterm, cycleState(state))}
                        className="absolute inset-0 w-full h-full flex items-center justify-center font-bold text-xl z-10 transition-colors hover:bg-slate-50/50"
                      >
                        <span className={state === '1' ? 'text-blue-600' : state === '0' ? 'text-slate-300' : 'text-amber-500'}>
                          {state}
                        </span>
                        <span className="absolute bottom-1 right-1 text-[10px] text-slate-400 font-mono">
                          {minterm}
                        </span>
                      </button>
                      
                      {/* Overlays */}
                      <div className="absolute inset-1 pointer-events-none z-0 flex flex-col justify-center gap-0.5 opacity-60">
                        {coveringPIs.map((piIdx, _i) => {
                          const isHovered = hoveredTermIndex === piIdx;
                          return (
                            <div
                              key={piIdx}
                              className={cn(
                                "flex-1 rounded-sm border opacity-70 transition-all",
                                groupColors[piIdx % groupColors.length],
                                borderColors[piIdx % borderColors.length],
                                isHovered ? "opacity-100 ring-2 ring-black scale-110 shadow-lg z-20" : ""
                              )}
                            />
                          );
                        })}
                      </div>
                    </td>
                    {showTopQuadrants && cIdx === 3 && <td className="w-4"></td>}
                  </React.Fragment>
                  );
                })}
              </tr>
              {showSideQuadrants && rIdx === 3 && (
                <tr className="h-4">
                  {/* Spacer row */}
                  <td colSpan={2}></td>
                  <td colSpan={4}></td>
                  <td></td>
                  <td colSpan={4}></td>
                </tr>
              )}
            </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
