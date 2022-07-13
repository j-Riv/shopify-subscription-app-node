# Shopify Subscription App Node

> Embedded Shopify Subscription app made with Node, Prisma, React, Polaris, App Bridge React and TypeScript.

🚧🔨👷 Currently Under Development

## Environmental Variables

.env 
```javascript
DOMAIN_NAME=DOMAIN_NAME
GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET
OAUTH_SECRET=OAUTH_SECRET
EMAIL_WHITELIST=name@example.com,name2@example.com
```

database.env
```javascript
POSTGRES_USER=THE_USERNAME
POSTGRES_PASSWORD=THE_PASSWORD
POSTGRES_DB=THE_DATABASE_NAME
```

## Setup

Install Docker.

Create Data `/data` directory for persistent data.

```bash
docker-compose up -d
```

Connect to Postgres Container & Create Tables

```sql
# using psql
psql -h localhost -U <username> -d postgres
# Or Create a new Bash Session inside the container
docker container exec -it postgres /bin/bash
psql postgres -U <username>
# Now connected to DB
# Create Active Shops Table
CREATE TABLE active_shops (id varchar NOT NULL PRIMARY KEY, scope varchar NOT NULL, access_token varchar NOT NULL);
# Create Contracts Table
CREATE TABLE subscription_contracts (id varchar NOT NULL PRIMARY KEY, shop varchar NOT NULL, status varchar NOT NULL, next_billing_date date NOT NULL, interval varchar NOT NULL, interval_count integer NOT NULL, payment_failure_count integer NOT NULL DEFAULT 0, contract json NOT NULL);
```

## Build App Image
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

## App Proxy
App Proxy will be served from `/proxy/build`.

## Logs

Logs can be found at /logs