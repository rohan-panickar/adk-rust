import React, { createContext, useContext, useState } from 'react';
import clsx from 'clsx';
import Markdown from 'react-markdown';
import { AlertCircle, CheckCircle, Info, XCircle, User, Mail, Calendar } from 'lucide-react';

import type { FunctionRegistry } from './bindings';
import { isDataBinding, resolveDynamicString, resolveDynamicValue, resolvePath } from './bindings';
import { buildActionEvent } from './events';
import type { A2uiActionDefinition, A2uiActionEventPayload } from './events';
import type { A2uiComponent, A2uiStore } from './store';

const IconMap: Record<string, React.ComponentType<any>> = {
    'alert-circle': AlertCircle,
    'check-circle': CheckCircle,
    'info': Info,
    'x-circle': XCircle,
    'user': User,
    'mail': Mail,
    'calendar': Calendar,
};

type ChildList = string[] | { componentId: string; path: string };

interface A2uiRenderContextValue {
    store: A2uiStore;
    surfaceId: string;
    dataModel: Record<string, unknown>;
    onAction?: (payload: A2uiActionEventPayload) => void;
    functions?: FunctionRegistry;
    bumpVersion: () => void;
}

const A2uiRenderContext = createContext<A2uiRenderContextValue | null>(null);

export interface A2uiSurfaceRendererProps {
    store: A2uiStore;
    surfaceId: string;
    rootId?: string;
    onAction?: (payload: A2uiActionEventPayload) => void;
    theme?: 'light' | 'dark' | 'system';
    functions?: FunctionRegistry;
}

export const A2uiSurfaceRenderer: React.FC<A2uiSurfaceRendererProps> = ({
    store,
    surfaceId,
    rootId = 'root',
    onAction,
    theme,
    functions,
}) => {
    const surface = store.getSurface(surfaceId);
    const [version, setVersion] = useState(0);

    const bumpVersion = React.useCallback(() => {
        setVersion((prev) => prev + 1);
    }, []);

    if (!surface) {
        return null;
    }

    const dataModel = surface.dataModel ?? {};
    const isDark = theme === 'dark';

    return (
        <A2uiRenderContext.Provider
            value={{
                store,
                surfaceId,
                dataModel,
                onAction,
                functions,
                bumpVersion,
            }}
        >
            <div className={isDark ? 'dark' : ''} data-version={version}>
                <A2uiComponentRenderer componentId={rootId} />
            </div>
        </A2uiRenderContext.Provider>
    );
};

const A2uiComponentRenderer: React.FC<{ componentId: string; scope?: Record<string, unknown> }> = ({
    componentId,
    scope,
}) => {
    const ctx = useContext(A2uiRenderContext);
    if (!ctx) {
        return null;
    }
    const surface = ctx.store.getSurface(ctx.surfaceId);
    const component = surface?.components.get(componentId);
    if (!component) {
        return null;
    }

    return (
        <A2uiComponentView
            component={component}
            scope={scope}
        />
    );
};

