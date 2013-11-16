/*global describe, it */
'use strict';
var assert = require('assert');
var qs = require('./query-string');


describe('.parse()', function () {
	it('should handle query strings starting with a `?`', function () {
		assert.deepEqual(qs.parse('?foo=bar'), {foo: 'bar'});
	});

	it('should parse a qseter', function () {
		assert.deepEqual(qs.parse('foo=bar'), {foo: 'bar'});
	});

	it('should parse multiple qseters', function () {
		assert.deepEqual(qs.parse('foo=bar&key=val'), {foo: 'bar', key: 'val'});
	});

	it('should parse qseters without a value', function () {
		assert.deepEqual(qs.parse('foo'), {foo: null});
		assert.deepEqual(qs.parse('foo&key'), {foo: null, key: null});
		assert.deepEqual(qs.parse('foo=bar&key'), {foo: 'bar', key: null});
	});

	it('should return empty object if no qss can be found', function () {
		assert.deepEqual(qs.parse('?'), {});
		assert.deepEqual(qs.parse(' '), {});
	});

	it('should handle `+` correctly', function () {
		assert.deepEqual(qs.parse('foo+faz=bar+baz++'), {'foo faz': 'bar baz  '});
	});
});

describe('.stringify()', function () {
	it('should stringify', function () {
		assert.strictEqual(qs.stringify({foo: 'bar'}), 'foo=bar');
		assert.strictEqual(qs.stringify({foo: 'bar', bar: 'baz'}), 'foo=bar&bar=baz');
	});

	it('should handle different types', function () {
		assert.strictEqual(qs.stringify(), '');
		assert.strictEqual(qs.stringify(0), '');
	});

	it('should URI encode', function () {
		assert.strictEqual(qs.stringify({'foo bar': 'baz faz'}), 'foo%20bar=baz%20faz');
	});
});
