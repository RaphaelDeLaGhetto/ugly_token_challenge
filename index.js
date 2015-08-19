'use strict';

var express = require('express'),
	schedule = require('node-schedule'),
	path = require('path'),
	crypto = require(path.join(__dirname, 'lib', 'peerio_crypto_mod')),
	port = process.env.PORT || 3333,
	app = express(),
    Base58 = require(path.join(__dirname, 'lib', 'base58')),
    morgan = require('morgan'),
    nacl = require('tweetnacl/nacl-fast'),
    bodyParser = require('body-parser'),
    parseArgs = require('minimist'),
    argv = parseArgs(process.argv),
    redis = require('redis').createClient(argv.p || '6379', argv.h || '127.0.0.1'),
	keys = {},
	keyPair = nacl.box.keyPair(), 
	v1 = express.Router();

/**
 * Don't start listening until the database is ready
 */
redis.on('error', function(err) {
    console.log('could not connect to redis', err);
  });

redis.on('connect', function() {
    console.log('redis connected');
    app.listen(port);
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    // Set default AP1 route to version 1
    app.use('/api/v1', v1);
    app.use('/api', v1);

    // For server request logging
    app.use(morgan('combined'));

    // This server's public/private keys (refreshed every day at 3am)
    keys.public = crypto.getPublicKeyString(keyPair.publicKey);
    keys.private = nacl.util.encodeBase64(keyPair.secretKey);
  });


/**
 * Encrypt the given token with the public key provided
 *
 * @param {object} token - Contains token, nonce, and ephemeralServerPublicKey properties
 * @param {string} userPublicKeyString
 *
 * @return {object} Contains encrypted token, nonce, and ephemeralServerPublicKey properties in Base64
 */
var encryptToken = function (token, userPublicKeyString) {
	var nonce = nacl.randomBytes(24);
	var userBytes = new Uint8Array(Base58.decode(userPublicKeyString));
	var serverEphemeralSecret = nacl.util.decodeBase64(keys.private);
	var encrypted_token = nacl.box(
		nacl.util.decodeBase64(token),
		nonce,
		userBytes.subarray(0, 32),
		serverEphemeralSecret
	);
	return {
		token: nacl.util.encodeBase64(encrypted_token),
		nonce: nacl.util.encodeBase64(nonce),
		ephemeralServerPublicKey: keys.public
	};
  };

/**
 * Generate a Base64-encoded 2-byte prefixed array appended with 30 pseudo-random bytes
 *
 * @return {string} Base64
 */
var generateToken = function () {
	var token = new Uint8Array(32);

	token[0] = 0x41;
	token[1] = 0x54;
	token.set(nacl.randomBytes(30), 2);
	return nacl.util.encodeBase64(token);
  };

/**
 * Route middleware for tracking publicKey usage. Incremement by one for every
 * request with a _publicKey_ parameter.
 *
 * @version 1
 */
v1.param('publicKey', function(req, res, next) {
	var publicKey = req.params.publicKey;
    if (publicKey) {
      redis.incr('usage:' + publicKey, function(err, res) {
          next();
        });
    }
    else {
      next();
    }
  });

/**
 * Get ten encrypted tokens
 *
 * GET /api/v1/generate/:publicKey
 *
 * @version 1
 */
v1.get('/generate/:publicKey', function(req, res) {
	var publicKey = req.params.publicKey,
		tokens = [], 
		encryptedTokens = [];

	for (var i=0; i<10; i++) {
      var token = generateToken();
      tokens.push(token);
      redis.set(token, publicKey);
      encryptedTokens.push(encryptToken(token, publicKey));
	}

	res.status(200).json({ 
        tokens: encryptedTokens
	  });
  });


/**
 * Check validity of a token
 *
 * POST /api/v1/tokens/:token
 *
 * @version 1
 */
v1.post('/tokens/:token*?', function(req, res) {

    // The tokens sometimes contain forward slashes.
    // This messes up routing. Here, everything following
    // a slash is treated as splat-like parameters and
    // then appended to the value assigned to the token
    // parameter.
    var decryptedToken = req.params.token + req.params[0];

    var publicKey = req.body.publicKey;

    redis.get(decryptedToken, function(err, val) {
    	if (val && val.toString() === publicKey) {
          res.status(200).json({ status: 'ok' });
    	}
        else {
          res.status(500).json({ error: 'error' });
    	}
    	redis.del(decryptedToken);
    });
  });	

/**
 * Refresh this server's public/private keys at 3am every day
 */
schedule.scheduleJob('0 3 * * *', function() {
	console.log('change server\'s ephemeral keypair');

	keys.public = crypto.getPublicKeyString(keyPair.publicKey);
	keys.private = nacl.util.encodeBase64(keyPair.secretKey);
  });

