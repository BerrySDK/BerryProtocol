FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json tsconfig.json ./
COPY packages ./packages

RUN npm install
RUN npm run build

EXPOSE 3000

ENV BERRY_AUTH_FOLDER=/data/auth
ENV BERRY_SQLITE_PATH=/data/berryprotocol.db

CMD ["node", "packages/gateway/dist/index.js"]
