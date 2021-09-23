const _ = require('lodash');
const R = require('ramda');

const fakeLazy = (value) => {
  return {
    getValue: async () => {
      return value;
    },
  };
};

// Takes an object (context) and deep clones all fields found in the mods array, then executes the modifier function
// Commonly used in functional areas of the API to enforce immutability
const modify = (context, mods, modifier) => {
  mods.forEach((m) => {
    context[m] = _.cloneDeep(context[m]);
  });
  return modifier(context);
};

const conditional = (evaluator, func) => {
  return R.cond([
    [evaluator, (ctx) => ctx], // execute this if we've errored, just return the context until we reach the end of the pipeline
    [R.T, func], // otherwise execute the function
  ]);
};

module.exports = {
  modify,
  fakeLazy,
  conditional,
};
