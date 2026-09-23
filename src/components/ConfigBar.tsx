import React from 'react';

interface ConfigBarProps {
  numVars: 2 | 3 | 4 | 5 | 6;
  setNumVars: (n: 2 | 3 | 4 | 5 | 6) => void;
  namingMode: 'letters' | 'subscripts';
  setNamingMode: (mode: 'letters' | 'subscripts') => void;
  canonicalMode: 'SOP' | 'POS';
  setCanonicalMode: (mode: 'SOP' | 'POS') => void;
}

export const ConfigBar: React.FC<ConfigBarProps> = ({
  numVars, setNumVars,
  namingMode, setNamingMode,
  canonicalMode, setCanonicalMode
}) => {
  return (
    <div className="modern-card p-4 flex flex-wrap gap-6 items-center justify-between">
      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-slate-700">Variables:</label>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => setNumVars(n as 2 | 3 | 4 | 5 | 6)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${numVars === n ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-slate-700">Naming Mode:</label>
        <select
          value={namingMode}
          onChange={(e) => setNamingMode(e.target.value as 'letters' | 'subscripts')}
          className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="letters">Letters (A, B, C, D)</option>
          <option value="subscripts">Subscripts (X₁, X₂, X₃, X₄)</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-slate-700">Form:</label>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {['SOP', 'POS'].map((mode) => (
            <button
              key={mode}
              onClick={() => setCanonicalMode(mode as 'SOP' | 'POS')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${canonicalMode === mode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {mode === 'SOP' ? 'SOP (Σm)' : 'POS (ΠM)'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
