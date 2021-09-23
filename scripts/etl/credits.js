const credit = {
  id: id(this),
  userId: this.userId,
  type: this.type,
  status: this.status,
  orderId: this.orderId,
  balance: this.balance,
  amount: this.amount,
  spent: this.spent,
  createdAt: this.createdAt,
  country: this.country,
  exchangeRate: this.exchangeRate,
};

loadTocredits(credit);

for (let i = 0; i < this.transactions.length; i++) {
  loadTocreditTransactions({
    creditId: credit.id,
    orderId: this.transactions[i].orderId,
    createdAt: this.transactions[i].createdAt,
    issued: this.transactions[i].credit || 0,
    spent: this.transactions[i].debit || 0,
    expired: this.transactions[i].expired ? this.transactions[i].credit : 0,
    available: this.transactions[i].expired ? 0 : this.transactions[i].credit,
    expiresOn: this.transactions[i].expiresOn,
    hasExpired: this.transactions[i].expired || false,
    type: this.transactions[i].type,
  });
}
