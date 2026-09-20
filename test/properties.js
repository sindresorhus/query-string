import deepEqual from 'deep-equal';
import fastCheck from 'fast-check';
import test from 'ava';
import queryString from '../index.js';

// Valid query parameters must follow:
// - key can be any unicode string (not empty). `stringify()` intentionally drops a key named `__proto__`, and a key that ends in an array marker is not distinguishable from the marker after parsing.
// - value must be one of:
// --> any unicode string
// --> null
// --> array containing values defined above (at least two items)
const queryParametersArbitrary = fastCheck.dictionary(
	fastCheck.fullUnicodeString({minLength: 1, maxLength: 10}).filter(key => key !== '__proto__' && !/\[\d*]$/.test(key) && !key.endsWith(':list')),
	fastCheck.oneof(
		fastCheck.fullUnicodeString(),
		fastCheck.constant(null),
		fastCheck.array(fastCheck.oneof(fastCheck.fullUnicodeString(), fastCheck.constant(null)), {minLength: 2, maxLength: 10}),
	),
);

const optionsArbitrary = fastCheck.record({
	arrayFormat: fastCheck.constantFrom('bracket', 'index', 'colon-list-separator', 'none'),
	strict: fastCheck.boolean(),
	encode: fastCheck.constant(true),
	sort: fastCheck.constant(false),
}, {withDeletedKeys: true});

test('should read correctly from stringified query parameters', t => {
	t.notThrows(() => {
		fastCheck.assert(
			fastCheck.property(
				queryParametersArbitrary,
				optionsArbitrary,
				(object, options) => deepEqual(queryString.parse(queryString.stringify(object, options), options), object),
			),
			{
				verbose: true,
			},
		);
	});
});

test('should read correctly from stringified query parameters with the separator formats', t => {
	// A plain value or an item that contains the separator must be percent-encoded so that it round-trips. `null` is written as an empty string in these formats, so it is left out. A single-item array has no separator, so it reads back as a plain value and is left out too. A separator that is a hex digit is documented as unsupported, since it also appears inside the `%XX` escapes.
	// The values are built from a small alphabet that includes every candidate separator, so that a value with the separator is common instead of rare.
	const stringArbitrary = fastCheck.stringOf(fastCheck.constantFrom(',', '|', '-', '.', '_', '~', '!', '*', 'å', 'a', 'b', ' ', '%', 'é'), {maxLength: 10});
	const separatorQueryParametersArbitrary = fastCheck.dictionary(
		fastCheck.fullUnicodeString({minLength: 1, maxLength: 10}).filter(key => key !== '__proto__' && !key.endsWith('[]')),
		fastCheck.oneof(
			stringArbitrary,
			fastCheck.array(stringArbitrary, {minLength: 2, maxLength: 10}),
		),
	);

	const separatorOptionsArbitrary = fastCheck.record({
		arrayFormat: fastCheck.constantFrom('comma', 'separator', 'bracket-separator'),
		arrayFormatSeparator: fastCheck.constantFrom(',', '|', '-', '.', '_', '~', '!', '*', 'å'),
		strict: fastCheck.boolean(),
		sort: fastCheck.constant(false),
	});

	t.notThrows(() => {
		fastCheck.assert(
			fastCheck.property(
				separatorQueryParametersArbitrary,
				separatorOptionsArbitrary,
				(object, options) => deepEqual(queryString.parse(queryString.stringify(object, options), options), object),
			),
			{
				verbose: true,
			},
		);
	});
});
