import {expectTypeOf, expectError} from 'nz';
import queryString, {type ParsedQuery} from './index.js';

// Stringify
expectTypeOf(
	queryString.stringify({
		str: 'bar',
		strArray: ['baz'],
		num: 123,
		numArray: [456],
		bool: true,
		boolArray: [false],
	}),
).toBe<string>();

expectTypeOf(queryString.stringify({foo: 'bar'}, {strict: false})).toBe<string>();
expectTypeOf(queryString.stringify({foo: 'bar'}, {encode: false})).toBe<string>();
expectTypeOf(
	queryString.stringify({foo: 'bar'}, {arrayFormat: 'bracket'}),
).toBe<string>();
expectTypeOf(queryString.stringify({foo: 'bar'}, {arrayFormat: 'index'})).toBe<string>();
expectTypeOf(queryString.stringify({foo: 'bar'}, {arrayFormat: 'none'})).toBe<string>();
expectTypeOf(queryString.stringify({foo: 'bar'}, {arrayFormat: 'comma'})).toBe<string>();
expectTypeOf(queryString.stringify({foo: 'bar'}, {sort: false})).toBe<string>();
expectTypeOf(queryString.stringify({foo: 'bar'}, {sort: true})).toBe<string>();
expectTypeOf(queryString.stringify({foo: 'bar'}, {skipNull: true})).toBe<string>();
expectTypeOf(queryString.stringify({foo: 'bar'}, {skipEmptyString: true})).toBe<string>();
const order = ['c', 'a', 'b'];
expectTypeOf(
	queryString.stringify(
		{foo: 'bar'},
		{
			sort: (itemLeft, itemRight) =>
				order.indexOf(itemLeft) - order.indexOf(itemRight),
		},
	),
).toBe<string>();

// Ensure it accepts an `interface`. Unlike a type alias, an interface has no implicit index signature.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface Query {
	foo: string;
}

const query: Query = {
	foo: 'bar',
};

queryString.stringify(query);
queryString.stringifyUrl({url: 'https://sindresorhus.com', query});

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface FullQuery {
	foo: string;
	count: number;
	enabled: boolean;
	big: bigint;
	missing?: string;
	tags: readonly string[];
	mixed: Array<string | number | boolean | undefined>;
}

const fullQuery: FullQuery = {
	foo: 'bar',
	count: 1,
	enabled: true,
	big: 1n,
	tags: ['a', 'b'],
	mixed: ['a', 1, true, undefined],
};

expectTypeOf(queryString.stringify(fullQuery)).toBe<string>();
expectTypeOf(queryString.stringifyUrl({url: 'https://sindresorhus.com', query: fullQuery})).toBe<string>();
expectTypeOf(queryString.stringifyUrl({url: 'https://sindresorhus.com', query: fullQuery, fragmentIdentifier: 'top'}, {arrayFormat: 'bracket'})).toBe<string>();

// A spread object has no index signature either. See https://github.com/microsoft/TypeScript/issues/42021
const queryWithExtraBits = {...query, baz: 'bang'};
expectTypeOf(queryString.stringify(queryWithExtraBits)).toBe<string>();
expectTypeOf(queryString.stringifyUrl({url: 'https://sindresorhus.com', query: queryWithExtraBits})).toBe<string>();

const urlObject: queryString.UrlObject = {url: 'https://sindresorhus.com', query: fullQuery};
expectTypeOf(queryString.stringifyUrl(urlObject)).toBe<string>();

// Parse
expectTypeOf(queryString.parse('?foo=bar')).toBe<queryString.ParsedQuery>();

// A key with no `=` parses to `null`, so the value type has to include it. The
// whole-result assertions above cannot see this, because they never index in.
// The type is spelled out rather than written as `ParsedQuery<string>['foo']`,
// which would only restate whatever the declaration already says.
/* eslint-disable @typescript-eslint/no-restricted-types, @typescript-eslint/array-type -- The `null` and `Array<T>` here are the point of the assertion. */
expectTypeOf(queryString.parse('foo')['foo']).toBe<string | null | (string | null)[]>();
expectTypeOf(queryString.parse('foo=bar&baz')['foo']).toBe<string | null | (string | null)[]>();
/* eslint-enable @typescript-eslint/no-restricted-types, @typescript-eslint/array-type */

expectTypeOf(
	queryString.parse('?foo=bar', {decode: false}),
).toBe<queryString.ParsedQuery>();
expectTypeOf(
	queryString.parse('?foo=bar', {arrayFormat: 'bracket'}),
).toBe<queryString.ParsedQuery>();
expectTypeOf(
	queryString.parse('?foo=bar', {arrayFormat: 'index'}),
).toBe<queryString.ParsedQuery>();
expectTypeOf(
	queryString.parse('?foo=bar', {arrayFormat: 'none'}),
).toBe<queryString.ParsedQuery>();
expectTypeOf(
	queryString.parse('?foo=bar', {arrayFormat: 'comma'}),
).toBe<queryString.ParsedQuery>();
expectTypeOf(
	queryString.parse('?foo=1', {parseNumbers: true}),
).toBe<queryString.ParsedQuery<string | number>>();
expectTypeOf(
	queryString.parse('?foo=true', {parseBooleans: true}),
).toBe<queryString.ParsedQuery<string | boolean>>();
expectTypeOf(
	queryString.parse('?foo=true', {parseBooleans: true, parseNumbers: true}),
).toBe<queryString.ParsedQuery<string | boolean | number>>();

