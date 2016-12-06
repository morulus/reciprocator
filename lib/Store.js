/**
* Very simple store for standalone work
*/
"use strict";

const $state = Symbol('state');
const $reducer = Symbol('reducer');
const $subsribers = Symbol('subsribers');
const defaultReducer = function(state) {
  return state;
}
const emptyFn = new Function("");
function dispatch(action) {
  this[$state] = this[$reducer](this[$state], action);
  this[$subsribers].forEach(function(fn) { fn() });
}
function getState() {
  return this[$state];
}
function subscribe(callback) {
  this[$subsribers].push(callback);
  return function(index) {
    this[index] = emptyFn;
  }.bind(this[$subsribers], this[$subsribers].length-1);
}
function Store(initialState, reducer) {
  this[$state] = initialState||{};
  this[$subsribers] = [];
  this.dispatch = dispatch.bind(this);
  this.getState = getState.bind(this);
  this.subscribe = subscribe.bind(this);
  this.replaceReducer(reducer||defaultReducer);
}

Store.prototype.replaceReducer = function replaceReducer(reducer) {
  this[$reducer] = reducer||defaultReducer;
  this[$state] = this.dispatch({
    type: '@@init-action'
  });
}

module.exports = Store;
