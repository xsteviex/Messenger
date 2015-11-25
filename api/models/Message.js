/**
* Message.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    to:{
      model: 'User'
    },
    from:{
      model: 'User'
    },
    text:{
      type:'string'
    },
    media:{
      type:'string'
    },
    toJSON: function(){
	   var obj = this.toObject();
     if(obj.media !== ''){
       obj.media = 'attachment'
     }
      return obj;
    }
  }
};

