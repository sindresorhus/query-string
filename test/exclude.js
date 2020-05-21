import test from 'ava';
import queryString from '..';

test('excludes keys from url', t => {
	t.is(queryString.exclude('https://foo.bar/?foo=1&bar=2', ['foo']), 'https://foo.bar/?bar=2');
	t.is(queryString.exclude('https://foo.bar/?foo=1&bar=2', []), 'https://foo.bar/?foo=1&bar=2');
	t.is(queryString.exclude('https://foo.bar/?foo=1&bar=2', ['other']), 'https://foo.bar/?foo=1&bar=2');
	t.is(queryString.exclude('https://foo.bar/?foo=1&bar=2#hashtag', ['foo']), 'https://foo.bar/?bar=2#hashtag');
});
