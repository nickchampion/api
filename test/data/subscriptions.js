
module.exports = () => {
  return {
    "collection": "Singletons",
    "plans": [
      {
        "id": 1,
        "name": "Every Month",
        "intervalUnit": "month",
        "intervalCount": 1,
        "percentOff": 10,
        "productType": "supplement",
        "order": 1
      },
      {
        "id": 2,
        "name": "Every Month",
        "intervalUnit": "month",
        "intervalCount": 1,
        "percentOff": 10,
        "productType": "testkit",
        "order": 1
      },
      {
        "id": 3,
        "name": "Every Month",
        "intervalUnit": "month",
        "intervalCount": 1,
        "percentOff": 10,
        "productType": "medication",
        "order": 1
      },
      {
        "id": 4,
        "name": "One Time Purchase",
        "intervalUnit": "month",
        "intervalCount": 0,
        "percentOff": 0,
        "productType": "supplement",
        "order": 1
      },
      {
        "id": 5,
        "name": "One Time Purchase",
        "intervalUnit": "month",
        "intervalCount": 0,
        "percentOff": 0,
        "productType": "testkit",
        "order": 1
      },
      {
        "id": 6,
        "name": "One Time Purchase",
        "intervalUnit": "month",
        "intervalCount": 0,
        "percentOff": 0,
        "productType": "medication",
        "order": 1
      }
    ],
    "currentId": 10
  };
};


/*
{
    "collection": "Singletons",
    "plans": [
        {
            "id": 4,
            "name": "One time purchase",
            "intervalUnit": "month",
            "intervalCount": 0,
            "percentOff": 0,
            "productTypes": [
                "supplement",
                "pack",
                "custompack",
                "medication",
                "testkit",
                "unclassified"
            ],
            "productFilter": [],
            "order": 1
        },
        {
            "id": 5,
            "name": "Every Month",
            "intervalUnit": "month",
            "intervalCount": 1,
            "percentOff": 10,
            "productTypes": [
                "supplement",
                "pack",
                "custompack"
            ],
            "productFilter": [],
            "order": 2
        },
        {
            "id": 1,
            "name": "Every month",
            "intervalUnit": "month",
            "intervalCount": 1,
            "percentOff": 20,
            "productTypes": [
                "testkit"
            ],
            "productFilter": [],
            "order": 1
        },
        {
            "id": 2,
            "name": "Every 3 months",
            "intervalUnit": "month",
            "intervalCount": 3,
            "percentOff": 15,
            "productTypes": [
                "testkit"
            ],
            "productFilter": [],
            "order": 2
        },
        {
            "id": 6,
            "name": "Every 6 months",
            "intervalUnit": "month",
            "intervalCount": 6,
            "percentOff": 10,
            "productTypes": [
                "testkit"
            ],
            "productFilter": [],
            "order": 3
        },
        {
            "id": 7,
            "name": "Every month",
            "intervalUnit": "month",
            "intervalCount": 1,
            "percentOff": 16.7,
            "productTypes": [
                "medication"
            ],
            "productFilter": [
                "medications/1-A:standard"
            ],
            "order": 2
        },
        {
            "id": 8,
            "name": "Every 3 months",
            "intervalUnit": "month",
            "intervalCount": 3,
            "percentOff": 22.9,
            "productTypes": [
                "medication"
            ],
            "productFilter": [
                "medications/1-A:standard"
            ],
            "order": 3
        },
        {
            "id": 9,
            "name": "Every 6 months",
            "intervalUnit": "month",
            "intervalCount": 6,
            "percentOff": 29.15,
            "productTypes": [
                "medication"
            ],
            "productFilter": [
                "medications/1-A:standard"
            ],
            "order": 4
        },
        {
            "id": 12,
            "name": "Every month",
            "intervalUnit": "month",
            "intervalCount": 1,
            "percentOff": 13.8,
            "productTypes": [
                "medication"
            ],
            "productFilter": [
                "medications/1-A:high"
            ],
            "order": 2
        },
        {
            "id": 13,
            "name": "Every 3 months",
            "intervalUnit": "month",
            "intervalCount": 3,
            "percentOff": 20.3,
            "productTypes": [
                "medication"
            ],
            "productFilter": [
                "medications/1-A:high"
            ],
            "order": 3
        },
        {
            "id": 14,
            "name": "Every 6 months",
            "intervalUnit": "month",
            "intervalCount": 6,
            "percentOff": 26.68,
            "productTypes": [
                "medication"
            ],
            "productFilter": [
                "medications/1-A:high"
            ],
            "order": 4
        },
        {
            "id": 16,
            "name": "Every month",
            "intervalUnit": "month",
            "intervalCount": 1,
            "percentOff": 11.11,
            "productTypes": [
                "medication"
            ],
            "productFilter": [
                "medications/2-A:standard"
            ],
            "order": 2
        },
        {
            "id": 17,
            "name": "Every 3 months",
            "intervalUnit": "month",
            "intervalCount": 3,
            "percentOff": 17.77,
            "productTypes": [
                "medication"
            ],
            "productFilter": [
                "medications/2-A:standard"
            ],
            "order": 3
        },
        {
            "id": 18,
            "name": "Every 6 months",
            "intervalUnit": "month",
            "intervalCount": 6,
            "percentOff": 24.44,
            "productTypes": [
                "medication"
            ],
            "productFilter": [
                "medications/2-A:standard"
            ],
            "order": 4
        },
        {
            "id": 19,
            "name": "Every month",
            "intervalUnit": "month",
            "intervalCount": 1,
            "percentOff": 2.93,
            "productTypes": [
                "medication"
            ],
            "productFilter": [
                "medications/3-A:standard",
                "medications/3-A:high"
            ],
            "order": 2
        },
        {
            "id": 20,
            "name": "Every 3 months",
            "intervalUnit": "month",
            "intervalCount": 3,
            "percentOff": 4.09,
            "productTypes": [
                "medication"
            ],
            "productFilter": [
                "medications/3-A:standard",
                "medications/3-A:high"
            ],
            "order": 3
        },
        {
            "id": 21,
            "name": "Every 6 months",
            "intervalUnit": "month",
            "intervalCount": 6,
            "percentOff": 5.33,
            "productTypes": [
                "medication"
            ],
            "productFilter": [
                "medications/3-A:standard",
                "medications/3-A:high"
            ],
            "order": 4
        },
        {
            "id": 22,
            "name": "Every month",
            "intervalUnit": "month",
            "intervalCount": 1,
            "percentOff": 7.9,
            "productTypes": [
                "medication"
            ],
            "productFilter": [
                "medications/3-A:max"
            ],
            "order": 2
        },
        {
            "id": 23,
            "name": "Every 3 months",
            "intervalUnit": "month",
            "intervalCount": 3,
            "percentOff": 15.4,
            "productTypes": [
                "medication"
            ],
            "productFilter": [
                "medications/3-A:max"
            ],
            "order": 3
        },
        {
            "id": 24,
            "name": "Every 6 months",
            "intervalUnit": "month",
            "intervalCount": 6,
            "percentOff": 23,
            "productTypes": [
                "medication"
            ],
            "productFilter": [
                "medications/3-A:max"
            ],
            "order": 4
        }
    ],
    "currentId": 25,
    "@metadata": {
        "@collection": "Singletons",
        "@nested-object-types": {},
        "Raven-Node-Type": null
    }
}
*/