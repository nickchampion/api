const Joi = require('@hapi/joi');

// const custom = Joi.extend((j) => {
//   return {
//     type: 'zesttee',
//     base: j.string(),
//     messages: {
//       'zesttee.zemail': 'Email format is invalid, please check, you cannot use + symbol in your emails',
//     },
//     rules: {
//       zemail: {
//         validate(value, helpers) {
//           const email = decodeURIComponent(value.trim().toLowerCase());

//           if (emailRegex.test(email)) {
//             if (email.indexOf('zesttee.com') === -1) {
//               if (value.split('@')[0].indexOf('+') > -1) return { value, errors: helpers.error('zesttee.zemail') };
//             }
//           }

//           return value;
//         },
//       },
//     },
//   };
// });

const allowPlusForZestteeEmailsOnly = (value, helpers) => {
  // only allow plus for zesttee emails
  if (value.toLowerCase().indexOf('zesttee.com') === -1) {
    if (value.split('@')[0].indexOf('+') > -1) return helpers.error('zesttee.invalid.email');
  }

  return value;
};

function strEmail() {
  return Joi.string()
    .regex(
      // eslint-disable-next-line max-len
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    )
    .message('Email format is invalid, please check, you cannot use + symbol in your emails')
    .lowercase({ force: true })
    .custom(allowPlusForZestteeEmailsOnly, 'test')
    .message('Email format is invalid, please check, you cannot use + symbol in your emails');
}

function strPhoneNumber() {
  return Joi.string()
    .regex(/^\+[0-9]{1,3} [0-9 -]{6,15}$/)
    .message('Phone number format is invalid, must be in one of these formats: "+65 12345678" or "+65 1234-5678" or "+65 1234 5678"');
}

function strPassword() {
  return Joi.string();
}

function idNumber() {
  return Joi.number().integer().min(0);
}

const queryParams = {
  limit: Joi.number().min(1).max(1000).default(10),
  offset: Joi.number().default(0),
  orderBy: Joi.string(),
  filter: Joi.string(),
  fields: Joi.array(),
};

const searchParams = {
  limit: Joi.number().min(1).max(1000).default(10),
  offset: Joi.number().default(0),
  orderBy: Joi.string(),
  filter: Joi.string(),
  fields: Joi.array(),
  q: Joi.string(),
};

const checkToken = Joi.object({
  Authorization: Joi.string(),
}).options({ allowUnknown: true });

const pathId = Joi.required().description('id is required');

module.exports = {
  strPhoneNumber,
  strPassword,
  strEmail,
  idNumber,
  queryParams,
  searchParams,
  checkToken,
  pathId,
};
