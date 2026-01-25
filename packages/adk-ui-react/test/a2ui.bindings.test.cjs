const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
    resolveDynamicString,
    resolveDynamicValue,
    resolvePath,
} = require('../dist/index.js');

describe('A2ui bindings', () => {
    it('resolves absolute and relative paths', () => {
        const dataModel = { user: { name: 'Ada' } };
        const scope = { name: 'Grace' };

        assert.equal(resolvePath(dataModel, '/user/name', scope), 'Ada');
        assert.equal(resolvePath(dataModel, 'name', scope), 'Grace');
    });

    it('resolves data bindings and formatString', () => {
        const dataModel = { user: { name: 'Ada' }, score: 7 };
        const bound = resolveDynamicValue({ path: '/user/name' }, dataModel);
        assert.equal(bound, 'Ada');

        const formatted = resolveDynamicString(
            { call: 'formatString', args: ['Hello ${/user/name}, score ${add(${/score}, 1)}'] },
            dataModel,
        );
        assert.equal(formatted, 'Hello Ada, score 8');
    });
});
