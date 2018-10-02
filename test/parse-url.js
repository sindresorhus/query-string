import test from 'ava';
import m from '..';

test('handles strings with query string', t => {
	t.deepEqual(m.parseUrl('https://foo.bar#top?foo=bar'), {url: 'https://foo.bar', query: {}});
	t.deepEqual(m.parseUrl('https://foo.bar?foo=bar&foo=baz#top'), {url: 'https://foo.bar', query: {foo: ['bar', 'baz']}});
	t.deepEqual(m.parseUrl('https://foo.bar?foo=bar&foo=baz'), {url: 'https://foo.bar', query: {foo: ['bar', 'baz']}});
});

test('handles strings not containing query string', t => {
	t.deepEqual(m.parseUrl('https://foo.bar/'), {url: 'https://foo.bar/', query: {}});
	t.deepEqual(m.parseUrl('https://foo.bar/#top'), {url: 'https://foo.bar/', query: {}});
	t.deepEqual(m.parseUrl(''), {url: '', query: {}});
});

test('throws for invalid values', t => {
	t.throws(() => {
		m.parseUrl(null);
	}, TypeError);

	t.throws(() => {
		m.parseUrl(undefined);
	}, TypeError);
});
