FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY server.js ./
COPY certs/ ./certs/

EXPOSE 2376

CMD ["node", "server.js"]
