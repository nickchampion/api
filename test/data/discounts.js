const percentage = (modifier) => {
  const discount = {
    "id": "discounts/1",
    "changeVector": "CV-1",
    "code": "TELE-10",
    "effect": "percentage",
    "status": "Approved",
    "tags": ["telehealth"],
    "countries": [
      {
        "country": "SG",
        "minCartValue": null,
        "fixedAmount": null,
        "percentage": 10,
        "description": "10% OFF CART"
      }
    ],
    "startsAt": "2020-10-01T13:00:00.0000000",
    "endsAt": "2030-10-31T23:59:59.0000000",
    "usageCount": null,
    "usageCountPerUser": 1,
    "createdAt": "2020-10-20T19:24:53.469Z",
    "updatedAt": "2020-10-20T19:24:53.469Z",
    "updatedByUserId": "users/1-C",
    "restrictions": {
      "filters": [
        {
          "source": "item",
          "operator": "eq",
          "field": "id",
          "values": ["packs/2434-A"]
        }
      ]
    },
    "patch": null
  };
  return modifier ? modifier(discount) : discount;
}

const fixedCartAmount = (modifier) => {
  const discount = {
    "id": "discounts/2",
    "changeVector": "CV-2",
    "code": "TELE-10",
    "effect": "fixedCartAmount",
    "status": "Approved",
    "tags": ["telehealth"],
    "countries": [
      {
        "country": "SG",
        "minCartValue": null,
        "fixedAmount": 10,
        "percentage": null,
        "description": "10% OFF CART"
      }
    ],
    "startsAt": "2020-10-01T13:00:00.0000000",
    "endsAt": "2030-10-31T23:59:59.0000000",
    "usageCount": null,
    "usageCountPerUser": 1,
    "createdAt": "2020-10-20T19:24:53.469Z",
    "updatedAt": "2020-10-20T19:24:53.469Z",
    "updatedByUserId": "users/1-C",
    "restrictions": { },
    "patch": null
  };
  return modifier ? modifier(discount) : discount;
}

module.exports = {
  percentage,
  fixedCartAmount
}