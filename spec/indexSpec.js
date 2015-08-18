'use strict';

var request = require('request'),
	path = require('path'),
	crypto = require(path.join(__dirname, '..', 'lib', 'peerio_crypto_mod')),
	nacl = require('tweetnacl/nacl-fast'),
	port = process.env.PORT || 3333;

var tokens,
    myPublicKeyString,
	serverPublicKey,
    redis,
	myKeyPair = nacl.box.keyPair();

// Connect to the database
redis = require('redis').createClient();

require('../index');

/**
 * Get some tokens to play with. This feature is tested below.
 */
beforeEach(function(done) {
    myPublicKeyString = crypto.getPublicKeyString(myKeyPair.publicKey);

    request('http://localhost:' + port + '/api/generate/' + myPublicKeyString, function(error, response, body){
        // Ensure no errors were returned
        expect(error).toBeNull();
        expect(response.statusCode).toEqual(200);
    
        // This try/catch ensures that the response body is JSON.
        // Tests will not proceed if an exception is thrown here.
        if (response) {
          try {
            var b = JSON.parse(response.body);
        	tokens = b.tokens; 
          }
          catch(err) {
            console.log('JSON parse failed', err);
            expect(true).toBe(false);
          }
        }
        done();
    });
});

afterEach(function(done) {
    redis.del('usage:' + myPublicKeyString);
    done();
});

/**
 * Public key usage tracking
 */
describe('Public key usage tracking', function() {
	it('should increment usage by one on each call', function(done) {
        // Used once because it was incremented by the call in beforeEach
        redis.get('usage:' + myPublicKeyString, function(err, ret) {
            expect(parseInt(ret)).toEqual(1);
            request('http://localhost:' + port + '/api/generate/' + myPublicKeyString, function(error, response, body){

                // Used twice
                redis.get('usage:' + myPublicKeyString, function(err, ret) {
                    expect(parseInt(ret)).toEqual(2);
                    request('http://localhost:' + port + '/api/generate/' + myPublicKeyString, function(error, response, body){

                        // Used thrice
                        redis.get('usage:' + myPublicKeyString, function(err, ret) {
                            expect(parseInt(ret)).toEqual(3);
                            done();
                          });
                      });
                  });
              });
          });
    });
});


/**
 * Generating tokens
 */
describe('Generating tokens', function() {
	it('should respond with 10 encrypted tokens', function(done) {
	  	request('http://localhost:' + port + '/api/generate/' + myPublicKeyString, function(error, response, body){

            // Ensure no errors were returned
            expect(error).toBeNull();
    		expect(response.statusCode).toEqual(200);

            // This try/catch ensures that the response body is JSON.
            // Tests will not proceed if an exception is thrown here.
            if (response) {
              try {
  		  	    var b = JSON.parse(response.body);
    		  	tokens = b.tokens; 
    		  	serverPublicKey = b.ephemeralServerPublicKey;
    		    expect(tokens.length).toEqual(10);
              }
              catch(err) {
                console.log('JSON parse failed', err);
                expect(true).toBe(false);
              }
            }
		    done();
	  	});
	});

	it('should use the specified API version', function(done) {
	  	request('http://localhost:' + port + '/api/v1/generate/' + myPublicKeyString, function(error, response, body){

            // Ensure no errors were returned
            expect(error).toBeNull();
    		expect(response.statusCode).toEqual(200);

            // This try/catch ensures that the response body is JSON.
            // Tests will not proceed if an exception is thrown here.
            if (response) {
              try {
  		  	    var b = JSON.parse(response.body);
    		  	tokens = b.tokens; 
    		  	serverPublicKey = b.ephemeralServerPublicKey;
    		    expect(tokens.length).toEqual(10);
              }
              catch(err) {
                console.log('JSON parse failed', err);
                expect(true).toBe(false);
              }
            }
		    done();
	  	});
	});
});

/**
 * Validating tokens
 */
describe('Validating tokens', function() {

	it('should return an error for an unknown token', function(done) {
		request({ uri: 'http://localhost:' + port + '/api/tokens/garbage',
                  method: 'post', json: true, body: { publicKey: myPublicKeyString } }, function(error, response, body){
		    expect(response.statusCode).toEqual(500);
		    done();
	  	});
	});

    it('should return an error for a known token and incorrect user', function(done) {
		var validDecryptedToken = crypto.decryptToken(tokens[0], myKeyPair);

		request({ uri: 'http://localhost:' + port + '/api/tokens/' + validDecryptedToken,
                  method: 'post', json: true, body: { publicKey: 'garbage' } }, function(error, response, body){
		    expect(response.statusCode).toEqual(500);
		    done();
	  	});	
	});

	it('should correctly validate legitimate credentials', function(done) {
		var validDecryptedToken = crypto.decryptToken(tokens[0], myKeyPair);

		request({ uri: 'http://localhost:' + port + '/api/tokens/' + validDecryptedToken,
                  method: 'post', json: true, body: { publicKey: myPublicKeyString } }, function(error, response, body){
		    expect(response.statusCode).toEqual(200);
		    done();
	  	});	
	});

	it('should correctly validate legitimate credentials with a token containing forward slashes', function(done) {
        // Finding a decrypted token with forward slashes from those retrieved during test setup.
        // This test depends on the likelihood that at least one of the ten tokens will decrypt
        // into something with forward slashes.
		var validDecryptedToken;
        for(var i = 0; i < tokens.length; i++) {
		  validDecryptedToken = crypto.decryptToken(tokens[i], myKeyPair);
          if (/\//.test(validDecryptedToken)) {
            break;
          }
        }
        expect(/\//.test(validDecryptedToken)).toBe(true);

		request({ uri: 'http://localhost:' + port + '/api/tokens/' + validDecryptedToken,
                  method: 'post', json: true, body: { publicKey: myPublicKeyString } }, function(error, response, body){
		    expect(response.statusCode).toEqual(200);
		    done();
	  	});	
	});

	it('should correctly route tokens containing forward slashes', function(done) {
        var token = 'QVQy2bNsRhEKfV8RGWJD/gmEuzHQjl+QC+z0W/axwwg=';
		request({ uri: 'http://localhost:' + port + '/api/tokens/' + token,
                  method: 'post', json: true, body: { publicKey: myPublicKeyString } }, function(error, response, body){
		    expect(response.statusCode).toEqual(500);
		    done();
	  	});	
	});
});
