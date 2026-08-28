FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json tsconfig.json ./
COPY packages ./packages
COPY .env.example ./

RUN npm install
RUN npm run build

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000
ENV API_KEY=berryapi_dev_key
ENV DATABASE_URL=file:/data/berryapi.sqlite
ENV BERRY_AUTH_FOLDER=/data/auth
ENV BERRY_SQLITE_PATH=/data/berrysdk.db

CMD ["node", "packages/berryapi/dist/server.js"]
