FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Set environment variables for build
ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD72HmBTrehu6RqAwfH14n37nbgSoSiF4c
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=brewnet-dd55e.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=brewnet-dd55e
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=brewnet-dd55e.firebasestorage.app
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=720864557324
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:720864557324:web:b7f4b2419dc12753503129
ENV NEXT_PUBLIC_API_URL=https://brewnet-api.fly.dev
ENV NEXT_PUBLIC_SOCKET_URL=wss://brewnet-api.fly.dev

RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"] 