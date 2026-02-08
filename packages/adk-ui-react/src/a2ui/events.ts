import type { FunctionCall, FunctionRegistry } from './bindings';
import { resolveDynamicValue } from './bindings';

export type A2uiActionEventDefinition = {
    name: string;
    context?: Record<string, unknown>;
};

export type A2uiActionDefinition = {
    event?: A2uiActionEventDefinition;
    functionCall?: FunctionCall;
};

export type A2uiActionEventPayload = {
    action: {
        name: string;
        surfaceId: string;
        sourceComponentId: string;
        timestamp: string;
        context: Record<string, unknown>;
    };
};

export interface ActionEventOptions {
    dataModel: Record<string, unknown>;
    scope?: Record<string, unknown>;
    functions?: FunctionRegistry;
    timestamp?: Date;
}

export function buildActionEvent(
    action: A2uiActionDefinition | undefined,
    surfaceId: string,
    sourceComponentId: string,
    options: ActionEventOptions,
): A2uiActionEventPayload | null {
    if (!action?.event?.name) {
        return null;
    }
    const context = resolveActionContext(action.event.context ?? {}, options);
    return {
        action: {
            name: action.event.name,
            surfaceId,
            sourceComponentId,
            timestamp: (options.timestamp ?? new Date()).toISOString(),
            context,
        },
    };
}

function resolveActionContext(
    context: Record<string, unknown>,
    options: ActionEventOptions,
) {
    const resolved: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(context)) {
        resolved[key] = resolveDynamicValue(
            value,
            options.dataModel,
            options.scope,
            options.functions,
        );
    }
    return resolved;
}
