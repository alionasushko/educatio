FROM node:22.22.2 AS deps
WORKDIR /app
COPY package*.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm ci --omit=dev \
  --workspace @educatio/shared \
  --workspace @educatio/api \
  --include-workspace-root

FROM node:22.22.2 AS build
WORKDIR /app
COPY package*.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm ci \
  --workspace @educatio/shared \
  --workspace @educatio/api \
  --include-workspace-root
COPY packages/shared packages/shared
RUN npm run build -w @educatio/shared
COPY apps/api apps/api
RUN npm run build -w @educatio/api

FROM node:22.22.2-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY --from=deps /app/node_modules node_modules
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/api/dist apps/api/dist
USER node
CMD ["node", "apps/api/dist/main"]