// Parse URL
expectTypeOf(queryString.parseUrl('?foo=bar')).toBe<queryString.ParsedUrl>();

expectTypeOf(
	queryString.parseUrl('?foo=bar', {decode: false}),
).toBe<queryString.ParsedUrl>();
expectTypeOf(
	queryString.parseUrl('?foo=bar', {arrayFormat: 'bracket'}),
).toBe<queryString.ParsedUrl>();
expectTypeOf(
	queryString.parseUrl('?foo=bar', {arrayFormat: 'index'}),
).toBe<queryString.ParsedUrl>();
expectTypeOf(
	queryString.parseUrl('?foo=bar', {arrayFormat: 'none'}),
).toBe<queryString.ParsedUrl>();
expectTypeOf(
	queryString.parseUrl('?foo=bar', {arrayFormat: 'comma'}),
).toBe<queryString.ParsedUrl>();
expectTypeOf(
	queryString.parseUrl('?foo=1', {parseNumbers: true}),
).toBe<queryString.ParsedUrl<string | number>>();
expectTypeOf(
	queryString.parseUrl('?foo=true', {parseBooleans: true}),
).toBe<queryString.ParsedUrl<string | boolean>>();
expectTypeOf(
	queryString.parseUrl('?foo=true', {parseBooleans: true, parseNumbers: true}),
).toBe<queryString.ParsedUrl<string | boolean | number>>();
expectTypeOf(
	queryString.parseUrl('?foo=1', {parseNumbers: true}).query,
).toBe<queryString.ParsedQuery<string | number>>();
expectTypeOf(
	queryString.parseUrl('?foo=1', {parseNumbers: false}).query,
).toBe<queryString.ParsedQuery>();
expectTypeOf(
	queryString.parseUrl('?foo=1#bar', {parseNumbers: true, parseFragmentIdentifier: true}),
).toBe<queryString.ParsedUrl<string | number>>();
expectTypeOf(
	queryString.parseUrl('?foo=1#bar', {parseNumbers: true, parseFragmentIdentifier: true}).fragmentIdentifier,
).toBe<string | undefined>();
expectTypeOf(
	queryString.stringifyUrl(queryString.parseUrl('?foo=1', {parseNumbers: true, parseBooleans: true})),
).toBe<string>();
expectTypeOf(
	queryString.parseUrl('?foo=true#bar', {parseFragmentIdentifier: true}),
).toBe<queryString.ParsedUrl>();

// Extract
expectTypeOf(queryString.extract('https://foo.bar/?abc=def&hij=klm')).toBe<string>();

expectTypeOf(
	queryString.stringifyUrl({
		url: 'https://sindresorhus.com',
		query: {
			fooMixedArray: [
				'a',
				1,
				true,
				null,
				undefined,
			],
			fooNumber: 1,
			fooBoolean: true,
			fooNull: null,
			fooUndefined: undefined,
			fooString: 'hi',
		},
	}),
).toBe<string>();

// Pick
expectTypeOf(queryString.pick('https://foo.bar/?abc=def&hij=klm', ['abc'])).toBe<string>();

// Exclude
expectTypeOf(queryString.exclude('https://foo.bar/?abc=def&hij=klm', ['abc'])).toBe<string>();

queryString.pick('https://foo.bar/?abc=def&hij=klm', (key, value) => {
	expectTypeOf(key).toBe<string>();
	expectTypeOf(value).toBe<ParsedQuery[string]>();
	return true;
});
queryString.pick('https://foo.bar/?abc=def&hij=klm', (key, value) => {
	expectTypeOf(value).toBe<ParsedQuery<string | number>[string]>();
	return true;
}, {parseNumbers: true});
queryString.pick('https://foo.bar/?abc=def&hij=klm', (key, value) => {
	expectTypeOf(value).toBe<ParsedQuery<string | boolean>[string]>();
	return true;
}, {parseBooleans: true});
queryString.pick('https://foo.bar/?abc=def&hij=klm', (key, value) => {
	expectTypeOf(value).toBe<ParsedQuery<string | boolean | number>[string]>();
	return true;
}, {parseBooleans: true, parseNumbers: true});
queryString.exclude('https://foo.bar/?abc=def&hij=klm', (key, value) => {
	expectTypeOf(key).toBe<string>();
	expectTypeOf(value).toBe<ParsedQuery[string]>();
	return true;
});
queryString.exclude('https://foo.bar/?abc=def&hij=klm', (key, value) => {
	expectTypeOf(value).toBe<ParsedQuery<string | number>[string]>();
	return true;
}, {parseNumbers: true});
queryString.exclude('https://foo.bar/?abc=def&hij=klm', (key, value) => {
	expectTypeOf(value).toBe<ParsedQuery<string | boolean>[string]>();
	return true;
}, {parseBooleans: true});
queryString.exclude('https://foo.bar/?abc=def&hij=klm', (key, value) => {
	expectTypeOf(value).toBe<ParsedQuery<string | boolean | number>[string]>();
	return true;
}, {parseBooleans: true, parseNumbers: true});

