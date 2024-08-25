FROM node:20-alpine AS base

WORKDIR /app
COPY . .

RUN corepack enable pnpm && pnpm install --frozen-lockfile

CMD [ "pnpm", "start" ]