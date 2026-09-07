import {expectType} from 'tsd';
import queryString, {type ParsedQuery} from './index.js';

// Stringify
expectType<string>(
	queryString.stringify({
		str: 'bar',
		strArray: ['baz'],
		num: 123,
		numArray: [456],
		bool: true,
		boolArray: [false],
	}),
);

expectType<string>(queryString.stringify({foo: 'bar'}, {strict: false}));
expectType<string>(queryString.stringify({foo: 'bar'}, {encode: false}));
expectType<string>(
	queryString.stringify({foo: 'bar'}, {arrayFormat: 'bracket'}),
);
expectType<string>(queryString.stringify({foo: 'bar'}, {arrayFormat: 'index'}));
expectType<string>(queryString.stringify({foo: 'bar'}, {arrayFormat: 'none'}));
expectType<string>(queryString.stringify({foo: 'bar'}, {arrayFormat: 'comma'}));
expectType<string>(queryString.stringify({foo: 'bar'}, {sort: false}));
expectType<string>(queryString.stringify({foo: 'bar'}, {sort: true}));
expectType<string>(queryString.stringify({foo: 'bar'}, {skipNull: true}));
expectType<string>(queryString.stringify({foo: 'bar'}, {skipEmptyString: true}));
const order = ['c', 'a', 'b'];
expectType<string>(
	queryString.stringify(
		{foo: 'bar'},
		{
			sort: (itemLeft, itemRight) =>
				order.indexOf(itemLeft) - order.indexOf(itemRight),
		},
	),
);

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

expectType<string>(queryString.stringify(fullQuery));
expectType<string>(queryString.stringifyUrl({url: 'https://sindresorhus.com', query: fullQuery}));
expectType<string>(queryString.stringifyUrl({url: 'https://sindresorhus.com', query: fullQuery, fragmentIdentifier: 'top'}, {arrayFormat: 'bracket'}));

// A spread object has no index signature either. See https://github.com/microsoft/TypeScript/issues/42021
const queryWithExtraBits = {...query, baz: 'bang'};
expectType<string>(queryString.stringify(queryWithExtraBits));
expectType<string>(queryString.stringifyUrl({url: 'https://sindresorhus.com', query: queryWithExtraBits}));

const urlObject: queryString.UrlObject = {url: 'https://sindresorhus.com', query: fullQuery};
expectType<string>(queryString.stringifyUrl(urlObject));

// Parse
expectType<queryString.ParsedQuery>(queryString.parse('?foo=bar'));

expectType<queryString.ParsedQuery>(
	queryString.parse('?foo=bar', {decode: false}),
);
expectType<queryString.ParsedQuery>(
	queryString.parse('?foo=bar', {arrayFormat: 'bracket'}),
);
expectType<queryString.ParsedQuery>(
	queryString.parse('?foo=bar', {arrayFormat: 'index'}),
);
expectType<queryString.ParsedQuery>(
	queryString.parse('?foo=bar', {arrayFormat: 'none'}),
);
expectType<queryString.ParsedQuery>(
	queryString.parse('?foo=bar', {arrayFormat: 'comma'}),
);
expectType<queryString.ParsedQuery<string | number>>(
	queryString.parse('?foo=1', {parseNumbers: true}),
);
expectType<queryString.ParsedQuery<string | boolean>>(
	queryString.parse('?foo=true', {parseBooleans: true}),
);
expectType<queryString.ParsedQuery<string | boolean | number>>(
	queryString.parse('?foo=true', {parseBooleans: true, parseNumbers: true}),
);

// Parse URL
expectType<queryString.ParsedUrl>(queryString.parseUrl('?foo=bar'));

expectType<queryString.ParsedUrl>(
	queryString.parseUrl('?foo=bar', {decode: false}),
);
expectType<queryString.ParsedUrl>(
	queryString.parseUrl('?foo=bar', {arrayFormat: 'bracket'}),
);
expectType<queryString.ParsedUrl>(
	queryString.parseUrl('?foo=bar', {arrayFormat: 'index'}),
);
expectType<queryString.ParsedUrl>(
	queryString.parseUrl('?foo=bar', {arrayFormat: 'none'}),
);
expectType<queryString.ParsedUrl>(
	queryString.parseUrl('?foo=bar', {arrayFormat: 'comma'}),
);
expectType<queryString.ParsedUrl<string | number>>(
	queryString.parseUrl('?foo=1', {parseNumbers: true}),
);
expectType<queryString.ParsedUrl<string | boolean>>(
	queryString.parseUrl('?foo=true', {parseBooleans: true}),
);
expectType<queryString.ParsedUrl<string | boolean | number>>(
	queryString.parseUrl('?foo=true', {parseBooleans: true, parseNumbers: true}),
);
expectType<queryString.ParsedQuery<string | number>>(
	queryString.parseUrl('?foo=1', {parseNumbers: true}).query,
);
expectType<queryString.ParsedQuery>(
	queryString.parseUrl('?foo=1', {parseNumbers: false}).query,
);
expectType<queryString.ParsedUrl<string | number>>(
	queryString.parseUrl('?foo=1#bar', {parseNumbers: true, parseFragmentIdentifier: true}),
);
expectType<string | undefined>(
	queryString.parseUrl('?foo=1#bar', {parseNumbers: true, parseFragmentIdentifier: true}).fragmentIdentifier,
);
expectType<string>(
	queryString.stringifyUrl(queryString.parseUrl('?foo=1', {parseNumbers: true, parseBooleans: true})),
);
expectType<queryString.ParsedUrl>(
	queryString.parseUrl('?foo=true#bar', {parseFragmentIdentifier: true}),
);

// Extract
expectType<string>(queryString.extract('http://foo.bar/?abc=def&hij=klm'));

expectType<string>(
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
);

// Pick
expectType<string>(queryString.pick('http://foo.bar/?abc=def&hij=klm', ['abc']));

// Exclude
expectType<string>(queryString.exclude('http://foo.bar/?abc=def&hij=klm', ['abc']));

queryString.pick('http://foo.bar/?abc=def&hij=klm', (key, value) => {
	expectType<string>(key);
	expectType<ParsedQuery[string]>(value);
	return true;
});
queryString.pick('http://foo.bar/?abc=def&hij=klm', (key, value) => {
	expectType<ParsedQuery<string | number>[string]>(value);
	return true;
}, {parseNumbers: true});
queryString.pick('http://foo.bar/?abc=def&hij=klm', (key, value) => {
	expectType<ParsedQuery<string | boolean>[string]>(value);
	return true;
}, {parseBooleans: true});
queryString.pick('http://foo.bar/?abc=def&hij=klm', (key, value) => {
	expectType<ParsedQuery<string | boolean | number>[string]>(value);
	return true;
}, {parseBooleans: true, parseNumbers: true});
queryString.exclude('http://foo.bar/?abc=def&hij=klm', (key, value) => {
	expectType<string>(key);
	expectType<ParsedQuery[string]>(value);
	return true;
});
queryString.exclude('http://foo.bar/?abc=def&hij=klm', (key, value) => {
	expectType<ParsedQuery<string | number>[string]>(value);
	return true;
}, {parseNumbers: true});
queryString.exclude('http://foo.bar/?abc=def&hij=klm', (key, value) => {
	expectType<ParsedQuery<string | boolean>[string]>(value);
	return true;
}, {parseBooleans: true});
queryString.exclude('http://foo.bar/?abc=def&hij=klm', (key, value) => {
	expectType<ParsedQuery<string | boolean | number>[string]>(value);
	return true;
}, {parseBooleans: true, parseNumbers: true});
