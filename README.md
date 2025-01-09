##
# Test suite
##
mocha: test runner 
chai: used to make assertions
nyc: collect test coverage report
sinon-chai: extends chai's assertions
supertest: http calls
coveralls: uploading coverage to coveralls.io

##
# Useful Neo4j queries
##
*Delete by interal id*
MATCH (p:Booking) where ID(p)=2
OPTIONAL MATCH (p)-[r]-() //drops p's relations
DELETE r,p 

##
# Execution Info
##
App uses env.js files for each environment.
settings.js has logic for which config to serve based on NODE_ENV set in the run script.


dev server: npm run startdev

##
# Important Notes
##

Must allow less secure apps in google for email service to work, free for 10,000 emails per day

build docker image: docker build --tag tsbackend . 
start docker container: docker run -d -p 3000:3000 --name tsback tsbackend

##
# Neo4j Notes
##

Docker run commands

# Start local network with all server instances
docker-compose up --build
docker-compose up -d --build //Detached from command window

# use current user auth
docker run \
    --publish=7474:7474 --publish=7687:7687 \
    --volume=$HOME/neo4j/data:/data \
    --volume=$HOME/neo4j/logs:/logs \
    --user="$(id -u):$(id -g)" \
    neo4j:4.3

# build basic container
docker run \
    --detach \
    --publish=7474:7474 --publish=7687:7687 \
    --volume=$HOME/neo4j/data:/data \
    --volume=$HOME/neo4j/logs:/logs \
    --volume=$HOME/neo4j/conf:/conf \
    neo4j:latest

# build with no auth
docker run \                                      
    --name testneo4j \
    -p7474:7474 -p7687:7687 \
    -d \
    -v $HOME/neo4j/data:/data \
    -v $HOME/neo4j/logs:/logs \
    -v $HOME/neo4j/import:/var/lib/neo4j/import \
    -v $HOME/neo4j/plugins:/plugins \
    --env NEO4J_AUTH=none \
    neo4j:latest


# Config arugements
docker update 

NEO4J_dbms__memory__pagecache__size=1G
NEO4J_dbms__memory__heap_max__size=512M
NEO4J_dbms__default__listen__address=0.0.0.0

# Util Commands
docker ps //lists server port data


##
# Dev and Build instructions
##

- Create a folder on your local for "docker-compose" files, target the dir location of the node app for the "dockerfile"'s  
- ## Deployment Scheme
- - The docker-compose file in the base dir of the node app is used for deployment builds
- - Make sure to target your image repo for the images you want to deploy
- - Copy this docker-compose.yml to your server and with docker installed you can run "docker-compose -up" in the docker-compose directory to start your app
- ## Components and Development procedure (visual) https://miro.com/app/board/uXjVOb5T7yg=/
- - Tattoo-Studio-UI -> Fronend Angular App w/ Dockerfile
- - Tattoo-Studio-Backend -> Backend Express.js Node App w/ Deployment Docker-Compose.yml and Dockerfile
- - Neo4j DB
- - Dockerfiles -> Used for Development of app docker-compose the server and database pulling the latest image
- - ng serve the angular app
- - Development environment is complete at this point