// The `types` option types the values.
expectTypeOf(queryString.parse('?a=1', {types: {a: 'number'}})).toBe<queryString.ParsedQuery<string | number>>();
expectTypeOf(queryString.parse('?a=1', {types: {a: 'number[]'}})).toBe<queryString.ParsedQuery<string | number>>();
expectTypeOf(queryString.parse('?a=1', {types: {a: 'boolean'}})).toBe<queryString.ParsedQuery<string | boolean>>();
expectTypeOf(queryString.parse('?a=1', {types: {a: 'string', b: 'string[]'}})).toBe<queryString.ParsedQuery>();
expectTypeOf(queryString.parse('?a=1', {types: {a: value => new Date(value)}})).toBe<queryString.ParsedQuery<string | Date>>();
expectTypeOf(queryString.parse('?a=1', {parseNumbers: true, types: {a: 'boolean'}})).toBe<queryString.ParsedQuery<string | number | boolean>>();
expectTypeOf(queryString.parse('?a=1', {parseBooleans: true, types: {a: 'number'}})).toBe<queryString.ParsedQuery<string | number | boolean>>();
expectTypeOf(queryString.parseUrl('?a=1', {types: {a: 'number'}})).toBe<queryString.ParsedUrl<string | number>>();
queryString.pick('https://foo.bar/?abc=def', (key, value) => {
	expectTypeOf(value).toBe<ParsedQuery<string | number>[string]>();
	return true;
}, {types: {abc: 'number'}});
queryString.exclude('https://foo.bar/?abc=def', (key, value) => {
	expectTypeOf(value).toBe<ParsedQuery<string | boolean>[string]>();
	return true;
}, {types: {abc: 'boolean'}});

// Options declared with the option types, or with a `boolean` variable, do not narrow the values.
const declaredOptions: queryString.ParseOptions = {parseNumbers: true, types: {a: 'boolean'}};
expectTypeOf(queryString.parse('?a=1', declaredOptions)).toBe<queryString.ParsedQuery>();
expectTypeOf(queryString.parseUrl('?a=1', declaredOptions)).toBe<queryString.ParsedUrl>();
const isParseNumbers = Boolean(Math.random());
expectTypeOf(queryString.parse('?a=1', {parseNumbers: isParseNumbers})).toBe<queryString.ParsedQuery>();
const sharedOptions: queryString.ParseOptions & queryString.StringifyOptions = {arrayFormat: 'comma'};
expectTypeOf(queryString.parse('?a=1', sharedOptions)).toBe<queryString.ParsedQuery>();
expectTypeOf(queryString.pick('https://foo.bar/?abc=def', (key, value) => value === '1', sharedOptions)).toBe<string>();
queryString.pick('https://foo.bar/?abc=def', (key, value) => {
	expectTypeOf(value).toBe<ParsedQuery<string | number | boolean>[string]>();
	return true;
}, {
	parseNumbers: true,
	types: {abc: 'boolean'},
	sort: false,
	encode: false,
});

// A typo in an option is rejected, like it is for a non-generic signature.
expectError(queryString.parse('?a=1', {decode: false, sortt: false}));
expectError(queryString.parseUrl('?a=1', {decode: false, sortt: false}));
expectError(queryString.pick('https://foo.bar/?a=1', () => true, {encode: false, sortt: false}));
expectError(queryString.exclude('https://foo.bar/?a=1', () => true, {encode: false, sortt: false}));

// A generic wrapper can forward its options. Its options are not known, so it gets the plain value type.
const parseWrapper = <Options extends queryString.ParseOptions>(options: Options) => queryString.parse('?a=1', options);
const parseUrlWrapper = <Options extends queryString.ParseOptions>(options: Options) => queryString.parseUrl('?a=1', options);
const pickWrapper = <Options extends queryString.ParseOptions & queryString.StringifyOptions>(options: Options) => queryString.pick('https://foo.bar/?a=1', () => true, options);
const excludeWrapper = <Options extends queryString.ParseOptions & queryString.StringifyOptions>(options: Options) => queryString.exclude('https://foo.bar/?a=1', () => true, options);
expectTypeOf(parseWrapper({parseNumbers: true})).toBe<queryString.ParsedQuery>();
expectTypeOf(parseUrlWrapper({parseNumbers: true})).toBe<queryString.ParsedUrl>();
expectTypeOf(pickWrapper({parseNumbers: true})).toBe<string>();
expectTypeOf(excludeWrapper({parseNumbers: true})).toBe<string>();
