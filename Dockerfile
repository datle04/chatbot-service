# 1. Base image
FROM node:20-alpine

# 2. Working directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install dependencies (bao gồm devDeps)
RUN npm install

# 5. Cài nodemon toàn cục (để chạy được CMD ["nodemon"])
RUN npm install -g nodemon

# 6. Copy source code
COPY . .

# 7. Expose port
EXPOSE 8000

# 8. Start in dev mode
CMD ["npm", "run", "dev"]
