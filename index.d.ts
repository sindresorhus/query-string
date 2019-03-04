export interface ParseOptions {
	/**
	 * Decode the keys and values. URI components are decoded with [`decode-uri-component`](https://github.com/SamVerschueren/decode-uri-component).
	 *
	 * @default true
	 */
	readonly decode?: boolean;

	/**
	 * Supports both `index` for an indexed array representation or `bracket` for a *bracketed* array representation.
	 *
	 * @default 'none'
	 *
	 * - `bracket`: stands for parsing correctly arrays with bracket representation on the query string, such as:
	 *
	 *
	 *    queryString.parse('foo[]=1&foo[]=2&foo[]=3', {arrayFormat: 'bracket'});
	 *    //=> foo: [1,2,3]
	 *
	 * - `index`: stands for parsing taking the index into account, such as:
	 *
	 *
	 *    queryString.parse('foo[0]=1&foo[1]=2&foo[3]=3', {arrayFormat: 'index'});
	 *    //=> foo: [1,2,3]
	 *
	 * - `none`: is the **default** option and removes any bracket representation, such as:
	 *
	 *
	 *    queryString.parse('foo=1&foo=2&foo=3');
	 *    //=> foo: [1,2,3]
	 */
	readonly arrayFormat?: 'bracket' | 'index' | 'none';
}

export interface ParsedQuery {
	readonly [key: string]: string | string[] | undefined;
}

/**
 * Parse a query string into an object. Leading `?` or `#` are ignored, so you can pass `location.search` or `location.hash` directly.
 *
 * The returned object is created with [`Object.create(null)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create) and thus does not have a `prototype`.
 *
 * @param query - The query string to parse.
 */
export function parse(query: string, options?: ParseOptions): ParsedQuery;

export interface ParsedUrl {
	readonly url: string;
	readonly query: ParsedQuery;
}

/**
 * Extract the URL and the query string as an object.
 *
 * @param url - The URL to parse.
 *
 * @example
 *
 * queryString.parseUrl('https://foo.bar?foo=bar');
 * //=> {url: 'https://foo.bar', query: {foo: 'bar'}}
 */
export function parseUrl(url: string, options?: ParseOptions): ParsedUrl;

export interface StringifyOptions {
	/**
	 * Strictly encode URI components with [`strict-uri-encode`](https://github.com/kevva/strict-uri-encode). It uses [`encodeURIComponent`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) if set to `false`. You probably [don't care](https://github.com/sindresorhus/query-string/issues/42) about this option.
	 *
	 * @default true
	 */
	readonly strict?: boolean;

	/**
	 * [URL encode](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) the keys and values.
	 *
	 * @default true
	 */
	readonly encode?: boolean;

	/**
	 * Supports both `index` for an indexed array representation or `bracket` for a *bracketed* array representation.
	 *
	 * @default 'none'
	 *
	 * - `bracket`: stands for parsing correctly arrays with bracket representation on the query string, such as:
	 *
	 *
	 *    queryString.stringify({foo: [1,2,3]}, {arrayFormat: 'bracket'});
	 *    // => foo[]=1&foo[]=2&foo[]=3
	 *
	 * - `index`: stands for parsing taking the index into account, such as:
	 *
	 *
	 *    queryString.stringify({foo: [1,2,3]}, {arrayFormat: 'index'});
	 *    // => foo[0]=1&foo[1]=2&foo[3]=3
	 *
	 * - `none`: is the **default** option and removes any bracket representation, such as:
	 *
	 *
	 *    queryString.stringify({foo: [1,2,3]});
	 *    // => foo=1&foo=2&foo=3
	 */
	readonly arrayFormat?: 'bracket' | 'index' | 'none';

	/**
	 * Supports both `Function` as a custom sorting function or `false` to disable sorting.
	 *
	 * If omitted, keys are sorted using `Array#sort`, which means, converting them to strings and comparing strings in Unicode code point order.
	 *
	 * @example
	 *
	 * const order = ['c', 'a', 'b'];
	 * queryString.stringify({ a: 1, b: 2, c: 3}, {
	 *     sort: (itemLeft, itemRight) => order.indexOf(itemLeft) - order.indexOf(itemRight)
	 * });
	 * // => 'c=3&a=1&b=2'
	 *
	 * queryString.stringify({ b: 1, c: 2, a: 3}, {sort: false});
	 * // => 'b=1&c=2&a=3'
	 */
	readonly sort?: ((itemLeft: string, itemRight: string) => number) | false;
}

/**
 * Stringify an object into a query string, sorting the keys.
 */
export function stringify(
	object: {[key: string]: unknown},
	options?: StringifyOptions
): string;

/**
 * Extract a query string from a URL that can be passed into `.parse()`.
 */
export function extract(url: string): string;
