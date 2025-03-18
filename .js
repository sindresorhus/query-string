const queryString = require('./index');

// Example data that includes null and empty strings
const params = {
    list: ['item', '', null, 'last']
};

// Options to reproduce the bug
const options = {
    arrayFormat: 'comma',
    skipNull: false,
    skipEmptyString: false
};

// Stringify the parameters with the options
const result = queryString.stringify(params, options);

// Log the result to console
console.log(result); // Expected to incorrectly skip null and empty strings based on the bug
