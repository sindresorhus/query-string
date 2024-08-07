function _type_of$1(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
var token = '%[a-f0-9]{2}';
var singleMatcher = new RegExp('(' + token + ')|([^%]+?)', 'gi');
var multiMatcher = new RegExp('(' + token + ')+', 'gi');
function decodeComponents(components, split) {
    try {
        // Try to decode the entire string first
        return [
            decodeURIComponent(components.join(''))
        ];
    } catch (e) {
    // Do nothing
    }
    if (components.length === 1) {
        return components;
    }
    split = split || 1;
    // Split the array in 2 parts
    var left = components.slice(0, split);
    var right = components.slice(split);
    return Array.prototype.concat.call([], decodeComponents(left), decodeComponents(right));
}
function decode$1(input) {
    try {
        return decodeURIComponent(input);
    } catch (e) {
        var tokens = input.match(singleMatcher) || [];
        for(var i = 1; i < tokens.length; i++){
            input = decodeComponents(tokens, i).join('');
            tokens = input.match(singleMatcher) || [];
        }
        return input;
    }
}
function customDecodeURIComponent(input) {
    // Keep track of all the replacements and prefill the map with the `BOM`
    var replaceMap = {
        '%FE%FF': '\uFFFD\uFFFD',
        '%FF%FE': '\uFFFD\uFFFD'
    };
    var match = multiMatcher.exec(input);
    while(match){
        try {
            // Decode as big chunks as possible
            replaceMap[match[0]] = decodeURIComponent(match[0]);
        } catch (e) {
            var result = decode$1(match[0]);
            if (result !== match[0]) {
                replaceMap[match[0]] = result;
            }
        }
        match = multiMatcher.exec(input);
    }
    // Add `%C2` at the end of the map to make sure it does not replace the combinator before everything else
    replaceMap['%C2'] = '\uFFFD';
    var entries = Object.keys(replaceMap);
    for(var _i = 0; _i < entries.length; _i++){
        var key = entries[_i];
        // Replace all decoded components
        input = input.replace(new RegExp(key, 'g'), replaceMap[key]);
    }
    return input;
}
function decodeUriComponent(encodedURI) {
    if (typeof encodedURI !== 'string') {
        throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + (typeof encodedURI === "undefined" ? "undefined" : _type_of$1(encodedURI)) + '`');
    }
    try {
        // Try the built in decoder first
        return decodeURIComponent(encodedURI);
    } catch (e) {
        // Fallback to a more advanced decoder
        return customDecodeURIComponent(encodedURI);
    }
}

function includeKeys(object, predicate) {
    var result = {};
    if (Array.isArray(predicate)) {
        for(var _i = 0; _i < predicate.length; _i++){
            var key = predicate[_i];
            var descriptor = Object.getOwnPropertyDescriptor(object, key);
            if (descriptor == null ? void 0 : descriptor.enumerable) {
                Object.defineProperty(result, key, descriptor);
            }
        }
    } else {
        // `Reflect.ownKeys()` is required to retrieve symbol properties
        for(var _i1 = 0, _Reflect_ownKeys = Reflect.ownKeys(object); _i1 < _Reflect_ownKeys.length; _i1++){
            var key1 = _Reflect_ownKeys[_i1];
            var descriptor1 = Object.getOwnPropertyDescriptor(object, key1);
            if (descriptor1.enumerable) {
                var value = object[key1];
                if (predicate(key1, value, object)) {
                    Object.defineProperty(result, key1, descriptor1);
                }
            }
        }
    }
    return result;
}

function splitOnFirst(string, separator) {
    if (!(typeof string === 'string' && typeof separator === 'string')) {
        throw new TypeError('Expected the arguments to be of type `string`');
    }
    if (string === '' || separator === '') {
        return [];
    }
    var separatorIndex = string.indexOf(separator);
    if (separatorIndex === -1) {
        return [];
    }
    return [
        string.slice(0, separatorIndex),
        string.slice(separatorIndex + separator.length)
    ];
}

