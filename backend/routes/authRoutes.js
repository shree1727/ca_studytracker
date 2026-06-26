const express = require("express");
const router = express.Router();

const bcrypt =
require("bcryptjs");

const User =
require("../models/User");

router.post(
"/register",
async(req,res)=>{

try{

const {name,email,password}
= req.body;

const existingUser =
await User.findOne({email});

if(existingUser){
return res.json({
message:"Email already exists"
});
}

const hashedPassword =
await bcrypt.hash(
password,
10
);

const newUser =
new User({
name,
email,
password:hashedPassword
});

await newUser.save();

res.json({
message:
"Registration Successful"
});

}catch(error){

console.log(error);

res.status(500).json({
message:"Server Error"
});

}

});

router.post(
"/login",
async(req,res)=>{

try{

const {email,password}
= req.body;

const user =
await User.findOne({
email
});

if(!user){
return res.json({
message:"User not found"
});
}

const isMatch =
await bcrypt.compare(
password,
user.password
);

if(!isMatch){
return res.json({
message:"Invalid Password"
});
}

res.json({
message:"Login Successful",
user
});

}catch(error){

console.log(error);

res.status(500).json({
message:"Server Error"
});

}

});

module.exports = router;