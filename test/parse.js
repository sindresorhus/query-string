import test from 'ava';
import fn from '../';

test('query strings starting with a `?`', t => {
	t.same(fn.parse('?foo=bar'), {foo: 'bar'});
	t.end();
});

test('query strings starting with a `#`', t => {
	t.same(fn.parse('#foo=bar'), {foo: 'bar'});
	t.end();
});

test('query strings starting with a `&`', t => {
	t.same(fn.parse('&foo=bar&foo=baz'), {foo: ['bar', 'baz']});
	t.end();
});

test('parse a query string', t => {
	t.same(fn.parse('foo=bar'), {foo: 'bar'});
	t.end();
});

test('parse multiple query string', t => {
	t.same(fn.parse('foo=bar&key=val'), {foo: 'bar', key: 'val'});
	t.end();
});

test('parse query string without a value', t => {
	t.same(fn.parse('foo'), {foo: null});
	t.same(fn.parse('foo&key'), {foo: null, key: null});
	t.same(fn.parse('foo=bar&key'), {foo: 'bar', key: null});
	t.end();
});

test('return empty object if no qss can be found', t => {
	t.same(fn.parse('?'), {});
	t.same(fn.parse('&'), {});
	t.same(fn.parse('#'), {});
	t.same(fn.parse(' '), {});
	t.end();
});

test('handle `+` correctly', t => {
	t.same(fn.parse('foo+faz=bar+baz++'), {'foo faz': 'bar baz  '});
	t.end();
});

test('handle multiple of the same key', t => {
	t.same(fn.parse('foo=bar&foo=baz'), {foo: ['bar', 'baz']});
	t.end();
});

test('query strings params including embedded `=`', t => {
	t.same(fn.parse('?param=http%3A%2F%2Fsomeurl%3Fid%3D2837'), {param: 'http://someurl?id=2837'});
	t.end();
});

test('query strings params including raw `=`', t => {
	t.same(fn.parse('?param=http://someurl?id=2837'), {param: 'http://someurl?id=2837'});
	t.end();
});
