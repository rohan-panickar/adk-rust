export type DataBinding = { path: string };
export type FunctionCall = {
    call: string;
    args?: unknown[];
    returnType?: string;
};

export interface ResolveContext {
    dataModel: Record<string, unknown>;
    scope?: Record<string, unknown>;
    functions?: FunctionRegistry;
}

export type FunctionRegistry = Record<string, (args: unknown[], ctx: ResolveContext) => unknown>;

const DEFAULT_FUNCTIONS: FunctionRegistry = {
    now: () => new Date().toISOString(),
    concat: (args) => args.map((value) => stringifyValue(value)).join(''),
    add: (args) => args.reduce<number>((total, value) => total + toNumber(value), 0),
    formatString: (args, ctx) => formatString(String(args[0] ?? ''), ctx),
};

export function isDataBinding(value: unknown): value is DataBinding {
    return (
        typeof value === 'object'
        && value !== null
        && 'path' in value
        && typeof (value as { path?: unknown }).path === 'string'
        && Object.keys(value as object).length === 1
    );
}

export function isFunctionCall(value: unknown): value is FunctionCall {
    return (
        typeof value === 'object'
        && value !== null
        && 'call' in value
        && typeof (value as { call?: unknown }).call === 'string'
    );
}

export function resolvePath(
    dataModel: Record<string, unknown>,
    path: string,
    scope?: Record<string, unknown>,
): unknown {
    const source = path.startsWith('/') ? dataModel : (scope ?? dataModel);
    if (path === '/' || path.length === 0) {
        return source;
    }
    const tokens = path.replace(/^\//, '').split('/').filter(Boolean);
    let cursor: unknown = source;
    for (const token of tokens) {
        if (typeof cursor !== 'object' || cursor === null) {
            return undefined;
        }
        cursor = (cursor as Record<string, unknown>)[token];
    }
    return cursor;
}

export function resolveDynamicValue(
    value: unknown,
    dataModel: Record<string, unknown>,
    scope?: Record<string, unknown>,
    functions?: FunctionRegistry,
): unknown {
    if (isDataBinding(value)) {
        return resolvePath(dataModel, value.path, scope);
    }
    if (isFunctionCall(value)) {
        return evaluateFunctionCall(value, { dataModel, scope, functions });
    }
    return value;
}

export function resolveDynamicString(
    value: unknown,
    dataModel: Record<string, unknown>,
    scope?: Record<string, unknown>,
    functions?: FunctionRegistry,
): string {
    const resolved = resolveDynamicValue(value, dataModel, scope, functions);
    return stringifyValue(resolved);
}

function evaluateFunctionCall(call: FunctionCall, ctx: ResolveContext): unknown {
    const registry = { ...DEFAULT_FUNCTIONS, ...(ctx.functions ?? {}) };
    const fn = registry[call.call];
    if (!fn) {
        return undefined;
    }
    const args = (call.args ?? []).map((arg) =>
        resolveDynamicValue(arg, ctx.dataModel, ctx.scope, ctx.functions),
    );
    return fn(args, ctx);
}

function formatString(template: string, ctx: ResolveContext): string {
    let output = '';
    let index = 0;
    while (index < template.length) {
        if (template[index] === '\\' && template[index + 1] === '$' && template[index + 2] === '{') {
            output += '${';
            index += 3;
            continue;
        }
        if (template[index] === '$' && template[index + 1] === '{') {
            const { expression, nextIndex } = parseExpression(template, index + 2);
            const value = resolveExpression(expression, ctx);
            output += stringifyValue(value);
            index = nextIndex + 1;
            continue;
        }
        output += template[index];
        index += 1;
    }
    return output;
}

function parseExpression(source: string, startIndex: number): { expression: string; nextIndex: number } {
    let index = startIndex;
    let depth = 1;
    let inString: '"' | "'" | null = null;
    while (index < source.length) {
        const char = source[index];
        if (inString) {
            if (char === '\\') {
                index += 2;
                continue;
            }
            if (char === inString) {
                inString = null;
            }
            index += 1;
            continue;
        }
        if (char === '"' || char === "'") {
            inString = char;
            index += 1;
            continue;
        }
        if (char === '$' && source[index + 1] === '{') {
            depth += 1;
            index += 2;
            continue;
        }
        if (char === '}') {
            depth -= 1;
            if (depth === 0) {
                return { expression: source.slice(startIndex, index), nextIndex: index };
            }
        }
        index += 1;
    }
    return { expression: source.slice(startIndex), nextIndex: source.length - 1 };
}

function resolveExpression(expression: string, ctx: ResolveContext): unknown {
    const trimmed = expression.trim();
    if (trimmed.startsWith('/')) {
        return resolvePath(ctx.dataModel, trimmed, ctx.scope);
    }
    if (trimmed.length === 0) {
        return '';
    }
    const callMatch = /^([a-zA-Z_][\w]*)\((.*)\)$/.exec(trimmed);
    if (callMatch) {
        const [, name, rawArgs] = callMatch;
        const args = splitArgs(rawArgs).map((arg) => resolveArgument(arg, ctx));
        return evaluateFunctionCall({ call: name, args }, ctx);
    }
    return resolvePath(ctx.dataModel, trimmed, ctx.scope);
}

function splitArgs(raw: string): string[] {
    const args: string[] = [];
    let current = '';
    let depth = 0;
    let inString: '"' | "'" | null = null;
    for (let index = 0; index < raw.length; index += 1) {
        const char = raw[index];
        if (inString) {
            current += char;
            if (char === '\\') {
                current += raw[index + 1] ?? '';
                index += 1;
                continue;
            }
            if (char === inString) {
                inString = null;
            }
            continue;
        }
        if (char === '"' || char === "'") {
            inString = char;
            current += char;
            continue;
        }
        if (char === '(') {
            depth += 1;
            current += char;
            continue;
        }
        if (char === ')') {
            depth = Math.max(0, depth - 1);
            current += char;
            continue;
        }
        if (char === ',' && depth === 0) {
            args.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    if (current.trim().length > 0) {
        args.push(current.trim());
    }
    return args;
}

function resolveArgument(raw: string, ctx: ResolveContext): unknown {
    const trimmed = raw.trim();
    if (trimmed.startsWith('${') && trimmed.endsWith('}')) {
        return resolveExpression(trimmed.slice(2, -1), ctx);
    }
    if (trimmed.startsWith('/') || trimmed.match(/^[a-zA-Z_]/)) {
        const resolved = resolveExpression(trimmed, ctx);
        if (resolved !== undefined) {
            return resolved;
        }
    }
    if ((trimmed.startsWith('"') && trimmed.endsWith('"'))
        || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return unquote(trimmed);
    }
    if (trimmed === 'true') {
        return true;
    }
    if (trimmed === 'false') {
        return false;
    }
    if (trimmed === 'null') {
        return null;
    }
    if (trimmed.length === 0) {
        return undefined;
    }
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
        return numeric;
    }
    return trimmed;
}

function stringifyValue(value: unknown): string {
    if (value === null || typeof value === 'undefined') {
        return '';
    }
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    return JSON.stringify(value);
}

function toNumber(value: unknown): number {
    if (typeof value === 'number') {
        return value;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function unquote(value: string): string {
    const quote = value[0];
    const body = value.slice(1, -1);
    return body.replace(new RegExp(`\\\\${quote}`, 'g'), quote).replace(/\\\\/g, '\\');
}
