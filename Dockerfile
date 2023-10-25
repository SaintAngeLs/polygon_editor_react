# Use an official Node runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any dependencies
RUN npm install

# Bundle the app source code inside the Docker image
COPY . .

# Create a directory for the Storybook cache
# and ensure it has the right permissions
# Change owner of node_modules to node user
RUN chown -R node:node /usr/src/app/

RUN mkdir -p node_modules/.cache/storybook && chmod -R 777 node_modules/.cache  

# Make port 9001 available to the world outside this container
EXPOSE 9001

# Define the command to run the app
CMD [ "npm", "start" ]
