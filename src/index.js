const defaults = require("lodash.defaults");
const run = require("./run");
const legacy = require("./legacy");

export const apply = (task, context, args) => Reflect.apply(run, context, [
  task,
  args
]);

export const create = function create (task, initialContext, ownArgs) {
  return function(...args) {
    return Reflect.apply(run, initialContext || this, [
      task,
      ownArgs || args
    ]);
  };
};

/* Create fyped function with prototypically inherit context */
export const createChild = function createChild(
  task,
  initialChildContext,
  ownArgs
) {
  return function withBoundedChildContext(...args) {
    const childContext = Object.create(this);

    Object.assign(childContext, initialChildContext);

    return Reflect.apply(run, childContext, [
      task,
      ownArgs || args
    ]);
  };
};

export {
  run,
  legacy
};

const Reciprocator = {
  apply,
  create,
  run,

  /* Support old legacy run */
  legacy
};

export const effects = {
  /* Get current context */
  context: function getContext() {
    return this;
  },

  /* Specify default context properties */
  defaultContext(defaultContextProperties) {
    return function applyDefaultContext() {
      defaults(this, defaultContextProperties);
    };
  },

  /* Assign some properties to current execution context */
  assignContext(newProperies) {
    return function assignContext() {
      Object.assign(this, newProperies);
    };
  },

  /*
   * Create new child context prototypically inherited with current
   * context
   */
  createChildContext(initialContext) {
    return function childContextCreator() {
      const childContext = Object.create(this);

      Object.assign(childContext, initialContext);

      return childContext;
    };
  },

  /* Cancel current task (it can a promise, or generator flow)*/
  cancel: function cancel(task, final) {
    return function() {
      if (typeof task[run.CANCEL] === "function") {
        task[run.CANCEL](final);
      } else {
        throw new Error(`The task (${typeof task})cannot be cancelled`);
      }
    };
  },

  /* Wrap value, which will be returned as result no matter its type */
  payload: function payload(fn) {
    /*
     * TODO: validation
     *
     */
    function payloaded() {
      return fn;
    }

    payloaded[run.RETURN_PAYLOAD] = true;

    return payloaded;
  }
};

export default Reciprocator;
