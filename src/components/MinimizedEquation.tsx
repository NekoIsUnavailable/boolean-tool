import React from 'react';

interface MinimizedEquationProps {
  varNames: string[];
  canonicalMode: 'SOP' | 'POS';
  primeImplicants: string[];
  hoveredTermIndex: number | null;
  setHoveredTermIndex: (idx: number | null) => void;
  funcName: string;
}

const groupColors = [
  'bg-red-100 text-red-800 border-red-300',
  'bg-blue-100 text-blue-800 border-blue-300',
  'bg-green-100 text-green-800 border-green-300',
  'bg-yellow-100 text-yellow-800 border-yellow-300',
  'bg-purple-100 text-purple-800 border-purple-300',
  'bg-pink-100 text-pink-800 border-pink-300',
  'bg-teal-100 text-teal-800 border-teal-300',
  'bg-orange-100 text-orange-800 border-orange-300'
];

export const MinimizedEquation: React.FC<MinimizedEquationProps> = ({
  varNames,
  canonicalMode,
  primeImplicants,
  hoveredTermIndex,
  setHoveredTermIndex,
  funcName
}) => {
  const renderTerm = (term: string) => {
    if (!term.includes('0') && !term.includes('1')) {
      return <span>{canonicalMode === 'SOP' ? '1' : '0'}</span>;
    }
    
    const isSOP = canonicalMode === 'SOP';
    const elements: React.ReactNode[] = [];
    
    term.split('').forEach((char, i) => {
      if (char === '-') return;
      const vName = varNames[i] || '';
      if (char === (isSOP ? '1' : '0')) {
        elements.push(<span key={i} className="text-blue-700 font-medium">{vName}</span>);
      } else {
        elements.push(
          <span key={i} className="inline-block px-[1px]">
            <span className="relative text-red-600 font-medium">
              <span className="absolute -top-[1px] left-0 right-0 h-[1.5px] bg-red-600"></span>
              {vName}
            </span>
          </span>
        );
      }
    });

    if (elements.length === 0) return null;
    if (!isSOP && elements.length > 1) {
      return (
        <span className="text-slate-800">
          <span className="text-slate-400 font-light mr-0.5">(</span>
          {elements.map((el, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-slate-400 mx-1 font-light">+</span>}
              {el}
            </React.Fragment>
          ))}
          <span className="text-slate-400 font-light ml-0.5">)</span>
        </span>
      );
    }
    return <span className="text-slate-800">{elements}</span>;
  };

  if (primeImplicants.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">Minimized Output</h2>
        <div className="text-2xl font-serif text-slate-400">{canonicalMode === 'SOP' ? '0' : '1'}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold mb-4">Minimized Output</h2>
      
      <div className="flex flex-wrap items-center gap-2 text-2xl font-serif mb-6">
        <span className="font-sans font-bold text-slate-700 mr-2">{funcName} =</span>
        {primeImplicants.map((pi, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="text-slate-400 font-sans mx-1">{canonicalMode === 'SOP' ? '+' : '\u00B7'}</span>}
            <span
              onMouseEnter={() => setHoveredTermIndex(idx)}
              onMouseLeave={() => setHoveredTermIndex(null)}
              className={`px-3 py-1 border rounded-lg cursor-pointer transition-all ${groupColors[idx % groupColors.length]} ${hoveredTermIndex === idx ? 'ring-2 ring-black scale-105 shadow-md' : 'shadow-sm'}`}
            >
              {renderTerm(pi)}
            </span>
          </React.Fragment>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100">
        <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Legend</h3>
        <div className="flex flex-wrap gap-2">
          {primeImplicants.map((pi, idx) => {
            const count = pi.split('').filter(c => c === '-').length;
            const groupSize = Math.pow(2, count);
            const groupName = groupSize === 1 ? 'Single' : groupSize === 2 ? 'Pair' : groupSize === 4 ? 'Quad' : groupSize === 8 ? 'Octet' : 'Group';
            
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredTermIndex(idx)}
                onMouseLeave={() => setHoveredTermIndex(null)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border cursor-pointer transition-all ${groupColors[idx % groupColors.length]} ${hoveredTermIndex === idx ? 'ring-1 ring-black shadow-sm' : ''}`}
              >
                <div className="font-semibold text-xs opacity-75 uppercase tracking-wider">
                  {groupName} {idx + 1}
                </div>
                <div className="font-serif font-medium flex items-center">
                  {renderTerm(pi)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
