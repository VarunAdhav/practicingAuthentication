require('dotenv').config();
const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const session = require('express-session');
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");


const app = express()

app.use(express.static("public"));
app.set('view engine' , 'ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));

/*---------------------------------------------------------SESSIONS AND COOKIES-------------------------------------------------------*/
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
/*---------------------------------------------------------SESSIONS AND COOKIES----------------------------------------------------------*/

try {
    mongoose.connect("mongodb://0.0.0.0:27017/secrets").then(()=>{
        console.log("Connected to MongoDB");
})
} catch (error) {
    console.log(error);
}

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt , {
//     secret:process.env.SECRET,
//     encryptedFields: ["password"]
// });


const User = new mongoose.model("users" , userSchema , "users");

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


/*---------------------------------------------------------GET REQUESTS----------------------------------------------------------*/

app.get("/" , (req , res)=>{
    res.redirect("/home");
});

app.get("/home" , (req , res)=>{
    res.render("home");
});

app.get("/login" , (req , res)=>{
    res.render("login");
});

app.get("/register" , (req , res)=>{
    res.render("register");
});

app.get("/secrets" , (req , res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login")
    }
});

app.get("/logout" , (req , res)=>{
    req.logOut((err)=>{
        if(err){
            console.log(err);
        }else{
            res.redirect("/home");
        }
    });
    // res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"]})
);

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),(req, res)=>{
    res.redirect('/secrets');
  });

/*---------------------------------------------------------POST REQUESTS----------------------------------------------------------*/

app.post("/register" , async(req , res)=>{
    User.register({username: req.body.username} , req.body.password , (err , user)=>{
        if(err){
            console.log("Error in Register" , err);
            res.redirect('/register')
        }else{
            passport.authenticate("local")(req , res , ()=>{
                console.log(user);
                res.redirect("/secrets")
            });
        }
    })
});

app.post("/login" , async(req, res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user , (err)=>{
        if(err){
            console.log("Login Post err: ");
        }else{
            try {
                passport.authenticate("local")(req , res , ()=>{
                    res.redirect("/secrets")
                });
            } catch (error) {
                console.log(error);
            }
        }
    })
});

app.listen(3000 , ()=>{
    console.log("server is running in the port 3000");
});