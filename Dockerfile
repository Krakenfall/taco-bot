FROM node:argon
LABEL Description="This image runs a GroupMe command bot node server" \
Vendor="Krakenfall" Version="0.3"

RUN mkdir -p /bot/app
WORKDIR /bot/app

COPY package.json /bot/app
RUN npm install

COPY . /bot/app

RUN export TZ=America/Los_Angeles

EXPOSE 80

CMD ["npm", "start"]
