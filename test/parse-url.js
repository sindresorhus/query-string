import test from 'ava';
import queryString from '..';

test('handles strings with query string', t => {
	t.deepEqual(queryString.parseUrl('https://foo.bar#top?foo=bar'), {url: 'https://foo.bar', query: {}});
	t.deepEqual(queryString.parseUrl('https://foo.bar?foo=bar&foo=baz#top'), {url: 'https://foo.bar', query: {foo: ['bar', 'baz']}});
	t.deepEqual(queryString.parseUrl('https://foo.bar?foo=bar&foo=baz'), {url: 'https://foo.bar', query: {foo: ['bar', 'baz']}});
});

test('handles strings not containing query string', t => {
	t.deepEqual(queryString.parseUrl('https://foo.bar/'), {url: 'https://foo.bar/', query: {}});
	t.deepEqual(queryString.parseUrl('https://foo.bar/#top'), {url: 'https://foo.bar/', query: {}});
	t.deepEqual(queryString.parseUrl(''), {url: '', query: {}});
});

test('handles strings with query string that contain =', t => {
	t.deepEqual(queryString.parseUrl('https://foo.bar?foo=baz=bar&foo=baz#top'), {url: 'https://foo.bar', query: {foo: ['baz=bar', 'baz']}});
	t.deepEqual(queryString.parseUrl('https://foo.bar?foo=bar=&foo=baz='), {url: 'https://foo.bar', query: {foo: ['bar=', 'baz=']}});
});

test('throws for invalid values', t => {
	t.throws(() => {
		queryString.parseUrl(null);
	}, TypeError);

	t.throws(() => {
		queryString.parseUrl(undefined);
	}, TypeError);
});
