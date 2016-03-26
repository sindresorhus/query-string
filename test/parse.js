import test from 'ava';
import fn from '../';

// https://github.com/sindresorhus/query-string/pull/48#issuecomment-198242935
function tsame(t, actual, expected) {
	Object.keys(expected).forEach(key => {
		if (Array.isArray(expected[key])) {
			t.same(actual[key], expected[key]);
		} else {
			t.is(actual[key], expected[key]);
		}
	});
}

test('query strings starting with a `?`', t => {
	tsame(t, fn.parse('?foo=bar'), {foo: 'bar'});
});

test('query strings starting with a `#`', t => {
	tsame(t, fn.parse('#foo=bar'), {foo: 'bar'});
});

test('query strings starting with a `&`', t => {
	tsame(t, fn.parse('&foo=bar&foo=baz'), {foo: ['bar', 'baz']});
});

test('parse a query string', t => {
	tsame(t, fn.parse('foo=bar'), {foo: 'bar'});
});

test('parse multiple query string', t => {
	tsame(t, fn.parse('foo=bar&key=val'), {foo: 'bar', key: 'val'});
});

test('parse query string without a value', t => {
	tsame(t, fn.parse('foo'), {foo: null});
	tsame(t, fn.parse('foo&key'), {foo: null, key: null});
	tsame(t, fn.parse('foo=bar&key'), {foo: 'bar', key: null});
	tsame(t, fn.parse('a&a'), {a: [null, null]});
	tsame(t, fn.parse('a=&a'), {a: ['', null]});
});

test('return empty object if no qss can be found', t => {
	tsame(t, fn.parse('?'), {});
	tsame(t, fn.parse('&'), {});
	tsame(t, fn.parse('#'), {});
	tsame(t, fn.parse(' '), {});
});

test('handle `+` correctly', t => {
	tsame(t, fn.parse('foo+faz=bar+baz++'), {'foo faz': 'bar baz  '});
});

test('handle multiple of the same key', t => {
	tsame(t, fn.parse('foo=bar&foo=baz'), {foo: ['bar', 'baz']});
});

test('query strings params including embedded `=`', t => {
	tsame(t, fn.parse('?param=http%3A%2F%2Fsomeurl%3Fid%3D2837'), {param: 'http://someurl?id=2837'});
});

test('query strings params including raw `=`', t => {
	tsame(t, fn.parse('?param=http://someurl?id=2837'), {param: 'http://someurl?id=2837'});
});

test('object properties', t => {
	t.notOk(fn.parse().prototype);
	tsame(t, fn.parse('hasOwnProperty=foo'), {hasOwnProperty: 'fo'});
	tsame(t, fn.parse('__proto__=bar'), {__proto__: 'bar'});
});
