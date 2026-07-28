FROM node:22-bookworm-slim AS dependencies

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY scripts ./scripts

# postinstall downloads and verifies the Linux yt-dlp binary and copies FFmpeg.
RUN npm ci


FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG DEPLOY_COMMIT_SHA

ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV DEPLOY_COMMIT_SHA=${DEPLOY_COMMIT_SHA}

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/runtime-tools ./runtime-tools
COPY . .

RUN npm run build
RUN npm prune --omit=dev


FROM node:22-bookworm-slim AS runner

WORKDIR /app

ARG DEPLOY_COMMIT_SHA

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV DEPLOY_COMMIT_SHA=${DEPLOY_COMMIT_SHA}
ENV YT_DLP_PATH=/app/runtime-tools/yt-dlp
ENV FFMPEG_PATH=/app/runtime-tools/ffmpeg

COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=dependencies --chown=node:node /app/runtime-tools ./runtime-tools

USER node

EXPOSE 3000

CMD ["npm", "run", "start"]
