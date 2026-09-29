// `node:bench` is not in Node.js 22, so the benchmark needs a later Node.js version than the package does.
import assert from 'node:assert/strict';
import {suite, bench} from 'node:bench';
import queryString from './index.js';

const {stringify, stringifyUrl} = queryString;

// Fixtures
const TEST_OBJECT = {
	genre: 'Epic fantasy',
	author: '',
	page: 2,
	published: true,
	symbols: 'πµ',
	chapters: [1, 2, 3],
	none: null,
};
const TEST_HOST = 'https://foo.bar/';
const TEST_STRING = stringify(TEST_OBJECT);
const TEST_BRACKETS_STRING = stringify(TEST_OBJECT, {arrayFormat: 'bracket'});
const TEST_INDEX_STRING = stringify(TEST_OBJECT, {arrayFormat: 'index'});
const TEST_COMMA_STRING = stringify(TEST_OBJECT, {arrayFormat: 'comma'});
const TEST_BRACKET_SEPARATOR_STRING = stringify(TEST_OBJECT, {arrayFormat: 'bracket-separator'});
const TEST_URL = stringifyUrl({url: TEST_HOST, query: TEST_OBJECT});

// Creates a test case and adds it to the suite
const defineTestCase = (methodName, input, options) => {
	const function_ = queryString[methodName];
	const label = options ? ` (${stringify(options)})` : '';
	const expected = function_(input, options || {});
	// `extract` is far cheaper than the other methods, so it needs more operations per sample.
	const operations = methodName === 'extract' ? 1_000_000 : 10_000;

	bench(methodName + label, b => {
		const results = [];

		b.start();
		for (let index = 0; index < operations; index++) {
			results.push(function_(input, options || {}));
		}

		b.end(operations);

		// Validated outside the measured region, so the results are observable and the work cannot be eliminated.
		for (const result of results) {
			assert.deepEqual(result, expected);
		}
	});
};

// Define all test cases
suite('query-string', () => {
	// Parse
	defineTestCase('parse', TEST_STRING);
	defineTestCase('parse', TEST_STRING, {parseNumbers: true});
	defineTestCase('parse', TEST_STRING, {parseBooleans: true});
	defineTestCase('parse', TEST_STRING, {sort: false});
	defineTestCase('parse', TEST_STRING, {decode: false});
	defineTestCase('parse', TEST_BRACKETS_STRING, {arrayFormat: 'bracket'});
	defineTestCase('parse', TEST_INDEX_STRING, {arrayFormat: 'index'});
	defineTestCase('parse', TEST_COMMA_STRING, {arrayFormat: 'comma'});
	defineTestCase('parse', TEST_BRACKET_SEPARATOR_STRING, {arrayFormat: 'bracket-separator'});

	// Stringify
	defineTestCase('stringify', TEST_OBJECT);
	defineTestCase('stringify', TEST_OBJECT, {strict: false});
	defineTestCase('stringify', TEST_OBJECT, {encode: false});
	defineTestCase('stringify', TEST_OBJECT, {skipNull: true});
	defineTestCase('stringify', TEST_OBJECT, {skipEmptyString: true});
	defineTestCase('stringify', TEST_OBJECT, {arrayFormat: 'bracket'});
	defineTestCase('stringify', TEST_OBJECT, {arrayFormat: 'index'});
	defineTestCase('stringify', TEST_OBJECT, {arrayFormat: 'comma'});
	defineTestCase('stringify', TEST_OBJECT, {arrayFormat: 'bracket-separator'});

	// Extract
	defineTestCase('extract', TEST_URL);

	// ParseUrl
	defineTestCase('parseUrl', TEST_URL);

	// StringifyUrl
	defineTestCase('stringifyUrl', {url: TEST_HOST, query: TEST_OBJECT});
});
