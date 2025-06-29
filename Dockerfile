# Marketing Agent - Production Dockerfile
FROM node:18-alpine AS base

# 依存関係のインストール
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ビルド
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 環境変数を設定 (ビルド時)
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Prisma クライアントの生成
RUN npx prisma generate

# Next.js のビルド (standalone出力を無効化してWSL2問題回避)
RUN npm run build

# 実行環境
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要なファイルのコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# データベースファイルとディレクトリの権限設定
RUN mkdir -p /app/prisma
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000

# 開発環境では npm run dev、本番環境では npm start
CMD ["npm", "start"]
