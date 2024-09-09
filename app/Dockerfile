# Dockerfile

# base image
FROM node:18.19.0-buster

# create & set working directory
RUN mkdir -p /usr/app
WORKDIR /usr/app

# copy source files
COPY . /usr/app

# install dependencies
RUN npm -g install cross-env
#RUN npm -g install npm

RUN npm install

# start app
RUN npx prisma generate
RUN npm run build

# permissions
#RUN chown -R 1000:1000 /root/.npm
#RUN chmod -R 777 /root/.npm

EXPOSE 8081
CMD ["npm", "run", "start"]
