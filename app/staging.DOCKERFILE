# Double-container Dockerfile for separated build process.
# Don't forget a .dockerignore!

# We're starting with the same base image, but we're declaring
# that this block outputs an image called DEPS that we
# won't be deploying - it just installs our deps
FROM --platform=linux/amd64 node:16.14.2-alpine AS deps

# If you need libc for any of your deps, uncomment this line:
# RUN apk add --no-cache libc6-compat

# Copy over ONLY the package.json and package.lock
# so that this `npm install` layer is only recomputed
# if these dependency files change. Nice speed hack!
WORKDIR /app
COPY package.json package-lock.json ./ 
RUN npm ci

# END DEPS IMAGE

# Now we make a container to handle our Build
FROM --platform=linux/amd64 node:16.14.2-alpine AS BUILD_IMAGE

# Set up our work directory again
WORKDIR /app

# Bring over the deps we installed and now also
# the rest of the source code to build the Next
# server for production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# END OF BUILD_IMAGE

# This starts our application's run image - the final output of build.
FROM --platform=linux/amd64 node:16.14.2-alpine

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Pull the built files out of BUILD_IMAGE - we need:
WORKDIR /app
COPY --from=BUILD_IMAGE --chown=nodejs:nodejs /app/package.json /app/package-lock.json ./
COPY --from=BUILD_IMAGE --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=BUILD_IMAGE --chown=nodejs:nodejs /app/app_proxy ./app_proxy
COPY --from=BUILD_IMAGE --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=BUILD_IMAGE --chown=nodejs:nodejs /app/dist ./dist
COPY --from=BUILD_IMAGE --chown=nodejs:nodejs /app/.env.staging ./.env

# Create log directory
RUN mkdir -p /app/logs
RUN chown -R nodejs:nodejs /app/logs
RUN chmod 755 /app/logs

USER nodejs

EXPOSE 8081

CMD ["npm", "run", "start"]