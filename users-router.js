const express = require("express");
const mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;
const User = require("./Models/UserModel");

let router = express.Router();

router.post("/", express.json(), express.urlencoded(), createUser);
router.get("/", parseQuery, loadUsersList, respondMultipleUsers);

router.get("/:userId([a-fA-F0-9]{24})", respondSingleUser);
router.post("/:userId([a-fA-F0-9]{24}/friends)", sendFriendRequest);
router.param("userId", loadUserById);

router.get("/:username(\\w+)", respondSingleUser);
router.post("/:username(\\w+)/friends", sendFriendRequest);
router.get("/:username(\\w+)/friends", respondFriends);
router.param("username", loadUserByName);


function createUser(req, res, next){
    // check if user is already logged in
    if(req.session.loggedIn){
        res.status(403).send("You are already logged in!");
        return;
    }

    let newUser = new User();
    console.log(req.body);
    try{
        newUser.name = req.body["username"];
        newUser.password = req.body["password"];
    }catch(err){
        res.status(400).send("Invalid request body");
        return;
    }
    
    User.findOneByName(newUser.name, function(err, result){
        if(err){
            console.log(err);
            res.status(500).send("Internal server error.");
            return;
        }

        if(result){
            res.status(403).send("User named " + result.name + " already exists!");
            return;
        }

        newUser.save(function(err, result){
            if(err){
                console.log(err);
                res.status(500).send("Error creating user.");
                return;
            }

            req.session.loggedIn = true;
            req.session.username = result.name;
            req.session.userId = result.id;
            res.render("profile", {page: "myProfile", user: newUser, session: req.session});

            console.log("new user created: " + result);
        });
    });
}

function sendFriendRequest(req, res, next){
    if (!req.user){
        res.status(404).send("User does not exist!");
    }
    if (!req.session.loggedIn){
        res.status(401).send("You must be logged in to send friend requests!");
        return;
    }

    // load current logged in user
    User.findById(req.session.userId, function(err, result){
        if(err){
            console.log(err);
            res.status(500).send("Error loading logged in user's data");
            return;
        }

        if(!result){
            res.status(404).send("Logged in user does not exist!");
            return;
        }
        
        let requestingUser = result;
        let receivingUser = req.user;
        // check if users are already friends
        if (requestingUser.friends.includes(receivingUser.id)){
            res.status(409).send("You are already friends with this user!");
            return;
        }

        // check if user has already sent a friend request
        if (receivingUser.friendRequests.incoming.includes(requestingUser.id)){
            res.status(409).send("You already sent this user a friend request!");
            return;
        }
        
        // if our user has a friend request from the other user, accept it
        let incomingFRindex = requestingUser.friendRequests.incoming.indexOf(receivingUser.id);
        let outgoingFRindex = receivingUser.friendRequests.outgoing.indexOf(requestingUser.id);
        if (incomingFRindex != -1){ //if incoming friend request exists 

            //remove incoming request from our requesting user
            requestingUser.friendRequests.incoming.splice(incomingFRindex, 1); 

            //remove outgoing friend request from the receiving user
            receivingUser.friendRequests.outgoing.splice(outgoingFRindex, 1);

            //add friends to both users
            requestingUser.friends.push(receivingUser.id);
            receivingUser.friends.push(requestingUser.id);
        } else {
            // if not, just send the friend request and add the request to both users
            requestingUser.friendRequests.outgoing.push(receivingUser.id);
            receivingUser.friendRequests.incoming.push(requestingUser.id);
        }

        requestingUser.save(function(err, result){
            if (err){
                console.log(err);
                return;
            }
            console.log(requestingUser.name + " has been updated!");
        });

        receivingUser.save(function(err, result){
            if (err){
                console.log(err);
                return;
            }
            console.log(receivingUser.name + " has been updated!");
        });

        res.status(200).send("friend request sent");
    });
}


function loadUserById(req, res, next, id){
    let objId;
    try{
        objId = new ObjectId(id);
    } catch(err){
        res.status(404).send("User ID " + id + " is invalid!");
        return;
    }

    User.findById(id, function(err, result){
        if(err){
            console.log(err);
            res.status(500).send("Failed to load user with id: " + id);
            return;
        }
        
        if(!result){
            res.status(404).send("User with id: " + id + " does not exist!");
            return;
        }

        req.user = result;
        next();
    });
}

function loadUserByName(req, res, next, name){
    User.findOneByName(name, function(err, result){
		if(err){
			res.status(500).send("Error loading user");
			return;
        }
        
        if(!result){
            res.status(404).send("User named " + name + "does not exist!");
            return;
        }
		req.user = result;
		next();
	});
}

