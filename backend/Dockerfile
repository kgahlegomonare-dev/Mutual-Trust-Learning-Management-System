# Use an official Node.js runtime as the base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) first to cache dependencies
COPY package*.json ./

# Install dependencies inside the container
RUN npm install

# Copy the rest of the backend application code
COPY . .

# Expose the port your JS backend runs on (replace 5000 with your actual JS backend port if different)
EXPOSE 5000

# Command to run your development script
CMD ["npm", "run", "dev"]