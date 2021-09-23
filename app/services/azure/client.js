const { ServiceBusClient } = require('@azure/service-bus');
const config = require('../../modules/configuration').config();

const client = ServiceBusClient.createFromConnectionString(config.azure.servicebus.connection);

module.exports = {
  client,
};
