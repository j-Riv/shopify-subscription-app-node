# Dockerfile

# base image
FROM node:16.14.2-alpine

# create & set working directory
RUN mkdir -p /usr/app
WORKDIR /usr/app

# copy source files
COPY . /usr/app

# install dependencies
RUN npm -g install cross-env
RUN npm install

# start app
RUN npm run build

EXPOSE 8081
CMD ["npm", "run", "serve"]