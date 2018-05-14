/* eslint-disable */

"use strict";

const isGenerator = require("is-generator");
const {
  RESTANTE,
  CANCEL,
  CANCELLED
} = require("./constants");
const createStore = require("./createStore");

/*
 * From version 0.4.0 RESTANTE called PAYLOAD, from version 0.5.0 RESTANTE will
 *be removed
 */
const PAYLOAD = RESTANTE;

function isFunction(next) {
  return typeof next === "function";
}

function isObject(next) {
  return next !== null && typeof next === "object";
}

function isGeneratorResult(next) {
  return next.hasOwnProperty("value") && next.hasOwnProperty("done") && typeof next.done === "boolean";
}

function isPromise(next) {
  return next !== null && typeof next === "object" && typeof next.then === "function" && typeof next.catch === "function";
}

function isError(next) {
  return next instanceof Error;
}

function validateStore() {
  return typeof store === "object" &&
    typeof store.dispatch === "function" &&
    typeof store.getState === "function";
}

const DEFAULT_REDUCER = state => state;

module.exports = function run(next, props, store, previousNext) {
  if (!store) {
    store = createStore(DEFAULT_REDUCER, {});
  }

  const getState = typeof store.getState === "function" ? store.getState.bind(store) : function() {
    return store;
  };

  if (typeof props === "undefined") {
    props = getState();
  }

  /*
   * Handles situation when result is a function as is, not a next part of the
   * flow. Thus if you prefer to return function as final paylaod, you must to
   * define [PAYLOAD] static property, to prevent execution in the flow
   */
  if (next && next[PAYLOAD]) {
    delete next[PAYLOAD];

    return Promise.resolve(next);
  }

  /*
   * Is next unit is a functiom. it must be called with current props
   * and store and result will go to the flow again
   */
  if (isFunction(next)) {
    try {
      return run(next(props, store), getState(), store);
    } catch (e) {
      return Promise.reject(e);
    }

  /* Handle case when next unit is an object */
  } else if (isObject(next)) {
    /* If next unit is a generator result */
    if (isObject(previousNext) && isGeneratorResult(next)) {
      /*
       * Generator still in work, current value should be executed
       * and after it next value should be getted
       */
      if (!next.done) {
        return run(next.value, getState(), store)
          .then(value => {
            try {
            /* In this case next is just a generator result, ??? */
              if (previousNext.hasOwnProperty(CANCELLED)) {
                return Promise.resolve(previousNext[CANCELLED] !== undefined
                  ? previousNext.return(value).value
                  : previousNext[CANCELLED]);
              }
              const nextValue = previousNext.next(value);
              /**
               * If generator has no closing `return` statement, it will
               * return `undefined` values with done===true.
               * Anyway we have to return last yielded value.
               *
               * I must to decide about necessary to return undefined
               * with there is no return statement
               */

              if (nextValue.done && typeof nextValue.value === "undefined") {
                return Promise.resolve(value);
              }

              return run(nextValue, getState(), store, previousNext);
            } catch (e) {
              return Promise.reject(e);
            }
          })

        /* If error hapends while execution generator next value */
          .catch(error => {
            try {
            /* Handle case when generator work have been cancelled */
              if (previousNext.hasOwnProperty(CANCELLED)) {
                return Promise.resolve(previousNext[CANCELLED] !== undefined
                  ? previousNext.return(value).value
                  : previousNext[CANCELLED]);
              }

              /* Return error back to generator */
              const nextValue = previousNext.throw(error);

              /* Run next unit, provided by catch block */
              return run(nextValue, getState(), store, previousNext);

              /* Handles error which may be throwed while handling sub-level error */
            } catch (e) {
            /* Hm. may be we shoudl handle it in a normal way? .... */
              return Promise.reject(e);
            }
          });

      /* If generator done */
      }

      return run(next.value, getState(), store);
    } else if (isGenerator(next)) {
      // Means it is generator
      try {
        const value = next.next();
        const wrap = run(value, getState(), store, next);

        wrap[CANCEL] = val => {
          next[CANCELLED] = val;
        };

        return wrap;
      } catch (e) {
        return Promise.reject(e);
      }
    } else if (isPromise(next)) {
      let cancel;
      const wrap = new Promise((resolve, reject) => {
        cancel = resolve;
        next
          .then(next => {
            run(next, getState(), store)
              .then(resolve)
              .catch(reject);
          }).catch(err => {
            run(err instanceof Error ? err : new Error(err), getState(), store)
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
};
