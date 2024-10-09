FROM node:20.17.0-alpine

USER node

WORKDIR /usr/src/app

COPY --chown=node:node . .
RUN npm clean-install

CMD ["npm", "run", "start:docker"]