const A2uiComponentView: React.FC<{ component: A2uiComponent; scope?: Record<string, unknown> }> = ({
    component,
    scope,
}) => {
    const ctx = useContext(A2uiRenderContext);
    if (!ctx) {
        return null;
    }

    const resolveString = (value: unknown) =>
        resolveDynamicString(value, ctx.dataModel, scope, ctx.functions);

    const resolveValue = (value: unknown) =>
        resolveDynamicValue(value, ctx.dataModel, scope, ctx.functions);

    const renderChildList = (children: ChildList | undefined) => {
        if (!children) return null;
        if (Array.isArray(children)) {
            return children.map((childId) => (
                <A2uiComponentRenderer key={childId} componentId={childId} scope={scope} />
            ));
        }
        const items = resolvePath(ctx.dataModel, children.path, scope);
        if (!Array.isArray(items)) {
            return null;
        }
        return items.map((item, index) => {
            const itemScope = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {};
            const key = (itemScope && 'id' in itemScope && typeof itemScope.id === 'string') ? itemScope.id : `${children.componentId}-${index}`;
            return (
                <A2uiComponentRenderer
                    key={key}
                    componentId={children.componentId}
                    scope={itemScope}
                />
            );
        });
    };

    const baseComponent = component.component;

    switch (baseComponent) {
        case 'Text': {
            const text = resolveString(component.text);
            const variant = component.variant as string | undefined;
            if (variant === 'body' || !variant) {
                return (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                        <Markdown>{text}</Markdown>
                    </div>
                );
            }
            const Tag = variant === 'h1' ? 'h1'
                : variant === 'h2' ? 'h2'
                    : variant === 'h3' ? 'h3'
                        : variant === 'h4' ? 'h4'
                            : variant === 'code' ? 'code'
                                : 'p';
            const classes = clsx({
                'text-4xl font-bold mb-4 dark:text-white': variant === 'h1',
                'text-3xl font-bold mb-3 dark:text-white': variant === 'h2',
                'text-2xl font-bold mb-2 dark:text-white': variant === 'h3',
                'text-xl font-bold mb-2 dark:text-white': variant === 'h4',
                'font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded dark:text-gray-100': variant === 'code',
                'text-sm text-gray-500 dark:text-gray-400': variant === 'caption',
            });
            return <Tag className={classes}>{text}</Tag>;
        }
        case 'Image': {
            const url = resolveString(component.url);
            const alt = resolveString(component.alt ?? '');
            const fit = component.fit as string | undefined;
            const style = fit ? { objectFit: fit as React.CSSProperties['objectFit'] } : undefined;
            return <img src={url} alt={alt} style={style} className="max-w-full h-auto" />;
        }
        case 'Icon': {
            const name = String(component.name ?? 'info');
            const Icon = IconMap[name] || Info;
            const size = typeof component.size === 'number' ? component.size : 24;
            return <Icon size={size} />;
        }
        case 'Row':
        case 'Column': {
            const justify = component.justify as string | undefined;
            const align = component.align as string | undefined;
            const flexDirection = baseComponent === 'Row' ? 'row' : 'column';
            const style: React.CSSProperties = {
                display: 'flex',
                flexDirection,
                justifyContent: mapJustify(justify),
                alignItems: mapAlign(align),
                gap: 12,
            };
            return (
                <div style={style}>
                    {renderChildList(component.children as ChildList)}
                </div>
            );
        }
        case 'List': {
            const direction = component.direction as string | undefined;
            const style: React.CSSProperties = {
                display: 'flex',
                flexDirection: direction === 'horizontal' ? 'row' : 'column',
                gap: 12,
            };
            return (
                <div style={style}>
                    {renderChildList(component.children as ChildList)}
                </div>
            );
        }
        case 'Card': {
            const childId = component.child as string;
            return (
                <div className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700 shadow-sm overflow-hidden mb-4 p-4">
                    <A2uiComponentRenderer componentId={childId} scope={scope} />
                </div>
            );
        }
        case 'Divider': {
            const axis = component.axis as string | undefined;
            return axis === 'vertical'
                ? <div className="w-px bg-gray-200 dark:bg-gray-700 self-stretch mx-2" />
                : <div className="h-px bg-gray-200 dark:bg-gray-700 w-full my-2" />;
        }
        case 'Tabs': {
            const tabs = (component.tabs as Array<{ title: unknown; child: string }>) ?? [];
            return (
                <A2uiTabs
                    tabs={tabs}
                    scope={scope}
                />
            );
        }
        case 'Modal': {
            const triggerId = component.trigger as string;
            const contentId = component.content as string;
            return (
                <A2uiModal
                    triggerId={triggerId}
                    contentId={contentId}
                    scope={scope}
                />
            );
        }
        case 'Button': {
            const childId = component.child as string;
            const variant = component.variant as string | undefined;
            const action = component.action as A2uiActionDefinition | undefined;
            const btnClasses = clsx('px-4 py-2 rounded font-medium transition-colors', {
                'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary' || !variant,
                'bg-transparent text-blue-600 hover:text-blue-700': variant === 'borderless',
            });
            return (
                <button
                    type="button"
                    className={btnClasses}
                    onClick={() => {
                        const event = buildActionEvent(action, ctx.surfaceId, component.id, {
                            dataModel: ctx.dataModel,
                            scope,
                            functions: ctx.functions,
                        });
                        if (event) {
                            ctx.onAction?.(event);
                        }
                    }}
                >
                    <A2uiComponentRenderer componentId={childId} scope={scope} />
                </button>
            );
        }
        case 'CheckBox': {
            const label = resolveString(component.label);
            const value = Boolean(resolveValue(component.value));
            const bindingPath = isDataBinding(component.value) ? component.value.path : undefined;
            return (
                <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                        type="checkbox"
                        checked={value}
                        onChange={(event) => {
                            if (bindingPath) {
                                ctx.store.applyUpdateDataModel(ctx.surfaceId, bindingPath, event.currentTarget.checked);
                                ctx.bumpVersion();
                            }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {label}
                </label>
            );
        }
        case 'TextField': {
            const label = resolveString(component.label);
            const variant = component.variant as string | undefined;
            const bindingPath = isDataBinding(component.value) ? component.value.path : undefined;
            const resolved = resolveValue(component.value);
            const value = typeof resolved === 'string' ? resolved : resolved ?? '';
            if (variant === 'longText') {
                return (
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                        <textarea
                            value={String(value)}
                            onChange={(event) => {
                                if (bindingPath) {
                                    ctx.store.applyUpdateDataModel(ctx.surfaceId, bindingPath, event.currentTarget.value);
                                    ctx.bumpVersion();
                                }
                            }}
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            rows={4}
                        />
                    </div>
                );
            }
            const inputType = variant === 'obscured' ? 'password' : variant === 'number' ? 'number' : 'text';
            return (
                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                    <input
                        type={inputType}
                        value={String(value)}
                        onChange={(event) => {
                            if (bindingPath) {
                                const nextValue = inputType === 'number' ? event.currentTarget.valueAsNumber : event.currentTarget.value;
                                ctx.store.applyUpdateDataModel(ctx.surfaceId, bindingPath, Number.isNaN(nextValue as number) ? event.currentTarget.value : nextValue);
                                ctx.bumpVersion();
                            }
                        }}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                </div>
            );
        }
        case 'ChoicePicker': {
            const label = resolveString(component.label ?? '');
            const options = (component.options as Array<{ label: unknown; value: string }>) ?? [];
            const variant = component.variant as string | undefined;
            const bindingPath = isDataBinding(component.value) ? component.value.path : undefined;
            const resolved = resolveValue(component.value);
            const values = Array.isArray(resolved) ? resolved.map(String) : [];
            if (variant === 'mutuallyExclusive') {
                return (
                    <div className="mb-3">
                        {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
                        <select
                            value={values[0] ?? ''}
                            onChange={(event) => {
                                if (bindingPath) {
                                    ctx.store.applyUpdateDataModel(ctx.surfaceId, bindingPath, [event.currentTarget.value]);
                                    ctx.bumpVersion();
                                }
                            }}
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">Select...</option>
                            {options.map((opt, i) => (
                                <option key={i} value={opt.value}>{resolveString(opt.label)}</option>
                            ))}
                        </select>
                    </div>
                );
            }
            return (
                <div className="mb-3">
                    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
                    <select
                        multiple
                        value={values}
                        onChange={(event) => {
                            if (bindingPath) {
                                const selected = Array.from(event.currentTarget.selectedOptions).map((opt) => opt.value);
                                ctx.store.applyUpdateDataModel(ctx.surfaceId, bindingPath, selected);
                                ctx.bumpVersion();
                            }
                        }}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                        {options.map((opt, i) => (
                            <option key={i} value={opt.value}>{resolveString(opt.label)}</option>
                        ))}
                    </select>
                </div>
            );
        }
        case 'Slider': {
            const label = resolveString(component.label ?? '');
            const bindingPath = isDataBinding(component.value) ? component.value.path : undefined;
            const resolved = resolveValue(component.value);
            const value = typeof resolved === 'number' ? resolved : Number(resolved ?? 0);
            const min = typeof component.min === 'number' ? component.min : 0;
            const max = typeof component.max === 'number' ? component.max : 100;
            return (
                <div className="mb-3">
                    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
                    <input
                        type="range"
                        min={min}
                        max={max}
                        value={Number.isNaN(value) ? min : value}
                        onChange={(event) => {
                            if (bindingPath) {
                                ctx.store.applyUpdateDataModel(ctx.surfaceId, bindingPath, event.currentTarget.valueAsNumber);
                                ctx.bumpVersion();
                            }
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            );
        }
        case 'DateTimeInput': {
            const label = resolveString(component.label ?? '');
            const bindingPath = isDataBinding(component.value) ? component.value.path : undefined;
            const resolved = resolveValue(component.value);
            const value = typeof resolved === 'string' ? resolved : '';
            const enableDate = component.enableDate !== false;
            const enableTime = component.enableTime !== false;
            const inputType = enableDate && enableTime ? 'datetime-local' : enableDate ? 'date' : 'time';
            return (
                <div className="mb-3">
                    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
                    <input
                        type={inputType}
                        value={value}
                        onChange={(event) => {
                            if (bindingPath) {
                                ctx.store.applyUpdateDataModel(ctx.surfaceId, bindingPath, event.currentTarget.value);
                                ctx.bumpVersion();
                            }
                        }}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                </div>
            );
        }
        case 'Video': {
            const url = resolveString(component.url);
            return (
                <video src={url} controls className="w-full rounded-md" />
            );
        }
        case 'AudioPlayer': {
            const url = resolveString(component.url);
            return (
                <audio src={url} controls className="w-full" />
            );
        }
        default:
            return null;
    }
};

const A2uiModal: React.FC<{ triggerId: string; contentId: string; scope?: Record<string, unknown> }> = ({
    triggerId,
    contentId,
    scope,
}) => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <span onClick={() => setOpen(true)} className="inline-block cursor-pointer">
                <A2uiComponentRenderer componentId={triggerId} scope={scope} />
            </span>
            {open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-lg w-full">
                        <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Modal</div>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                type="button"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <A2uiComponentRenderer componentId={contentId} scope={scope} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const A2uiTabs: React.FC<{ tabs: Array<{ title: unknown; child: string }>; scope?: Record<string, unknown> }> = ({
    tabs,
    scope,
}) => {
    const ctx = useContext(A2uiRenderContext);
    const [activeTab, setActiveTab] = useState(0);

    if (!ctx) {
        return null;
    }

    const resolveString = (value: unknown) =>
        resolveDynamicString(value, ctx.dataModel, scope, ctx.functions);

    return (
        <div className="mb-4">
            <div className="border-b border-gray-200">
                <nav className="flex space-x-4">
                    {tabs.map((tab, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveTab(i)}
                            className={clsx('px-4 py-2 border-b-2 font-medium text-sm transition-colors', {
                                'border-blue-600 text-blue-600': activeTab === i,
                                'border-transparent text-gray-500 hover:text-gray-700': activeTab !== i,
                            })}
                        >
                            {resolveString(tab.title)}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="p-4">
                {tabs[activeTab]?.child && (
                    <A2uiComponentRenderer componentId={tabs[activeTab].child} scope={scope} />
                )}
            </div>
        </div>
    );
};

function mapJustify(value: string | undefined) {
    switch (value) {
        case 'center':
            return 'center';
        case 'end':
            return 'flex-end';
        case 'spaceAround':
            return 'space-around';
        case 'spaceBetween':
            return 'space-between';
        case 'spaceEvenly':
            return 'space-evenly';
        case 'stretch':
            return 'stretch';
        case 'start':
        default:
            return 'flex-start';
    }
}

function mapAlign(value: string | undefined) {
    switch (value) {
        case 'center':
            return 'center';
        case 'end':
            return 'flex-end';
        case 'stretch':
            return 'stretch';
        case 'start':
        default:
            return 'flex-start';
    }
}
