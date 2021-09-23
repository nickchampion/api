/* eslint-disable global-require */
require('dotenv').config();

const test = require('tape-catch');
const discounts = require('../../../app/modules/discounts');
const utils = require('./utils');
const data = require('../../data');

test('If percentage coupon code applied correctly', async (assert) => {
  const discountModifier = (d) => {
    d.restrictions.filters = [];
    return d;
  };

  const cartModifier = (c) => {
    c.discountCode = 'TELE-10';
    // no subscription discounts
    c.items.forEach((i) => (i.planId = 4));
    return c;
  };

  // get the context
  const context = await utils.createCartContext(data.cart(cartModifier), data.discounts.percentage(discountModifier));

  // run the discount pipeline
  const discountedCart = (await discounts.apply(context)).cart;

  assert.equal(discountedCart.subTotal, 350, `subTotal is not $350 (${discountedCart.subTotal})`);
  assert.equal(discountedCart.orderTotal, 315, `orderTotal is not $315 (${discountedCart.orderTotal})`);
  assert.equal(discountedCart.discountTotal, 35, `discountTotal is not $35 (${discountedCart.discountTotal})`);

  const meds = discountedCart.items[0];
  assert.equal(meds.price, 50, 'meds.price should be $50');
  assert.equal(meds.subTotal, 50, 'meds.price subTotal be $50');
  assert.equal(meds.total, 45, 'meds.total should be $45');
  assert.equal(meds.discounts.total, 5, 'meds.discounts.total should be $5');
  assert.equal(meds.discounts.applied.length, 1, 'meds.discounts.applied.length should be 1');
  assert.equal(meds.discounts.applied.filter((i) => i.type === 'percentage').length, 1, 'should be one percentage discount applied to meds');

  const kit = discountedCart.items[1];
  assert.equal(kit.price, 100, 'kit.price should be $100');
  assert.equal(kit.subTotal, 100, 'kit.price subTotal be $100');
  assert.equal(kit.total, 90, 'kit.total should be $90');
  assert.equal(kit.discounts.total, 10, 'kit.discounts.total should be $10');
  assert.equal(kit.discounts.applied.length, 1, 'kit.discounts.applied.length should be 1');
  assert.equal(kit.discounts.applied.filter((i) => i.type === 'percentage').length, 1, 'should be one percentage discount applied to kit');

  const pack = discountedCart.items[2];
  assert.equal(pack.price, 200, 'pack.price should be $200');
  assert.equal(pack.subTotal, 200, 'pack.price subTotal be $200');
  assert.equal(pack.total, 180, 'pack.total should be $180');
  assert.equal(pack.discounts.total, 20, 'pack.discounts.total should be $20');
  assert.equal(pack.discounts.applied.length, 1, 'pack.discounts.applied.length should be 1');
  assert.equal(pack.discounts.applied.filter((i) => i.type === 'percentage').length, 1, 'should be one percentage discount applied to pack');

  assert.end();
});

test('If percentage coupon code applied correctly with multiple quantities', async (assert) => {
  const discountModifier = (d) => {
    d.restrictions.filters = [];
    return d;
  };

  const cartModifier = (c) => {
    c.discountCode = 'TELE-10';
    // no subscription discounts
    c.items.forEach((i) => {
      i.planId = 4;
      i.quantity = 2;
    });
    return c;
  };

  // get the context
  const context = await utils.createCartContext(data.cart(cartModifier), data.discounts.percentage(discountModifier));

  // run the discount pipeline
  const discountedCart = (await discounts.apply(context)).cart;

  assert.equal(discountedCart.subTotal, 700, `subTotal is not $700 (${discountedCart.subTotal})`);
  assert.equal(discountedCart.orderTotal, 630, `orderTotal is not $630 (${discountedCart.orderTotal})`);
  assert.equal(discountedCart.discountTotal, 70, `discountTotal is not $70 (${discountedCart.discountTotal})`);

  const meds = discountedCart.items[0];
  assert.equal(meds.price, 50, 'meds.price should be $50');
  assert.equal(meds.subTotal, 100, 'meds.price subTotal be $100');
  assert.equal(meds.total, 90, 'meds.total should be $90');
  assert.equal(meds.discounts.total, 10, 'meds.discounts.total should be $10');
  assert.equal(meds.discounts.applied.length, 1, 'meds.discounts.applied.length should be 1');
  assert.equal(meds.discounts.applied.filter((i) => i.type === 'percentage').length, 1, 'should be one percentage discount applied to meds');

  const kit = discountedCart.items[1];
  assert.equal(kit.price, 100, 'kit.price should be $100');
  assert.equal(kit.subTotal, 200, 'kit.price subTotal be $200');
  assert.equal(kit.total, 180, 'kit.total should be $180');
  assert.equal(kit.discounts.total, 20, 'kit.discounts.total should be $20');
  assert.equal(kit.discounts.applied.length, 1, 'kit.discounts.applied.length should be 1');
  assert.equal(kit.discounts.applied.filter((i) => i.type === 'percentage').length, 1, 'should be one percentage discount applied to kit');

  const pack = discountedCart.items[2];
  assert.equal(pack.price, 200, 'pack.price should be $200');
  assert.equal(pack.subTotal, 400, 'pack.price subTotal be $400');
  assert.equal(pack.total, 360, 'pack.total should be $360');
  assert.equal(pack.discounts.total, 40, 'pack.discounts.total should be $40');
  assert.equal(pack.discounts.applied.length, 1, 'pack.discounts.applied.length should be 1');
  assert.equal(pack.discounts.applied.filter((i) => i.type === 'percentage').length, 1, 'should be one percentage discount applied to pack');

  assert.end();
});
