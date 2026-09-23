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

  const handleNumVarsChange = (newNumVars: 2 | 3 | 4 | 5 | 6) => {
    setNumVars(newNumVars);
    
    // Cleanup minterm and don't care inputs so they don't force it back up
    const maxAllowed = Math.pow(2, newNumVars) - 1;
    
    setMainTermInputs(prev => {
      const filtered = prev.filter(s => {
        if (s === '') return true;
        const n = parseInt(s);
        return !isNaN(n) && n <= maxAllowed;
      });
      if (filtered.length === 0 || filtered[filtered.length - 1] !== '') filtered.push('');
      return filtered;
    });
    
    setDcInputs(prev => {
      const filtered = prev.filter(s => {
        if (s === '') return true;
        const n = parseInt(s);
        return !isNaN(n) && n <= maxAllowed;
      });
      if (filtered.length === 0 || filtered[filtered.length - 1] !== '') filtered.push('');
      return filtered;
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

  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen pb-12 transition-colors duration-300">
      <HistoryPanel 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history}
        onLoad={handleLoadHistory}
        onClear={() => setHistory([])}
      />

      {/* ── Sticky Header ─────────────────────────── */}
      <header className="sticky top-0 z-40 card-glass border-b border-white/40 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 leading-tight">Rene Baterboolean</h1>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium -mt-0.5 hidden sm:block">Visual Logic Simplification</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="pill text-xs px-2 sm:px-3"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <a 
              href="https://github.com/NekoIsUnavailable/boolean-tool/releases/download/latest/Rene-Baterboolean.apk"
              className="pill text-xs hidden sm:flex items-center"
            >
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Get APK
            </a>
            {isInstallable && (
              <button 
                onClick={handleInstallClick}
                className="pill pill-active text-xs"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Install
              </button>
            )}
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="pill text-xs"
            >
              <svg className="w-3.5 h-3.5 mr-1 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span className="hidden sm:inline">History</span>
            </button>
          </div>
        </div>
      </header>
        
      {/* ── Main Content ──────────────────────────── */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 pt-5 sm:pt-8 space-y-4 sm:space-y-6">

        <div className="animate-section">
          <ProblemInput 
            currentNumVars={numVars} 
            varNames={varNames}
            onVarNameChange={handleVarNameChange}
            onRequestNumVarsChange={handleNumVarsChange}
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
        </div>

        <div className="animate-section">
          <ConfigBar
            numVars={numVars}
            setNumVars={handleNumVarsChange}
            namingMode={namingMode}
            setNamingMode={setNamingMode}
            canonicalMode={canonicalMode}
            setCanonicalMode={setCanonicalMode}
          />
        </div>

        <div className="animate-section">
          <TermBuilder
            terms={builderTerms}
            numVars={numVars}
            varNames={varNames}
            canonicalMode={canonicalMode}
            onChange={handleBuilderChange}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4 sm:space-y-6 animate-section">
            <TruthTable
              numVars={numVars}
              varNames={varNames}
              mintermVector={mintermVector}
              onChange={handleMintermChange}
            />
          </div>
          
          <div className="space-y-4 sm:space-y-6 animate-section">
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

        <div className="animate-section">
          <TabularMethod
            numVars={numVars}
            varNames={varNames}
            mintermVector={mintermVector}
          />
        </div>

        <div className="animate-section">
          <LogicGateSchematic
            numVars={numVars}
            varNames={varNames}
            canonicalMode={canonicalMode}
            primeImplicants={primeImplicants}
            funcName={funcName}
          />
        </div>
        
        <div className="text-center pt-8 pb-4 sm:hidden">
          <a href="https://github.com/NekoIsUnavailable/boolean-tool/releases/download/latest/Rene-Baterboolean.apk" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none font-semibold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Download Android APK
          </a>
        </div>

      </main>
    </div>
  );
}

export default App;
