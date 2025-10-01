FROM node:18-alpine

RUN apk add --no-cache wget
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build          # <= creates dist/
RUN npm prune --production

ENV NODE_ENV=production
ENV PORT=3005
ENV HOST=0.0.0.0
EXPOSE 3005

CMD ["node", "dist/main.js"]
 