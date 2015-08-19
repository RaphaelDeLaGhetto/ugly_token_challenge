ugly_token_challenge
====================

A programming exercise submitted to [peerio.com](http://peerio.com). This
document describes how to deploy the product into production and setup a
development environment.

## Overview of enhancements

- Configured GruntJS for:
    - Builds
        - Delinting
        - Removed unused packages and variables
    - Testing
        - jasmine-node
        - Expanded coverage to account for public key usage and ugly tokens
- Declared _strict mode_
- Ensured tokens containing slashes don't break the routes
- Fixed private/public key refresh to execute once everyday at 3am
- Server request logging
- Set the stage for API versioning
- Deployed the project as a Docker image with automatic builds from GitHub

# Prepare the server environment

The following instructions pertain to a server running Ubuntu 14.04. It assumes
a basic install with SSH access and a _root_ user. Login as appropriate...

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

Docker is used to deploy the required system components. These install
instructions are adapted from [here](http://docs.docker.com/linux/started/).

```
wget -qO- https://get.docker.com/ | sh
```

Once installed, Docker helpfully suggests you allow the _deploy_ user to execute
Docker commands without prefixing `sudo`.

```
sudo usermod -aG docker deploy
```

Having done this, logout and log back in as the _deploy_ user for the change to
take effect.

Docker should start automatically, but if it didn't (`status docker`), execute:

```
sudo service docker start
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
docker build -t my-image .  # build image from Dockerfile in current directory
docker tag IMAGE_ID mydockeracct/my-image:latest # tag the image
docker push                 # push tagged image to repository
docker rmi -f my-image      # remove an image
docker pull mydockeracct/my-image # download an image
docker run my-image         # load image into new container
```

# Deploy Docker containers

The system topology is comprised of Nginx, Redis, and any number of
`ugly_token_challenge` instances.

![Ugly Topology](http://anandmanisankar.com/assets/images/DockerSample.png)

_NOTE:_ The following will likely be automated using Docker _Compose_ when it
is deemed [ready for production](https://docs.docker.com/compose/).

## Redis

```
docker run --restart=always -d --name redis -p 6379:6379 redis
```

## Nginx

### First, get an SSL certificate

This can be self-signed or obtained from a Certificate Authority. To self-sign
a certificate, execute the following:

```
mkdir certs
cd certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout sub.example.com.key -out sub.example.com.crt
cd ..
sudo chown -R root:root certs 
sudo chmod -R 600 certs 
```

Note the `keyout` and `out` options. The `jwilder/nginx-proxy` Docker image 
won't pick up the certificates unless they are named in accordance with the 
production site's URL and subdomain (if any). For example, if you have a
certificate for www.example.com, the `keyout` and `out` options must be
named `www.example.com.key` and `www.example.com.crt` respectively.

### Then, run the Nginx docker image

```
docker run --restart=always -d -p 80:80 -p 443:443 -v /home/deploy/certs:/etc/nginx/certs -v /var/run/docker.sock:/tmp/docker.sock:ro jwilder/nginx-proxy
```

## raphaeldelaghetto/ugly_token_challenge

Be sure to replace `www.example.com` with your domain.

```
docker run --restart=always -d --expose 3331 -e VIRTUAL_HOST=www.example.com -e PORT=3331 --name ugly --link redis:redis raphaeldelaghetto/ugly_token_challenge
```

Any number of `ugly_token_challenge` images can be deployed. Just be sure to 
provide each one with a unique name and port. For example:

```
docker run --restart=always -d --expose 3332 -e VIRTUAL_HOST=www.example.com -e PORT=3332 --name ugly1 --link redis:redis raphaeldelaghetto/ugly_token_challenge
docker run --restart=always -d --expose 3333 -e VIRTUAL_HOST=www.example.com -e PORT=3333 --name ugly2 --link redis:redis raphaeldelaghetto/ugly_token_challenge
```

# Developing ugly_token_challenge

This section provides instruction on how to prepare your development
environment. Again, this assumes an Ubuntu 14.04 installation.

## Update the OS

```
sudo apt-get update
sudo apt-get upgrade
```

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

## Clone the repository

```
git clone https://github.com/RaphaelDeLaGhetto/ugly_token_challenge.git
cd ugly_token_challenge
```

Once downloaded, install `npm` modules:

```
npm install
```

### Test

All tests must pass:

```
grunt test
```

### Execute

```
node index.js
```
