export interface Implicant {
  term: string; // e.g., "1-01"
  minterms: number[]; // e.g., [9, 13]
  used: boolean;
}

export interface QmStepTable {
  cubes: number; // 0 for 0-cubes, 1 for 1-cubes
  groups: Implicant[][];
}

export interface QmResult {
  stepTables: QmStepTable[];
  primeImplicants: Implicant[];
  piChart: { minterm: number; piIndices: number[] }[];
  essentialPIs: number[];
  finalEquationPIs: string[];
}

export function quineMcCluskey(minterms: number[], dontCares: number[], numVars: number): string[] {
  return getQuineMcCluskeySteps(minterms, dontCares, numVars).finalEquationPIs;
}

export function getQuineMcCluskeySteps(minterms: number[], dontCares: number[], numVars: number): QmResult {
  if (minterms.length === 0) {
    return {
      stepTables: [],
      primeImplicants: [],
      piChart: [],
      essentialPIs: [],
      finalEquationPIs: []
    };
  }
  if (minterms.length + dontCares.length === Math.pow(2, numVars)) {
    return {
      stepTables: [],
      primeImplicants: [{ term: "-".repeat(numVars), minterms: [...minterms, ...dontCares], used: false }],
      piChart: [],
      essentialPIs: [0],
      finalEquationPIs: ["-".repeat(numVars)]
    };
  }
  
  let groups: Implicant[][] = Array.from({ length: numVars + 1 }, () => []);
  const allTerms = [...minterms, ...dontCares];
  
  for (const m of allTerms) {
    const bin = m.toString(2).padStart(numVars, '0');
    const ones = (bin.match(/1/g) || []).length;
    if (groups[ones]) {
      groups[ones].push({ term: bin, minterms: [m], used: false });
    }
  }
  
  const primeImplicants: Implicant[] = [];
  const stepTables: QmStepTable[] = [];
  let cubeLevel = 0;
  
  while (groups.some(g => g.length > 0)) {
    const nextGroups: Implicant[][] = Array.from({ length: numVars + 1 }, () => []);
    const combinedSet = new Set<string>();
    
    for (let i = 0; i < groups.length - 1; i++) {
      for (const t1 of groups[i]) {
        for (const t2 of groups[i + 1]) {
          const diffIndex = getDiffIndex(t1.term, t2.term);
          if (diffIndex !== -1) {
            t1.used = true;
            t2.used = true;
            const newTerm = t1.term.substring(0, diffIndex) + '-' + t1.term.substring(diffIndex + 1);
            if (!combinedSet.has(newTerm)) {
              combinedSet.add(newTerm);
              const newMinterms = Array.from(new Set([...t1.minterms, ...t2.minterms])).sort((a, b) => a - b);
              const ones = (newTerm.match(/1/g) || []).length;
              nextGroups[ones].push({ term: newTerm, minterms: newMinterms, used: false });
            }
          }
        }
      }
    }
    
    // Save current step table (deep copy to capture 'used' state)
    // Only save if this level had any terms
    if (groups.some(g => g.length > 0)) {
      stepTables.push({
        cubes: cubeLevel,
        groups: groups.map(g => g.map(t => ({ ...t, minterms: [...t.minterms] })))
      });
    }
    
    for (const group of groups) {
      for (const t of group) {
        if (!t.used && !primeImplicants.some(pi => pi.term === t.term)) {
          primeImplicants.push({ ...t, minterms: [...t.minterms] });
        }
      }
    }
    
    groups = nextGroups;
    cubeLevel++;
  }
  
  const { finalEquationPIs, piChart, essentialPIs } = petricksMethodWithDetails(primeImplicants, minterms);
  
  return {
    stepTables,
    primeImplicants,
    piChart,
    essentialPIs,
    finalEquationPIs
  };
}

function getDiffIndex(t1: string, t2: string): number {
  let diffs = 0;
  let idx = -1;
  for (let i = 0; i < t1.length; i++) {
    if (t1[i] !== t2[i]) {
      diffs++;
      idx = i;
    }
  }
  return diffs === 1 ? idx : -1;
}

function petricksMethodWithDetails(primeImplicants: Implicant[], minterms: number[]) {
  if (minterms.length === 0) return { finalEquationPIs: [], piChart: [], essentialPIs: [] };

  const chart = new Map<number, number[]>();
  const piChartData: { minterm: number; piIndices: number[] }[] = [];
  
  minterms.forEach(m => {
    const pis = primeImplicants.map((pi, idx) => pi.minterms.includes(m) ? idx : -1).filter(idx => idx !== -1);
    chart.set(m, pis);
    piChartData.push({ minterm: m, piIndices: pis });
  });

  const essentialPIs: number[] = [];
  const uncoveredMinterms = new Set(minterms);

  let changed = true;
  while (changed) {
    changed = false;
    for (const m of Array.from(uncoveredMinterms)) {
      const pis = chart.get(m)!;
      if (pis.length === 1) {
        const epi = pis[0];
        if (!essentialPIs.includes(epi)) {
          essentialPIs.push(epi);
          for (const cm of primeImplicants[epi].minterms) {
            if (uncoveredMinterms.has(cm)) {
              uncoveredMinterms.delete(cm);
              changed = true;
            }
          }
        }
      }
    }
  }

  if (uncoveredMinterms.size === 0) {
    return {
      finalEquationPIs: essentialPIs.map(idx => primeImplicants[idx].term),
      piChart: piChartData,
      essentialPIs
    };
  }

  const remainingMinterms = Array.from(uncoveredMinterms);
  const pos: number[][] = remainingMinterms.map(m => chart.get(m)!);

  function multiply(sop1: number[][], sop2: number[][]): number[][] {
    let result: number[][] = [];
    for (const p1 of sop1) {
      for (const p2 of sop2) {
        const combined = Array.from(new Set([...p1, ...p2])).sort((a,b) => a-b);
        let isAbsorbed = false;
        
        const newResult: number[][] = [];
        for (const existing of result) {
          if (existing.every(x => combined.includes(x))) {
            isAbsorbed = true;
            newResult.push(existing);
          } else if (combined.every(x => existing.includes(x))) {
            // combined absorbs existing, so we don't keep existing
          } else {
            newResult.push(existing);
          }
        }
        if (!isAbsorbed) newResult.push(combined);
        result = newResult;
      }
    }
    return result;
  }

  const sops = pos.map(p => p.map(x => [x]));
  const resultSop = sops.reduce((acc, val) => multiply(acc, val));

  let minCost = Infinity;
  let minLength = Infinity;
  let bestPiCombo: number[] = [];

  for (const product of resultSop) {
    let cost = 0;
    for (const p of product) {
      cost += primeImplicants[p].term.split('').filter(c => c !== '-').length;
    }
    if (product.length < minLength || (product.length === minLength && cost < minCost)) {
      minLength = product.length;
      minCost = cost;
      bestPiCombo = product;
    }
  }

  return {
    finalEquationPIs: [...essentialPIs, ...bestPiCombo].map(idx => primeImplicants[idx].term),
    piChart: piChartData,
    essentialPIs
  };
}
