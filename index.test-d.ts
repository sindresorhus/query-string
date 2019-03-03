import {expectType} from 'tsd-check';
import * as queryString from '.';

// stringify
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

// parse
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

// parseUrl
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

// extract
expectType<string>(queryString.extract('http://foo.bar/?abc=def&hij=klm'));
