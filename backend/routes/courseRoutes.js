const express =
require("express");

const router =
express.Router();

const Course =
require("../models/Course");

router.post(
"/add-course",
async(req,res)=>{

try{

const {
courseName,
progress,
timeSpent,
notes,
topics,
targetDate,
userId
}
= req.body;

const newCourse =
new Course({
courseName,
progress,
timeSpent,
notes,
topics,
targetDate,
userId
});

await newCourse.save();

res.json({
message:
"Course Added"
});

}catch(error){

console.log(error);

res.status(500).json({
message:
"Server Error"
});

}

});

router.put(
"/update-course/:courseId",
async(req,res)=>{

try{

const {
courseName,
progress,
timeSpent,
notes,
topics
} = req.body;

const updateFields = {};
if(courseName !== undefined) updateFields.courseName = courseName;
if(progress !== undefined) updateFields.progress = progress;
if(timeSpent !== undefined) updateFields.timeSpent = timeSpent;
if(notes !== undefined) updateFields.notes = notes;
if(topics !== undefined) updateFields.topics = topics;

const updatedCourse =
await Course.findByIdAndUpdate(
req.params.courseId,
updateFields,
{new:true}
);

if(!updatedCourse){
return res.status(404).json({
message:
"Course not found"
});
}

res.json({
message:
"Course Updated",
course:updatedCourse
});

}catch(error){
console.log(error);
res.status(500).json({
message:
"Server Error"
});
}

});

router.delete(
"/delete-course/:courseId",
async(req,res)=>{

try{

const deletedCourse =
await Course.findByIdAndDelete(
req.params.courseId
);

if(!deletedCourse){
return res.status(404).json({
message:
"Course not found"
});
}

res.json({
message:
"Course Deleted"
});

}catch(error){
console.log(error);
res.status(500).json({
message:
"Server Error"
});
}

});

router.post(
"/add-topic/:courseId",
async(req,res)=>{

try{

const {topicName} = req.body;

if(!topicName){
return res.status(400).json({
message:"Topic name required"
});
}

const course = await Course.findById(req.params.courseId);

if(!course){
return res.status(404).json({
message:"Course not found"
});
}

course.topics.push({
name:topicName,
notes:"",
timeSpent:0
});

await course.save();

res.json({
message:"Topic added",
course:course
});

}catch(error){
console.log(error);
res.status(500).json({
message:"Server Error"
});
}

});

router.delete(
"/delete-topic/:courseId/:topicId",
async(req,res)=>{

try{

const course = await Course.findById(req.params.courseId);

if(!course){
return res.status(404).json({
message:"Course not found"
});
}

course.topics.id(req.params.topicId).deleteOne();
await course.save();

res.json({
message:"Topic deleted"
});

}catch(error){
console.log(error);
res.status(500).json({
message:"Server Error"
});
}

});

router.put(
"/update-topic/:courseId/:topicId",
async(req,res)=>{

try{

const {notes,timeSpent} = req.body;

const course = await Course.findById(req.params.courseId);

if(!course){
return res.status(404).json({
message:"Course not found"
});
}

const topic = course.topics.id(req.params.topicId);

if(!topic){
return res.status(404).json({
message:"Topic not found"
});
}

if(notes !== undefined) topic.notes = notes;
if(timeSpent !== undefined) topic.timeSpent = timeSpent;

await course.save();

res.json({
message:"Topic updated",
course:course
});

}catch(error){
console.log(error);
res.status(500).json({
message:"Server Error"
});
}

});

router.get(
"/get-courses/:userId",
async(req,res)=>{

try{

const courses =
await Course.find({
userId:
req.params.userId
});

res.json(courses);

}catch(error){

console.log(error);
res.status(500).json({
message:"Server Error"
});

}

});

module.exports = router;

