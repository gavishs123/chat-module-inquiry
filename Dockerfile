# Use the official Node.js Alpine image as the base image
FROM node:14-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port that your application will run on
EXPOSE 5000

# Command to run the backend application
CMD ["node", "app.js"]
