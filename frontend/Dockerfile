FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy rest of the application
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

# Build-time settings
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_SHARP_PATH=/tmp/node_modules/sharp

# Install dependencies for production
RUN npm ci --only=production

# Build the application
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

# Runtime environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_SHARP_PATH=/tmp/node_modules/sharp

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Start the application
CMD ["node", "server.js"] 