function parseQuery(req, res, next){
    // max num users and default num users per page
    const MAX_USERS = 50;
    const DEFAULT_USERS = 10;

    // create and store new querystring in the request
    // Exclude the 'page' parameter, as that will be decided later.
    req.qstring = "";
    for(term in req.query){
        if(term === "page"){
            continue;
        }
        req.qstring += ("&" + term + "=" + req.query[term]);
    }

    req.query.limit = req.query.limit || DEFAULT_USERS;
    try{
        req.query.limit = Number(req.query.limit);
        if(req.query.limit > MAX_USERS){
            req.query.limit = MAX_USERS;
        } 
    } catch {
        req.query.limit = DEFAULT_USERS;
    }
    
    req.query.page = req.query.page || 1;
    try{
        req.query.page = Number(req.query.page);
        if(req.query.page < 1){
            req.query.page = 1;
        }
    } catch {
        req.query.page = 1;
    }

    next();
}

function loadUsersList(req, res, next){
    if(!req.query.name){
        next();
        return;
    }

    let startIndex = ((req.query.page-1) * req.query.limit);
    let userLimit = req.query.limit;

    let searcherId;

    if(req.session.loggedIn){
        searcherId = req.session.userId;
    } else {
        searcherId = null;
    }
    User.find()
    .lean()
    .byName(req.query.name)
    .limit(userLimit)
    .skip(startIndex)
    .select('-password')
    .exec(function(err, results){
        if(err){
            console.log(err);
            res.status(500).send("Error finding users");
            return;
        }
        console.log("Num Search Results: " + results.length);
        console.log("Search Query: " + JSON.stringify(req.query));
        res.users = results;
        next();
    });
}

function sendSearchPage(req, res, next){
    // if there is no search query, don't pass results into template
    if (!req.query.name){
        res.render("search", {
            page: "search",
            searchTerm: "",
            session: req.session
        });
        return;
    }
    // create the next and previous page URLs
    let nextURL;
    let prevURL;
    //if current page number is greater than 1, there is a previous page
    if (req.query.page > 1){
        prevURL = "/users?page=" + (req.query.page - 1) + req.qstring;
    }
    //if the number of results is equal to the limit, this is not the last page
    if (res.users.length === req.query.limit){ 
        nextURL = "/users?page=" + (req.query.page + 1) + req.qstring;
    }
    res.format
    res.render("search", {
        page: "search", 
        userList: res.users,
        searchTerm: req.query.name,
        nextURL,
        prevURL, 
        session: req.session
    });
}

function respondMultipleUsers(req, res, next){
    res.format({
        "application/json": function(){
            if(!req.users){
                res.status(400).send("No query given");
                return;
            }
            res.status(200).json(req.users);
        },
        "text/html": function(){
            sendSearchPage(req, res, next);
        },
        default: function(){
            res.status(406).send('Not Acceptable');
        }
    });
}

function respondSingleUser(req, res, next){
    if(!req.user){
        res.status(404).send("User does not exist!");
        return;
    }

    
    console.log("Get request for user named " + req.user["name"] + " has been received!");

    res.format({
        "application/json": function(){
            if (hasViewPerms(req.user, req.session.userId)){
                res.status(200).json(req.user);
            } else {
                res.status(403).send("You don't have permission to view that user");
            }
        },
        "text/html": function(){
            if(req.user.id === req.session.userId){
                res.render("profile", {page: "myProfile", user : req.user, session : req.session});
            } else if (hasViewPerms(req.user, req.session.userId)) {
                res.render("profile", {page: "search", user : req.user, session : req.session});
            } else {
                res.status(403).send("You don't have permission to view that user");
            }
        }
    });
}
// TODO
function respondFriends(req, res, next){
    if(!req.user){
        res.status(404).send("User does not exist!");
        return;
    }

    User.populate(req.user, {path: 'friends', select: "-password"}, function(err, user){
        if (err){
            console.log(err);
            res.status(500).send("Error populating users");
            return;
        }

        res.format({
            "application/json": function(){
                if (hasViewPerms(req.user, req.session.userId)){
                    res.status(200).json(user.friends);
                } else {
                    res.status(403).send("You don't have permission to view that user");
                }
            },
            "text/html": function(){
                if(req.user.id === req.session.userId){
                    res.render("friends", {page: "myProfile", user, session : req.session});
                } else if (hasViewPerms(req.user, req.session.userId)) {
                    res.render("friends", {page: "search", user, session : req.session});
                } else {
                    res.status(403).send("You don't have permission to view that user's friends!");
                }
            }
        });
    });
}

function hasViewPerms(user, viewerId){
    if (user.id === viewerId){
        return true;
    }

    if (user.privacy === 0){
        return true;
    } else if (user.privacy === 1){
        return (user.friends.includes(viewerId));
    } else {
        return false;
    }
}

module.exports = router;