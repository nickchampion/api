/*
Author: Nick Champion
Date: 02/11/2020
Description: 
  Discount pipeline; first attempt at a functional approach to a module. We use Ramda (compose or pipe) to run our pipelines
  All functions are and should remain pure
  Responsible for applying discount code based discounts (at the cart and item level) and subscription discounts
  futils.modify is used extensively, this allows us to pass a context to each function and let the function tell 
  us what data it will be modified, futils.modify will clone the fields the function modifies but leaves the other 
  fields un-touched. 
*/

const R = require('ramda');
const math = require('../../utils/math');
const futils = require('../../utils/futils.js');
const F = require('./utils');
const effects = require('./effects');
const validation = require('./validation');

// this is the final function in the pipeline so we return just the item rather than the full context
const sumItemTotalsFn = (ctx, cartContext, forItem) => {
  ctx.item.discounts = {
    ...cartContext.item.discounts,
    total: F.sumByTotal(cartContext.item.discounts.applied),
  };
  // total before any discounts are applied (use price field from item)
  ctx.item.subTotal = math.round(cartContext.item.price * cartContext.item.quantity);
  // total after all discounts applied
  ctx.item.total = math.round(ctx.item.subTotal - ctx.item.discounts.total);
  // sometimes we need this fn to return an item other times the ctx, depends o nthe pipeline we're running
  return forItem ? ctx.item : ctx;
};

// this is the final function in the pipeline so we return just the item rather than the full context
const sumFinalItemTotals = (cartContext) => {
  return futils.modify(cartContext, ['item'], (ctx) => sumItemTotalsFn(ctx, cartContext, true));
};

// this is the final function in the pipeline so we return just the item rather than the full context
const sumItemTotals = (cartContext) => {
  return futils.modify(cartContext, ['item'], (ctx) => sumItemTotalsFn(ctx, cartContext, false));
};

// applies coupon codes for each item by looking up the correct effect for the discount and executing the function to apply the discount
const applyCoupon = (cartContext) => {
  // dont execute if we have no discount loaded or if the validation pipeline failed
  if (
    !cartContext.discount || // need a discount
    !cartContext.validation.discount.valid || // needs to have passed validation checks
    !effects[cartContext.discount.effect] || // need a valid effect
    effects[cartContext.discount.effect].cart // should nt be a cart based discount effect
  )
    return cartContext;

  return effects[cartContext.discount.effect].apply(cartContext);
};

// apply any cart level discounts (fixedCart, shipping)
const applyCartDiscounts = (cartContext) => {
  // dont execute if we have no discount loaded or if the validation pipeline failed
  if (
    !cartContext.discount || // need a discount
    !cartContext.validation.discount.valid || // needs to have passed validation checks
    !effects[cartContext.discount.effect] || // need a valid effect
    !effects[cartContext.discount.effect].cart // should nt be a cart based discount effect
  )
    return cartContext;

  return effects[cartContext.discount.effect].apply(cartContext);
};

// runs the calculate pipeline for each item in the cart applying any valid discounts and eventually summing up the discounts applied across all items
// item level discounts could be subscription, percentage off and fixedItem
const applyItemDiscounts = (cartContext) => {
  // run pipeline to apply item level discounts, we need to calculate subscription discounts first
  // as these always need to be based off the items list price because we show this across UIs on the site
  const pipe = R.pipe(effects.subscription.apply, sumItemTotals, applyCoupon, sumFinalItemTotals);
  const items = R.map((i) => pipe({ ...cartContext, item: i }), cartContext.cart.items);

  return futils.modify(cartContext, ['cart'], (ctx) => {
    ctx.cart.items = items;
    return ctx;
  });
};

// Once all item level discounts have been applied we need to sum up the totals at the cart level.
const sumCartTotals = (cartContext) => {
  return futils.modify(cartContext, ['cart'], (ctx) => {
    ctx.cart.discounts = {
      ...cartContext.cart.discounts,
      total: F.sumByTotal(cartContext.cart.discounts.applied),
    };
    ctx.cart.discountTotal = F.discountTotal(cartContext.cart.items, ctx.cart.discounts);
    ctx.cart.subTotal = F.subTotal(cartContext.cart.items);
    ctx.cart.credits.cashback = F.creditsTotal(ctx.cart.discounts.applied);
    ctx.cart.orderTotal = Math.max(
      math.round(cartContext.cart.subTotal + cartContext.cart.shippingTotal + cartContext.cart.consultationFee - cartContext.cart.discountTotal),
      0,
    );
    return ctx;
  });
};

// Takes a cart and applies any relevant discounts to each item in the cart, sums up the totals and maps back on to the incoming cart
const apply = (cartContext) => {
  // run the validation checks to see if the discount code applied is valid
  cartContext.validation.discount = validation.apply(cartContext);

  // run the pipeline to apply all the discounts. We still need to run the pipeline even if the validation checks
  // failed. The validation checks are coupon code related, so we still need to apply subscription discounts and
  // total up the cart even if the discount code is not valid. This means each function that may apply a discount
  // is responsible for checking the code is valid before doing anything
  return R.pipe(applyItemDiscounts, sumCartTotals, applyCartDiscounts, sumCartTotals)(cartContext);
};

module.exports = {
  apply,
};
