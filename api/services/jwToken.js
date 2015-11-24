/**
 * jwToken
 *
 * @description :: JSON Webtoken Service for sails
 * @help        :: See https://github.com/auth0/node-jsonwebtoken & http://sailsjs.org/#!/documentation/concepts/Services
 */

var jwt = require('jsonwebtoken');
var tokenSecret = 'mysecretstring';

//Generates a token from supplied payload
module.exports.issue = function(payload){
	return jwt.sign(
		payload,
		tokenSecret,{
			expiresIn : 86400			
		}
	);
};

module.exports.verify = function(token, callback){
	return jwt.verify(
		token,
		tokenSecret,
		{},
		callback
	);
};