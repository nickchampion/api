/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const syscrypto = require('crypto');
const cache = require('../../modules/cache');
const config = require('../../modules/configuration').config();
const notifications = require('../../modules/notifications');
const crypto = require('../../utils/crypto');
const raven = require('../../modules/ravendb');
const security = require('../../utils/security');
const bootstrap = require('../../modules/ravendb/bootstrap');

const { NOTIFICATIONS } = require('../../constants');

class UtilsController {
  async temp() {
    return [];
  }

  async bootstrap() {
    try {
      await bootstrap();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }

    return {
      success: true,
    };
  }

  async job(request) {
    await require(`../../jobs/jobs/${request.context.params.id}`)();

    return {
      success: true,
    };
  }

  encodeId(request) {
    return {
      id: security.encodeId(request.query.id),
    };
  }

  decodeId(request) {
    return {
      id: security.decodeId(request.query.id),
    };
  }

  encode(request) {
    return {
      id: security.encode(request.query.id),
    };
  }

  decode(request) {
    return {
      id: security.decode(request.query.id),
    };
  }

  async emails(request) {
    const user = await request.context.session.get(request.context.user.id);

    switch (request.params.id) {
      case NOTIFICATIONS.CashPaymentMethods: {
        const order = await request.context.session.orders({ payments: 'cash' }).firstOrNull();
        const payment = order.payments.find((p) => p.provider === 'cash');

        await notifications.send(request.context.user, NOTIFICATIONS.CashPaymentMethods, {
          session: request.context.session,
          code: order.code,
          amount: payment.amount,
        });
        break;
      }
      case NOTIFICATIONS.CartAbandonment: {
        const cart = await request.context.session.carts({ userId: user.id }).include('userId').firstOrNull();
        const u = await request.context.session.get(cart.userId);

        await notifications.send(u, NOTIFICATIONS.CartAbandonment, {
          session: request.context.session,
          cart,
          subject: 'Did you forget something?',
        });

        break;
      }
      case NOTIFICATIONS.ForgotPassword: {
        await notifications.send(user, NOTIFICATIONS.ForgotPassword, {
          url: `${config.zesttee.webUrl}reset-password?token=${syscrypto.randomBytes(64).toString('hex')}`,
          session: request.context.session,
        });
        break;
      }
      case NOTIFICATIONS.PasswordReset: {
        await notifications.send(user, NOTIFICATIONS.PasswordReset, {
          session: request.context.session,
        });
        break;
      }
      case NOTIFICATIONS.Welcome: {
        await notifications.send(user, NOTIFICATIONS.Welcome, {
          session: request.context.session,
        });
        break;
      }
      case NOTIFICATIONS.OrderRefunded: {
        const order = request.payload.orderId
          ? await request.context.session.get(raven.Models.Order.getId(request.payload.orderId))
          : await request.context.session.orders().firstOrNull();

        await notifications.send(user, NOTIFICATIONS.OrderRefunded, {
          order,
          session: request.context.session,
        });
        break;
      }
      case NOTIFICATIONS.OrderDelivered: {
        const order = request.payload.orderId
          ? await request.context.session.get(raven.Models.Order.getId(request.payload.orderId))
          : await request.context.session.orders().firstOrNull();

        await notifications.send(user, NOTIFICATIONS.OrderDelivered, {
          order,
          session: request.context.session,
        });
        break;
      }
      case NOTIFICATIONS.OrderReceived: {
        const order = request.payload.orderId
          ? await request.context.session.get(raven.Models.Order.getId(request.payload.orderId))
          : await request.context.session.orders().firstOrNull();

        await notifications.send(user, NOTIFICATIONS.OrderReceived, {
          order,
          user,
          session: request.context.session,
        });
        break;
      }
      case NOTIFICATIONS.OrderShipped: {
        const order = request.payload.orderId
          ? await request.context.session.get(raven.Models.Order.getId(request.payload.orderId))
          : await request.context.session.orders().firstOrNull();

        await notifications.send(user, NOTIFICATIONS.OrderShipped, {
          order,
          user,
          session: request.context.session,
        });
        break;
      }
      default:
        break;
    }

    return {
      success: true,
    };
  }

  async config() {
    if (config.production) return { status: 'unavailable' };

    return config;
  }

