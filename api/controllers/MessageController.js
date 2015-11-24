/* global User */
/* global Message */
/**
 * MessageController
 *
 * @description :: Server-side logic for managing messages
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
module.exports = {
	index: function(req,res){
		//kinda like inbox
		var token =  req.token;		
		Message.find(undefined, function(err, messages){
			if(err) return res.json({err: err});
			var myMessages = [];
			messages.forEach(function(item, index, messages){
				if(item.to.id === token.id){
					myMessages.push(item);
				}
			});
			return res.json(myMessages);
		});
	},
	sent: function(req,res){
		//kinda like outbox
		var token =  req.token;
		Message.find(undefined, function(err, messages){
			if(err) return res.json({err: err});
			var myMessages = [];
			messages.forEach(function(item, index, messages){
				if(item.from.id === token.id){
					myMessages.push(item);
				}
			});
			return res.json(myMessages);
		})
	},
	write: function(req,res){
		var users = req.body.to;
		var token =  req.token;
		var sent = [];
		var notsent = [];
		var onAuthorFound = function(err, author, users){
			users.forEach(function(user, index, users){
				User.findOne({username: user}, function(err, addressee){
					if(addressee == undefined){
						addressee = user;
					}
					onAddresseeFound(err, author, addressee);
				});
			})
		};
		var onAddresseeFound = function(err, author, addressee){
			if(addressee != undefined && typeof(addressee) === 'object' && addressee !== null){
						Message.create({
							to: addressee,
							from: author,
							content: req.body.content
						},onMessageCreated);
					} else{
						notsent.push(addressee);
						if((sent.length + notsent.length) == users.length){
							finish({
								sent: sent,
								notsent:notsent
							});
						}						
					}
		};
		var onMessageCreated = function(err, message){
			if(message !== undefined){
				sent.push(message.to.username);
				if((sent.length + notsent.length) == users.length){
					finish({
						sent: sent,
						notsent:notsent
					});
				}
			}
		};	
		var finish = function(response){
			res.json({
				Accepted:response.sent,
				Rejected:response.notsent
			});
		};
		(function(arr){
			User.findOne({id: token.id},function(err, author){
				onAuthorFound(err,author, arr);
			});	
		}(users));
	},
	read: function(req,res){
		var token =  req.token;
		var id = req.params["id"];
		Message.findOne({id:id}, function(err, message){			
			if(err) return res.json({err: err});
			if(message !== undefined){
				if(message.from.id === token.id || message.to.id === token.id){
					return res.json(message);
				}
			};
			return res.json(401, {err: "You aren't a part of this message chain"});
		});
	}
	
};
