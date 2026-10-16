/**
 * Sprint 37 - 37.3 Conditional branching expression evaluator.
 *
 * Evaluates a small, safe expression DSL against an execution context:
 *
 *   amount gt 500 && (department eq 'IT' | region in ['EU', 'US'])
 *
 * Supported operators:
 *   eq, ne, gt, gte, lt, lte, contains, in
 * Combinations: and/&&, or/||, not/!, parentheses.
 *
 * Values are read from the context using dot paths, e.g. `form.amount`.
 * Literals: numbers, single/double-quoted strings, booleans, arrays.
 */

type Any = any;

const OPERATORS = ['contains', 'gte', 'lte', 'gt', 'lt', 'eq', 'ne', 'in'];

function toComparable(v: Any): Any {
  if (typeof v === 'string') {
    const trimmed = v.trim().replace(/^(['"])(.*)\1$/, '$2');
    return trimmed;
  }
  if (v === 'true') return true;
  if (v === 'false') return false;
  return v;
}

function resolvePath(ctx: Any, path: string): Any {
  if (path === '') return undefined;
  const first = /^(['"]).*\1$/.test(path) ? path.slice(1, -1) : path;
  return first.split('.').reduce((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    return acc[key];
  }, ctx);
}

function applyOp(op: string, a: Any, b: Any): boolean {
  const av = toComparable(a);
  const bv = toComparable(b);
  switch (op) {
    case 'eq':
      return av === bv || String(av) === String(bv);
    case 'ne':
      return av !== bv && String(av) !== String(bv);
    case 'gt':
      return Number(av) > Number(bv);
    case 'gte':
      return Number(av) >= Number(bv);
    case 'lt':
      return Number(av) < Number(bv);
    case 'lte':
      return Number(av) <= Number(bv);
    case 'contains': {
      const hay = Array.isArray(av) ? av.join(' ') : String(av ?? '');
      return hay.toLowerCase().includes(String(bv ?? '').toLowerCase());
    }
    case 'in': {
      const list = Array.isArray(bv) ? bv : [bv];
      return list.some((item) => String(item) === String(av));
    }
    default:
      return false;
  }
}

class Tokenizer {
  pos = 0;
  constructor(private readonly src: string) {}

  private peek(): string {
    while (this.pos < this.src.length && /\s/.test(this.src[this.pos]))
      this.pos++;
    return this.src[this.pos];
  }

  next(): { type: string; value: Any } | null {
    const c = this.peek();
    if (c === undefined) return null;
    if (c === '(') {
      this.pos++;
      return { type: 'lparen', value: '(' };
    }
    if (c === ')') {
      this.pos++;
      return { type: 'rparen', value: ')' };
    }
    if (c === ',') {
      this.pos++;
      return { type: 'comma', value: ',' };
    }
    if (c === "'" || c === '"') {
      const quote = c;
      this.pos++;
      let out = '';
      while (this.pos < this.src.length && this.src[this.pos] !== quote) {
        out += this.src[this.pos];
        this.pos++;
      }
      this.pos++; // closing quote
      return { type: 'string', value: out };
    }
    if (/[0-9]/.test(this.src[this.pos])) {
      let out = '';
      while (this.pos < this.src.length && /[0-9.]/.test(this.src[this.pos])) {
        out += this.src[this.pos];
        this.pos++;
      }
      return { type: 'number', value: Number(out) };
    }
    if (c === '[') {
      this.pos++; // consume '['
      let raw = '';
      while (this.pos < this.src.length && this.src[this.pos] !== ']') {
        raw += this.src[this.pos];
        this.pos++;
      }
      this.pos++; // consume ']'
      const arr = raw
        .split(',')
        .map((s) => s.trim().replace(/^(['"])(.*)\1$/, '$2'))
        .filter((s) => s !== '');
      return { type: 'array', value: arr };
    }
    // identifier / operator / keyword
    let out = '';
    while (
      this.pos < this.src.length &&
      /[A-Za-z0-9_.]/.test(this.src[this.pos])
    ) {
      out += this.src[this.pos];
      this.pos++;
    }
    if (out === 'and') return { type: 'and', value: out };
    if (out === 'or') return { type: 'or', value: out };
    if (out === 'not') return { type: 'not', value: out };
    if (out === '&&' || out === '||' || out === '!') {
      return { type: out, value: out };
    }
    return { type: 'token', value: out };
  }
}

export class ExpressionParser {
  private tk: Tokenizer;
  private tkPos = 0;
  private tokens: { type: string; value: Any }[] = [];

  constructor(expr: string) {
    this.tk = new Tokenizer(expr);
    for (;;) {
      const t = this.tk.next();
      if (!t) break;
      this.tokens.push(t);
    }
  }

  private peek(): { type: string; value: Any } | null {
    return this.tokens[this.tkPos] ?? null;
  }
  private eat(): { type: string; value: Any } | null {
    return this.tokens[this.tkPos++];
  }

  parse(): Any {
    if (this.tokens.length === 0) return true;
    return this.orClause();
  }

  private orClause(): Any {
    let left = this.andClause();
    while (
      this.peek() &&
      (this.peek()!.type === 'or' || this.peek()!.value === '||')
    ) {
      this.eat();
      const right = this.andClause();
      left = { type: 'binop', op: 'or', left, right };
    }
    return left;
  }

  private andClause(): Any {
    let left = this.unary();
    while (
      this.peek() &&
      (this.peek()!.type === 'and' || this.peek()!.value === '&&')
    ) {
      this.eat();
      const right = this.unary();
      left = { type: 'binop', op: 'and', left, right };
    }
    return left;
  }

  private unary(): Any {
    if (
      this.peek() &&
      (this.peek()!.type === 'not' || this.peek()!.value === '!')
    ) {
      this.eat();
      return { type: 'not', operand: this.unary() };
    }
    return this.atom();
  }

  private atom(): Any {
    const t = this.eat();
    if (!t) return true;
    if (t.type === 'lparen') {
      const inner = this.orClause();
      this.eat(); // rparen
      return inner;
    }
    // comparison: token op value
    const opTok: { type: string; value: Any } | null =
      this.peek() && OPERATORS.includes(String(this.peek()!.value))
        ? this.peek()
        : null;
    if (opTok) {
      this.eat(); // op
      const valueTok = this.eat();
      return {
        type: 'predicate',
        field: String(t.value),
        op: String(opTok.value),
        value: valueTok?.value,
      };
    }
    // bare value -> its truthiness
    return { type: 'literal', value: t.value };
  }

  static evaluate(root: Any, ctx: Any): boolean {
    if (root === undefined || root === null) return false;
    if (root === true || root === false) return root;
    switch (root.type) {
      case 'literal':
        return !!toComparable(root.value);
      case 'binop': {
        const l = ExpressionParser.evaluate(root.left, ctx);
        const r = ExpressionParser.evaluate(root.right, ctx);
        return root.op === 'and' ? l && r : l || r;
      }
      case 'not':
        return !ExpressionParser.evaluate(root.operand, ctx);
      case 'predicate':
        return applyOp(
          root.op,
          toComparable(resolvePath(ctx, root.field)),
          toComparable(root.value),
        );
      default:
        return !!ExpressionParser.evaluate(root, ctx);
    }
  }
}

/** Convenience entry point. */
export function evaluateCondition(expression: string, ctx: Any): boolean {
  if (!expression) return true;
  const parser = new ExpressionParser(expression);
  return ExpressionParser.evaluate(parser.parse(), ctx || {});
}
