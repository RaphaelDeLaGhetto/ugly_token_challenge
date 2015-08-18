ugly_token_challenge
====================

A programming exercise submitted to [peerio.com](http://peerio.com). This
document describes how to deploy the product into a production (and
development) environment.

## Overview of enhancements

- Configured GruntJS for:
    - Builds
        - Delinting
        - Removed unused packages and variables
    - Testing
        - jasmine-node
        - Expanded coverage to account for public key usage and ugly tokens
    - Deployment
- Declared _strict mode_
- Ensured tokens containing slashes don't break the routes
- Fixed private/public key refresh to execute once everyday at 3am
- Server request logging
- Set the stage for API versioning

# Prepare the server environment

The following instructions pertain to a server running Ubuntu 14.04. It assumes a basic install with SSH access and a _root_ user. Login as appropriate...

## Add a user account

You don't want to run everything as _root_, so create a new user.

```
sudo adduser deploy
sudo adduser deploy sudo
su deploy
```

## Update the OS

```
sudo apt-get update
sudo apt-get upgrade
```

## Install Docker

Docker is used, wherever possible, to set up the server environment. These instructions are adapted from [here](http://docs.docker.com/linux/started/).

```
wget -qO- https://get.docker.com/ | sh
```

Once installed, Docker helpfully suggests you allow the _deploy_ user to execute Docker commands without prefixing `sudo`.

```
sudo usermod -aG docker deploy
```

Having done this, logout and log back in as the _deploy_ user for the change to take effect.

Docker should start automatically, but likely didn't. To be sure, execute:

```
sudo service docker restart
```

Now verify that `docker` is installed correctly;

```
docker run hello-world
```

### Docker cheatsheet

Some useful `docker` commands:

```
docker images               # show locally stored images
docker ps                   # show running containers
docker login                # authenticate
docker build -t my-image    # build image from Dockerfile in current directory
docker tag IMAGE_ID mydockeracct/my-image:latest # tag the image
docker push                 # push tagged image to repository
docker rmi -f my-image      # remove an image
docker pull mydockeracct/my-image # download an image
docker run my-image         # load image into new container
```

# Setting the stage

This project has a number of production/development environment dependencies, most of which are deployed with Docker.

## Redis

### Build requirements

Some of these may already be installed, but it won't hurt to install again.

```
sudo apt-get install make
sudo apt-get install gcc
sudo apt-get install build-essential
sudo apt-get install tcl8.5
```

### Download and build

```
cd
wget http://download.redis.io/releases/redis-stable.tar.gz
tar xzf redis-stable.tar.gz
sudo mv redis-stable /etc/redis
cd /etc/redis
sudo make
sudo make test
sudo make install
```

### Start Redis

From the `/etc/redis` directory:

```
cd utils
sudo ./install_server.sh
```

Hit `enter` for each of the configuration prompts to accept the defaults.

At this point, Redis should have automatically started. Execute `redis-cli` and
you will see a prompt similar to this:

```
redis-cli
127.0.0.1:6379>
```

Exit the command prompt (`ctrl-c`) and set Redis to start on boot:

```
sudo update-rc.d redis_6379 defaults
```

#### Stopping and starting Redis (for reference)

```
sudo service redis_6379 stop
sudo service redis_6379 start
```

Here, `6379` is the default port.

## Node

```
sudo apt-get install nodejs
```

### npm

[Node Package Manager](https://npmjs.org/) is needed to install package
dependencies. It should be installed automatically along with Node (see above).
If, for some reason, it wasn't, run:

```
sudo apt-get install npm
```

## GruntJS

This is required for building, testing, and deploying the
`ugly_token_challenge` project:

```
npm install -g grunt-cli
```






Install Redis, node, npm. 

To run `node index.js`. To run tests `jasmine`. 
