FROM cicirello/gnu-on-alpine:latest

FROM ghcr.io/puppeteer/puppeteer:latest

USER root

RUN apt-get update -y && apt-get install vim -y

WORKDIR /home/pptruser/app

# RUN npm install -g @nestjs/cli



