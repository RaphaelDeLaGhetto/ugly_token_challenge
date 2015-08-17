ugly_token_challenge
====================

A programming exercise submitted to [peerio.com](http://peerio.com). This
document describes how to deploy the product into a production (and
development) environment.

## Overview of enhancements

- Configured GruntJS for builds, testing, and deployment
- Declared _strict mode_


# Update the OS

The following instructions pertain to Ubuntu 14.04.

```
sudo apt-get update
sudo apt-get upgrade
```

# Setting the stage

This project has a number of production/development environment dependencies...

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
