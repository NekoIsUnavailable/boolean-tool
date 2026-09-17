// Boolean Expression Evaluator

export function evaluateBooleanExpression(expr: string, numVars: number, _naming: 'letters' | 'subscripts'): number[] | null {
  try {
    // 1. Tokenize
    const tokens: string[] = [];
    let i = 0;
    while (i < expr.length) {
      const char = expr[i];
      if (/\s/.test(char)) {
        i++;
        continue;
      }
      
      // Match variables like x0, x1, or A, B
      let varMatch = expr.slice(i).match(/^[A-Za-z][0-9]*/);
      if (varMatch) {
        // Special case: 'v' in 'v' could be a variable, but what if it's 'v' from a word?
        // We assume expressions don't have random words.
        tokens.push(varMatch[0]);
        i += varMatch[0].length;
        continue;
      }
      
      if (char === "'" || char === "’") {
        tokens.push("NOT_POST");
      } else if (char === "!" || char === "~") {
        tokens.push("NOT_PRE");
      } else if (char === "+" || char === "|") {
        tokens.push("OR");
      } else if (char === "*" || char === "&" || char === ".") {
        tokens.push("AND");
      } else if (char === "^") {
        tokens.push("XOR");
      } else if (char === "(" || char === ")") {
        tokens.push(char);
      } else {
        // Unknown char, skip or treat as implicit something?
        // Let's just skip unknown chars like '=' if they passed through
      }
      i++;
    }

    if (tokens.length === 0) return null;

    // 2. Insert implicit ANDs
    // e.g. A B -> A AND B
    // A ( -> A AND (
    // ) A -> ) AND A
    // ' A -> ' AND A
    const finalTokens: string[] = [];
    for (let j = 0; j < tokens.length; j++) {
      if (j > 0) {
        const prev = tokens[j - 1];
        const curr = tokens[j];
        const prevIsValue = /^[A-Za-z]/.test(prev) || prev === "NOT_POST" || prev === ")";
        const currIsValue = /^[A-Za-z]/.test(curr) || curr === "NOT_PRE" || curr === "(";
        
        if (prevIsValue && currIsValue) {
          finalTokens.push("AND");
        }
      }
      finalTokens.push(tokens[j]);
    }

    // 3. Shunting Yard (Infix to Postfix)
    const precedence: Record<string, number> = {
      "NOT_PRE": 4,
      "NOT_POST": 4,
      "AND": 3,
      "XOR": 2,
      "OR": 1
    };

    const output: string[] = [];
    const ops: string[] = [];

    for (const t of finalTokens) {
      if (/^[A-Za-z]/.test(t)) {
        output.push(t);
      } else if (t === "NOT_PRE" || t === "NOT_POST") {
        ops.push(t);
      } else if (t === "AND" || t === "OR" || t === "XOR") {
        while (ops.length > 0 && ops[ops.length - 1] !== "(" && precedence[ops[ops.length - 1]] >= precedence[t]) {
          output.push(ops.pop()!);
        }
        ops.push(t);
      } else if (t === "(") {
        ops.push(t);
      } else if (t === ")") {
        while (ops.length > 0 && ops[ops.length - 1] !== "(") {
          output.push(ops.pop()!);
        }
        if (ops.length > 0 && ops[ops.length - 1] === "(") {
          ops.pop();
        }
      }
    }
    while (ops.length > 0) {
      output.push(ops.pop()!);
    }

    // 4. Evaluate for all 2^N combinations
    const minterms: number[] = [];
    const maxVal = 1 << numVars;
    
    // Extract unique variables from output to map them to bits
    const uniqueVars = Array.from(new Set(output.filter(t => /^[A-Za-z]/.test(t)))).sort();
    
    // Map variables to bit indices (0 to numVars-1).
    // If naming is letters, A -> numVars-1, B -> numVars-2, etc. (MSB to LSB)
    // If naming is subscripts, x0 -> numVars-1, x1 -> numVars-2, etc.
    const varToBit: Record<string, number> = {};
    if (uniqueVars.length > 0) {
        for (let i = 0; i < uniqueVars.length; i++) {
           // We assign bits from MSB (numVars - 1) down to 0
           // Assuming alphabetical order maps to MSB->LSB
           varToBit[uniqueVars[i]] = numVars - 1 - i;
        }
    }

    for (let m = 0; m < maxVal; m++) {
      const stack: boolean[] = [];
      for (const t of output) {
        if (/^[A-Za-z]/.test(t)) {
          // It's a variable
          const bitIdx = varToBit[t] ?? 0;
          const val = ((m >> bitIdx) & 1) === 1;
          stack.push(val);
        } else if (t === "NOT_PRE" || t === "NOT_POST") {
          const val = stack.pop()!;
          stack.push(!val);
        } else if (t === "AND") {
          const b = stack.pop()!;
          const a = stack.pop()!;
          stack.push(a && b);
        } else if (t === "OR") {
          const b = stack.pop()!;
          const a = stack.pop()!;
          stack.push(a || b);
        } else if (t === "XOR") {
          const b = stack.pop()!;
          const a = stack.pop()!;
          stack.push(a !== b);
        }
      }
      
      if (stack.length === 1 && stack[0] === true) {
        minterms.push(m);
      }
    }

    return minterms.length > 0 ? minterms : null;
  } catch (_e) {
    return null;
  }
}
