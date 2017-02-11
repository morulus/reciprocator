"use strict";
const Store = require('./Store.js');
const isGenerator = require('is-generator');
const MESSAGE = require('./constants.js').MESSAGE;
const RESTANTE = require('./constants.js').RESTANTE;
const CANCEL = require('./constants.js').CANCEL;
const CANCELLED = require('./constants.js').CANCELLED;

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
  }

  const stateToProps = "undefined"===typeof props;
  const getState = "function"===typeof store.getState ? store.getState.bind(store) : function() { return store; };

  if (stateToProps) {
    props = getState();
  }

  if (next && next[RESTANTE]) {
    return Promise.resolve(next);
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
            if (previousNext.hasOwnProperty(CANCELLED)) {
              return Promise.resolve(
                previousNext[CANCELLED] !== undefined
                ? previousNext.return(value).value
                : previousNext[CANCELLED]
              );
            }
            let nextValue = previousNext.next(value);
            if (!nextValue.done) {
              return run(nextValue, getState(), store, previousNext);
            } else {
              return Promise.resolve(value);
            }
          } catch(e) {
            return Promise.reject(e);
          }
        })
        .catch(function(error) {
          try {
            if (previousNext.hasOwnProperty(CANCELLED)) {
              return Promise.resolve(
                previousNext[CANCELLED] !== undefined
                ? previousNext.return(value).value
                : previousNext[CANCELLED]
              );
            }
            let nextValue = previousNext.throw(error);
            if (!nextValue.done) {
              return run(nextValue, getState(), store, previousNext);
            } else {
              return Promise.reject(error);
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
        const wrap = run(value, getState(), store, next);
        wrap[CANCEL] = (val) => {
          next[CANCELLED] = val;
        };
        return wrap;
      } catch(e) {
        return Promise.reject(e);
      }
    } else if (isPromise(next)) {
      let cancel;
      const wrap = new Promise(function(resolve, reject) {
        cancel = resolve;
        next
        .then(function(next) {
          run(next, getState(), store)
          .then(resolve)
          .catch(reject);
        }).catch(function(err) {
          run(err, getState(), store)
          .then(resolve)
          .catch(reject);
        });
      });
      wrap[CANCEL] = val => cancel(val);
      return wrap;
    } else if (isError(next)) {
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
