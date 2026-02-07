const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { A2uiStore, applyProtocolPayload, parseProtocolPayload } = require('../dist/index.js');

describe('Protocol payload adapter', () => {
    it('converts ag_ui custom surface events into A2UI messages', () => {
        const payload = {
            protocol: 'ag_ui',
            events: [
                { type: 'RUN_STARTED', threadId: 'thread-1', runId: 'run-1' },
                {
                    type: 'CUSTOM',
                    name: 'adk.ui.surface',
                    value: {
                        format: 'adk-ui-surface-v1',
                        surface: {
                            surfaceId: 'main',
                            catalogId: 'catalog',
                            components: [{ id: 'root', component: 'Column', children: [] }],
                            dataModel: { status: 'ok' },
                        },
                    },
                },
                { type: 'RUN_FINISHED', threadId: 'thread-1', runId: 'run-1' },
            ],
        };

        const parsed = parseProtocolPayload(payload);
        assert.equal(parsed.length, 3);
        assert.ok('createSurface' in parsed[0].message);
        assert.ok('updateDataModel' in parsed[1].message);
        assert.ok('updateComponents' in parsed[2].message);
    });

    it('converts mcp_apps html resource payload into A2UI messages and applies to store', () => {
        const surface = {
            surfaceId: 'main',
            catalogId: 'catalog',
            components: [{ id: 'root', component: 'Column', children: [] }],
            dataModel: { phase: 'ready' },
        };
        const html = `<!doctype html><html><body><script id="adk-ui-surface" type="application/json">${JSON.stringify(surface)}</script></body></html>`;
        const payload = {
            protocol: 'mcp_apps',
            payload: {
                resourceReadResponse: {
                    contents: [{ text: html }],
                },
            },
        };

        const store = new A2uiStore();
        const parsed = applyProtocolPayload(store, payload);
        assert.equal(parsed.length, 3);

        const state = store.getSurface('main');
        assert.ok(state);
        assert.equal(state.components.get('root').component, 'Column');
        assert.deepEqual(state.dataModel, { phase: 'ready' });
    });

    it('returns empty output for unsupported payloads', () => {
        const parsed = parseProtocolPayload({ protocol: 'unsupported' });
        assert.deepEqual(parsed, []);
    });
});
