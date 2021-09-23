const { PutCompareExchangeValueOperation, DeleteCompareExchangeValueOperation, GetCompareExchangeValueOperation } = require('ravendb');
const raven = require('../ravendb');

const reserve = async (code, discountId) => {
  const cmpExchange = await raven.store.operations.send(new PutCompareExchangeValueOperation(`codes/${code}`, discountId, 0));
  return cmpExchange.successful;
};

const release = async (code) => {
  const cmpExchange = await raven.store.operations.send(new GetCompareExchangeValueOperation(`codes/${code}`));

  // if the code exists we can delete it
  if (cmpExchange) {
    await raven.store.operations.send(new DeleteCompareExchangeValueOperation(`codes/${code}`, cmpExchange.index));
  }
};

const replace = async (code, newCode, discountId) => {
  // if we can reserve the new code then release the old code
  if (await reserve(newCode, discountId)) {
    await release(code);
    return true;
  }

  return false;
};

module.exports = {
  reserve,
  release,
  replace,
};
