# Production Dockerfile for Backend
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema BEFORE npm install 
# This allows the 'postinstall' script to find the schema during npm install
COPY prisma ./prisma

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the API port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
