/* eslint-disable global-require */
require('dotenv').config();

const test = require('tape-catch');
const discounts = require('../../../app/modules/discounts');
const utils = require('./utils');
const data = require('../../data');

test('If fixed amount cart discount is applied correctly', async (assert) => {
  const cartModifier = (c) => {
    c.discountCode = 'TELE-10';
    // no subscription discounts
    c.items.forEach((i) => (i.planId = 4));
    return c;
  };

  // get the context
  const context = await utils.createCartContext(data.cart(cartModifier), data.discounts.fixedCartAmount());

  // run the discount pipeline
  const discountedCart = (await discounts.apply(context)).cart;

  assert.equal(discountedCart.subTotal, 350, `subTotal is not $350 (${discountedCart.subTotal})`);
  assert.equal(discountedCart.orderTotal, 340, `orderTotal is not $340 (${discountedCart.orderTotal})`);
  assert.equal(discountedCart.discountTotal, 10, `discountTotal is not $10 (${discountedCart.discountTotal})`);

  assert.equal(discountedCart.discounts.total, 10, 'discountedCart.discounts.total is not $10');
  assert.equal(discountedCart.discounts.applied.length, 1, 'discountedCart.discounts.applied length not 1');

  const meds = discountedCart.items[0];
  assert.equal(meds.discounts.total, 0, 'meds discount total not $0');
  assert.equal(meds.discounts.applied.length, 0, 'meds discount length not 0');

  const kit = discountedCart.items[1];
  assert.equal(kit.discounts.total, 0, 'kit discount total not $0');
  assert.equal(kit.discounts.applied.length, 0, 'kit discount length not 0');

  const pack = discountedCart.items[2];
  assert.equal(pack.discounts.total, 0, 'pack discount total not $0');
  assert.equal(pack.discounts.applied.length, 0, 'pack discount length not 0');

  assert.end();
});
