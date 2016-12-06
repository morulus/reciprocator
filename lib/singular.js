"use strict";
const Store = require('./Store.js');
const isGenerator = require('is-generator');
const MESSAGE = require('./constants.js').MESSAGE;

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

module.exports = function run(next, props, store, previousNext) {


  if ("object"!==typeof store) {
    store = new Store();
  } else if (store.constructor === Object) {
    store = new Store(store);
  }

  const stateToProps = "undefined"===typeof props;
  const getState = "function"===typeof getState ? getState.bind(store) : function() { return store; };

  if (stateToProps) {
    props = getState();
  }

  if (isFunction(next)) {
    let state = getState();
    if (process.env.DEBUG) {
      store.dispatch({
        type: MESSAGE,
        message: '> '+(next.name||'anonymus')
      });
    }
    try {
      return run(next(props, store), state, store);
    } catch(e) {
      return Promise.reject(e);
    }
  } else if (isObject(next)) {
    if (isObject(previousNext)&&isGeneratorResult(next)) {
      // Means it is generator result
      if (!next.done) {
        return run(next.value, getState(), store)
        .then(function(value) {
          try {
            let nextValue = previousNext.next(value);
            if (!nextValue.done) {
              return run(nextValue, getState(), store, previousNext);
            } else {
              return Promise.resolve(value);
            }
          } catch(e) {
            return Promise.reject(e);
          }
        });
      } else {
        return run(next.value, getState(), store);
      }
    } else if (isGenerator(next)) {
      // Means it is generator
      try {
        let value = next.next();
        return run(value, getState(), store, next);
      } catch(e) {
        return Promise.reject(e);
      }
    } else if (isPromise(next)) {
      return next.then(function(next) {
        return run(next, getState(), store);
      }).catch(function(err) {
        return run(err, getState(), store);
      });
    } else if (isError(next)){
      return Promise.reject(next);
    } else {
      // Returns plain object
      return Promise.resolve(next);
    }
  } else {
    // Returns plain object
    return Promise.resolve(next);
  }
}
