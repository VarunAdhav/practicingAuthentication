//jshint esversion:6
const express = require("express")
const ejs = require("ejs")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const encrypt = require('mongoose-encryption');

const app = express()

app.use(express.static("public"));
app.set('view engine' , 'ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));

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

const secret = "Thisisasecret"
userSchema.plugin(encrypt , {
    secret:secret,
    encryptedFields: ["password"]
});

const user = new mongoose.model("users" , userSchema , "users");

/*---------------------------------------------------------GET REQUESTS----------------------------------------------------------*/

app.get("/" , (req , res)=>{
    res.render("home");
});

app.get("/login" , (req , res)=>{
    res.render("login");
});

app.get("/register" , (req , res)=>{
    res.render("register");
});


/*---------------------------------------------------------POST REQUESTS----------------------------------------------------------*/

app.post("/register" , (req , res)=>{
    const newUser = new user({
        email: req.body.username,
        password: req.body.password
    });

    try{
        newUser.save();
        res.render("secrets");
    }catch(err){
        console.log(err);
    }
});

app.post("/login" , async(req, res)=>{
    const userName = req.body.username;
    const password = req.body.password

    try{
        await user.findOne({email:userName})
        .then((user)=>{
            if(user.password === password){
                res.render("secrets");
            }else{
                console.log("Wrong Password");
            }
        });
    }catch(err){
        console.log(err);
    }
})

app.listen(3000 , ()=>{
    console.log("server is running in the port 3000");
});