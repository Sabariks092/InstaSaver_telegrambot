FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Set environment to production
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "app.js"]
