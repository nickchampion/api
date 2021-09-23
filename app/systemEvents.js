/*
The purpose of this module is to provide a central place to raise and listen to system events such as StateChanged events for orders.
*/

const { EventEmitter } = require('events');

const events = new EventEmitter();

const EVENTS = {
  StateChanged: 'StateChanged',
  StockReserved: 'StockReserved',
  StockReleased: 'StockReleased',
  UserRegistration: 'UserRegistration',
  AlertRaised: 'AlertRaised',
  OutOfStock: 'OutOfStock',
  CacheChanged: 'CacheChanged',
  CacheMessageReceived: 'CacheMessageReceived',
};

const raise = (name, state) => {
  events.emit(name, state);
};

const listen = (name, action) => {
  events.on(name, action);
};

module.exports = {
  raise,
  listen,
  EVENTS,
};
