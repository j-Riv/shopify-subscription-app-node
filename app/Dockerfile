# Dockerfile

# base image
FROM --platform=linux/amd64 node:16.14.2-buster

# create & set working directory
RUN mkdir -p /usr/app
WORKDIR /usr/app

# copy source files
COPY . /usr/app

# install dependencies
RUN npm -g install cross-env

RUN npm install

# start app
RUN npx prisma generate
RUN npm run build

EXPOSE 8081
CMD ["npm", "run", "start"]
