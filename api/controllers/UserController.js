/* global jwToken */
/* global User */
/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	register: function(req,res){
		if(!req.body || req.body.username || req.body.password){
			return res.json(401, {err: 'username and password required'});
		}
		var username = req.body.username.trim();
		var password = req.body.password;
		
		User.findOne({username: username}, function(err,user){
			if(user != undefined){
				return res.json(403, {err: 'username already exists'});				
			}
			User.create({
				username: username,
				password: password
			}).exec(function(err,user){
				if(err){
					return res.json(err.status, {err:err});
				}
				if(user){
					res.json(200, {user: user, token: jwToken.issue({id:user.id})})
				}
			});			
		});
	},
	login: function(req,res){
		if(!req.body || req.body.username || req.body.password){
			return res.json(401, {err: 'username and password required'});
		}
		var username = req.body.username.trim();
		var password = req.body.password;
		User.findOne({username: username}, function(err,user){
			if(err){
				return res.json(403, {err: 'forbidden'});
			}
			if(user == undefined){
				return res.json(401, 'invalid username or password');
			}
			User.comparePassword(password, user, function(err, valid){
				if(!valid){
					return res.json(401, {err: 'invalid username or password'});
				} else {
					res.json({
						user: user,
						token: jwToken.issue({id : user.id})
					});
				}
			});
		});
	},
};
