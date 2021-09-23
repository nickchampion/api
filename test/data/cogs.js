module.exports = (modifier) => {
  const data = {
    packaging: packaging(),
    products: products(),
    context: {
      order: order()
    }
  }

  if(modifier) modifier(data);
  return data;
}

function products() {
  return {
    "products/12-A": {
      "id": "products/12-A",
      "name": "Arginine-Citrulline Complex",
      "price": 29,
      "currency": "SGD",
      "inventory": 9550,
      "cogs": 0.06,
      "packagingId": 1,
      "productType": "supplement"
    },
    "products/19-A": {
      "id": "products/19-A",
      "name": "Male Performance Blend",
      "price": 15,
      "currency": "SGD",
      "inventory": 1170,
      "cogs": 0.14,
      "packagingId": 1,
      "productType": "supplement"
    },
    "products/135-A": {
      "id": "products/135-A",
      "name": "SAMe",
      "price": 32.11,
      "currency": "SGD",
      "inventory": 150,
      "cogs": 0.09,
      "packagingId": 1
    },
    "products/89-A": {
      "id": "products/89-A",
      "name": "5-HTP",
      "price": 13.59,
      "currency": "SGD",
      "inventory": 640,
      "cogs": 0.05,
      "packagingId": 1
    },
    "products/17-A": {
      "id": "products/17-A",
      "name": "ControlX",
      "price": 37.8,
      "currency": "SGD",
      "inventory": 630,
      "cogs": 0.85,
      "packagingId": 1,
    },
    "products/42-A": {
      "id": "products/42-A",
      "name": "Ashwagandha",
      "price": 8.97,
      "currency": "SGD",
      "inventory": 30,
      "cogs": 0.08,
      "packagingId": 1
    },
    "products/321-A": {
      "id": "products/321-A",
      "name": "Basic Male Performance Test",
      "price": 189,
      "currency": "SGD",
      "inventory": 9994,
      "cogs": 110,
      "packagingId": 3,
      "isActive": true
    },
    "packs/785-C": {
      "id": "packs/785-C",
      "name": "Control Pack I",
      "price": 106.06,
      "trialPrice": 20,
      "currency": "SGD",
      "packagingId": 1,
      "contents": [
          {
              "id": "products/42-A",
              "qty": 1,
              "type": "supplement"
          },
          {
              "id": "products/17-A",
              "qty": 1,
              "type": "supplement"
          },
          {
              "id": "products/89-A",
              "qty": 2,
              "type": "supplement"
          },
          {
              "id": "products/135-A",
              "qty": 1,
              "type": "supplement"
          }
      ]
    },
    "packs/820-C": {
      "id": "packs/820-C",
      "name": "Performance Pack I",
      "price": 89,
      "trialPrice": 15,
      "currency": "SGD",
      "contents": [
          {
              "id": "products/19-A",
              "qty": 4,
              "type": "supplement"
          },
          {
              "id": "products/12-A",
              "qty": 1,
              "type": "supplement"
          }
      ],
    },
    "medications/2-A": {
      "id": "medications/2-A",
      "name": "Priligy (Dapoxetine)",
      "variants": [
          {
              "id": "standard",
              "name": "Standard",
              "dosage": 30,
              "measurement": "mg",
              "cogs": 1,
              "packagingId": 2,
              "packs": [
                  {
                      "id": "standard-4",
                      "size": 4,
                      "price": 22.5,
                      "enabled": true
                  },
                  {
                      "id": "standard-8",
                      "size": 8,
                      "price": 22,
                      "enabled": true
                  },
                  {
                      "id": "standard-12",
                      "size": 12,
                      "price": 21.5,
                      "enabled": true
                  },
                  {
                      "id": "standard-16",
                      "size": 16,
                      "price": 21,
                      "enabled": true
                  }
              ]
          }
      ],
    }
  }
}

function packaging() {
  return {
    "collection": "Singletons",
    "defaultSku": 1,
    "skus": [
        {
            "id": 1,
            "name": "Supplement Packaging Cost",
            "cost": 4.37,
            "multiplier": 0,
            "trialCost": 3.38
        },
        {
            "id": 2,
            "name": "Medication Packaging",
            "cost": 2.72,
            "multiplier": 0.05
        },
        {
            "id": 3,
            "name": "Blood Spot Test Kit",
            "cost": 10.18
        },
        {
            "id": 4,
            "name": "Cholesterol Test Kit",
            "cost": 14.08
        },
        {
            "id": 5,
            "name": "Saliva Test Kit",
            "cost": 4.93
        },
        {
            "id": 6,
            "name": "Urine Test Kit",
            "cost": 9.91
        },
        {
            "id": 7,
            "name": "Combo Test Kit 1 (Blood & Saliva)",
            "cost": 11.66
        },
        {
            "id": 8,
            "name": "Combo Test Kit 2 (Blood & Urine)",
            "cost": 15.26
        }
    ]
  }
}

function order() {
  return {
      "userId": "users/1505-B",
      "currency": "SGD",
      "orderTotal": 471.06,
      "subTotal": 471.06,
      "status": "PaymentTaken",
      "code": "Z531-4272-209B",
      "country": "SG",
      "items": [
          {
              "id": 1,
              "name": "Priligy (Dapoxetine) 30mg",
              "price": 176,
              "salePrice": 176,
              "type": "medication",
              "planId": 15,
              "medicationId": "medications/2-A",
              "variantId": "standard-8",
              "size": 8,
              "status": "PaymentTaken",
          },
          {
              "id": 2,
              "name": "Control Pack I",
              "price": 106.06,
              "salePrice": 106.06,
              "type": "pack",
              "packId": "packs/785-C",
              "planId": 4,
              "size": 30,
              "status": "PaymentTaken",
              "metadata": {
                  "categoryIds": [
                      6
                  ],
                  "contents": [
                      {
                          "id": "products/42-A",
                          "qty": 1,
                          "type": "supplement"
                      },
                      {
                          "id": "products/17-A",
                          "qty": 1,
                          "type": "supplement"
                      },
                      {
                          "id": "products/89-A",
                          "qty": 2,
                          "type": "supplement"
                      },
                      {
                          "id": "products/135-A",
                          "qty": 1,
                          "type": "supplement"
                      }
                  ]
              }
          },
          {
              "id": 3,
              "productId": "products/321-A",
              "name": "Basic Male Performance Test",
              "price": 189,
              "salePrice": 189,
              "type": "testkit",
              "planId": 3,
              "size": 1,
              "status": "PaymentTaken",
          },
          {
            "id": 4,
            "type": "supplement",
            "name": "Male Performance Blend",
            "planId": 4,
            "price": 15,
            "subTotal": 15,
            "total": 15,
            "productId": "products/19-A",
            "size": 30,
            "status": "PaymentTaken",
        },
        {
          "id": 5,
          "type": "pack",
          "name": "Performance Pack I",
          "planId": 4,
          "price": 15,
          "subTotal": 15,
          "total": 15,
          "packId": "packs/820-C",
          "size": 5,
          "metadata": {
              "contents": [
                  {
                      "id": "products/19-A",
                      "qty": 4,
                      "type": "supplement"
                  },
                  {
                      "id": "products/12-A",
                      "qty": 1,
                      "type": "supplement"
                  }
              ]
          },
          "status": "PaymentTaken",
        }
      ]
  }
}