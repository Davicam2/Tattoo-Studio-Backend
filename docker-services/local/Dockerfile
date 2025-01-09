# syntax=docker/dockerfile:1
FROM node:14.17.5

ENV NODE_ENV=production

#RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /Users/camerondavis/Desktop/dev-projects/Tattoo-Studio-Backend

COPY package*.json .

#USER node

RUN npm install

COPY . .

EXPOSE 3000

#CMD ["npm", "run", "startdev"]
#ENTRYPOINT [ "home/node/app/entrypoint.sh" ]