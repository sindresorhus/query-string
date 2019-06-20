import {expectType} from 'tsd';
import * as queryString from '.';

// Stringify
expectType<string>(
	queryString.stringify({
		str: 'bar',
		strArray: ['baz'],
		num: 123,
		numArray: [456],
		bool: true,
		boolArray: [false]
	})
);

expectType<string>(queryString.stringify({foo: 'bar'}, {strict: false}));
expectType<string>(queryString.stringify({foo: 'bar'}, {encode: false}));
expectType<string>(
	queryString.stringify({foo: 'bar'}, {arrayFormat: 'bracket'})
);
expectType<string>(queryString.stringify({foo: 'bar'}, {arrayFormat: 'index'}));
expectType<string>(queryString.stringify({foo: 'bar'}, {arrayFormat: 'none'}));
expectType<string>(queryString.stringify({foo: 'bar'}, {arrayFormat: 'comma'}));
expectType<string>(queryString.stringify({foo: 'bar'}, {sort: false}));
const order = ['c', 'a', 'b'];
expectType<string>(
	queryString.stringify(
		{foo: 'bar'},
		{
			sort: (itemLeft, itemRight) =>
				order.indexOf(itemLeft) - order.indexOf(itemRight)
		}
	)
);

// Parse
expectType<queryString.ParsedQuery>(queryString.parse('?foo=bar'));

expectType<queryString.ParsedQuery>(
	queryString.parse('?foo=bar', {decode: false})
);
expectType<queryString.ParsedQuery>(
	queryString.parse('?foo=bar', {arrayFormat: 'bracket'})
);
expectType<queryString.ParsedQuery>(
	queryString.parse('?foo=bar', {arrayFormat: 'index'})
);
expectType<queryString.ParsedQuery>(
	queryString.parse('?foo=bar', {arrayFormat: 'none'})
);
expectType<queryString.ParsedQuery>(
	queryString.parse('?foo=bar', {arrayFormat: 'comma'})
);
expectType<queryString.ParsedQuery<string | number>>(
	queryString.parse('?foo=1', {parseNumbers: true})
);
expectType<queryString.ParsedQuery<string | boolean>>(
	queryString.parse('?foo=true', {parseBooleans: true})
);
expectType<queryString.ParsedQuery<string | boolean | number>>(
	queryString.parse('?foo=true', {parseBooleans: true, parseNumbers: true})
);

// Parse URL
expectType<queryString.ParsedUrl>(queryString.parseUrl('?foo=bar'));

expectType<queryString.ParsedUrl>(
	queryString.parseUrl('?foo=bar', {decode: false})
);
expectType<queryString.ParsedUrl>(
	queryString.parseUrl('?foo=bar', {arrayFormat: 'bracket'})
);
expectType<queryString.ParsedUrl>(
	queryString.parseUrl('?foo=bar', {arrayFormat: 'index'})
);
expectType<queryString.ParsedUrl>(
	queryString.parseUrl('?foo=bar', {arrayFormat: 'none'})
);
expectType<queryString.ParsedUrl>(
	queryString.parseUrl('?foo=bar', {arrayFormat: 'comma'})
);
expectType<queryString.ParsedUrl>(
	queryString.parseUrl('?foo=1', {parseNumbers: true})
);
expectType<queryString.ParsedUrl>(
	queryString.parseUrl('?foo=true', {parseBooleans: true})
);

// Extract
expectType<string>(queryString.extract('http://foo.bar/?abc=def&hij=klm'));
