import type { OutputState } from '../types';

interface CanonicalEquationProps {
  numVars: number;
  varNames: string[];
  mintermVector: OutputState[];
  canonicalMode: 'SOP' | 'POS';
  funcName: string;
}

export function CanonicalEquation({
  numVars,
  varNames,
  mintermVector,
  canonicalMode,
  funcName
}: CanonicalEquationProps) {
  const activeLength = Math.pow(2, numVars);
  const mainTerms: number[] = [];
  const dcTerms: number[] = [];

  for (let i = 0; i < activeLength; i++) {
    const val = mintermVector[i] || (canonicalMode === 'SOP' ? '0' : '1');
    if (canonicalMode === 'SOP') {
      if (val === '1') mainTerms.push(i);
      else if (val === 'X') dcTerms.push(i);
    } else {
      if (val === '0') mainTerms.push(i);
      else if (val === 'X') dcTerms.push(i);
    }
  }

  const varList = varNames.slice(0, numVars).join(', ');
  
  return (
    <div className="modern-card">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          Complete Equation
        </h3>
      </div>
      <div className="p-5 overflow-x-auto py-8">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-xl sm:text-2xl" style={{ fontFamily: '"Cambria Math", "Times New Roman", serif' }}>
          <span className="italic">{funcName}</span>
          <span>({varList})</span>
          <span className="mx-1">=</span>
          
          {canonicalMode === 'SOP' ? (
            <>
              {mainTerms.length > 0 ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-4xl leading-none -mt-2">∑</span>
                  <span className="italic">m</span>
                  <span>({mainTerms.join(', ')})</span>
                </div>
              ) : (
                <span>0</span>
              )}
              
              {dcTerms.length > 0 && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="mx-1">+</span>
                  <span className="italic">d</span>
                  <span>({dcTerms.join(', ')})</span>
                </div>
              )}
            </>
          ) : (
            <>
              {mainTerms.length > 0 ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-4xl leading-none -mt-2">∏</span>
                  <span className="italic">M</span>
                  <span>({mainTerms.join(', ')})</span>
                </div>
              ) : (
                <span>1</span>
              )}
              
              {dcTerms.length > 0 && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="mx-1">·</span>
                  <span className="italic">D</span>
                  <span>({dcTerms.join(', ')})</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
