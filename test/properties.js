import test from 'ava';
import m from '..';

const sameParams = function (params1, params2) {
	for (const k of Object.keys(params1)) {
		if (params1[k] !== params2[k]) {
			return false;
		}
	}
	return params1.length === params2.length;
};

// fast-check not compatible with node 0.10
if (process.version.indexOf('v0.10') === -1) {
	test('should read correctly from stringified query params', () => {
		const fc = require('fast-check');

		const key = fc.string();
		const values = [fc.string()];
		const queryParamsArbitrary = fc.object({key, values, maxDepth: 0});

		fc.assert(
			fc.property(queryParamsArbitrary,
			obj => sameParams(m.parse(m.stringify(obj)), obj)));
	});
} else {
	test('should read correctly from stringified query params [not executed]', () => {});
}
