const subscripts = ['₀', '₁', '₂', '₃', '₄', '₅', '₆'];

export function getVarName(index: number, mode: 'letters' | 'subscripts'): string {
  if (mode === 'letters') return String.fromCharCode(65 + index);
  return `X${subscripts[index]}`;
}

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
