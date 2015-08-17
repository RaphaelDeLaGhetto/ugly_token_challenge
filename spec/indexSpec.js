var request = require('request'),
	path = require('path'),
	crypto = require(path.join(__dirname, '..', 'lib', 'peerio_crypto_mod')),
	nacl = require('tweetnacl/nacl-fast'),
	port = process.env.PORT || 3333;

var tokens, 
	serverPublicKey,
	myKeyPair = nacl.box.keyPair();

describe("Generating tokens", function() {
	it("should respond with 10 encrypted tokens", function(done) {
		var myPublicKeyString = crypto.getPublicKeyString(myKeyPair.publicKey);

	  	request("http://localhost:" + port + "/api/generate/" + myPublicKeyString, function(error, response, body){
		  	var b = JSON.parse(response.body);
		  	tokens = b.tokens; 
		  	serverPublicKey = b.ephemeralServerPublicKey;
		    expect(response.statusCode).toEqual(200);
		    expect(tokens.length).toEqual(10);
		    done();
	  	});
	});
})

describe("Validating tokens", function() {
	it("should return an error for an unknown token", function(done) {
		var myPublicKeyString = crypto.getPublicKeyString(myKeyPair.publicKey);

		request({ uri: "http://localhost:" + port + "/api/tokens/garbage", method: 'post', json: true, body: { publicKey: myPublicKeyString } }, function(error, response, body){
		    expect(response.statusCode).toEqual(500);
		    done();
	  	});
	})

	it("should return an error for a known token and incorrect user", function(done) {
		var validDecryptedToken = crypto.decryptToken(tokens[0], myKeyPair);

		request({ uri: "http://localhost:" + port + "/api/tokens/" + validDecryptedToken, method: 'post', json: true, body: { publicKey: 'garbage' } }, function(error, response, body){
		    expect(response.statusCode).toEqual(500);
		    done();
	  	});	
	})

	it("should return an error for an unknown token", function(done) {
		var myPublicKeyString = crypto.getPublicKeyString(myKeyPair.publicKey);

		request({ uri: "http://localhost:" + port + "/api/tokens/garbage" , method: 'post', json: true, body: { publicKey: myPublicKeyString } }, function(error, response, body){
		    expect(response.statusCode).toEqual(500);
		    done();
	  	});	
	
	})
})