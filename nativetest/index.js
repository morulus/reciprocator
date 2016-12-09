const singular = require('./../index.js').singular;
if ("function"===typeof singular) {
  console.log('OK');
} else {
  console.log('NOT OK');
}
