/* eslint-disable node-test/require-assertion -- The assertions here come from `deepEqual()` below, which the rule cannot see. `deep-equal` is used rather than `assert.deepEqual()` because `parse()` returns null-prototype objects, and `assert.deepEqual()` compares the prototype of both sides. `fastCheck.assert()` throws when a property fails, which fails the test. */
import test from 'node:test';
import deepEqual from 'deep-equal';
import fastCheck from 'fast-check';
import queryString from '../index.js';

// Valid query parameters must follow:
// - key can be any unicode string (not empty). `stringify()` intentionally drops a key named `__proto__`, and a key that ends in an array marker is not distinguishable from the marker after parsing.
// - value must be one of:
// --> any unicode string
// --> null
// --> array containing values defined above (at least two items)
const unicodeStringArbitrary = fastCheck.string({unit: 'binary'});

const keyArbitrary = fastCheck.string({unit: 'binary', minLength: 1, maxLength: 10})
	.filter(key => key !== '__proto__' && !/\[\d*\]$/v.test(key) && !key.endsWith(':list'));

const scalarOrArrayArbitrary = fastCheck.array(
	fastCheck.oneof(unicodeStringArbitrary, fastCheck.constant(null)),
	{minLength: 2, maxLength: 10},
);

const queryParametersArbitrary = fastCheck.dictionary(
	keyArbitrary,
	fastCheck.oneof(unicodeStringArbitrary, fastCheck.constant(null), scalarOrArrayArbitrary),
);

const optionsArbitrary = fastCheck.record({
	arrayFormat: fastCheck.constantFrom('bracket', 'index', 'colon-list-separator', 'none'),
	strict: fastCheck.boolean(),
	encode: fastCheck.constant(true),
	sort: fastCheck.constant(false),
}, {withDeletedKeys: true});

test('should read correctly from stringified query parameters', () => {
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

test('should read correctly from stringified query parameters with the separator formats', () => {
	// A plain value or an item that contains the separator must be percent-encoded so that it round-trips. `null` is written as an empty string in these formats, so it is left out. A single-item array has no separator, so it reads back as a plain value and is left out too. A separator that is a hex digit is documented as unsupported, since it also appears inside the `%XX` escapes.
	// The values are built from a small alphabet that includes every candidate separator, so that a value with the separator is common instead of rare.
	const stringArbitrary = fastCheck.array(fastCheck.constantFrom(',', '|', '-', '.', '_', '~', '!', '*', 'å', 'a', 'b', ' ', '%', 'é'), {maxLength: 10}).map(characters => characters.join(''));
	const separatorQueryParametersArbitrary = fastCheck.dictionary(
		fastCheck.string({unit: 'binary', minLength: 1, maxLength: 10}).filter(key => key !== '__proto__' && !key.endsWith('[]')),
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

test('parsing a stringified query string is a fixed point', () => {
	// Parsing a stringified value and stringifying the result again parses to the same value, so a query string has one stable form. These are the non-separator formats, where every value survives the first pass unchanged.
	fastCheck.assert(
		fastCheck.property(
			queryParametersArbitrary,
			optionsArbitrary,
			(object, options) => {
				const once = queryString.parse(queryString.stringify(object, options), options);
				deepEqual(queryString.parse(queryString.stringify(once, options), options), once);
			},
		),
		{
			verbose: true,
		},
	);
});

test('pick and exclude with a predicate preserve every query parameter', () => {
	// `pick` with a predicate that keeps everything and `exclude` with one that drops nothing must both leave the query unchanged.
	fastCheck.assert(
		fastCheck.property(
			queryParametersArbitrary,
			optionsArbitrary,
			(object, options) => {
				const url = 'https://foo.bar/?' + queryString.stringify(object, options);
				const before = queryString.parseUrl(url, options).query;
				deepEqual(queryString.parseUrl(queryString.pick(url, () => true, options), options).query, before);
				deepEqual(queryString.parseUrl(queryString.exclude(url, () => false, options), options).query, before);
			},
		),
		{
			verbose: true,
		},
	);
});

test('parseUrl and stringifyUrl round trip a query string', () => {
	fastCheck.assert(
		fastCheck.property(
			queryParametersArbitrary,
			optionsArbitrary,
			(object, options) => {
				const url = 'https://foo.bar/?' + queryString.stringify(object, options);
				const parseOptions = {...options, parseFragmentIdentifier: true};
				const parsed = queryString.parseUrl(url, parseOptions);
				const stringified = queryString.stringifyUrl({url: parsed.url, query: parsed.query, fragmentIdentifier: parsed.fragmentIdentifier}, options);
				deepEqual(queryString.parseUrl(stringified, parseOptions), parsed);
			},
		),
		{
			verbose: true,
		},
	);
});

test('the extracted query string parses to the same object as `parseUrl()`', () => {
	// `extract()` returns the part `parse()` reads, so parsing it must match what `parseUrl()` produces for the same URL.
	fastCheck.assert(
		fastCheck.property(
			queryParametersArbitrary,
			object => {
				const url = 'https://foo.bar/?' + queryString.stringify(object);
				deepEqual(queryString.parse(queryString.extract(url)), queryString.parseUrl(url).query);
			},
		),
		{
			verbose: true,
		},
	);
});

test('a query string round trips through a custom sort function', () => {
	fastCheck.assert(
		fastCheck.property(
			queryParametersArbitrary,
			object => {
				const sort = (a, b) => (a < b ? 1 : (a > b ? -1 : 0));
				const options = {sort, arrayFormat: 'none'};
				deepEqual(queryString.parse(queryString.stringify(object, options), options), object);
			},
		),
		{
			verbose: true,
		},
	);
});

test('parsing a query string with `parseNumbers` or `parseBooleans` is a fixed point', () => {
	// `parseNumbers` turns numeric strings into numbers. Stringifying and reparsing must not change the already-parsed value further.
	for (const option of ['parseNumbers', 'parseBooleans']) {
		fastCheck.assert(
			fastCheck.property(
				queryParametersArbitrary,
				object => {
					const options = {[option]: true, arrayFormat: 'none'};
					const once = queryString.parse(queryString.stringify(object, options), options);
					deepEqual(queryString.parse(queryString.stringify(once, options), options), once);
				},
			),
			{
				verbose: true,
			},
		);
	}
});

test('a query string round trips through an identity replacer', () => {
	fastCheck.assert(
		fastCheck.property(
			queryParametersArbitrary,
			object => {
				const options = {arrayFormat: 'none', replacer: (key, value) => value};
				deepEqual(queryString.parse(queryString.stringify(object, options), options), object);
			},
		),
		{
			verbose: true,
		},
	);
});
