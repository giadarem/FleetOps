FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Install dependencies separately (better caching)
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

# Expose app port
EXPOSE 3000

# Start in dev mode with hot reload
CMD ["npm", "run", "dev"]