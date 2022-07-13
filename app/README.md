# Shopify Subscription App Node

> Embedded Shopify App made with Node and TypeScript.

🚧🔨👷 Currently Under Development

## Environmental Variables

.env

```javascript
SHOPIFY_API_KEY = 'YOUR_SHOPIFY_API_KEY';
SHOPIFY_API_SECRET = 'YOUR_SHOPIFY_SECRET';
SHOP = 'my-shop-name.myshopify.com';
SCOPES = 'SHOPIFY_API_SCOPES';
HOST = 'YOUR_TUNNEL_URL';
PG_DB = 'DATABASE_NAME';
PG_HOST = 'DATABASE_HOST';
PG_USER = 'DATABASE_USER';
PG_PASSWORD = 'DATABASE_PASSWORD';
PG_PORT = 'DATABASE_PORT';
```

## Prisma

Create the first migration:

```
prisma migrate dev --name init
```

Production and Testing Environments

```
npx prisma migrate deploy
```

## Tests

- Server callback test is failing, the auth flow was changed to handle both `online` and `offline` tokens. The test will have to be rewritten.
- GraphQL tests are failing, don't understand why, will try to fix when I get the chance.

## Shopify Embedded App Navigation

You can configure the apps navigation from App > App setup > Embed your app in Shopify Admin > Navigation > Configure.
