const mongoose =
require("mongoose");

const courseSchema =
new mongoose.Schema({

courseName:{
type:String,
required:true
},

progress:{
type:Number,
default:0
},

timeSpent:{
type:Number,
default:0
},

notes:{
type:String,
default:""
},

topics:[{
name:{
type:String,
required:true
},
notes:{
type:String,
default:""
},
timeSpent:{
type:Number,
default:0
}
}],

targetDate:{
type:String
},

userId:{
type:String,
required:true
}

});

module.exports =
mongoose.model(
"Course",
courseSchema
);