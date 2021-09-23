const _ = require('lodash');

function mergeCartItem(items, newItems, increment = true) {
  newItems.forEach((item) => {
    const existingItem = items.find((i) =>
      item.productId
        ? i.productId === item.productId && i.variantId === item.variantId
        : item.packId
        ? item.packId === i.packId && i.size === item.size
        : item.medicationId === i.medicationId && i.variantId === item.variantId,
    );

    if (!existingItem) {
      items.push(item);
    } else if (increment) {
      existingItem.quantity += 1;
      existingItem.metadata = item.metadata || existingItem.metadata;
    } else {
      existingItem.quantity = Math.max(existingItem.quantity, item.quantity);
      existingItem.metadata = item.metadata || existingItem.metadata;
    }
  });

  return items;
}

// We dont want users to have more than one cart, so if a user has multiple from different sessions
// and they are authenticated, merge the carts into one and discard the others
async function getSingleCartForUser(context) {
  // if user is not logged in just find the cart for the current token
  if (!context.user) {
    return context.session.carts({ token: context.headers.cart }).firstOrNull();
  }

  let carts = await context.session.carts({ token: context.headers.cart }).orElse().whereEquals('userId', context.user.id).all();

  carts
    .filter((c) => c.country !== context.country.isoCode)
    .forEach((c) => {
      /// delete any carts not the same country as the logged in user
      context.session.database.delete(c);
      context.session.commitOnGet = true;
    });

  carts = carts.filter((c) => c.country === context.country.isoCode);

  if (carts.length === 0) return null;

  // if we only have one cart make sure its linked to the user
  if (carts.length === 1) {
    const cart = carts[0];
    if (cart.userId !== context.user.id) {
      cart.userId = context.user.id;
      context.session.commitOnGet = true;
    }
    return cart;
  }

  // ensure we save cart as we're merging
  context.session.commitOnGet = true;

  // otherwise merge the items from all carts into a single cart and delete the others
  // first find the cart we'll keep
  const cart =
    carts.find((c) => c.token === context.headers.cart && c.userId === context.user.id) ||
    carts.find((c) => c.userId === context.user.id) ||
    carts.find((c) => c.token === context.headers.cart);

  // make sure its up to date with user info
  cart.userId = context.user.id;
  cart.token = context.headers.cart;

  // make sure we map the latest used discount code across if there is one
  cart.discountCode = _.sortBy(carts, ['updatedAt'])
    .filter((c) => c.discountCode)
    .map((c) => c.discountCode)
    .find(() => true);

  // get all the otehr carts that we'll merge and then discard
  const discardedCarts = carts.filter((c) => c.id !== cart.id);

  discardedCarts.forEach((c) => {
    // merge the items without incrementing quantity
    mergeCartItem(cart.items, c.items, false);
    /// delete the discarded cart
    context.session.database.delete(c);
  });

  return cart;
}

module.exports = {
  getSingleCartForUser,
  mergeCartItem,
};
