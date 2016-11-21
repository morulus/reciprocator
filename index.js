"use strict";

const isGenerator = require('is-generator')

function isFunction(next) {
  return "function"===typeof next;
}

function isObject(next) {
  return next!==null&&"object"===typeof next;
}

function isGeneratorResult(next) {
  return next.hasOwnProperty('value')&&next.hasOwnProperty('done')&&"boolean"===typeof next.done;
}

function isPromise(next) {
	return next!==null&&"object"===typeof next&&"function"===typeof next.then&&"function"===typeof next['catch'];
}

module.exports = function run(next, store = {}, previousNext = null) {
  if (isFunction(next)) {
    try {
      return run(next(store), store);
    } catch(e) {
      return Promise.reject(e);
    }
  } else if (isObject(next)) {
    if (isObject(previousNext)&&isGeneratorResult(next)) {
      // Means it is generator result
      if (!next.done) {
        return run(next.value, store)
        .then(function(value) {
          try {
            return run(previousNext.next(value), store, previousNext);
          } catch(e) {
            return Promise.reject(e);
          }
        });
      } else {
        return run(next.value, store);
      }
    } else if (isGenerator(next)) {
      // Means it is generator
      try {
        return run(next.next(), store, next);
      } catch(e) {
        return Promise.reject(e);
      }
    } else {
      // Returns plain object
      return Promise.resolve(next);
    }
  } else if (isPromise(next)) {
    return next.then(function(next) {
      return run(next, store);
    })
  } else if (isError(next)){
    return Promise.reject(next);
  } else {
    return Promise.resolve(next);
  }
}
