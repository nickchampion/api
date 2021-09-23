const orderData = {
  id: id(this),
  userId: this.userId,
  code: this.code,
  currency: this.currency,
  orderTotal: this.orderTotal,
  shippingTotal: this.shippingTotal,
  discountTotal: this.discountTotal,
  consultationFee: this.consultationFee,
  subTotal: this.subTotal,
  status: this.status,
  discountCode: this.discountCode,
  country: this.country,
  exchangeRate: this.exchangeRate,
  shippingMethodId: this.shippingMethodId,
  shippingType: this.shippingType,
  appointmentId: this.appointmentId,
  affiliateId: this.affiliateId,
  creditsStatus: this.credits.status,
  creditsEarned: this.credits.earned,
  creditsSpent: this.credits.spent,
  cogsItems: this.cogs.items,
  cogsPackaging: this.cogs.packaging,
  cogsTotal: this.cogs.total,
  createdAt: this.createdAt,
  updatedAt: this.updatedAt,
};

loadToorders(orderData);

for (let i = 0; i < this.items.length; i++) {
  const productId = this.items[i].productId
    ? this.items[i].productId
    : this.items[i].medicationId
    ? this.items[i].medicationId
    : this.items[i].packId;

  loadToorderItems({
    orderId: orderData.id,
    itemId: this.items[i].id,
    name: this.items[i].name,
    type: this.items[i].type,
    status: this.items[i].status,
    productId,
    variantId: this.items[i].variantId,
    price: this.items[i].price,
    salePrice: this.items[i].salePrice,
    discountTotal: this.items[i].discounts.total,
    size: this.items[i].size,
    creditsStatus: this.items[i].credits.status,
    creditsEarned: this.items[i].credits.cashback,
    cogsItems: this.items[i].cogs.items,
    cogsPackaging: this.items[i].cogs.packaging,
    cogsTotal: this.items[i].cogs.total,
    country: this.country,
    exchangeRate: this.exchangeRate,
  });
}
