'use strict';

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var strictUriEncode = require('strict-uri-encode');

var decodeComponent = require('decode-uri-component');

var splitOnFirst = require('split-on-first');

function encoderForArrayFormat(options) {
  switch (options.arrayFormat) {
    case 'index':
      return function (key) {
        return function (result, value) {
          var index = result.length;

          if (value === undefined || options.skipNull && value === null) {
            return result;
          }

          if (value === null) {
            return [].concat(_toConsumableArray(result), [[encode(key, options), '[', index, ']'].join('')]);
          }

          return [].concat(_toConsumableArray(result), [[encode(key, options), '[', encode(index, options), ']=', encode(value, options)].join('')]);
        };
      };

    case 'bracket':
      return function (key) {
        return function (result, value) {
          if (value === undefined || options.skipNull && value === null) {
            return result;
          }

          if (value === null) {
            return [].concat(_toConsumableArray(result), [[encode(key, options), '[]'].join('')]);
          }

          return [].concat(_toConsumableArray(result), [[encode(key, options), '[]=', encode(value, options)].join('')]);
        };
      };

    case 'comma':
      return function (key) {
        return function (result, value) {
          if (value === null || value === undefined || value.length === 0) {
            return result;
          }

          if (result.length === 0) {
            return [[encode(key, options), '=', encode(value, options)].join('')];
          }

          return [[result, encode(value, options)].join(',')];
        };
      };

    default:
      return function (key) {
        return function (result, value) {
          if (value === undefined || options.skipNull && value === null) {
            return result;
          }

          if (value === null) {
            return [].concat(_toConsumableArray(result), [encode(key, options)]);
          }

          return [].concat(_toConsumableArray(result), [[encode(key, options), '=', encode(value, options)].join('')]);
        };
      };
  }
}

function parserForArrayFormat(options) {
  var result;

  switch (options.arrayFormat) {
    case 'index':
      return function (key, value, accumulator) {
        result = /\[(\d*)\]$/.exec(key);
        key = key.replace(/\[\d*\]$/, '');

        if (!result) {
          accumulator[key] = value;
          return;
        }

        if (accumulator[key] === undefined) {
          accumulator[key] = {};
        }

        accumulator[key][result[1]] = value;
      };

    case 'bracket':
      return function (key, value, accumulator) {
        result = /(\[\])$/.exec(key);
        key = key.replace(/\[\]$/, '');

        if (!result) {
          accumulator[key] = value;
          return;
        }

        if (accumulator[key] === undefined) {
          accumulator[key] = [value];
          return;
        }

        accumulator[key] = [].concat(accumulator[key], value);
      };

    case 'comma':
      return function (key, value, accumulator) {
        var isArray = typeof value === 'string' && value.split('').indexOf(',') > -1;
        var newValue = isArray ? value.split(',') : value;
        accumulator[key] = newValue;
      };

    default:
      return function (key, value, accumulator) {
        if (accumulator[key] === undefined) {
          accumulator[key] = value;
          return;
        }

        accumulator[key] = [].concat(accumulator[key], value);
      };
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
    return decodeComponent(value);
  }

  return value;
}

