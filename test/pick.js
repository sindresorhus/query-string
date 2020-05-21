import test from 'ava';
import queryString from '..';

test('picks keys from url', t => {
	t.is(queryString.pick('https://foo.bar/?foo=1&bar=2', ['foo']), 'https://foo.bar/?foo=1');
	t.is(queryString.pick('https://foo.bar/?foo=1&bar=2', ['foo', 'bar']), 'https://foo.bar/?foo=1&bar=2');
	t.is(queryString.pick('https://foo.bar/?foo=1&bar=2', []), 'https://foo.bar/');
	t.is(queryString.pick('https://foo.bar/?foo=1&bar=2', ['other']), 'https://foo.bar/');
	t.is(queryString.pick('https://foo.bar/?foo=1&bar=2#hashtag', ['foo']), 'https://foo.bar/?foo=1#hashtag');
});
