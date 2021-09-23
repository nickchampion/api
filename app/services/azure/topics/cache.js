const { ReceiveMode } = require('@azure/service-bus');
const { client } = require('../client');
const management = require('../management');
const config = require('../../../modules/configuration').config();
const errordite = require('../../../modules/errordite');
const events = require('../../../modules/events');

const serverName = `node-${process.env.COMPUTERNAME}`.toLowerCase();

// set up the sender for when this server needs to notify other nodes of a cache event
const sender = config.dev ? null : client.createTopicClient(config.azure.servicebus.topics.cache).createSender();

// set up the receiver so this server can respond to cache events on other servers.
// messages will be automatically deleted from the queue when received
let receiver = null;

// handles cache messages received
const messageHandler = (message) => {
  // dont process if the event originated from this server
  if (message.server === serverName) return;

  // otherwise raise event so the cache can do what it needs to with this message
  events.raise(events.EVENTS.CacheMessageReceived, JSON.parse(message.body));
};

const errorHandler = (error) => {
  error.name = 'CacheCoherance:ErrorHandler';
  errordite.log(error);
};

const send = async (message) => {
  message.server = serverName;

  await sender.send({
    body: JSON.stringify(message),
  });
};

const start = async () => {
  if (config.dev) return;

  // make sure the subscription for this server exists
  const subscription = await management.createOrGetSubscription(config.azure.servicebus.topics.cache, serverName);

  if (subscription) {
    // try to receive messages from this servers subscription, if it does not exist, create it and then subscribe
    receiver = client.createSubscriptionClient(config.azure.servicebus.topics.cache, serverName).createReceiver(ReceiveMode.receiveAndDelete);
    receiver.registerMessageHandler(messageHandler, errorHandler);
    // eslint-disable-next-line no-console
    console.log(`Azure Service Bus: Connected ${serverName} to ${config.azure.servicebus.topics.cache}`);
  }
};

// listen for the cache changed event so we can send a message to other servers to respond
if (!config.dev) events.listen(events.EVENTS.CacheChanged, send);

module.exports = {
  send,
  start,
};