function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes(arr) {
    if (Array.isArray(arr)) return arr;
}
function _array_without_holes(arr) {
    if (Array.isArray(arr)) return _array_like_to_array(arr);
}
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _extends() {
    _extends = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
function _iterable_to_array(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _iterable_to_array_limit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
        for(_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true){
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
        }
    } catch (err) {
        _d = true;
        _e = err;
    } finally{
        try {
            if (!_n && _i["return"] != null) _i["return"]();
        } finally{
            if (_d) throw _e;
        }
    }
    return _arr;
}
function _non_iterable_rest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _non_iterable_spread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _sliced_to_array(arr, i) {
    return _array_with_holes(arr) || _iterable_to_array_limit(arr, i) || _unsupported_iterable_to_array(arr, i) || _non_iterable_rest();
}
function _to_consumable_array(arr) {
    return _array_without_holes(arr) || _iterable_to_array(arr) || _unsupported_iterable_to_array(arr) || _non_iterable_spread();
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
}
var isNullOrUndefined = function(value) {
    return value === null || value === undefined;
};
// eslint-disable-next-line unicorn/prefer-code-point
var strictUriEncode = function(string) {
    return encodeURIComponent(string).replaceAll(/[!'()*]/g, function(x) {
        return "%" + x.charCodeAt(0).toString(16).toUpperCase();
    });
};
var encodeFragmentIdentifier = Symbol('encodeFragmentIdentifier');
function encoderForArrayFormat(options) {
    switch(options.arrayFormat){
        case 'index':
            {
                return function(key) {
                    return function(result, value) {
                        var index = result.length;
                        if (value === undefined || options.skipNull && value === null || options.skipEmptyString && value === '') {
                            return result;
                        }
                        if (value === null) {
                            return _to_consumable_array(result).concat([
                                [
                                    encode(key, options),
                                    '[',
                                    index,
                                    ']'
                                ].join('')
                            ]);
                        }
                        return _to_consumable_array(result).concat([
                            [
                                encode(key, options),
                                '[',
                                encode(index, options),
                                ']=',
                                encode(value, options)
                            ].join('')
                        ]);
                    };
                };
            }
        case 'bracket':
            {
                return function(key) {
                    return function(result, value) {
                        if (value === undefined || options.skipNull && value === null || options.skipEmptyString && value === '') {
                            return result;
                        }
                        if (value === null) {
                            return _to_consumable_array(result).concat([
                                [
                                    encode(key, options),
                                    '[]'
                                ].join('')
                            ]);
                        }
                        return _to_consumable_array(result).concat([
                            [
                                encode(key, options),
                                '[]=',
                                encode(value, options)
                            ].join('')
                        ]);
                    };
                };
            }
        case 'colon-list-separator':
            {
                return function(key) {
                    return function(result, value) {
                        if (value === undefined || options.skipNull && value === null || options.skipEmptyString && value === '') {
                            return result;
                        }
                        if (value === null) {
                            return _to_consumable_array(result).concat([
                                [
                                    encode(key, options),
                                    ':list='
                                ].join('')
                            ]);
                        }
                        return _to_consumable_array(result).concat([
                            [
                                encode(key, options),
                                ':list=',
                                encode(value, options)
                            ].join('')
                        ]);
                    };
                };
            }
        case 'comma':
        case 'separator':
        case 'bracket-separator':
            {
                var keyValueSeparator = options.arrayFormat === 'bracket-separator' ? '[]=' : '=';
                return function(key) {
                    return function(result, value) {
                        if (value === undefined || options.skipNull && value === null || options.skipEmptyString && value === '') {
                            return result;
                        }
                        // Translate null to an empty string so that it doesn't serialize as 'null'
                        value = value === null ? '' : value;
                        if (result.length === 0) {
                            return [
                                [
                                    encode(key, options),
                                    keyValueSeparator,
                                    encode(value, options)
                                ].join('')
                            ];
                        }
                        return [
                            [
                                result,
                                encode(value, options)
                            ].join(options.arrayFormatSeparator)
                        ];
                    };
                };
            }
        default:
            {
                return function(key) {
                    return function(result, value) {
                        if (value === undefined || options.skipNull && value === null || options.skipEmptyString && value === '') {
                            return result;
                        }
                        if (value === null) {
                            return _to_consumable_array(result).concat([
                                encode(key, options)
                            ]);
                        }
                        return _to_consumable_array(result).concat([
                            [
                                encode(key, options),
                                '=',
                                encode(value, options)
                            ].join('')
                        ]);
                    };
                };
            }
    }
}
function parserForArrayFormat(options) {
    var result;
    switch(options.arrayFormat){
        case 'index':
            {
                return function(key, value, accumulator) {
                    result = /\[(\d*)]$/.exec(key);
                    key = key.replace(/\[\d*]$/, '');
                    if (!result) {
                        accumulator[key] = value;
                        return;
                    }
                    if (accumulator[key] === undefined) {
                        accumulator[key] = {};
                    }
                    accumulator[key][result[1]] = value;
                };
            }
        case 'bracket':
            {
                return function(key, value, accumulator) {
                    result = /(\[])$/.exec(key);
                    key = key.replace(/\[]$/, '');
                    if (!result) {
                        accumulator[key] = value;
                        return;
                    }
                    if (accumulator[key] === undefined) {
                        accumulator[key] = [
                            value
                        ];
                        return;
                    }
                    accumulator[key] = _to_consumable_array(accumulator[key]).concat([
                        value
                    ]);
                };
            }
        case 'colon-list-separator':
            {
                return function(key, value, accumulator) {
                    result = /(:list)$/.exec(key);
                    key = key.replace(/:list$/, '');
                    if (!result) {
                        accumulator[key] = value;
                        return;
                    }
                    if (accumulator[key] === undefined) {
                        accumulator[key] = [
                            value
                        ];
                        return;
                    }
                    accumulator[key] = _to_consumable_array(accumulator[key]).concat([
                        value
                    ]);
                };
            }
        case 'comma':
        case 'separator':
            {
                return function(key, value, accumulator) {
                    var isArray = typeof value === 'string' && value.includes(options.arrayFormatSeparator);
                    var isEncodedArray = typeof value === 'string' && !isArray && decode(value, options).includes(options.arrayFormatSeparator);
                    value = isEncodedArray ? decode(value, options) : value;
                    var newValue = isArray || isEncodedArray ? value.split(options.arrayFormatSeparator).map(function(item) {
                        return decode(item, options);
                    }) : value === null ? value : decode(value, options);
                    accumulator[key] = newValue;
                };
            }
        case 'bracket-separator':
            {
                return function(key, value, accumulator) {
                    var isArray = /(\[])$/.test(key);
                    key = key.replace(/\[]$/, '');
                    if (!isArray) {
                        accumulator[key] = value ? decode(value, options) : value;
                        return;
                    }
                    var arrayValue = value === null ? [] : value.split(options.arrayFormatSeparator).map(function(item) {
                        return decode(item, options);
                    });
                    if (accumulator[key] === undefined) {
                        accumulator[key] = arrayValue;
                        return;
                    }
                    accumulator[key] = _to_consumable_array(accumulator[key]).concat(_to_consumable_array(arrayValue));
                };
            }
        default:
            {
                return function(key, value, accumulator) {
                    if (accumulator[key] === undefined) {
                        accumulator[key] = value;
                        return;
                    }
                    accumulator[key] = _to_consumable_array([
                        accumulator[key]
                    ].flat()).concat([
                        value
                    ]);
                };
            }
    }
}
function validateArrayFormatSeparator(value) {
    if (typeof value !== 'string' || value.length !== 1) {
        throw new TypeError('arrayFormatSeparator must be single character string');
    }
}
function encode(value, options) {
    if (options.encode) {
        return options.strict ? strictUriEncode(value) : encodeURIComponent(value);
    }
    return value;
}
function decode(value, options) {
    if (options.decode) {
        return decodeUriComponent(value);
    }
    return value;
}
function keysSorter(input) {
    if (Array.isArray(input)) {
        return input.sort();
    }
    if ((typeof input === "undefined" ? "undefined" : _type_of(input)) === 'object') {
        return keysSorter(Object.keys(input)).sort(function(a, b) {
            return Number(a) - Number(b);
        }).map(function(key) {
            return input[key];
        });
    }
    return input;
}
function removeHash(input) {
    var hashStart = input.indexOf('#');
    if (hashStart !== -1) {
        input = input.slice(0, hashStart);
    }
    return input;
}
function getHash(url) {
    var hash = '';
    var hashStart = url.indexOf('#');
    if (hashStart !== -1) {
        hash = url.slice(hashStart);
    }
    return hash;
}
function parseValue(value, options, type) {
    if (type === 'string' && typeof value === 'string') {
        return value;
    }
    if (typeof type === 'function' && typeof value === 'string') {
        return type(value);
    }
    if (options.parseBooleans && value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
        return value.toLowerCase() === 'true';
    }
    if (type === 'number' && !Number.isNaN(Number(value)) && typeof value === 'string' && value.trim() !== '') {
        return Number(value);
    }
    if (options.parseNumbers && !Number.isNaN(Number(value)) && typeof value === 'string' && value.trim() !== '') {
        return Number(value);
    }
    return value;
}
function extract(input) {
    input = removeHash(input);
    var queryStart = input.indexOf('?');
    if (queryStart === -1) {
        return '';
    }
    return input.slice(queryStart + 1);
}
function parse(query, options) {
    options = _extends({
        decode: true,
        sort: true,
        arrayFormat: 'none',
        arrayFormatSeparator: ',',
        parseNumbers: false,
        parseBooleans: false,
        types: Object.create(null)
    }, options);
    validateArrayFormatSeparator(options.arrayFormatSeparator);
    var formatter = parserForArrayFormat(options);
    // Create an object with no prototype
    var returnValue = Object.create(null);
    if (typeof query !== 'string') {
        return returnValue;
    }
    query = query.trim().replace(/^[?#&]/, '');
    if (!query) {
        return returnValue;
    }
    for(var _i = 0, _query_split = query.split('&'); _i < _query_split.length; _i++){
        var parameter = _query_split[_i];
        if (parameter === '') {
            continue;
        }
        var parameter_ = options.decode ? parameter.replaceAll('+', ' ') : parameter;
        var _splitOnFirst = _sliced_to_array(splitOnFirst(parameter_, '='), 2), key = _splitOnFirst[0], value = _splitOnFirst[1];
        if (key === undefined) {
            key = parameter_;
        }
        // Missing `=` should be `null`:
        // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
        value = value === undefined ? null : [
            'comma',
            'separator',
            'bracket-separator'
        ].includes(options.arrayFormat) ? value : decode(value, options);
        formatter(decode(key, options), value, returnValue);
    }
    for(var _i1 = 0, _Object_entries = Object.entries(returnValue); _i1 < _Object_entries.length; _i1++){
        var _Object_entries__i = _sliced_to_array(_Object_entries[_i1], 2), key1 = _Object_entries__i[0], value1 = _Object_entries__i[1];
        if ((typeof value1 === "undefined" ? "undefined" : _type_of(value1)) === 'object' && value1 !== null && options.types[key1] !== 'string') {
            for(var _i2 = 0, _Object_entries1 = Object.entries(value1); _i2 < _Object_entries1.length; _i2++){
                var _Object_entries__i1 = _sliced_to_array(_Object_entries1[_i2], 2), key2 = _Object_entries__i1[0], value2 = _Object_entries__i1[1];
                var type = options.types[key1] ? options.types[key1].replace('[]', '') : undefined;
                value1[key2] = parseValue(value2, options, type);
            }
        } else if ((typeof value1 === "undefined" ? "undefined" : _type_of(value1)) === 'object' && value1 !== null && options.types[key1] === 'string') {
            returnValue[key1] = Object.values(value1).join(options.arrayFormatSeparator);
        } else {
            returnValue[key1] = parseValue(value1, options, options.types[key1]);
        }
    }
    if (options.sort === false) {
        return returnValue;
    }
    // TODO: Remove the use of `reduce`.
    // eslint-disable-next-line unicorn/no-array-reduce
    return (options.sort === true ? Object.keys(returnValue).sort() : Object.keys(returnValue).sort(options.sort)).reduce(function(result, key) {
        var value = returnValue[key];
        result[key] = Boolean(value) && (typeof value === "undefined" ? "undefined" : _type_of(value)) === 'object' && !Array.isArray(value) ? keysSorter(value) : value;
        return result;
    }, Object.create(null));
}
function stringify(object, options) {
    if (!object) {
        return '';
    }
    options = _extends({
        encode: true,
        strict: true,
        arrayFormat: 'none',
        arrayFormatSeparator: ','
    }, options);
    validateArrayFormatSeparator(options.arrayFormatSeparator);
    var shouldFilter = function(key) {
        return options.skipNull && isNullOrUndefined(object[key]) || options.skipEmptyString && object[key] === '';
    };
    var formatter = encoderForArrayFormat(options);
    var objectCopy = {};
    for(var _i = 0, _Object_entries = Object.entries(object); _i < _Object_entries.length; _i++){
        var _Object_entries__i = _sliced_to_array(_Object_entries[_i], 2), key = _Object_entries__i[0], value = _Object_entries__i[1];
        if (!shouldFilter(key)) {
            objectCopy[key] = value;
        }
    }
    var keys = Object.keys(objectCopy);
    if (options.sort !== false) {
        keys.sort(options.sort);
    }
    return keys.map(function(key) {
        var value = object[key];
        if (value === undefined) {
            return '';
        }
        if (value === null) {
            return encode(key, options);
        }
        if (Array.isArray(value)) {
            if (value.length === 0 && options.arrayFormat === 'bracket-separator') {
                return encode(key, options) + '[]';
            }
            return value.reduce(formatter(key), []).join('&');
        }
        return encode(key, options) + '=' + encode(value, options);
    }).filter(function(x) {
        return x.length > 0;
    }).join('&');
}
function parseUrl(url, options) {
    var _url__split;
    options = _extends({
        decode: true
    }, options);
    var _splitOnFirst = _sliced_to_array(splitOnFirst(url, '#'), 2), url_ = _splitOnFirst[0], hash = _splitOnFirst[1];
    if (url_ === undefined) {
        url_ = url;
    }
    var _url__split_;
    return _extends({
        url: (_url__split_ = url_ == null ? void 0 : (_url__split = url_.split('?')) == null ? void 0 : _url__split[0]) != null ? _url__split_ : '',
        query: parse(extract(url), options)
    }, options && options.parseFragmentIdentifier && hash ? {
        fragmentIdentifier: decode(hash, options)
    } : {});
}
function stringifyUrl(object, options) {
    options = _extends(_define_property({
        encode: true,
        strict: true
    }, encodeFragmentIdentifier, true), options);
    var url = removeHash(object.url).split('?')[0] || '';
    var queryFromUrl = extract(object.url);
    var query = _extends({}, parse(queryFromUrl, {
        sort: false
    }), object.query);
    var queryString = stringify(query, options);
    queryString && (queryString = "?" + queryString);
    var hash = getHash(object.url);
    if (typeof object.fragmentIdentifier === 'string') {
        var urlObjectForFragmentEncode = new URL(url);
        urlObjectForFragmentEncode.hash = object.fragmentIdentifier;
        hash = options[encodeFragmentIdentifier] ? urlObjectForFragmentEncode.hash : "#" + object.fragmentIdentifier;
    }
    return "" + url + queryString + hash;
}
function pick(input, filter, options) {
    options = _extends(_define_property({
        parseFragmentIdentifier: true
    }, encodeFragmentIdentifier, false), options);
    var _parseUrl = parseUrl(input, options), url = _parseUrl.url, query = _parseUrl.query, fragmentIdentifier = _parseUrl.fragmentIdentifier;
    return stringifyUrl({
        url: url,
        query: includeKeys(query, filter),
        fragmentIdentifier: fragmentIdentifier
    }, options);
}
function exclude(input, filter, options) {
    var exclusionFilter = Array.isArray(filter) ? function(key) {
        return !filter.includes(key);
    } : function(key, value) {
        return !filter(key, value);
    };
    return pick(input, exclusionFilter, options);
}

var queryString = /*#__PURE__*/Object.freeze({
	__proto__: null,
	exclude: exclude,
	extract: extract,
	parse: parse,
	parseUrl: parseUrl,
	pick: pick,
	stringify: stringify,
	stringifyUrl: stringifyUrl
});

export { queryString as default };
