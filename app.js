//jshint esversion:6
// require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");



const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));


app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose) ;

// userSchema.plugin(encrypt, {secret: process.env.SECRET , encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const secretSchema = new mongoose.Schema({
    secret: String,
});

const Secret = new mongoose.model("Scret", secretSchema);



app.get("/", function (req, res){

    res.render("home");

});
app.get("/login", function (req, res){

    res.render("login");

});
app.get("/register", function (req, res){

    res.render("register");

});

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        Secret.find({}, function(err, foundSecrets){
            if(err){
                console.log(err);
            }else{
                res.render("secrets",{secrets: foundSecrets});
            }
        });
    } else{
        res.redirect("/login");
    }
});

app.get("/submit", function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    } else{
        res.redirect("/login");
    }
});

app.post("/submit", function(req,res){
    
    const newSecret = req.body.secret;
    console.log(newSecret.length);
    if(newSecret.length != 0){
        const userSecret = new Secret({
            secret: newSecret
        });
        userSecret.save();}

    res.redirect("/secrets");
});


app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){

        if(err){
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
            });
        }

    });






    // bcrypt.hash(req.body.password, saltRounds, function(err, hash){                  
    //         const newUser = new User({
    //             email: req.body.username,
    //             password: hash
    //         }); 

    //         newUser.save(function(err){
    //             if(err){
    //                 console.log(err);
    //             }else{
    //                 res.render("secrets");
    //             }
        
    //         });
        
        
    // });  
});

app.post("/login", function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if(err){
           console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
                });

        }
    });
    // const userName = req.body.username;
    // const userPassword = req.body.password;
    // User.findOne({ email: userName}, function (err, foundUser) {
    //     if(err){
    //         console.log(err);
    //     }else if(foundUser){
    //         bcrypt.compare(userPassword, foundUser.password, function(err, result){                  
    //             if(result === true){
    //                 res.render("secrets");
    //             }else{
    //                 res.send("Worng user name or password");
    //             }
    //         });
    //     }else {
    //         res.send("Worng user name or password");
    //     }  
    // });
});



app.get("/logout", function(req,res){
    req.logout();
    res.render("home");
})



app.listen(3000, function(){
    console.log("Server started on port 3000.");

});
