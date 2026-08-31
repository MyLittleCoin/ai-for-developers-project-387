# syntax=docker/dockerfile:1

# Build-time proxy passthrough. Passed via --build-arg / compose build.args when
# the host reaches the npm registry through a local proxy (e.g. on a dev box
# HTTP_PROXY=http://127.0.0.1:10808). Requires build network: host so that
# 127.0.0.1 inside the build container really is the host.
ARG HTTP_PROXY=""
ARG HTTPS_PROXY=""
ARG NO_PROXY=""

# npm config: keep retries/timeouts modest so a dead/slow network fails fast
# instead of hanging; default npm fetch-timeout is 300000 and with 5 retries a
# broken link can stall the build for 20+ minutes. --no-audit/--no-fund keeps
# extra registry requests out of the install path.
ARG NPM_FLAGS="--fetch-retries=3 --fetch-retry-mintimeout=5000 --fetch-retry-maxtimeout=60000 --fetch-timeout=60000 --no-audit --no-fund"

# ---------- 1. Build the frontend ----------
FROM node:22-slim AS web-build
WORKDIR /src
ARG NPM_FLAGS
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
COPY web/package.json web/package-lock.json ./
RUN npm ci ${NPM_FLAGS}
COPY web/ ./
RUN npm run build

# ---------- 2. Runtime ----------
FROM node:22-slim AS runtime
WORKDIR /app
ARG NPM_FLAGS
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
COPY server/package.json server/package-lock.json ./
RUN (npm ci ${NPM_FLAGS} || npm ci ${NPM_FLAGS}) && npm cache clean --force
# NODE_ENV must be set AFTER npm ci, otherwise npm omit-dev trims devDeps
# (incl. tsx, needed by "npm start")
ENV NODE_ENV=production
COPY server/ ./
COPY --from=web-build /src/dist /app/public
ENV HOST=0.0.0.0
ENV PORT=4011
EXPOSE 4011
USER node
CMD ["npm", "start"]
