/* global User */
/* global Message */
/**
 * MessageController
 *
 * @description :: Server-side logic for managing messages
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
module.exports = {
	write: function(req,res){
		if (req.body === undefined || req.body.to === undefined || req.body.text === undefined){
			return res.json(400,"Invalid parameters for request");
		}
		if(typeof(req.body.to) === 'string'){
			req.body.to = [req.body.to];
		}		
		var params = {
			users : req.body.to,
			token : req.token,
			text : req.body.text,
			sent: [],
			notSent:[]
		};
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
		};
		req.file('media').upload({ maxBytes : 10000000 }, function(err, files){
			if(err){
				return res.json({err: err});
			}			 
			if(files.length > 0) {
				params.media = files[0].fd;
				if(!isValidExtension(params.media)){
					return res.json(400,{err: "Invalid file upload"});
				}
			}
			onInitialize(params);
		});
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

function isValidExtension(filename){
	var extension = filename.substr(filename.lastIndexOf('.') + 1);
	return (ValidExtension[extension.toLowerCase()] !== undefined);
}

var ValidExtension = {
	jpeg:"image/jpeg",
	jpg:"image/jpeg",
	gif:"image/gif"
}