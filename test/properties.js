import deepEqual from 'deep-equal';
import * as fc from 'fast-check';
import test from 'ava';
import m from '..';

// Valid query parameters must follow:
// - key can be any unicode string (not empty)
// - value must be one of:
// --> any unicode string
// --> null
// --> array containing values defined above (at least two items)
const queryParamsArbitrary = fc.dictionary(
	fc.fullUnicodeString(1, 10),
	fc.oneof(
		fc.fullUnicodeString(),
		fc.constant(null),
		fc.array(fc.oneof(fc.fullUnicodeString(), fc.constant(null)), 2, 10)
	)
);

const optionsArbitrary = fc.record({
	arrayFormat: fc.constantFrom('bracket', 'index', 'none'),
	strict: fc.boolean(),
	encode: fc.constant(true),
	sort: fc.constant(false)
}, {withDeletedKeys: true});

test('should read correctly from stringified query params', t => {
	t.notThrows(() => fc.assert(
		fc.property(queryParamsArbitrary, optionsArbitrary,
			(obj, opts) => deepEqual(m.parse(m.stringify(obj, opts), opts), obj))));
});
