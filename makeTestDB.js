const mongoose = require("mongoose");
const sampleData = require('./MOCK_DATA.json');

const ObjectId = mongoose.Types.ObjectId;
const User = require("./Models/UserModel");

mongoose.connect('mongodb://localhost/connect4_test', {useNewUrlParser: true});

let db = mongoose.connection;


db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("Loading sample data: ");
    
    for(sampleUser of sampleData){
        let newUser = new User();
        newUser.name = sampleUser["name"];
        newUser.password = sampleUser["password"];
        newUser.save(function(err, result){
            if(err){
                console.log(err);
            }
        });
    }
});
