"use strict";

const isGenerator = require("is-generator");
const isFunction = require("is-function");
const isPromise = require("is-promise");
const isObject = require("is-object");
const isObjectLike = require("is-object-like");
const isError = require("is-error");

const {
  PAYLOAD,
  CANCEL,
  CANCELLED
} = require("./constants");

function isGeneratorResultLike(next) {
  return next.hasOwnProperty("value") && next.hasOwnProperty("done") && typeof next.done === "boolean";
}

function extractPayload(value) {
  if (isObjectLike(value) && value[PAYLOAD]) {
    if (value[PAYLOAD] === "invoke") {
      return value();
    }
    Reflect.deleteProperty(value, PAYLOAD);

    return value;
  }

  return value;
}

module.exports = function run(next, args, previousNext) {
  if (typeof args === "undefined") {
    args = [];
  }

  // TODO: add object like
  if (typeof this !== "object" && typeof this !== "undefined") {
    throw new Error(`Context should be an object or undefined. ${typeof this} given`);
  }

  /* Reduce context */
  const context = this || null;

  /*
   * Handles situation when result is a function as is, not a next part of the
   * flow. Thus if you prefer to return function as final paylaod, you must to
   * define [PAYLOAD] static property, to prevent execution in the flow
   */

  if (next && next[PAYLOAD]) {
    return Promise.resolve(next);
  }

  /*
   * Is next unit is a functiom. it must be called with current props
   * and store and result will go to the flow again
   */
  if (isFunction(next)) {
    try {
      const result = Reflect.apply(next, context, args);

      /* That function was just a final result factory */
      /*
       * if (next[RETURN_PAYLOAD]) {
       *   return Promise.resolve(result);
       * }
       */

      return Reflect.apply(run, context, [
        result,
        args
      ]);
    } catch (e) {
      return Promise.reject(e);
    }

  /* Handle case when next unit is an object */
  } else if (isObject(next)) {
    /* If next unit is a generator result */
    if (
      isObject(previousNext) &&
      isGeneratorResultLike(next)
    ) {
      /*
       * Generator still in work, current value should be executed
       * and after it next value should be getted
       */
      if (!next.done) {
        return Reflect.apply(run, context, [
          next.value,
          args
        ])
          .then(rawValue => {
            /* Extract payload */
            debugger; // eslint-disable-line
            const value = extractPayload(rawValue);

            try {
            /* In this case next is just a generator result, ??? */
              if (previousNext.hasOwnProperty(CANCELLED)) {
                return Promise.resolve(typeof previousNext[CANCELLED] === "undefined"
                  ? previousNext[CANCELLED]
                  : previousNext.return(value).value);
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
                return Promise.resolve(rawValue);
              }

              return Reflect.apply(run, context, [
                nextValue,
                args,
                previousNext
              ]);
            } catch (e) {
              return Promise.reject(e);
            }
          })

        /* If error hapends while execution generator next value */
          .catch(error => {
            try {
            /* Handle case when generator work have been cancelled */
              if (previousNext.hasOwnProperty(CANCELLED)) {
                return Promise.resolve(typeof previousNext[CANCELLED] === "undefined"
                  ? previousNext[CANCELLED]

                  /* TODO: What I must to return here? */
                  : previousNext.return(null).value);
              }

              /* Return error back to generator */
              const nextValue = previousNext.throw(error);

              /* Run next unit, provided by catch block */
              return Reflect.apply(run, context, [
                nextValue,
                args,
                previousNext
              ]);

              /*
               * Handles error which may be throwed while handling
               * sub-level error
               */
            } catch (e) {
            /* Hm. may be we shoudl handle it in a normal way? .... */
              return Promise.reject(e);
            }
          });

      /* If generator done */
      }

      return Reflect.apply(run, context, [
        next.value,
        args
      ]);
    } else if (isGenerator(next)) {
      // Means it is generator
      try {
        const value = next.next();
        const wrap = Reflect.apply(run, context, [
          value,
          args,
          next
        ]);

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
            Reflect.apply(run, context, [
              next,
              args
            ])
              .then(resolve)
              .catch(reject);
          }).catch(err => {
            Reflect.apply(run, context, [
              err instanceof Error ? err : new Error(err),
              args
            ])
              .then(resolve)
              .catch(reject);
          });
      });

      wrap[CANCEL] = val => cancel(val);

      return wrap;
    } else if (isError(next)) {
      return Promise.reject(next);

    /* Unexecutable payload */
    } else if (next[PAYLOAD]) {
      return Promise.resolve(next.value);
    } else {
      // Returns plain object
      return Promise.resolve(next);
    }
  } else {
    // Returns plain object
    return Promise.resolve(next);
  }
};

module.exports.PAYLOAD = PAYLOAD;
// module.exports.RETURN_PAYLOAD = RETURN_PAYLOAD;
module.exports.CANCELLED = CANCELLED;
module.exports.CANCELLED = CANCELLED;
