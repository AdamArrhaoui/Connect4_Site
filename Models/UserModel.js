const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let userSchema = Schema({
    name: {
        type: String, 
        required: true,
        minlength: 5,
        maxlength: 22,
        match: /^\w+$/,
		trim: true
    },
    password: {
        type: String, 
        required: true,
        minlength: 5,
        maxlength: 22,
        match: /^\w+$/,
        trim: true
    },
    joinDate: {
        type: Date, 
        default: Date.now
    },
    pfpURL: {
        type: String, 
        default: '/Assets/default_pfp.svg'
    },
    numWins: {
        type: Number, 
        default: 0, 
        min: [0, "You can't have less than 0 wins"]
    },
    numLosses: {
        type: Number, 
        default: 0, 
        min: [0, "You can't have less than 0 losses"]
    },
    numDraws: {
        type: Number, 
        default: 0, 
        min: [0, "You can't have less than 0 draws"]
    },
    friends: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    friendRequests: {
        incoming: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }],
        outgoing:[{
            type: Schema.Types.ObjectId,
            ref: "User"
        }]
    },
    privacy: {
        // Privacy level
        // 0: Public
        // 1: Friends Only
        // 2: Private
        type: Number,
        enum: [0, 1, 2],
        default: 0,
        required: true
    }
});

userSchema.statics.findOneByName = function(name, callback){
    this.findOne()
	.where("name").regex(new RegExp("^" + name + "$", "i"))
	.exec(callback);
}

userSchema.statics.findByName = function(name, callback){
    this.find()
    .where("name").regex(new RegExp(name, "i"))
    .exec(callback);
}

userSchema.query.byName = function(name){
    return this.where({name: new RegExp(name, 'i')});
}

module.exports = mongoose.model("User", userSchema);