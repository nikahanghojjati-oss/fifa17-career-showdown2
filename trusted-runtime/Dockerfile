FROM node:24-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

COPY trusted-runtime/package.json ./trusted-runtime/package.json
WORKDIR /app/trusted-runtime
RUN npm install --omit=dev --no-audit --no-fund

WORKDIR /app
COPY js/trustedRequestAuthentication.js ./js/trustedRequestAuthentication.js
COPY js/trustedAccountBootstrap.js ./js/trustedAccountBootstrap.js
COPY js/trustedAccountBootstrapExecution.js ./js/trustedAccountBootstrapExecution.js
COPY js/trustedAppAttestationRequest.js ./js/trustedAppAttestationRequest.js
COPY trusted-runtime/productionTrustedRuntime.js ./trusted-runtime/productionTrustedRuntime.js
COPY trusted-runtime/firebaseAdminProvider.mjs ./trusted-runtime/firebaseAdminProvider.mjs
COPY trusted-runtime/server.mjs ./trusted-runtime/server.mjs

USER node
WORKDIR /app/trusted-runtime
CMD ["node","server.mjs"]
