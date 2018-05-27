const defaults = require("lodash.defaults");
const isGenerator = require("is-generator");
const isFunction = require("is-function");
const isPromise = require("is-promise");
const run = require("./run");
const legacy = require("./legacy");

function resolveContext(context) {
  return typeof context === "function"
    ? context(this)
    : context;
}

export const apply = (task, context, args) => Reflect.apply(run, context || null, [
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
    const childContext = Object.create(this || null);

    Object.assign(childContext, Reflect.apply(
      resolveContext,

      /*
       * When child context build by function, by default should use empty
       * object, not null as other cases does
       */
      this || {},
      [ initialChildContext ]
    ));

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

/* Wrap value, which will be returned as result no matter its type */
function payload(value) {
  if (isPromise(value)) {
    const promiseFactory = function promiseFactory() {
      return value;
    };

    promiseFactory[run.PAYLOAD] = "invoke";

    return promiseFactory;
  }
  if (isGenerator(value) || isFunction(value)) {
    value[run.PAYLOAD] = true;
  }

  return value;
}

export const effects = {
  /*
   * Get current context
   * @derecated
   */
  context: function getContext() {
    throw new Error("Deprecated");
  },

  /* Get current context */
  getContext: () => function getContext() {
    return this;
  },


  /**
   * @deprecated Because spawn named just as common node.js function for
   * creating child processes. To prevent collisions function name has changed
   * to evolve.
   */
  spawn(task, context, args) {
    console.warn("Spawn is deprecated, use evolve");

    return function spawnChildFlow() {
      const childContext = Object.create(this || null);

      Object.assign(childContext, resolveContext(context));

      return apply(task, childContext, args);
    };
  },

  /* Apply function with child context */
  evolve(task, context, args) {
    return function applyChildFlow() {
      const childContext = Object.create(this || null);

      Object.assign(childContext, resolveContext(context));

      return apply(task, childContext, args);
    };
  },

  /* Fork child flow */
  fork(task, context, args) {
    return function forkChildFlow() {
      const childContext = Object.create(this);

      Object.assign(childContext, resolveContext(context));

      const flow = apply(task, childContext, args);

      return payload(flow);
    };
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
  payload
};

Reciprocator.effects = effects;

export default Reciprocator;
