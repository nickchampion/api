/*
Author: Nick Champion
Date: 02/11/2020
Description: 
  Responsible for validting a discount pipeline to ensure the discount is valid for the users cart.
  Each function takes the cartContext and uses the data held within to perform any required validation checks
  The functions are pure and should remain so
  If any given function detects a validation failure it should instead of returning the cartContext, return
  a validation error, this mean each function in the validation pipline needs to check the incoming args
  and if there is a validationCode set on the args just exit as we've already failed
*/

const R = require('ramda');
const restrictions = require('./restrictions');

const country = (cartContext) => {
  // Only process if we have a discount and the pipeline is still valid
  if (!cartContext.discount || !cartContext.validation.discount.valid) return cartContext;

  // get the country discount info
  const countryInfo = cartContext.discount.countries.find((c) => c.country === cartContext.context.country.isoCode);

  // not applicable to users country
  if (!countryInfo) {
    return {
      valid: false,
      code: 'DISCOUNTS_COUNTRY_NOT_ALLOWED',
    };
  }

  return cartContext;
};

const code = (cartContext) => {
  if (cartContext.cart.discountCode && !cartContext.discount) {
    return {
      valid: false,
      code: 'DISCOUNTS_NO_LONGER_ACTIVE',
    };
  }

  return cartContext;
};

const usages = (cartContext) => {
  // Only process if we have a discount and the pipeline is still valid
  if (!cartContext.discount || !cartContext.validation.discount.valid) return cartContext;

  // make sure overall usage has not been exceeded
  if (cartContext.discount.usageCount && cartContext.totalUsages >= cartContext.discount.usageCount)
    return {
      valid: false,
      code: 'DISCOUNT_USED_UP',
    };

  // make sure user has not ordered before if its forst order only discount
  if (cartContext.discount.firstOrderOnly && cartContext.totalOrdersForUser > 0)
    return {
      valid: false,
      code: 'DISCOUNT_FIRST_ORDER_ONLY',
    };

  // make sure user usage has not been exceeded
  if (cartContext.discount.usageCountPerUser && cartContext.totalUsagesForUser >= cartContext.discount.usageCountPerUser)
    return {
      valid: false,
      code: 'DISCOUNT_USED_UP_USER',
    };

  // TODO: run the discount usage checks
  return cartContext;
};

const items = (cartContext) => {
  // Only process if we have a discount and the pipeline is still valid
  if (!cartContext.discount || !cartContext.validation.discount.valid || !cartContext.discount.restrictions) return cartContext;

  // execute pipeline to decide which items in the cart are valid based on any restrictions set on the discount
  const validatedCtx = restrictions.apply(cartContext);

  // if we have at least one valid item in the cart once we've applied the restrictions return the context to continue
  if (validatedCtx.cart.items.filter((i) => i.valid).length > 0) return cartContext;

  // otherwise return validation error for whole cart
  return {
    valid: false,
    code: 'DISCOUNTS_NO_ITEMS_VALID',
  };
};

// return result of the pipeline to indicate whether the discount is valid for this users cart
// if not return the code associated with the validation error
const finalise = (cartContext) => {
  if (cartContext.code && Object.keys(cartContext).includes('valid')) {
    return cartContext;
  }

  return {
    code: null,
    valid: true,
  };
};

const apply = (cartContext) => {
  // note that code check needs to run first
  return R.pipe(code, country, items, usages, finalise)(cartContext);
};

module.exports = {
  apply,
};
