import test from 'node:test';
import assert from 'node:assert/strict';
import queryString from '../index.js';

test('extracts query string from url', () => {
	assert.equal(queryString.extract('https://foo.bar/?abc=def&hij=klm'), 'abc=def&hij=klm');
	assert.equal(queryString.extract('https://foo.bar/?'), '');
	assert.equal(queryString.extract('https://foo.bar/?regex=ab?c'), 'regex=ab?c');
	assert.equal(queryString.extract('https://foo.bar#top?foo=bar'), '');
	assert.equal(queryString.extract('https://foo.bar?foo=bar#top'), 'foo=bar');
});

test('handles strings not containing query string', () => {
	assert.equal(queryString.extract('https://foo.bar'), '');
	assert.equal(queryString.extract('https://foo.bar#top'), '');
	assert.equal(queryString.extract(''), '');
});

test('throws for invalid values', () => {
	assert.throws(() => {
		queryString.extract(null);
	}, TypeError);

	assert.throws(() => {
		queryString.extract(undefined);
	}, TypeError);
});
