FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
COPY start-node-and-deploy.sh ./start-node-and-deploy.sh

RUN sed -i 's/\r$//' ./start-node-and-deploy.sh && chmod +x ./start-node-and-deploy.sh

EXPOSE 8545

CMD ["./start-node-and-deploy.sh"]
