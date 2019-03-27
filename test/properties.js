import deepEqual from 'deep-equal';
import * as fastCheck from 'fast-check';
import test from 'ava';
import queryString from '..';

// Valid query parameters must follow:
// - key can be any unicode string (not empty)
// - value must be one of:
// --> any unicode string
// --> null
// --> array containing values defined above (at least two items)
const queryParamsArbitrary = fastCheck.dictionary(
	fastCheck.fullUnicodeString(1, 10),
	fastCheck.oneof(
		fastCheck.fullUnicodeString(),
		fastCheck.constant(null),
		fastCheck.array(fastCheck.oneof(fastCheck.fullUnicodeString(), fastCheck.constant(null)), 2, 10)
	)
);

const optionsArbitrary = fastCheck.record({
	arrayFormat: fastCheck.constantFrom('bracket', 'index', 'none'),
	strict: fastCheck.boolean(),
	encode: fastCheck.constant(true),
	sort: fastCheck.constant(false)
}, {withDeletedKeys: true});

test('should read correctly from stringified query params', t => {
	t.notThrows(() => {
		fastCheck.assert(
			fastCheck.property(
				queryParamsArbitrary,
				optionsArbitrary,
				(object, options) => deepEqual(queryString.parse(queryString.stringify(object, options), options), object)
			)
		);
	});
});
