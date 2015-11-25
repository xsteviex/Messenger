/* global User */
/* global Message */
/**
 * MessageController
 *
 * @description :: Server-side logic for managing messages
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
module.exports = {
/*	index: function(req,res){
		//kinda like inbox
		var token =  req.token;		
		Message.find(undefined, function(err, messages){
			if(err) return res.json({err: err});
			var myMessages = [];
			messages.forEach(function(item, index, messages){
				if(item.to === token.id){
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
				if(item.from === token.id){
					myMessages.push(item);
				}
			});
			return res.json(myMessages);
		})
	},*/
	write: function(req,res){
		var params = {			
			users : req.body.to,
			token : req.token,
			text : req.body.text,
			sent: [],
			notSent:[]
		};
		req.file('media').upload({ maxBytes : 10000000 }, function(err, media){
			if(err){
				return res.json({err: err});
			} if(media.length > 0) {
				params.media = media[0].fd;
			}
			onInitialize(params);
		});
		var onInitialize = function(params){
			User.findOne({id: params.token.id},function(err, author){
				if(author === undefined){
					return res.json({err: 'Invalid Login, please login again'});
				}	
				params.author = author;			
				onAuthorFound(err,params);
			});	
		};
		var onAuthorFound = function(err, params){
			params.users.forEach(function(user, index, users){
				User.findOne({username: user}, function(err, addressee){
					if(addressee == undefined){
						params.notSent.push(user);
						isFinished();
					} else {
						params.addressee = addressee;
						onAddresseeFound(err, params);	
					}								
				});				
			})
		};
		var onAddresseeFound = function(err, params){
			if(params.addressee != undefined && typeof(params.addressee) === 'object' && params.addressee !== null){
				Message.create({
					to: params.addressee,
					from: params.author,
					text: params.text,
					media: params.media || ''
				},function(err, message){
					
					params.message = message;
					onMessageCreated(err, params);
				});
			} else{
				params.notSent.push(params.addressee);
				isFinished(params);
			}
		};
		var onMessageCreated = function(err, params){
			if(params.message !== undefined){
				params.sent.push(params.addressee.username);
				isFinished(params);
			} else{
				params.notSent.push(params.addressee.username);
				isFinished(params);
			}
		};
		var isFinished = function(parmas){
			if((params.sent.length + params.notSent.length) == params.users.length){
				if(params.notSent.length > 0){
					res.json({
						result: "Problems occured with the following recipients: " + params.notSent.join()
					})
				} else {
					res.json(201,{
						result: "All messages were sent!"
					})
				}
			}
		}
	},
	read: function(req,res){
		var token =  req.token;
		var id = req.params["id"];
		var filter = {
			
		}
		if(id !== undefined){
			filter.id = id;
		}
		Message.find(filter, function(err, messages){			
			if(err) return res.json({err: err});
			var myMessages = [];
			messages.forEach(function(item, index, messages){
				if(item.from === token.id || item.to === token.id){
					myMessages.push(item);
				}
			});
			return res.json(myMessages);			
		});
	},
	download: function(req,res){		
		var token =  req.token;
		var id = req.params["id"];
		Message.findOne({id:id}, function(err, message){			
			if(err) return res.json({err: err});
			if(message !== undefined){
				if(message.from === token.id || message.to === token.id){
					if(message.media !== ''){
						var file = message.media;
						var rdr = require('skipper-disk');
						var fileHandle = rdr();
						fileHandle.read(file).on('error', function(err){
							return res.json({err: err});
						}).pipe(res.attachment(file + '.jpeg'));
					} else{
						return res.json(400, {err: "There wasn't an attachment associated with this message"})
					}
				}else{
					return res.json(401, {err: "You aren't a part of this message chain"});			
				}
			} else{
				//Message not found
				return res.json(401, {err: "You aren't a part of this message chain"});
			}		
		});
	}
};