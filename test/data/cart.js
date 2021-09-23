module.exports = (modifier) => {
  const cart = {
    token: '38e444607b4756cdc0831c4818587b545be9',
    currency: 'SGD',
    orderTotal: 350,
    discountTotal: 0,
    shippingTotal: 0,
    consultationFee: 0,
    subTotal: 350,
    country: 'SG',
    userId: 'users/1-C',
    items: [
      {
        quantity: 1,
        type: 'medication',
        name: 'Generic Viagra (Sildenafil) 50mg',
        planId: 3,
        price: 50,
        medicationId: 'medications/1-A',
        image: 'https://media.zesttee.com/product/sildenafil_6529-c.png',
        size: 4,
        variantId: 'standard-4',
        discounts: {
          total: 0,
          applied: [],
        },
        subTotal: 50,
        total: 50,
        id: 1,
      },
      {
        quantity: 1,
        type: 'testkit',
        name: 'Basic Male Performance Test',
        planId: 2,
        price: 100,
        productId: 'products/321-A',
        image: null,
        size: 1,
        metadata: {
          categoryIds: [],
        },
        discounts: {
          total: 0,
          applied: [],
        },
        subTotal: 100,
        total: 100,
        id: 2,
      },
      {
        quantity: 1,
        packId: 'packs/2434-A',
        type: 'custompack',
        name: 'Recommended Supplement Pack',
        planId: 4,
        price: 200,
        size: 30,
        metadata: {
          contents: [
            {
              id: 'products/53-A',
              included: true,
              type: 'supplement',
              qty: 1,
            },
            {
              id: 'products/68-A',
              included: true,
              type: 'supplement',
              qty: 1,
            },
            {
              id: 'products/73-A',
              included: true,
              type: 'supplement',
              qty: 1,
            },
          ],
        },
        discounts: {
          total: 0,
          applied: [],
        },
        subTotal: 200,
        total: 200,
        id: 3,
      },
    ],
    discountCode: null,
    shippingMethodId: 1,
    createdAt: '2020-10-21T09:47:55.991Z',
    updatedAt: '2020-10-21T09:47:55.991Z',
    patch: null,
  };

  return modifier ? modifier(cart) : cart;
};
