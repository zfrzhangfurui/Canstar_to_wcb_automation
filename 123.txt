FROM ilaipi/node-puppeteer as base

USER root

WORKDIR /home/pptruser/app

FROM base as prod

COPY package*.json ./

RUN npm install --omit=dev

FROM base as dev

COPY package*.json ./

RUN npm install

FROM dev as build
COPY . ./
RUN npm run build

FROM base as release

COPY --from=prod /home/pptruser/app/node_modules /home/pptruser/app/node_modules/
COPY package.json ./
COPY --from=build /home/pptruser/app/dist /home/pptruser/app/dist/

RUN chown -R pptruser:pptruser /home/pptruser/app

USER pptruser

ENTRYPOINT ["node"]

CMD ["dist/main.js"]
