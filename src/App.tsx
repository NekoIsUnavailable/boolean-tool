import { useState, useEffect, useMemo, useRef } from 'react';
import { ConfigBar } from './components/ConfigBar';
import { ProblemInput } from './components/ProblemInput';
import { TermBuilder } from './components/TermBuilder';
import { CanonicalEquation } from './components/CanonicalEquation';
import { TruthTable } from './components/TruthTable';
import { KarnaughMap } from './components/KarnaughMap';
import { MinimizedEquation } from './components/MinimizedEquation';
import { LogicGateSchematic } from './components/LogicGateSchematic';
import { TabularMethod } from './components/TabularMethod';
import type { OutputState, Term } from './types';
import { getVarName } from './lib/utils';
import { quineMcCluskey } from './lib/quineMcCluskey';
import { useLocalStorage } from './hooks/useLocalStorage';

export interface SavedProblem {
  id: string;
  timestamp: number;
  funcName: string;
  numVars: 2 | 3 | 4 | 5 | 6;
  varNames: string[];
  canonicalMode: 'SOP' | 'POS';
  mintermVector: OutputState[];
  mainTermInputs: string[];
  dcInputs: string[];
}

import { HistoryPanel } from './components/HistoryPanel';

function App() {
  const [numVars, setNumVars] = useLocalStorage<2 | 3 | 4 | 5 | 6>('numVars', 4);
  const [namingMode, setNamingMode] = useLocalStorage<'letters' | 'subscripts'>('namingMode', 'letters');
  const [canonicalMode, setCanonicalMode] = useLocalStorage<'SOP' | 'POS'>('canonicalMode', 'SOP');
  const [funcName, setFuncName] = useLocalStorage('funcName', 'Z');
  
  const [mainTermInputs, setMainTermInputs] = useLocalStorage<string[]>('mainTermInputs', ['']);
  const [dcInputs, setDcInputs] = useLocalStorage<string[]>('dcInputs', ['']);
  const [isPOS, setIsPOS] = useLocalStorage('isPOS', false);

  const [history, setHistory] = useLocalStorage<SavedProblem[]>('problemHistory', []);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [varNames, setVarNames] = useLocalStorage<string[]>('varNames', ['A', 'B', 'C', 'D']);
  const prevNamingMode = useRef(namingMode);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const handleLoadHistory = (problem: SavedProblem) => {
    setNumVars(problem.numVars);
    setFuncName(problem.funcName);
    setCanonicalMode(problem.canonicalMode);
    setIsPOS(problem.canonicalMode === 'POS');
    setVarNames(problem.varNames);
    setMainTermInputs(problem.mainTermInputs);
    setDcInputs(problem.dcInputs);
    setMintermVector(problem.mintermVector);
    setIsBuilderDirty(false);
  };
  useEffect(() => {
    setVarNames(prev => {
      const isNamingModeChanged = prevNamingMode.current !== namingMode;
      prevNamingMode.current = namingMode;

      return Array.from({ length: numVars }).map((_, i) => {
        if (!isNamingModeChanged && prev[i] !== undefined) {
          return prev[i]; // Preserve existing custom name
        }
        return getVarName(i, namingMode); // Generate new name
      });
    });
  }, [numVars, namingMode]);

  const handleVarNameChange = (index: number, newName: string) => {
    setVarNames(prev => {
      const next = [...prev];
      next[index] = newName;
      return next;
    });
  };

  const [mintermVector, setMintermVector] = useLocalStorage<OutputState[]>('mintermVector', Array(64).fill('0'));
  const [builderTerms, setBuilderTerms] = useLocalStorage<Term[]>('builderTerms', []);
  const [isBuilderDirty, setIsBuilderDirty] = useState(false);
  const [hoveredTermIndex, setHoveredTermIndex] = useState<number | null>(null);

  // Derive Prime Implicants
  const primeImplicants = useMemo(() => {
    const activeLength = Math.pow(2, numVars);
    const activeVector = mintermVector.slice(0, activeLength);
    const minterms: number[] = [];
    const dontCares: number[] = [];
    
    if (canonicalMode === 'SOP') {
      activeVector.forEach((state, idx) => {
        if (state === '1') minterms.push(idx);
        if (state === 'X') dontCares.push(idx);
      });
    } else {
      activeVector.forEach((state, idx) => {
        if (state === '0') minterms.push(idx);
        if (state === 'X') dontCares.push(idx);
      });
    }

    return quineMcCluskey(minterms, dontCares, numVars);
  }, [mintermVector, numVars, canonicalMode]);

  // Sync mintermVector to builderTerms when mintermVector changes externally
  useEffect(() => {
    if (!isBuilderDirty) {
      const newTerms: Term[] = primeImplicants.map(pi => {
        if (!pi.includes('0') && !pi.includes('1')) {
          // all omitted
          return Array(numVars).fill('Omitted');
        }
        return pi.split('').map(c => {
          if (canonicalMode === 'SOP') {
            if (c === '1') return 'True';
            if (c === '0') return 'Inverted';
          } else {
            if (c === '0') return 'True';
            if (c === '1') return 'Inverted';
          }
          return 'Omitted';
        });
      });
      setBuilderTerms(newTerms);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primeImplicants, isBuilderDirty, numVars, canonicalMode]);

  // Sync builderTerms to mintermVector when builder changes
  const handleBuilderChange = (newTerms: Term[]) => {
    setBuilderTerms(newTerms);
    setIsBuilderDirty(true);

    const activeLength = Math.pow(2, numVars);
    const newVector: OutputState[] = Array(activeLength).fill(canonicalMode === 'SOP' ? '0' : '1');
    
    for (let m = 0; m < activeLength; m++) {
      const bin = m.toString(2).padStart(numVars, '0');
      let covered = false;
      for (const term of newTerms) {
        let termMatch = true;
        for (let i = 0; i < numVars; i++) {
          if (canonicalMode === 'SOP') {
            if (term[i] === 'True' && bin[i] !== '1') termMatch = false;
            if (term[i] === 'Inverted' && bin[i] !== '0') termMatch = false;
          } else {
            if (term[i] === 'True' && bin[i] !== '0') termMatch = false;
            if (term[i] === 'Inverted' && bin[i] !== '1') termMatch = false;
          }
        }
        if (termMatch) {
          covered = true;
          break;
        }
      }
      if (covered) {
        newVector[m] = canonicalMode === 'SOP' ? '1' : '0';
      }
    }
    
    const mergedVector = mintermVector.slice(0, activeLength).map((state, idx) => {
      const defaultValue = canonicalMode === 'SOP' ? '0' : '1';
      if (state === 'X' && newVector[idx] === defaultValue) return 'X';
      return newVector[idx];
    });

    setMintermVector(mergedVector);
  };

  const handleMintermChange = (index: number, newState: OutputState) => {
    setIsBuilderDirty(false); // They edited externally
    setMintermVector(prev => {
      const next = [...prev];
      next[index] = newState;
      return next;
    });
  };

  const handleProblemParse = (detectedVars: 2 | 3 | 4 | 5 | 6 | null, mainTerms: number[], dontCares: number[], isPOS: boolean, naming: 'letters' | 'subscripts' | null) => {
    let finalVars = numVars;
    
    // Auto-detect number of variables from the max minterm provided if not detected from string
    let maxTerm = Math.max(...mainTerms, ...dontCares, 0);
    if (detectedVars) {
      finalVars = detectedVars;
    } else {
      if (maxTerm > 31) finalVars = 6;
      else if (maxTerm > 15) finalVars = 5;
      else if (maxTerm > 7) finalVars = 4;
      else if (maxTerm > 3) finalVars = 3;
      else if (maxTerm > 1) finalVars = 2;
    }
    
    setNumVars(finalVars);
    setCanonicalMode(isPOS ? 'POS' : 'SOP');
    
    if (naming) {
      setNamingMode(naming);
    }

    const activeLength = Math.pow(2, finalVars);
    const newVector: OutputState[] = Array(64).fill(isPOS ? '1' : '0');
    
    mainTerms.forEach(m => {
      if (m < activeLength) newVector[m] = isPOS ? '0' : '1';
    });
    dontCares.forEach(m => {
      if (m < activeLength) newVector[m] = 'X';
    });
    
    setMintermVector(newVector);
    setIsBuilderDirty(false); // Let it resync from the new vector

    // Save to history
    setHistory(prev => {
      const newItem: SavedProblem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        funcName,
        numVars: finalVars,
        varNames: Array.from({ length: finalVars }).map((_, i) => getVarName(i, naming || namingMode)),
        canonicalMode: isPOS ? 'POS' : 'SOP',
        mintermVector: newVector,
        mainTermInputs,
        dcInputs
      };
      return [newItem, ...prev].slice(0, 50); // Keep last 50
    });
  };

  // Adjust vector size if numVars changes
  useEffect(() => {
    setMintermVector(prev => {
      if (prev.length === 64) return prev;
      const next = Array(64).fill(canonicalMode === 'SOP' ? '0' : '1');
      for (let i = 0; i < Math.min(prev.length, 64); i++) {
        next[i] = prev[i];
      }
      return next;
    });
  }, [numVars, canonicalMode]);

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6 md:p-8 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <header className="mb-6 sm:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 tracking-tight">Rene Baterboolean</h1>
            <p className="text-slate-500 mt-1 font-medium">Visual Logic Simplification</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {isInstallable && (
              <button 
                onClick={handleInstallClick}
                className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95"
              >
                Install App
              </button>
            )}
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-5 py-2.5 bg-white text-slate-700 font-semibold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              History
            </button>
          </div>
        </header>

        <HistoryPanel 
          isOpen={isHistoryOpen} 
          onClose={() => setIsHistoryOpen(false)} 
          history={history}
          onLoad={handleLoadHistory}
          onClear={() => setHistory([])}
        />

        <ProblemInput 
          currentNumVars={numVars} 
          varNames={varNames}
          onVarNameChange={handleVarNameChange}
          onRequestNumVarsChange={setNumVars}
          onParse={handleProblemParse} 
          funcName={funcName}
          setFuncName={setFuncName}
          mainTermInputs={mainTermInputs}
          setMainTermInputs={setMainTermInputs}
          dcInputs={dcInputs}
          setDcInputs={setDcInputs}
          isPOS={isPOS}
          setIsPOS={setIsPOS}
        />

        <ConfigBar
          numVars={numVars}
          setNumVars={setNumVars}
          namingMode={namingMode}
          setNamingMode={setNamingMode}
          canonicalMode={canonicalMode}
          setCanonicalMode={setCanonicalMode}
        />

        <TermBuilder
          terms={builderTerms}
          numVars={numVars}
          varNames={varNames}
          canonicalMode={canonicalMode}
          onChange={handleBuilderChange}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <TruthTable
              numVars={numVars}
              varNames={varNames}
              mintermVector={mintermVector}
              onChange={handleMintermChange}
            />
          </div>
          
          <div className="space-y-6">
            <CanonicalEquation
              numVars={numVars}
              varNames={varNames}
              mintermVector={mintermVector}
              canonicalMode={canonicalMode}
              funcName={funcName}
            />

            <KarnaughMap
              numVars={numVars}
              varNames={varNames}
              mintermVector={mintermVector}
              primeImplicants={primeImplicants}
              onChange={handleMintermChange}
              hoveredTermIndex={hoveredTermIndex}
              setHoveredTermIndex={setHoveredTermIndex}
            />
            
            <MinimizedEquation
              varNames={varNames}
              canonicalMode={canonicalMode}
              primeImplicants={primeImplicants}
              hoveredTermIndex={hoveredTermIndex}
              setHoveredTermIndex={setHoveredTermIndex}
              funcName={funcName}
            />
          </div>
        </div>

        <TabularMethod
          numVars={numVars}
          varNames={varNames}
          mintermVector={mintermVector}
        />

        <LogicGateSchematic
          numVars={numVars}
          varNames={varNames}
          canonicalMode={canonicalMode}
          primeImplicants={primeImplicants}
          funcName={funcName}
        />

      </div>
    </div>
  );
}

export default App;
