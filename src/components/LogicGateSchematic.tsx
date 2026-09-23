import React, { useRef } from 'react';
import { Copy, Download } from 'lucide-react';

interface LogicGateSchematicProps {
  numVars: number;
  varNames: string[];
  canonicalMode: 'SOP' | 'POS';
  primeImplicants: string[];
  funcName: string;
}

export const LogicGateSchematic: React.FC<LogicGateSchematicProps> = ({
  numVars,
  varNames,
  canonicalMode,
  primeImplicants,
  funcName
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Layout parameters
  const railSpacing = 40;
  const startX = 60;
  const railStartY = 40;
  const termSpacing = 80;
  const andGateX = startX + numVars * railSpacing + 60;
  const orGateX = andGateX + 160;

  const totalHeight = Math.max(300, railStartY + primeImplicants.length * termSpacing + 40);
  const totalWidth = orGateX + 100;

  const handleCopyEquation = () => {
    // Generate text eq
    const eq = primeImplicants.map(pi => {
      if (!pi.includes('0') && !pi.includes('1')) return '1';
      return pi.split('').map((c, i) => {
        if (c === '-') return '';
        const name = varNames[i];
        return c === '0' ? name + "'" : name;
      }).join('');
    }).join(' + ');
    navigator.clipboard.writeText(eq || '0');
  };

  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schematic.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (primeImplicants.length === 0) {
    return (
      <div className="modern-card p-6">
        <h2 className="text-lg font-semibold mb-4">Logic Gate Schematic</h2>
        <div className="h-40 flex items-center justify-center text-slate-400">
          Output is always 0 (No gates needed)
        </div>
      </div>
    );
  }

  if (primeImplicants.length === 1 && !primeImplicants[0].includes('0') && !primeImplicants[0].includes('1')) {
    return (
      <div className="modern-card p-6">
        <h2 className="text-lg font-semibold mb-4">Logic Gate Schematic</h2>
        <div className="h-40 flex items-center justify-center text-slate-400">
          Output is always 1 (Direct to VCC)
        </div>
      </div>
    );
  }

  return (
    <div className="modern-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Logic Gate Schematic</h2>
        <div className="flex gap-2">
          <button onClick={handleCopyEquation} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
            <Copy size={16} /> Copy Eq
          </button>
          <button onClick={handleExportSVG} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
            <Download size={16} /> Export SVG
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-lg bg-slate-50">
        <svg ref={svgRef} width={totalWidth} height={totalHeight} className="min-w-full" viewBox={`0 0 ${totalWidth} ${totalHeight}`}>
          <defs>
            <g id="and-gate">
              <path d="M 0,-20 L 20,-20 A 20 20 0 0 1 40 0 A 20 20 0 0 1 20 20 L 0,20 Z" fill="none" stroke="black" strokeWidth="2" />
            </g>
            <g id="or-gate">
              <path d="M 0,-25 Q 20,-25 40,0 Q 20,25 0,25 Q 12,0 0,-25 Z" fill="none" stroke="black" strokeWidth="2" />
            </g>
          </defs>

          {/* Input Rails */}
          {Array.from({ length: numVars }).map((_, i) => {
            const rx = startX + i * railSpacing;
            return (
              <g key={`rail-${i}`}>
                <text x={rx} y={railStartY - 15} textAnchor="middle" className="font-mono text-sm fill-slate-700 font-bold">
                  {varNames[i]}
                </text>
                {/* Main Rail */}
                <line x1={rx} y1={railStartY} x2={rx} y2={totalHeight - 20} stroke="#cbd5e1" strokeWidth="2" />
                
                {/* Tap off for inverted rail */}
                <circle cx={rx} cy={railStartY + 5} r="2" fill="black" />
                <line x1={rx} y1={railStartY + 5} x2={rx + 15} y2={railStartY + 5} stroke="black" strokeWidth="1.5" />
                
                {/* NOT Gate Triangle & Bubble */}
                <path d={`M ${rx + 9} ${railStartY + 5} L ${rx + 21} ${railStartY + 5} L ${rx + 15} ${railStartY + 15} Z`} fill="white" stroke="black" strokeWidth="1.5" />
                <circle cx={rx + 15} cy={railStartY + 17.5} r="2.5" fill="white" stroke="black" strokeWidth="1.5" />
                
                {/* Inverted Rail */}
                <line x1={rx + 15} y1={railStartY + 20} x2={rx + 15} y2={totalHeight - 20} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,4" />
              </g>
            );
          })}

          {/* Logic Gates & Wiring */}
          {primeImplicants.map((pi, piIdx) => {
            const y = railStartY + 40 + piIdx * termSpacing;
            const literals = pi.split('').map((c, i) => ({ c, i })).filter(x => x.c !== '-');
            const numLiterals = literals.length;
            
            // Standard spacing on the rails (12px)
            const inputsY = literals.map((_, idx) => y - (numLiterals - 1) * 6 + idx * 12);
            // Compressed spacing entering the gate (fits within the 40px gate height)
            const maxGateSpan = 30; // -15 to +15
            const gateSpacing = numLiterals > 1 ? Math.min(12, maxGateSpan / (numLiterals - 1 || 1)) : 0;
            const gateInputsY = literals.map((_, idx) => y - (numLiterals - 1) * (gateSpacing/2) + idx * gateSpacing);
            
            const isSOP = canonicalMode === 'SOP';
            const termGateHref = isSOP ? "#and-gate" : "#or-gate";
            
            return (
              <g key={`term-${piIdx}`}>
                {numLiterals > 1 ? (
                  <use href={termGateHref} x={andGateX} y={y} />
                ) : (
                  <line x1={andGateX} y1={y} x2={andGateX + 40} y2={y} stroke="black" strokeWidth="1.5" strokeDasharray="2,2" />
                )}

                {literals.map((lit, idx) => {
                  const useInverted = isSOP ? (lit.c === '0') : (lit.c === '1');
                  const railX = startX + lit.i * railSpacing + (useInverted ? 15 : 0);
                  const inY = numLiterals > 1 ? inputsY[idx] : y;
                  const targetY = numLiterals > 1 ? gateInputsY[idx] : y;
                  
                  return (
                    <g key={`wire-${piIdx}-${idx}`}>
                      <circle cx={railX} cy={inY} r="2.5" fill="black" />
                      {/* Wire routes straight to right before gate, then diagonals in, then straight into gate */}
                      <path 
                        d={`M ${railX} ${inY} L ${andGateX - 20} ${inY} L ${andGateX - 5} ${targetY} L ${andGateX} ${targetY}`} 
                        fill="none" 
                        stroke="black" 
                        strokeWidth="1.5" 
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Final Gate */}
          {primeImplicants.length > 1 && (() => {
            const finalY = railStartY + 40 + (primeImplicants.length - 1) * termSpacing / 2;
            const N = primeImplicants.length;
            
            return (
              <g>
                <use href={canonicalMode === 'SOP' ? "#or-gate" : "#and-gate"} x={orGateX} y={finalY} />
                
                {/* Wires from each term into Final Gate */}
                {primeImplicants.map((_, idx) => {
                  const sourceY = railStartY + 40 + idx * termSpacing;
                  const targetY = finalY - 15 + idx * (30 / (N - 1));
                  
                  return (
                    <path 
                      key={`final-wire-${idx}`}
                      d={`M ${andGateX + 40} ${sourceY} L ${orGateX - 40} ${sourceY} L ${orGateX - 15} ${targetY} L ${orGateX} ${targetY}`}
                      fill="none"
                      stroke="black"
                      strokeWidth="1.5"
                    />
                  );
                })}
                
                {/* Output Wire */}
                <line x1={orGateX + 40} y1={finalY} x2={orGateX + 70} y2={finalY} stroke="black" strokeWidth="2" />
                <text x={orGateX + 75} y={finalY + 5} className="font-mono text-lg font-bold">{funcName}</text>
              </g>
            );
          })()}

          {/* Single Term Output */}
          {primeImplicants.length === 1 && (
            <g>
              <line x1={andGateX + 40} y1={railStartY + 40} x2={orGateX + 70} y2={railStartY + 40} stroke="black" strokeWidth="2" />
              <text x={orGateX + 75} y={railStartY + 45} className="font-mono text-lg font-bold">{funcName}</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
