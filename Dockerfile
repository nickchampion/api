FROM node:14.15.1-alpine as builder

WORKDIR /build

COPY package.json .
COPY yarn.lock .

RUN apk update
RUN apk --no-cache add yarn
RUN yarn --network-timeout 100000 && yarn cache clean
RUN apk add --update bash && rm -rf /var/cache/apk/*

FROM node:14.15.1-alpine as api

WORKDIR /usr/app

COPY --from=builder /build/node_modules ./node_modules
COPY . ./

EXPOSE 3000

CMD ["node", "app"]
