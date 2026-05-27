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
