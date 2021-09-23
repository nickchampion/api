const axios = require('axios').default;
const config = require('../../modules/configuration').config();
const errordite = require('../../modules/errordite');
const { EMAIL_VERIFICATION_STATUS } = require('../../constants');

const verifyEmail = async (email) => {
  // dont bother unless we're live
  if (!config.production) return EMAIL_VERIFICATION_STATUS.Verified;

  try {
    const response = await axios.get('https://api.emailverifyapi.com/v3/lookups/json', { params: { key: '3C3AB99CD29FABD2', email } });

    // emails need to be valid, deliverable and not disposible
    if (response.data.validFormat === true && response.data.deliverable === true && response.data.disposable === false)
      return EMAIL_VERIFICATION_STATUS.Verified;

    if (response.data.disposable === true) return EMAIL_VERIFICATION_STATUS.Disposible;

    return EMAIL_VERIFICATION_STATUS.Undeliverable;
  } catch (e) {
    e.name = 'EmailVerification';
    errordite.log(e);
    return EMAIL_VERIFICATION_STATUS.Verified;
  }
};

module.exports = {
  verifyEmail,
};
