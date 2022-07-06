import { Shopify } from '@shopify/shopify-api';
import topLevelAuthRedirect from '../helpers/top-level-auth-redirect.js';

export default function applyAuthMiddleware(app, pgStorage) {
  app.get('/auth', async (req, res) => {
    if (!req.signedCookies[app.get('top-level-oauth-cookie')]) {
      return res.redirect(`/auth/toplevel?${new URLSearchParams(req.query).toString()}`);
    }

    const redirectUrl = await Shopify.Auth.beginAuth(
      req,
      res,
      req.query.shop as string,
      '/auth/callback',
      app.get('use-online-tokens'),
    );

    res.redirect(redirectUrl);
  });

  app.get('/auth/toplevel', (req, res) => {
    res.cookie(app.get('top-level-oauth-cookie'), '1', {
      signed: true,
      httpOnly: true,
      sameSite: 'strict',
    });

    res.set('Content-Type', 'text/html');

    res.send(
      topLevelAuthRedirect({
        apiKey: Shopify.Context.API_KEY,
        hostName: Shopify.Context.HOST_NAME,
        host: req.query.host,
        query: req.query,
      }),
    );
  });

  app.get('/auth/callback', async (req, res) => {
    try {
      const session = await Shopify.Auth.validateAuthCallback(req, res, req.query);
      console.log('ONLINE SESSION', session);

      // register webhooks
      // app uninstall
      const appUninstalledWebhookResponse = await Shopify.Webhooks.Registry.register({
        shop: session.shop,
        accessToken: session.accessToken,
        topic: 'APP_UNINSTALLED',
        path: '/webhooks',
      });

      if (!appUninstalledWebhookResponse.APP_UNINSTALLED.success) {
        console.log(
          `Failed to register APP_UNINSTALLED webhook: ${appUninstalledWebhookResponse.result}`,
        );
      }
      // subscription contracts create
      const subscriptionContractCreateWebhookResponse = await Shopify.Webhooks.Registry.register({
        shop: session.shop,
        accessToken: session.accessToken,
        topic: 'SUBSCRIPTION_CONTRACTS_CREATE',
        path: '/webhooks',
      });

      if (!subscriptionContractCreateWebhookResponse.SUBSCRIPTION_CONTRACTS_CREATE.success) {
        console.log(
          `Failed to register SUBSCRIPTION_CONTRACTS_CREATE webhook: ${subscriptionContractCreateWebhookResponse.result}`,
        );
      }
      // subscription contracts update
      const subscriptionContractUpdateWebhookResponse = await Shopify.Webhooks.Registry.register({
        shop: session.shop,
        accessToken: session.accessToken,
        topic: 'SUBSCRIPTION_CONTRACTS_UPDATE',
        path: '/webhooks',
      });

      if (!subscriptionContractUpdateWebhookResponse.SUBSCRIPTION_CONTRACTS_UPDATE.success) {
        console.log(
          `Failed to register SUBSCRIPTION_CONTRACTS_UPDATE webhook: ${subscriptionContractUpdateWebhookResponse.result}`,
        );
      }
      // subscription billing attempts success
      const subscriptionBillingAttemptsSuccessWebhookResponse =
        await Shopify.Webhooks.Registry.register({
          shop: session.shop,
          accessToken: session.accessToken,
          topic: 'SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS',
          path: '/webhooks',
        });

      if (
        !subscriptionBillingAttemptsSuccessWebhookResponse.SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS
          .success
      ) {
        console.log(
          `Failed to register SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS webhook: ${subscriptionBillingAttemptsSuccessWebhookResponse.result}`,
        );
      }
      // subscription billing attempts failure
      const subscriptionBillingAttemptsFailureWebhookResponse =
        await Shopify.Webhooks.Registry.register({
          shop: session.shop,
          accessToken: session.accessToken,
          topic: 'SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE',
          path: '/webhooks',
        });

      if (
        !subscriptionBillingAttemptsFailureWebhookResponse.SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE
          .success
      ) {
        console.log(
          `Failed to register SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE webhook: ${subscriptionBillingAttemptsFailureWebhookResponse.result}`,
        );
      }

      // Redirect to second callback (offline token)
      const redirectUrl = await Shopify.Auth.beginAuth(
        req,
        res,
        req.query.shop,
        '/auth/callback2',
        false,
      );

      // Redirect to app with shop parameter upon auth
      res.redirect(redirectUrl);
    } catch (e) {
      switch (true) {
        case e instanceof Shopify.Errors.InvalidOAuthError:
          res.status(400);
          res.send(e.message);
          break;
        case e instanceof Shopify.Errors.CookieNotFound:
        case e instanceof Shopify.Errors.SessionNotFound:
          // This is likely because the OAuth session cookie
          // expired before the merchant approved the request
          res.redirect(`/auth?shop=${req.query.shop}`);
          break;
        default:
          res.status(500);
          res.send(e.message);
          break;
      }
    }
  });

  app.get('/auth/callback2', async (req, res) => {
    try {
      const session = await Shopify.Auth.validateAuthCallback(req, res, req.query);
      console.log('OFFLINE SESSION', session);

      const host = req.query.host;
      // update active shops locally
      app.set(
        'active-shopify-shops',
        Object.assign(app.get('active-shopify-shops'), {
          [session.shop]: session.scope,
        }),
      );
      // update active shops in db
      console.log('SAVING OFFLINE SESSION');
      // save offline token (session.accessToken)
      pgStorage.storeActiveShop({
        shop: session.shop,
        scope: session.scope,
        accessToken: session.accessToken,
      });

      // Redirect to app with shop parameter upon auth
      res.redirect(`/?shop=${session.shop}&host=${host}`);
    } catch (e) {
      switch (true) {
        case e instanceof Shopify.Errors.InvalidOAuthError:
          res.status(400);
          res.send(e.message);
          break;
        case e instanceof Shopify.Errors.CookieNotFound:
        case e instanceof Shopify.Errors.SessionNotFound:
          // This is likely because the OAuth session cookie expired before the merchant approved the request
          res.redirect(`/auth?shop=${req.query.shop}`);
          break;
        default:
          res.status(500);
          res.send(e.message);
          break;
      }
    }
  });
}
