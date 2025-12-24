FROM node:18

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

ENV USE_MOCKS=false
ENV MONOLITH_URL=http://monolith:8080

EXPOSE 4001

CMD ["node", "index.js"]
