require('dotenv').config();
const express = require("express")
const ejs = require("ejs")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const encrypt = require('mongoose-encryption');
const bcrypt = require("bcrypt");
const { log } = require('console');
const saltRound = 10;

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

// userSchema.plugin(encrypt , {
//     secret:process.env.SECRET,
//     encryptedFields: ["password"]
// });


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

app.post("/register" , async(req , res)=>{
    

    try {
        bcrypt.hash(req.body.password , saltRound , (err , hash)=>{
            newUser = new user({
                email: req.body.username,
                password: hash
            });
            try{
                newUser.save();
                res.render("secrets");
            }catch(err){
                console.log("New User Saving error"+err);
            }
        })
    } catch (err) {
        console.log("Bcrypt error:" + err);
    }    
});

app.post("/login" , async(req, res)=>{
    const userName = req.body.username;
    const password = req.body.password;

    

    try{
        await user.findOne({email:userName})
        .then((user)=>{

            try {
                bcrypt.compare(password , user.password , (err , result)=>{
                    if(result == true){
                        res.render("secrets");
                    }else{
                        console.log("Wrong Password");
                    }
                })
            } catch (err) {
                console.log("bcrypt.compare error: " + err);
            }

            // if((user.password) === password){
            //     res.render("secrets");
            // }else{
            //     console.log("Wrong Password");
            // }
        });
        
    }catch(err){
        console.log(err);
    }
})

app.listen(3000 , ()=>{
    console.log("server is running in the port 3000");
});