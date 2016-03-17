import test from 'ava';
import fn from '../';

// https://github.com/sindresorhus/query-string/pull/48#issuecomment-198242935
function tsame(t, actual, expected) {
	Object.keys(expected).forEach(key => {
		t.is(actual[key], expected[key]);
	});
}

test.beforeEach(t => {
	t.context.same = tsame.bind(undefined, t);
});

test('query strings starting with a `?`', t => {
	t.context.same(fn.parse('?foo=bar'), {foo: 'bar'});
});

test('query strings starting with a `#`', t => {
	t.context.same(fn.parse('#foo=bar'), {foo: 'bar'});
});

test('query strings starting with a `&`', t => {
	t.context.same(fn.parse('&foo=bar&foo=baz'), {foo: ['bar', 'baz']});
});

test('parse a query string', t => {
	t.context.same(fn.parse('foo=bar'), {foo: 'bar'});
});

test('parse multiple query string', t => {
	t.context.same(fn.parse('foo=bar&key=val'), {foo: 'bar', key: 'val'});
});

test('parse query string without a value', t => {
	t.context.same(fn.parse('foo'), {foo: null});
	t.context.same(fn.parse('foo&key'), {foo: null, key: null});
	t.context.same(fn.parse('foo=bar&key'), {foo: 'bar', key: null});
});

test('return empty object if no qss can be found', t => {
	t.context.same(fn.parse('?'), {});
	t.context.same(fn.parse('&'), {});
	t.context.same(fn.parse('#'), {});
	t.context.same(fn.parse(' '), {});
});

test('handle `+` correctly', t => {
	t.context.same(fn.parse('foo+faz=bar+baz++'), {'foo faz': 'bar baz  '});
});

test('handle multiple of the same key', t => {
	t.context.same(fn.parse('foo=bar&foo=baz'), {foo: ['bar', 'baz']});
});

test('query strings params including embedded `=`', t => {
	t.context.same(fn.parse('?param=http%3A%2F%2Fsomeurl%3Fid%3D2837'), {param: 'http://someurl?id=2837'});
});

test('query strings params including raw `=`', t => {
	t.context.same(fn.parse('?param=http://someurl?id=2837'), {param: 'http://someurl?id=2837'});
});

test('object methods', t => {
	t.context.same(fn.parse('hasOwnProperty=foo'), {hasOwnProperty: 'fo'});
	t.context.same(fn.parse('__proto__=bar'), {__proto__: 'bar'});
});
