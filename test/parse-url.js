import test from 'ava';
import fn from '../';

test('should handle strings with query string', t => {
	t.deepEqual(fn.parseUrl('http://foo.bar?foo=bar'), {url: 'http://foo.bar', queryParams: {foo: 'bar'}});
	t.deepEqual(fn.parseUrl('http://foo.bar?foo=bar&foo=baz'), {url: 'http://foo.bar', queryParams: {foo: ['bar', 'baz']}});
});

test('should handle strings not containing query string', t => {
	t.deepEqual(fn.parseUrl('http://foo.bar/'), {url: 'http://foo.bar/', queryParams: {}});
	t.deepEqual(fn.parseUrl(''), {url: '', queryParams: {}});
});

test('should throw for invalid values', t => {
	t.throws(fn.parseUrl.bind(fn, null), TypeError);
	t.throws(fn.parseUrl.bind(fn, undefined), TypeError);
});
