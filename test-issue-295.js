import test from 'ava';
import queryString from './index.js';

test('parse() drops empty and whitespace-only keys', t => {
	// Original issue - encoded whitespace key
	t.deepEqual(queryString.parse('?%20&'), {});

	// Various whitespace encodings
	t.deepEqual(queryString.parse('?%20'), {});
	t.deepEqual(queryString.parse('?%09'), {}); // Tab
	t.deepEqual(queryString.parse('?+'), {}); // Plus as space

	// Empty keys
	t.deepEqual(queryString.parse('?&&'), {});

	// Mixed valid and invalid keys
	t.deepEqual(queryString.parse('?valid=1&%20&another=2'), {
		valid: '1',
		another: '2',
	});

	// Valid keys are preserved
	t.deepEqual(queryString.parse('?a'), {a: null});
	t.deepEqual(queryString.parse('?a='), {a: ''});
});

test('stringify() ignores empty and whitespace keys', t => {
	// Empty and whitespace keys
	t.is(queryString.stringify({'': 'value'}), '');
	t.is(queryString.stringify({' ': 'value'}), '');
	t.is(queryString.stringify({'\t': 'value'}), '');

	// Mixed valid and invalid
	t.is(queryString.stringify({valid: '1', '': 'ignored'}), 'valid=1');

	// Valid keys work normally
	t.is(queryString.stringify({a: null}), 'a');
	t.is(queryString.stringify({a: ''}), 'a=');
});

test('symmetry: parse and stringify round-trip', t => {
	// Original issue case
	t.is(queryString.stringify(queryString.parse('?%20&')), '');

	// Empty keys
	t.is(queryString.stringify(queryString.parse('?&&')), '');

	// Mixed keys maintain valid ones
	t.is(queryString.stringify(queryString.parse('?valid=1&%20&')), 'valid=1');
});

test('array formats handle empty keys correctly', t => {
	// Parse with different array formats
	t.deepEqual(queryString.parse('?%20[]=1', {arrayFormat: 'bracket'}), {});
	t.deepEqual(queryString.parse('?%20[0]=1', {arrayFormat: 'index'}), {});
	t.deepEqual(queryString.parse('?%20=1,2', {arrayFormat: 'comma'}), {});

	// Stringify with different array formats
	t.is(queryString.stringify({'': ['1']}, {arrayFormat: 'bracket'}), '');
	t.is(queryString.stringify({' ': ['1']}, {arrayFormat: 'index'}), '');
	t.is(queryString.stringify({'': ['1', '2']}, {arrayFormat: 'comma'}), '');
});
