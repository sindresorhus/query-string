import test from 'ava';
import queryString from '../index.js';

test('handles strings with query string', t => {
	t.deepEqual(queryString.parseUrl('https://foo.bar#top?foo=bar'), {url: 'https://foo.bar', query: {}});
	t.deepEqual(queryString.parseUrl('https://foo.bar?foo=bar&foo=baz#top'), {url: 'https://foo.bar', query: {foo: ['bar', 'baz']}});
	t.deepEqual(queryString.parseUrl('https://foo.bar?foo=bar&foo=baz'), {url: 'https://foo.bar', query: {foo: ['bar', 'baz']}});
	t.deepEqual(queryString.parseUrl('https://foo.bar?foo=null'), {url: 'https://foo.bar', query: {foo: 'null'}});
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

test('handles query-heavy URLs without splitting the whole URL', t => {
	const count = 10_000_000;
	const url = `https://foo.bar?${'?'.repeat(count)}`;
	const startTime = performance.now();
	const parsed = queryString.parseUrl(url, {sort: false});
	const elapsedTime = performance.now() - startTime;

	t.is(parsed.url, 'https://foo.bar');
	t.true(elapsedTime < 120, `Expected URL parsing to avoid splitting the whole URL. Took ${elapsedTime}ms.`);
});

test('handles strings with fragment identifier', t => {
	t.deepEqual(queryString.parseUrl('https://foo.bar?top=foo#bar', {parseFragmentIdentifier: true}), {url: 'https://foo.bar', query: {top: 'foo'}, fragmentIdentifier: 'bar'});
	t.deepEqual(queryString.parseUrl('https://foo.bar?foo=bar&foo=baz#top', {parseFragmentIdentifier: true}), {url: 'https://foo.bar', query: {foo: ['bar', 'baz']}, fragmentIdentifier: 'top'});
	t.deepEqual(queryString.parseUrl('https://foo.bar/#top', {parseFragmentIdentifier: true}), {url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'top'});
	t.deepEqual(queryString.parseUrl('https://foo.bar/#st%C3%A5le', {parseFragmentIdentifier: true}), {url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'ståle'});
});

test('throws for invalid values', t => {
	t.throws(() => {
		queryString.parseUrl(null);
	}, {
		instanceOf: TypeError,
	});

	t.throws(() => {
		queryString.parseUrl(undefined);
	}, {
		instanceOf: TypeError,
	});
});

test('handles index array format without sorting', t => {
	t.deepEqual(queryString.parseUrl('https://foo.bar?foo[1]=b&foo[0]=a', {arrayFormat: 'index', sort: false}), {url: 'https://foo.bar', query: {foo: ['a', 'b']}});
});

test('a `?` inside the fragment identifier does not start a query string', t => {
	t.deepEqual(queryString.parseUrl('https://foo.bar#/users?id=1', {parseFragmentIdentifier: true}), {url: 'https://foo.bar', query: {}, fragmentIdentifier: '/users?id=1'});
	t.deepEqual(queryString.parseUrl('https://foo.bar?a=1#b?c=2', {parseFragmentIdentifier: true}), {url: 'https://foo.bar', query: {a: '1'}, fragmentIdentifier: 'b?c=2'});
	t.is(queryString.extract('https://foo.bar#/users?id=1'), '');
});

test('ignores leading and trailing whitespace, like `parse()` and the URL parser do', t => {
	// `parse()` already trims the query, so the query and the rest of the URL agreed only when nothing followed the query. Trailing whitespace after the fragment identifier, like a newline from pasted input, ended up in `fragmentIdentifier` and was percent-encoded by `stringifyUrl()`.
	t.deepEqual(queryString.parseUrl('https://foo.bar?a=1#top ', {parseFragmentIdentifier: true}), {url: 'https://foo.bar', query: {a: '1'}, fragmentIdentifier: 'top'});
	t.deepEqual(queryString.parseUrl('https://foo.bar?a=1#top\n', {parseFragmentIdentifier: true}), {url: 'https://foo.bar', query: {a: '1'}, fragmentIdentifier: 'top'});
	t.deepEqual(queryString.parseUrl('https://foo.bar/ '), {url: 'https://foo.bar/', query: {}});
	t.deepEqual(queryString.parseUrl(' https://foo.bar?a=1'), {url: 'https://foo.bar', query: {a: '1'}});
	t.deepEqual(queryString.parseUrl('\thttps://foo.bar?a=1\t'), {url: 'https://foo.bar', query: {a: '1'}});
	t.deepEqual(queryString.parseUrl('https://foo.bar/#\t', {parseFragmentIdentifier: true}), {url: 'https://foo.bar/', query: {}});
	t.deepEqual(queryString.parseUrl(' '), {url: '', query: {}});
	// Whitespace inside the URL is kept.
	t.deepEqual(queryString.parseUrl('https://foo.bar/a b?c=1#d e', {parseFragmentIdentifier: true}), {url: 'https://foo.bar/a b', query: {c: '1'}, fragmentIdentifier: 'd e'});
	t.is(queryString.stringifyUrl(queryString.parseUrl('https://foo.bar?a=1#top ', {parseFragmentIdentifier: true})), 'https://foo.bar?a=1#top');
});
