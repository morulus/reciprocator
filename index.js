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

function isError(next) {
  return next instanceof Error;
}

const defaultStore = {}
module.exports = function run(next, store, previousNext) {
  if ("object"!==typeof store) store = defaultStore;
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
            let nextValue = previousNext.next(value);
            if (!nextValue.done) {
              return run(nextValue, store, previousNext);
            } else {
              return Promise.resolve(value);
            }
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
        let value = next.next();
        return run(value, store, next);
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