function keysSorter(input) {
  if (Array.isArray(input)) {
    return input.sort();
  }

  if (_typeof(input) === 'object') {
    return keysSorter(Object.keys(input)).sort(function (a, b) {
      return Number(a) - Number(b);
    }).map(function (key) {
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

function extract(input) {
  input = removeHash(input);
  var queryStart = input.indexOf('?');

  if (queryStart === -1) {
    return '';
  }

  return input.slice(queryStart + 1);
}

function parseValue(value, options) {
  if (options.parseNumbers && !Number.isNaN(Number(value)) && typeof value === 'string' && value.trim() !== '') {
    value = Number(value);
  } else if (options.parseBooleans && value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
    value = value.toLowerCase() === 'true';
  }

  return value;
}

function parse(input, options) {
  options = Object.assign({
    decode: true,
    sort: true,
    arrayFormat: 'none',
    parseNumbers: false,
    parseBooleans: false
  }, options);
  var formatter = parserForArrayFormat(options); // Create an object with no prototype

  var ret = Object.create(null);

  if (typeof input !== 'string') {
    return ret;
  }

  input = input.trim().replace(/^[?#&]/, '');

  if (!input) {
    return ret;
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = input.split('&')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var param = _step.value;

      var _splitOnFirst = splitOnFirst(options.decode ? param.replace(/\+/g, ' ') : param, '='),
          _splitOnFirst2 = _slicedToArray(_splitOnFirst, 2),
          key = _splitOnFirst2[0],
          value = _splitOnFirst2[1]; // Missing `=` should be `null`:
      // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters


      value = value === undefined ? null : decode(value, options);
      formatter(decode(key, options), value, ret);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  for (var _i = 0, _Object$keys = Object.keys(ret); _i < _Object$keys.length; _i++) {
    var _key = _Object$keys[_i];
    var _value = ret[_key];

    if (_typeof(_value) === 'object' && _value !== null) {
      for (var _i2 = 0, _Object$keys2 = Object.keys(_value); _i2 < _Object$keys2.length; _i2++) {
        var k = _Object$keys2[_i2];
        _value[k] = parseValue(_value[k], options);
      }
    } else {
      ret[_key] = parseValue(_value, options);
    }
  }

  if (options.sort === false) {
    return ret;
  }

  return (options.sort === true ? Object.keys(ret).sort() : Object.keys(ret).sort(options.sort)).reduce(function (result, key) {
    var value = ret[key];

    if (Boolean(value) && _typeof(value) === 'object' && !Array.isArray(value)) {
      // Sort object keys, not values
      result[key] = keysSorter(value);
    } else {
      result[key] = value;
    }

    return result;
  }, Object.create(null));
}

exports.extract = extract;
exports.parse = parse;

exports.stringify = function (object, options) {
  if (!object) {
    return '';
  }

  options = Object.assign({
    encode: true,
    strict: true,
    arrayFormat: 'none'
  }, options);
  var formatter = encoderForArrayFormat(options);
  var objectCopy = Object.assign({}, object);

  if (options.skipNull) {
    for (var _i3 = 0, _Object$keys3 = Object.keys(objectCopy); _i3 < _Object$keys3.length; _i3++) {
      var key = _Object$keys3[_i3];

      if (objectCopy[key] === undefined || objectCopy[key] === null) {
        delete objectCopy[key];
      }
    }
  }

  var keys = Object.keys(objectCopy);

  if (options.sort !== false) {
    keys.sort(options.sort);
  }

  return keys.map(function (key) {
    var value = object[key];

    if (value === undefined) {
      return '';
    }

    if (value === null) {
      return encode(key, options);
    }

    if (Array.isArray(value)) {
      return value.reduce(formatter(key), []).join('&');
    }

    return encode(key, options) + '=' + encode(value, options);
  }).filter(function (x) {
    return x.length > 0;
  }).join('&');
};

exports.parseUrl = function (input, options) {
  return {
    url: removeHash(input).split('?')[0] || '',
    query: parse(extract(input), options)
  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sIm5hbWVzIjpbInN0cmljdFVyaUVuY29kZSIsInJlcXVpcmUiLCJkZWNvZGVDb21wb25lbnQiLCJzcGxpdE9uRmlyc3QiLCJlbmNvZGVyRm9yQXJyYXlGb3JtYXQiLCJvcHRpb25zIiwiYXJyYXlGb3JtYXQiLCJrZXkiLCJyZXN1bHQiLCJ2YWx1ZSIsImluZGV4IiwibGVuZ3RoIiwidW5kZWZpbmVkIiwic2tpcE51bGwiLCJlbmNvZGUiLCJqb2luIiwicGFyc2VyRm9yQXJyYXlGb3JtYXQiLCJhY2N1bXVsYXRvciIsImV4ZWMiLCJyZXBsYWNlIiwiY29uY2F0IiwiaXNBcnJheSIsInNwbGl0IiwiaW5kZXhPZiIsIm5ld1ZhbHVlIiwic3RyaWN0IiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiZGVjb2RlIiwia2V5c1NvcnRlciIsImlucHV0IiwiQXJyYXkiLCJzb3J0IiwiT2JqZWN0Iiwia2V5cyIsImEiLCJiIiwiTnVtYmVyIiwibWFwIiwicmVtb3ZlSGFzaCIsImhhc2hTdGFydCIsInNsaWNlIiwiZXh0cmFjdCIsInF1ZXJ5U3RhcnQiLCJwYXJzZVZhbHVlIiwicGFyc2VOdW1iZXJzIiwiaXNOYU4iLCJ0cmltIiwicGFyc2VCb29sZWFucyIsInRvTG93ZXJDYXNlIiwicGFyc2UiLCJhc3NpZ24iLCJmb3JtYXR0ZXIiLCJyZXQiLCJjcmVhdGUiLCJwYXJhbSIsImsiLCJyZWR1Y2UiLCJCb29sZWFuIiwiZXhwb3J0cyIsInN0cmluZ2lmeSIsIm9iamVjdCIsIm9iamVjdENvcHkiLCJmaWx0ZXIiLCJ4IiwicGFyc2VVcmwiLCJ1cmwiLCJxdWVyeSJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsSUFBTUEsZUFBZSxHQUFHQyxPQUFPLENBQUMsbUJBQUQsQ0FBL0I7O0FBQ0EsSUFBTUMsZUFBZSxHQUFHRCxPQUFPLENBQUMsc0JBQUQsQ0FBL0I7O0FBQ0EsSUFBTUUsWUFBWSxHQUFHRixPQUFPLENBQUMsZ0JB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LENBRUEsR0FGQSxDQUFQO0FBR0E7O0FBRUQsV0FBT0QsTUFBTSxDQUFDUCxHQUFELEVBQU1GLE9BQU4sQ0FBTixHQUF1QixHQUF2QixHQUE2QlMsTUFBTSxDQUFDTCxLQUFELEVBQVFKLE9BQVIsQ0FBMUM7QUFDQSxHQWxCTSxFQWtCSnlELE1BbEJJLENBa0JHLFVBQUFDLENBQUM7QUFBQSxXQUFJQSxDQUFDLENBQUNwRCxNQUFGLEdBQVcsQ0FBZjtBQUFBLEdBbEJKLEVBa0JzQkksSUFsQnRCLENBa0IyQixHQWxCM0IsQ0FBUDtBQW1CQSxDQS9DRDs7QUFpREEyQyxPQUFPLENBQUNNLFFBQVIsR0FBbUIsVUFBQ25DLEtBQUQsRUFBUXhCLE9BQVIsRUFBb0I7QUFDdEMsU0FBTztBQUNONEQsSUFBQUEsR0FBRyxFQUFFM0IsVUFBVSxDQUFDVCxLQUFELENBQVYsQ0FBa0JQLEtBQWxCLENBQXdCLEdBQXhCLEVBQTZCLENBQTdCLEtBQW1DLEVBRGxDO0FBRU40QyxJQUFBQSxLQUFLLEVBQUVqQixLQUFLLENBQUNSLE9BQU8sQ0FBQ1osS0FBRCxDQUFSLEVBQWlCeEIsT0FBakI7QUFGTixHQUFQO0FBSUEsQ0FMRCIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbmNvbnN0IHN0cmljdFVyaUVuY29kZSA9IHJlcXVpcmUoJ3N0cmljdC11cmktZW5jb2RlJyk7XG5jb25zdCBkZWNvZGVDb21wb25lbnQgPSByZXF1aXJlKCdkZWNvZGUtdXJpLWNvbXBvbmVudCcpO1xuY29uc3Qgc3BsaXRPbkZpcnN0ID0gcmVxdWlyZSgnc3BsaXQtb24tZmlyc3QnKTtcblxuZnVuY3Rpb24gZW5jb2RlckZvckFycmF5Rm9ybWF0KG9wdGlvbnMpIHtcblx0c3dpdGNoIChvcHRpb25zLmFycmF5Rm9ybWF0KSB7XG5cdFx0Y2FzZSAnaW5kZXgnOlxuXHRcdFx0cmV0dXJuIGtleSA9PiAocmVzdWx0LCB2YWx1ZSkgPT4ge1xuXHRcdFx0XHRjb25zdCBpbmRleCA9IHJlc3VsdC5sZW5ndGg7XG5cdFx0XHRcdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IChvcHRpb25zLnNraXBOdWxsICYmIHZhbHVlID09PSBudWxsKSkge1xuXHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodmFsdWUgPT09IG51bGwpIHtcblx0XHRcdFx0XHRyZXR1cm4gWy4uLnJlc3VsdCwgW2VuY29kZShrZXksIG9wdGlvbnMpLCAnWycsIGluZGV4LCAnXSddLmpvaW4oJycpXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFx0Li4ucmVzdWx0LFxuXHRcdFx0XHRcdFtlbmNvZGUoa2V5LCBvcHRpb25zKSwgJ1snLCBlbmNvZGUoaW5kZXgsIG9wdGlvbnMpLCAnXT0nLCBlbmNvZGUodmFsdWUsIG9wdGlvbnMpXS5qb2luKCcnKVxuXHRcdFx0XHRdO1xuXHRcdFx0fTtcblxuXHRcdGNhc2UgJ2JyYWNrZXQnOlxuXHRcdFx0cmV0dXJuIGtleSA9PiAocmVzdWx0LCB2YWx1ZSkgPT4ge1xuXHRcdFx0XHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCAob3B0aW9ucy5za2lwTnVsbCAmJiB2YWx1ZSA9PT0gbnVsbCkpIHtcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHZhbHVlID09PSBudWxsKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFsuLi5yZXN1bHQsIFtlbmNvZGUoa2V5LCBvcHRpb25zKSwgJ1tdJ10uam9pbignJyldO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFsuLi5yZXN1bHQsIFtlbmNvZGUoa2V5LCBvcHRpb25zKSwgJ1tdPScsIGVuY29kZSh2YWx1ZSwgb3B0aW9ucyldLmpvaW4oJycpXTtcblx0XHRcdH07XG5cblx0XHRjYXNlICdjb21tYSc6XG5cdFx0XHRyZXR1cm4ga2V5ID0+IChyZXN1bHQsIHZhbHVlKSA9PiB7XG5cdFx0XHRcdGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAocmVzdWx0Lmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdHJldHVybiBbW2VuY29kZShrZXksIG9wdGlvbnMpLCAnPScsIGVuY29kZSh2YWx1ZSwgb3B0aW9ucyldLmpvaW4oJycpXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBbW3Jlc3VsdCwgZW5jb2RlKHZhbHVlLCBvcHRpb25zKV0uam9pbignLCcpXTtcblx0XHRcdH07XG5cblx0XHRkZWZhdWx0OlxuXHRcdFx0cmV0dXJuIGtleSA9PiAocmVzdWx0LCB2YWx1ZSkgPT4ge1xuXHRcdFx0XHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCAob3B0aW9ucy5za2lwTnVsbCAmJiB2YWx1ZSA9PT0gbnVsbCkpIHtcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHZhbHVlID09PSBudWxsKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFsuLi5yZXN1bHQsIGVuY29kZShrZXksIG9wdGlvbnMpXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBbLi4ucmVzdWx0LCBbZW5jb2RlKGtleSwgb3B0aW9ucyksICc9JywgZW5jb2RlKHZhbHVlLCBvcHRpb25zKV0uam9pbignJyldO1xuXHRcdFx0fTtcblx0fVxufVxuXG5mdW5jdGlvbiBwYXJzZXJGb3JBcnJheUZvcm1hdChvcHRpb25zKSB7XG5cdGxldCByZXN1bHQ7XG5cblx0c3dpdGNoIChvcHRpb25zLmFycmF5Rm9ybWF0KSB7XG5cdFx0Y2FzZSAnaW5kZXgnOlxuXHRcdFx0cmV0dXJuIChrZXksIHZhbHVlLCBhY2N1bXVsYXRvcikgPT4ge1xuXHRcdFx0XHRyZXN1bHQgPSAvXFxbKFxcZCopXFxdJC8uZXhlYyhrZXkpO1xuXG5cdFx0XHRcdGtleSA9IGtleS5yZXBsYWNlKC9cXFtcXGQqXFxdJC8sICcnKTtcblxuXHRcdFx0XHRpZiAoIXJlc3VsdCkge1xuXHRcdFx0XHRcdGFjY3VtdWxhdG9yW2tleV0gPSB2YWx1ZTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoYWNjdW11bGF0b3Jba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0YWNjdW11bGF0b3Jba2V5XSA9IHt9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YWNjdW11bGF0b3Jba2V5XVtyZXN1bHRbMV1dID0gdmFsdWU7XG5cdFx0XHR9O1xuXG5cdFx0Y2FzZSAnYnJhY2tldCc6XG5cdFx0XHRyZXR1cm4gKGtleSwgdmFsdWUsIGFjY3VtdWxhdG9yKSA9PiB7XG5cdFx0XHRcdHJlc3VsdCA9IC8oXFxbXFxdKSQvLmV4ZWMoa2V5KTtcblx0XHRcdFx0a2V5ID0ga2V5LnJlcGxhY2UoL1xcW1xcXSQvLCAnJyk7XG5cblx0XHRcdFx0aWYgKCFyZXN1bHQpIHtcblx0XHRcdFx0XHRhY2N1bXVsYXRvcltrZXldID0gdmFsdWU7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGFjY3VtdWxhdG9yW2tleV0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGFjY3VtdWxhdG9yW2tleV0gPSBbdmFsdWVdO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGFjY3VtdWxhdG9yW2tleV0gPSBbXS5jb25jYXQoYWNjdW11bGF0b3Jba2V5XSwgdmFsdWUpO1xuXHRcdFx0fTtcblxuXHRcdGNhc2UgJ2NvbW1hJzpcblx0XHRcdHJldHVybiAoa2V5LCB2YWx1ZSwgYWNjdW11bGF0b3IpID0+IHtcblx0XHRcdFx0Y29uc3QgaXNBcnJheSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgdmFsdWUuc3BsaXQoJycpLmluZGV4T2YoJywnKSA+IC0xO1xuXHRcdFx0XHRjb25zdCBuZXdWYWx1ZSA9IGlzQXJyYXkgPyB2YWx1ZS5zcGxpdCgnLCcpIDogdmFsdWU7XG5cdFx0XHRcdGFjY3VtdWxhdG9yW2tleV0gPSBuZXdWYWx1ZTtcblx0XHRcdH07XG5cblx0XHRkZWZhdWx0OlxuXHRcdFx0cmV0dXJuIChrZXksIHZhbHVlLCBhY2N1bXVsYXRvcikgPT4ge1xuXHRcdFx0XHRpZiAoYWNjdW11bGF0b3Jba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0YWNjdW11bGF0b3Jba2V5XSA9IHZhbHVlO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGFjY3VtdWxhdG9yW2tleV0gPSBbXS5jb25jYXQoYWNjdW11bGF0b3Jba2V5XSwgdmFsdWUpO1xuXHRcdFx0fTtcblx0fVxufVxuXG5mdW5jdGlvbiBlbmNvZGUodmFsdWUsIG9wdGlvbnMpIHtcblx0aWYgKG9wdGlvbnMuZW5jb2RlKSB7XG5cdFx0cmV0dXJuIG9wdGlvbnMuc3RyaWN0ID8gc3RyaWN0VXJpRW5jb2RlKHZhbHVlKSA6IGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XG5cdH1cblxuXHRyZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGRlY29kZSh2YWx1ZSwgb3B0aW9ucykge1xuXHRpZiAob3B0aW9ucy5kZWNvZGUpIHtcblx0XHRyZXR1cm4gZGVjb2RlQ29tcG9uZW50KHZhbHVlKTtcblx0fVxuXG5cdHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24ga2V5c1NvcnRlcihpbnB1dCkge1xuXHRpZiAoQXJyYXkuaXNBcnJheShpbnB1dCkpIHtcblx0XHRyZXR1cm4gaW5wdXQuc29ydCgpO1xuXHR9XG5cblx0aWYgKHR5cGVvZiBpbnB1dCA9PT0gJ29iamVjdCcpIHtcblx0XHRyZXR1cm4ga2V5c1NvcnRlcihPYmplY3Qua2V5cyhpbnB1dCkpXG5cdFx0XHQuc29ydCgoYSwgYikgPT4gTnVtYmVyKGEpIC0gTnVtYmVyKGIpKVxuXHRcdFx0Lm1hcChrZXkgPT4gaW5wdXRba2V5XSk7XG5cdH1cblxuXHRyZXR1cm4gaW5wdXQ7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUhhc2goaW5wdXQpIHtcblx0Y29uc3QgaGFzaFN0YXJ0ID0gaW5wdXQuaW5kZXhPZignIycpO1xuXHRpZiAoaGFzaFN0YXJ0ICE9PSAtMSkge1xuXHRcdGlucHV0ID0gaW5wdXQuc2xpY2UoMCwgaGFzaFN0YXJ0KTtcblx0fVxuXG5cdHJldHVybiBpbnB1dDtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdChpbnB1dCkge1xuXHRpbnB1dCA9IHJlbW92ZUhhc2goaW5wdXQpO1xuXHRjb25zdCBxdWVyeVN0YXJ0ID0gaW5wdXQuaW5kZXhPZignPycpO1xuXHRpZiAocXVlcnlTdGFydCA9PT0gLTEpIHtcblx0XHRyZXR1cm4gJyc7XG5cdH1cblxuXHRyZXR1cm4gaW5wdXQuc2xpY2UocXVlcnlTdGFydCArIDEpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVZhbHVlKHZhbHVlLCBvcHRpb25zKSB7XG5cdGlmIChvcHRpb25zLnBhcnNlTnVtYmVycyAmJiAhTnVtYmVyLmlzTmFOKE51bWJlcih2YWx1ZSkpICYmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmIHZhbHVlLnRyaW0oKSAhPT0gJycpKSB7XG5cdFx0dmFsdWUgPSBOdW1iZXIodmFsdWUpO1xuXHR9IGVsc2UgaWYgKG9wdGlvbnMucGFyc2VCb29sZWFucyAmJiB2YWx1ZSAhPT0gbnVsbCAmJiAodmFsdWUudG9Mb3dlckNhc2UoKSA9PT0gJ3RydWUnIHx8IHZhbHVlLnRvTG93ZXJDYXNlKCkgPT09ICdmYWxzZScpKSB7XG5cdFx0dmFsdWUgPSB2YWx1ZS50b0xvd2VyQ2FzZSgpID09PSAndHJ1ZSc7XG5cdH1cblxuXHRyZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHBhcnNlKGlucHV0LCBvcHRpb25zKSB7XG5cdG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcblx0XHRkZWNvZGU6IHRydWUsXG5cdFx0c29ydDogdHJ1ZSxcblx0XHRhcnJheUZvcm1hdDogJ25vbmUnLFxuXHRcdHBhcnNlTnVtYmVyczogZmFsc2UsXG5cdFx0cGFyc2VCb29sZWFuczogZmFsc2Vcblx0fSwgb3B0aW9ucyk7XG5cblx0Y29uc3QgZm9ybWF0dGVyID0gcGFyc2VyRm9yQXJyYXlGb3JtYXQob3B0aW9ucyk7XG5cblx0Ly8gQ3JlYXRlIGFuIG9iamVjdCB3aXRoIG5vIHByb3RvdHlwZVxuXHRjb25zdCByZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG5cdGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnKSB7XG5cdFx0cmV0dXJuIHJldDtcblx0fVxuXG5cdGlucHV0ID0gaW5wdXQudHJpbSgpLnJlcGxhY2UoL15bPyMmXS8sICcnKTtcblxuXHRpZiAoIWlucHV0KSB7XG5cdFx0cmV0dXJuIHJldDtcblx0fVxuXG5cdGZvciAoY29uc3QgcGFyYW0gb2YgaW5wdXQuc3BsaXQoJyYnKSkge1xuXHRcdGxldCBba2V5LCB2YWx1ZV0gPSBzcGxpdE9uRmlyc3Qob3B0aW9ucy5kZWNvZGUgPyBwYXJhbS5yZXBsYWNlKC9cXCsvZywgJyAnKSA6IHBhcmFtLCAnPScpO1xuXG5cdFx0Ly8gTWlzc2luZyBgPWAgc2hvdWxkIGJlIGBudWxsYDpcblx0XHQvLyBodHRwOi8vdzMub3JnL1RSLzIwMTIvV0QtdXJsLTIwMTIwNTI0LyNjb2xsZWN0LXVybC1wYXJhbWV0ZXJzXG5cdFx0dmFsdWUgPSB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGRlY29kZSh2YWx1ZSwgb3B0aW9ucyk7XG5cdFx0Zm9ybWF0dGVyKGRlY29kZShrZXksIG9wdGlvbnMpLCB2YWx1ZSwgcmV0KTtcblx0fVxuXG5cdGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKHJldCkpIHtcblx0XHRjb25zdCB2YWx1ZSA9IHJldFtrZXldO1xuXHRcdGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSB7XG5cdFx0XHRmb3IgKGNvbnN0IGsgb2YgT2JqZWN0LmtleXModmFsdWUpKSB7XG5cdFx0XHRcdHZhbHVlW2tdID0gcGFyc2VWYWx1ZSh2YWx1ZVtrXSwgb3B0aW9ucyk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldFtrZXldID0gcGFyc2VWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKG9wdGlvbnMuc29ydCA9PT0gZmFsc2UpIHtcblx0XHRyZXR1cm4gcmV0O1xuXHR9XG5cblx0cmV0dXJuIChvcHRpb25zLnNvcnQgPT09IHRydWUgPyBPYmplY3Qua2V5cyhyZXQpLnNvcnQoKSA6IE9iamVjdC5rZXlzKHJldCkuc29ydChvcHRpb25zLnNvcnQpKS5yZWR1Y2UoKHJlc3VsdCwga2V5KSA9PiB7XG5cdFx0Y29uc3QgdmFsdWUgPSByZXRba2V5XTtcblx0XHRpZiAoQm9vbGVhbih2YWx1ZSkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcblx0XHRcdC8vIFNvcnQgb2JqZWN0IGtleXMsIG5vdCB2YWx1ZXNcblx0XHRcdHJlc3VsdFtrZXldID0ga2V5c1NvcnRlcih2YWx1ZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlc3VsdFtrZXldID0gdmFsdWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fSwgT2JqZWN0LmNyZWF0ZShudWxsKSk7XG59XG5cbmV4cG9ydHMuZXh0cmFjdCA9IGV4dHJhY3Q7XG5leHBvcnRzLnBhcnNlID0gcGFyc2U7XG5cbmV4cG9ydHMuc3RyaW5naWZ5ID0gKG9iamVjdCwgb3B0aW9ucykgPT4ge1xuXHRpZiAoIW9iamVjdCkge1xuXHRcdHJldHVybiAnJztcblx0fVxuXG5cdG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcblx0XHRlbmNvZGU6IHRydWUsXG5cdFx0c3RyaWN0OiB0cnVlLFxuXHRcdGFycmF5Rm9ybWF0OiAnbm9uZSdcblx0fSwgb3B0aW9ucyk7XG5cblx0Y29uc3QgZm9ybWF0dGVyID0gZW5jb2RlckZvckFycmF5Rm9ybWF0KG9wdGlvbnMpO1xuXG5cdGNvbnN0IG9iamVjdENvcHkgPSBPYmplY3QuYXNzaWduKHt9LCBvYmplY3QpO1xuXHRpZiAob3B0aW9ucy5za2lwTnVsbCkge1xuXHRcdGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKG9iamVjdENvcHkpKSB7XG5cdFx0XHRpZiAob2JqZWN0Q29weVtrZXldID09PSB1bmRlZmluZWQgfHwgb2JqZWN0Q29weVtrZXldID09PSBudWxsKSB7XG5cdFx0XHRcdGRlbGV0ZSBvYmplY3RDb3B5W2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Y29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKG9iamVjdENvcHkpO1xuXG5cdGlmIChvcHRpb25zLnNvcnQgIT09IGZhbHNlKSB7XG5cdFx0a2V5cy5zb3J0KG9wdGlvbnMuc29ydCk7XG5cdH1cblxuXHRyZXR1cm4ga2V5cy5tYXAoa2V5ID0+IHtcblx0XHRjb25zdCB2YWx1ZSA9IG9iamVjdFtrZXldO1xuXG5cdFx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiAnJztcblx0XHR9XG5cblx0XHRpZiAodmFsdWUgPT09IG51bGwpIHtcblx0XHRcdHJldHVybiBlbmNvZGUoa2V5LCBvcHRpb25zKTtcblx0XHR9XG5cblx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcblx0XHRcdHJldHVybiB2YWx1ZVxuXHRcdFx0XHQucmVkdWNlKGZvcm1hdHRlcihrZXkpLCBbXSlcblx0XHRcdFx0LmpvaW4oJyYnKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZW5jb2RlKGtleSwgb3B0aW9ucykgKyAnPScgKyBlbmNvZGUodmFsdWUsIG9wdGlvbnMpO1xuXHR9KS5maWx0ZXIoeCA9PiB4Lmxlbmd0aCA+IDApLmpvaW4oJyYnKTtcbn07XG5cbmV4cG9ydHMucGFyc2VVcmwgPSAoaW5wdXQsIG9wdGlvbnMpID0+IHtcblx0cmV0dXJuIHtcblx0XHR1cmw6IHJlbW92ZUhhc2goaW5wdXQpLnNwbGl0KCc/JylbMF0gfHwgJycsXG5cdFx0cXVlcnk6IHBhcnNlKGV4dHJhY3QoaW5wdXQpLCBvcHRpb25zKVxuXHR9O1xufTtcbiJdfQ==