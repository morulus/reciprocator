const run = require("./run");
const legacy = require("./legacy");

const Reciprocator = {
  apply: (task, context, args) => Reflect.apply(run, context, [
    task,
    args
  ]),
  bind: (task, context) =>  args => Reflect.apply(run, context, [
    task,
    args
  ]),
  run,

  /* Support old legacy run */
  legacy
};

module.exports = Reciprocator;
