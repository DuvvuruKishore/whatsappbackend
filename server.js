import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import Messages from './dbMessages.js';
import Pusher from 'pusher';



//api config
const app=express();
const port=process.env.PORT||5000;

//middleware
app.use(express.json());
app.use(cors());

const pusher = new Pusher({
  appId: "1197235",
  key: "edf71b2b26eb56bcabcb",
  secret: "cffacdb0bd01789eed71",
  cluster: "ap2",
  useTLS: true
});

/*app.use((req, res, next) => {
    res.setheader("Access-Control-Allow-Origin", "*");
    res.setheader("Access-Control-Allow-Headers", "*");
    next();
  });*/

//Db config
mongoose.connect(process.env.MONGO_URI,{
    useCreateIndex:true,
    useFindAndModify:true,
    useNewUrlParser:true,
    useUnifiedTopology:true,
})

const db=mongoose.connection;

db.once("open",()=>{
    console.log("db connected");

const msgCollection=db.collection('messagecontents');
const changeStream=msgCollection.watch();

changeStream.on("change",(change)=>{
    console.log("a change occured",change);

    if(change.operationType==="insert"){
        const messageDetails=change.fullDocument;
        pusher.trigger("messages","inserted",{
            name:messageDetails.name,
            message:messageDetails.message,
            timestamp:messageDetails.timestamp,
            received:messageDetails.received,
        });
    }else{
        console.log("error pusher");
    }

});
});

//api endpoint
app.get('/',(req,res)=>{
    res.status(200).send("hello world");
})

app.get('/messages/sync',(req,res)=>{
    Messages.find((err,data)=>{
        if(err){
            res.status(500).send(err);
        }else{
            res.status(200).send(data);
        }
    })
})

app.post('/messages/new',(req,res)=>{
    const dbMessage=req.body;
   Messages.create(dbMessage,(err,data)=>{
       if(err){
           res.status(500).send(err);
       }else{
           res.status(201).send(data);
       }
   })
})



app.listen(port,()=>console.log(`running on port ${port}`));