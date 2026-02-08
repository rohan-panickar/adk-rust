const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { buildActionEvent } = require('../dist/index.js');

describe('A2ui events', () => {
    it('builds action events with resolved context', () => {
        const event = buildActionEvent(
            {
                event: {
                    name: 'submitForm',
                    context: {
                        userId: { path: '/user/id' },
                        literal: 'ok',
                        score: { call: 'add', args: [1, { path: '/score' }] },
                    },
                },
            },
            'main',
            'submit_button',
            {
                dataModel: { user: { id: 'u-1' }, score: 2 },
                timestamp: new Date('2026-01-25T12:00:00Z'),
            },
        );

        assert.equal(event.action.name, 'submitForm');
        assert.equal(event.action.surfaceId, 'main');
        assert.equal(event.action.sourceComponentId, 'submit_button');
        assert.equal(event.action.timestamp, '2026-01-25T12:00:00.000Z');
        assert.deepEqual(event.action.context, {
            userId: 'u-1',
            literal: 'ok',
            score: 3,
        });
    });

    it('returns null when no event is configured', () => {
        const event = buildActionEvent(undefined, 'main', 'btn', { dataModel: {} });
        assert.equal(event, null);
    });
});