  async encrypt(request) {
    if (config.production) return { status: 'unavailable' };

    const r = crypto.encrypt(
      `
-----BEGIN CERTIFICATE-----
MIIFBzCCAu+gAwIBAgIUeSn/8vXOzWJtDGGY/zm2lzCu0zMwDQYJKoZIhvcNAQEN
BQAwJzElMCMGA1UEAwwcKi5saXZlLnplc3R0ZWUucmF2ZW5kYi5jbG91ZDAeFw0y
MDA2MTgwMDAwMDBaFw0yNTA2MTgwMDAwMDBaMBcxFTATBgNVBAMMDGxpdmUuemVz
dHRlZTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAIcnmeOyymSRxzbZ
Y6xewhJVzkOjOFbt1kRcV3rG+BgBwNxslVDvlFFND1POZbN+iBMOrP6SgtYsYkg+
52h1qz0aDacaapKCTj8OhXhX+WlHJPQkGMNsahRZ3qpkt8MDYKjSezsCAGogmxmN
OudEMyKTwuMVLJ6v3owdj221AYVxg6VALa1vENFdTJvXFXaUQiIuN9BtKG79zG8m
fCEgsweCFq81BlO3DgtjByWq7V7JCmL1gBFpjaXqWe+5YOC4THtO+sYVe1nvyq9b
YG4T9NWxoT4pjJDjDoo8v/GHsH05UVHkdyBwrGKXgGPSN4ADWZfz3AxBqPBXw+CQ
ynq+bSqvHs2JCrmLo61qMCSsYNFNp48Z9ThXF+C/+pDR6LQGNUfpkhyABQuzbiwC
FQ0kGMTswyftAwPDnfdpwnBoZbXcjASysgMpGhcnjUT+4wx33+1aU7P7L6SJnAeY
FfD3qCtWVDbp1sqWN5Wt2vxkY97Yi6NXyBLYGK1jfau4XJ3seWu/7r4kqWslPG+L
Io/acYnyZfoci2a57LBOcM0dKHKvReuH+WsfimJnz7AEK5NL/JHpVQfHcjv910ge
nbVfBFly9CKzc/rJYBnjNPTgRTevEeaV3t79hqESNtSscNEL0+ou8XWs4cIv/IGF
6Qnsi8ZYeqQ0tgrZWUt/YG4Ru+mrAgMBAAGjOzA5MB8GA1UdIwQYMBaAFEquzG+f
u0AEQ1D6PH7IOmsUl70yMBYGA1UdJQEB/wQMMAoGCCsGAQUFBwMCMA0GCSqGSIb3
DQEBDQUAA4ICAQBwo1BeifvBGiHzwcF4nSlbfxKA8AWXaycAnYXnZpV+ZDzDg7Ju
xTi54bKcZQbFJLSmS1Au1S9bWnL80qO5+w+NpPTIciAHBbe6AyRA5IerQ4Q/zcdo
ebeCOrzHEi/wGFwXda1qMTvl2E4n9JcfvoKqJvNEse958LVi/hqaPjjos732Ex65
H3uCdLPModYzHPqezideIuHMazKU/xsVitICTBHGKOCxBcBHemgwiGBzI+hyc/dI
iBD5NbDnDKbJjuCtFenkABC3X/tqcuuCd5Ozk3NSmcpat5h3ZarXnItZvgAUYdFk
SIfJRZsziaLHlu9vrJj6RDArDnTB2DHb92YjK1ou9pFrj4ha5ROoqPDivLcxTMpB
ML7PHFaYorXO5dk1ueMSxJPuOuaRMjYNGuD57/mRRvDyvzK6Ds039H0xcH3CkLcw
yFSgwOfqNjyjpK3XPRYz53Xy2HYH15d+IdTOsSIWingnMyx1CYL+cPVqS0aGplDF
iSYi2I+2Ce3PQsCX6CU5GY2W+YDiGxdNmTbG8EWOVn40ILfjK0v6KNgCs47IxagX
ODE3iWTgLa6muD5L/iDFBu0EUAI2klT8J/tu8wZXc0YGaSuiq+YOE6vYfDErAOTR
wEL3QyIfRMnVSC4IfIeXv93cb8AB/zdiPmCyrxIHScDa+PIv+G6ouu3mAg==
-----END CERTIFICATE-----
-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----`,
      request.payload.key,
    );
    return r;
  }

  async decrypt(request) {
    if (config.production) return { status: 'unavailable' };

    const r = crypto.decrypt(request.payload.input, request.payload.key);
    return r;
  }

  async cache() {
    await cache.flush();
    return {
      success: true,
    };
  }
}

module.exports = UtilsController;
