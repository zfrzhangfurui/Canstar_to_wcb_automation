FROM ghcr.io/puppeteer/puppeteer:24.1.1 AS base

USER root

# RUN apt-get update -y && apt-get install vim -y

WORKDIR /home/pptruser/app

FROM base AS build

COPY . ./

RUN npm install --omit=dev && npm run build

FROM base AS prod

COPY --from=build /home/pptruser/app/node_modules /home/pptruser/app/node_modules/

COPY package.json ./

COPY .env ./

COPY --from=build /home/pptruser/app/dist /home/pptruser/app/dist/

RUN mv .env prod.env && mkdir scv_download && mkdir logger 

USER pptruser

ENTRYPOINT ["node"]

CMD ["dist/main.js", "--env-file prod.env"]



