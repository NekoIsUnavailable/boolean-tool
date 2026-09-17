const numVars = 5;
const railSpacing = 40;
const startX = 60;
const railStartY = 40;
const termSpacing = 80;
const andGateX = startX + numVars * railSpacing + 60;

const pis = ['-0-0-', '---10'];
pis.forEach((pi, piIdx) => {
  const y = railStartY + 40 + piIdx * termSpacing;
  const literals = pi.split('').map((c, i) => ({ c, i })).filter(x => x.c !== '-');
  const numLiterals = literals.length;
  
  const inputsY = literals.map((_, idx) => y - (numLiterals - 1) * 6 + idx * 12);
  
  console.log('PI:', pi);
  literals.forEach((lit, idx) => {
    const railX = startX + lit.i * railSpacing + (lit.c === '0' ? 15 : 0);
    console.log(`  Lit ${lit.i}: M ${railX} ${inputsY[idx]} L ${andGateX - 20} ${inputsY[idx]}`);
  });
});
