# Shopify Subscription App Node

> Embedded Shopify App made with Node and TypeScript.

🚧🔨👷 Currently Under Development

## Environmental Variables

/app/.env

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

## Setup

Install Docker.

Create Data `/data` directory for persistent data.

Create database.env

```bash
POSTGRES_USER=THE_USERNAME
POSTGRES_PASSWORD=THE_PASSWORD
POSTGRES_DB=THE_DATABASE_NAME
```

```bash
docker-compose up -d
```

Connect to Postgres Container & Create Tables

````sql
# using psql
psql -h localhost -U <username> -d postgres
# Or Create a new Bash Session inside the container
docker container exec -it postgres /bin/bash
psql postgres -U <username>
# Now connected to DB
# Create Active Shops Table
CREATE TABLE active_shops (id varchar NOT NULL PRIMARY KEY, scope varchar NOT NULL, access_token varchar NOT NULL);
# Create Sessions Table
CREATE TABLE sessions (id varchar NOT NULL PRIMARY KEY, session json NOT NULL);
# Create Contracts Table
CREATE TABLE subscription_contracts (id varchar NOT NULL PRIMARY KEY, shop varchar NOT NULL, status varchar NOT NULL, next_billing_date date NOT NULL, interval varchar NOT NULL, interval_count integer NOT NULL, payment_failure_count integer NOT NULL DEFAULT 0, contract json NOT NULL);


Build App Image
```bash
docker build --tag jriv/subscriptions:latest .
````

Traefik Setup

```yaml
# create file at data/traefik/traefik.yml
api:
  dashboard: true

accessLog:
  filePath: '/var/log/traefik/access.log'
  format: json
  fields:
    defaultMode: keep
    names:
      ClientUsername: drop
    headers:
      defaultMode: keep
      names:
        User-Agent: keep
        Authorization: drop
        Content-Type: keep
  bufferingSize: 100

#Define HTTP and HTTPS entrypoints
entryPoints:
  insecure:
    address: ':80'
  secure:
    address: ':443'

#Dynamic configuration will come from docker labels
providers:
  docker:
    endpoint: 'unix:///var/run/docker.sock'
    network: 'traefik_proxy'
    exposedByDefault: false

http:
  middlewares:
    traefik-forward-auth:
      forwardauth:
        - address = "http://traefik-forward-auth:4181"
        - authResponseHeaders = ["X-Forwarded-User"]
    customHeader:
      headers:
        customResponseHeaders:
          - X-Custom-Response-Header= ["X-Robots-Tag:noindex,nofollow,nosnippet,noarchive,notranslate,noimageindex"}

#Enable acme with http file challenge
certificatesResolvers:
  le:
    acme:
      email: email@example.com
      storage: /acme.json
      httpChallenge:
        # used during the challenge
        entryPoint: insecure
```

Run

```bash
docker-compose up -d
```

```bash
# to remove docker containers
# --volumes to remove volumes
docker system prune
```

## Logs

Logs can be found at /logs

## Tests

- Server callback test is failing, the auth flow was changed to handle both `online` and `offline` tokens. The test will have to be rewritten.
- GraphQL tests are failing, don't understand why, will try to fix when I get the chance.

## Shopify Embedded App Navigation

You can configure the apps navigation from App > App setup > Embed your app in Shopify Admin > Navigation > Configure.
