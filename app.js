require('dotenv').config();
const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const session = require('express-session');
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose');


const app = express()

app.use(express.static("public"));
app.set('view engine' , 'ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

try {
    mongoose.connect("mongodb://0.0.0.0:27017/secrets").then(()=>{
        console.log("Connected to MongoDB");
})
} catch (error) {
    console.log(error);
}

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

// userSchema.plugin(encrypt , {
//     secret:process.env.SECRET,
//     encryptedFields: ["password"]
// });


const User = new mongoose.model("users" , userSchema , "users");

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
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