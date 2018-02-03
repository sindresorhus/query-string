import test from 'ava';
import fn from '../';

test('should handle strings with query string', t => {
	t.deepEqual(fn.parseUrl('http://foo.bar?foo=bar'), {url: 'http://foo.bar', query: {foo: 'bar'}});
	t.deepEqual(fn.parseUrl('http://foo.bar?foo=bar&foo=baz'), {url: 'http://foo.bar', query: {foo: ['bar', 'baz']}});
});

test('should handle strings not containing query string', t => {
	t.deepEqual(fn.parseUrl('http://foo.bar/'), {url: 'http://foo.bar/', query: {}});
	t.deepEqual(fn.parseUrl(''), {url: '', query: {}});
});

test('should throw for invalid values', t => {
	t.throws(fn.parseUrl.bind(fn, null), TypeError);
	t.throws(fn.parseUrl.bind(fn, undefined), TypeError);
});
