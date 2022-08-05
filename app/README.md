# Shopify Subscription App Node

> Embedded Shopify App made with Node and TypeScript.

🚧🔨👷 Currently Under Development

## Environmental Variables

.env

```
# Shopify
SHOPIFY_API_KEY='YOUR_SHOPIFY_API_KEY'
SHOPIFY_API_SECRET='YOUR_SHOPIFY_SECRET'
SHOP='my-shop-name.myshopify.com'
SCOPES='SHOPIFY_API_SCOPES'
HOST='YOUR_TUNNEL_URL'

# Docker
DOCKER='TRUE OR FALSE'

# Database
PG_DB='DATABASE_NAME'
PG_HOST='DATABASE_HOST'
PG_USER='DATABASE_USER'
PG_PASSWORD='DATABASE_PASSWORD'
PG_PORT='DATABASE_PORT'

# App Proxy
APP_PROXY="PATH TO STATIC FILES"
APP_PROXY_SECRET="RANDOM STRING"

# Mail Gun
MAILGUN_DOMAIN="example.com"
MAILGUN_API_KEY="MAILGUN_API_KEY"
MAILGUN_API_BASE_URL="MAILGUN_API_BASE_URL"
MAILGUN_ADMIN_EMAIL="admin@example.com"
MAILGUN_SENDER="MAILGUN_SENDER"

# Node
NODE_ENV="development or production"
```

## Prisma

prisma/.env

```
# Local
DATABASE_URL="postgresql://user:password@localhost:5432/database"
# Docker
DATABASE_URL="postgresql://user:password@postgres:5432/database"
```

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
