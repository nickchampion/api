/* eslint-disable no-console */
const msRestNodeAuth = require('@azure/ms-rest-nodeauth');
const { ServiceBusManagementClient, Subscriptions } = require('@azure/arm-servicebus');
const config = require('../../modules/configuration').config();
const errordite = require('../../modules/errordite');
const { tryExecuteAsync } = require('../../utils/common');

let client = null;

const getClient = async () => {
  if (client) return client;
  const auth = await msRestNodeAuth.loginWithUsernamePasswordWithAuthResponse(config.azure.servicebus.user, config.azure.servicebus.password);
  client = new ServiceBusManagementClient(auth.credentials, config.azure.subscriptionId);
  return client;
};

const createOrGetSubscription = async (topicName, subscriptionName) => {
  try {
    const armClient = await getClient();

    let subscription = await tryExecuteAsync(
      () => new Subscriptions(armClient).get(config.azure.servicebus.resourceGroup, config.azure.servicebus.namespace, topicName, subscriptionName),
      false,
      false,
    );

    if (subscription.failed) {
      subscription = await new Subscriptions(armClient).createOrUpdate(
        config.azure.servicebus.resourceGroup,
        config.azure.servicebus.namespace,
        topicName,
        subscriptionName,
        {
          autoDeleteOnIdle: 'P0Y0M1DT0H0M0S',
          maxDeliveryCount: 100,
          defaultMessageTimeToLive: 'P0Y0M7DT0H0M0S',
        },
      );
    }

    return subscription;
  } catch (e) {
    e.name = 'Azure:Management:CreateSubscription';
    errordite.log(e);
    return null;
  }
};

module.exports = {
  createOrGetSubscription,
};
