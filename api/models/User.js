/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/
var bcrypt = require('bcrypt');
module.exports = {
  schema:true,  
  attributes: {
	  username: {
		  type:'string',
		  required:true,
      unique:true
	  },
	  encryptedPassword:{
		  type:'string'		  
	  },
    toJSON: function(){
	   var obj = this.toObject();
      delete obj.encryptedPassword;
      return obj;
    }
  },
  beforeCreate: function(values, next){
    bcrypt.genSalt(10,function(err,salt){
      if(err) return next(err);
      bcrypt.hash(values.password, salt, function(err,hash){
        if(err) return next(err);
        values.encryptedPassword = hash;
        next();
      });
    });
  },
  comparePassword: function(password, user, callback){
    bcrypt.compare(password, user.encryptedPassword, function(err, match){
      if(err) callback(err);
      if(match){
        callback(null,true);        
      } else{
        callback(err);
      }
    });
  }
};