'use strict';

var express = require('express'),
    // Not used (yet...)
	//http = require('http'),
	schedule = require('node-schedule'),
    // Not used (yet...)
	//_ = require('lodash'),
	path = require('path'),
	crypto = require(path.join(__dirname, 'lib', 'peerio_crypto_mod')),
	port = process.env.PORT || 3333,
	app = express(),
    Base58 = require(path.join(__dirname, 'lib', 'base58')),
    nacl = require('tweetnacl/nacl-fast'),
    bodyParser = require('body-parser'),
    redis = require('redis').createClient(),
    // Not used (yet...)
	//httpServer = http.createServer(app),
	keys = {},
	keyPair = nacl.box.keyPair(), 
	router = express.Router();

/**
 * Don't start listening until the database is ready
 */
redis.on('error', function() {
    console.log('could not connect to redis');
  });

redis.on('connect', function() {
    console.log('redis connected');
    app.listen(port);
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use('/api', router);
    keys.public = crypto.getPublicKeyString(keyPair.publicKey);
    keys.private = nacl.util.encodeBase64(keyPair.secretKey);
  });


/**
 *
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
 *
 */
var generateToken = function () {
	var token = new Uint8Array(32);

	token[0] = 0x41;
	token[1] = 0x54;
	token.set(nacl.randomBytes(30), 2);
	return nacl.util.encodeBase64(token);
};

/**
 * Track publicKey usage
 */
router.param('publicKey', function(req, res, next) {
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
 * GET /api/generate/:publicKey
 */
router.get('/generate/:publicKey', function(req, res) {
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
 * POST /api/tokens/:token
 */
router.post('/tokens/:token*?', function(req, res) {

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
 * Switch up the keys at 3am every day
 */
schedule.scheduleJob('0 3 * * *', function() {
	console.log('change server\'s ephemeral keypair');

	keys.public = crypto.getPublicKeyString(keyPair.publicKey);
	keys.private = nacl.util.encodeBase64(keyPair.secretKey);
});

