const express = require("express");
const session = require("express-session");
const path = require("path");

const mongoose = require("mongoose");
const User = require("./Models/UserModel");
const LOCALPORT = 3000;
const homePath = "public";


const app = express();

app.set('view engine', 'pug');

app.use(logger);
app.use(session({
    secret: "spookybeans8282",
    cookie: {maxAge: 3600000},
    rolling: true
}));

const usersRouter = require("./users-router");
app.use("/users", usersRouter);

app.route('/login')
    .get(sendLoginPage)
    .post(express.json(), express.urlencoded(), postLogin);

app.route('/logout')
    .post(postLogout);

app.route('/editprofile')
    .get()
app.route('/signup')
    .get(sendSignupPage);

app.route('/search')
    .get(sendSearchPage);

app.route('/play')
    .get(sendPlayPage);

app.route('/inbox')
    .get(sendInboxPage);


app.route('/').get(sendHomePage);
app.route('/home').get(sendHomePage);

app.use(express.static(homePath, {index: "index.html"}));

function sendHomePage(req, res, next){
    res.render("home", {page: "home", session: req.session});
}

function sendLoginPage(req, res, next){
    if(req.session.loggedIn){ //send home if already logged in
        sendHomePage(req, res, next);
        return;
    }
    res.render("login", {page: "login", session: req.session});
}

function sendSignupPage(req, res, next){
    if(req.session.loggedIn){ //send home if already logged in
        sendHomePage(req, res, next);
        return;
    }
    res.render("signup", {page: "signup", session: req.session});
}

function sendSearchPage(req, res, next){
    res.render("search", {page: "search", session: req.session});
}

function sendPlayPage(req, res, next){
    res.render("play", {page: "play", session: req.session});
}

function sendInboxPage(req, res, next){
    if (!req.session.loggedIn){
        res.redirect("/login");
        return;
    }
    User.findById(req.session.userId, function(err, user){
        if (err){
            console.log(err);
            res.status(500).send("can't load logged in user");
            return;
        }

        User.populate(user, {path: 'friendRequests.incoming', select: "-password"}, function(err, userWFriends){
            if (err){
                console.log(err);
                res.status(500).send("can't load friend requests");
                return;
            }

            res.render("inbox", {page: "inbox", user: userWFriends, session: req.session});
        })
    });
}

function postLogin(req, res, next){
    if(req.session.loggedIn){
        res.status(200).send("You are already logged in!");
        return;
    }

    var username = req.body["username"];
    var password = req.body["password"];

    console.log(username + " logging in");
    console.log(req.body);

    User.findOneByName(username, function(err, result){
        if(err){
            res.status(500).send("Error loading user");
            return;
        }
        
        if(!result){
            res.status(404).send("User named " + username + "does not exist!");
            return;
        }

        if(result["password"] === password){
            req.session.loggedIn = true;
            req.session.username = username;
            req.session.userId = result.id;
            console.log(JSON.stringify(req.session));
            res.redirect("/users/" + username);
            return;
        } else {
            res.status(401).send("Incorrect password");
            return;
        }
    });
}

function postLogout(req, res, next){
    if(req.session.loggedIn){
        req.session.regenerate(function(err){
            if(err){
                console.log(err);
                res.status(500).send("Error logging out!");
                return;
            }
            sendHomePage(req, res, next);
        });
    } else {
        sendHomePage(req, res, next);
    }
}


function logger(req, res, next){
    console.log("\n");
    console.log(`Incoming ${req.method} request:`);
    console.log(req.url);
    console.log(req.path);
    console.log(`Content-Type: ${req.get("Content-Type")}`);
    next();
}




mongoose.connect('mongodb://localhost/connect4', {useNewUrlParser: true});

let db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	app.listen(LOCALPORT);
    console.log("Server started on port " + LOCALPORT);
});

