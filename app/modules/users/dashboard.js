const calendar = require('../calendar');
const map = require('../map');
const taxonomy = require('../taxonomy');
const consultations = require('../consultations');
const { CONSULTATION_STATUS, ROLES, SURVEY_STATUS, SINGLETONS } = require('../../constants');

const dashboard = async (context) => {
  const summary = {
    healthTests: [],
    surveys: [],
    orders: [],
    appointments: [],
    prescriptions: [],
    consultations: [],
  };

  if (!context.user) return summary;

  if (context.userHasRole(ROLES.Doctor)) {
    return doctorsDashboard(context, summary);
  }

  const categories = await taxonomy.getCategories();
  const configuration = await taxonomy.getSingleton(SINGLETONS.Configuration);
  const surveyConfiguration = await taxonomy.getSingleton(SINGLETONS.Surveys);
  const consultationsLazy = getConsultations(context);
  const ordersLazy = getOrders(context);
  const surveysLazy = getSurveys(context);
  const healthTestsLazy = getHealthTests(context);
  const barcodesLazy = getBarcodes(context);
  const prescriptionsLazy = getLazyPrescriptions(context);

  summary.orders = map.orders(context, await ordersLazy.getValue(), categories);
  summary.surveys = (await surveysLazy.getValue()).map((s) => {
    return {
      ...s,
      name: surveyConfiguration.surveys[s.surveygizmo_id].name,
    };
  });
  summary.testResults = (await barcodesLazy.getValue()).map((r) => {
    return {
      ...r,
      url: `/profile/dashboard/test-kit-results?code=${r.barcode}`,
    };
  });
  summary.labResults = (await healthTestsLazy.getValue()).map((r) => map.labResults(r, false));
  summary.consultations = map.consultations(await consultationsLazy.getValue(), context.timezone);
  summary.prescriptions = consultations.prescriptions.getPrescriptionMedications(await prescriptionsLazy.getValue(), configuration);

  return summary;
};

function getSurveys(context) {
  return context.session
    .surveys()
    .whereEquals('userId', context.user.id)
    .whereEquals('status', SURVEY_STATUS.Complete)
    .orderByDescending('createdAt')
    .selectFields(['vertical', 'updatedAt', 'encodedId', 'telehealth', 'surveygizmo_id'])
    .take(3)
    .lazily();
}

function getLazyPrescriptions(context) {
  return context.session.consultations({ userId: context.user.id, status: CONSULTATION_STATUS.Complete }).orderByDescending('startsAt').lazily();
}

function getHealthTests(context) {
  return context.session.labResults({ userId: context.user.id }).orderByDescending('uploadedAt').take(5).lazily();
}

function getBarcodes(context) {
  return context.session
    .barcodes({ userId: context.user.id })
    .orderByDescending('createdAt')
    .selectFields(['barcode', 'id', 'orderId', 'createdAt', 'name', 'resultsReceivedAt'])
    .take(5)
    .lazily();
}

function getOrders(context) {
  return context.session.orders().whereEquals('userId', context.user.id).orderByDescending('createdAt').take(3).lazily();
}

function getConsultations(context) {
  return context.session.consultations().whereEquals('userId', context.user.id).whereNotEquals('status', CONSULTATION_STATUS.Complete).lazily();
}

async function doctorsDashboard(context, result) {
  result.appointments = await calendar.getPendingAppointments(context);
  result.consultations = await consultations.doctors.getPendingConsultations(context);
  result.prescriptions = await consultations.prescriptions.getPending(context);
  return result;
}

module.exports = {
  dashboard,
};
