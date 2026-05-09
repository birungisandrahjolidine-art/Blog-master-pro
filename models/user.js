
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose').default ||require('passport-local-mongoose');


const UserSchema = new mongoose.Schema({
  firstname: {
    type: String,
    trim: true,
  },
    lastname: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    unique:true,
    required: true
  },
  role: {
    type: String,
    trim: true,
    required:true,
    enum: ['admin','user']
  },

});
UserSchema.plugin(passportLocalMongoose,{
  usernameField:'email'
})
module.exports = mongoose.model('User', UserSchema);


