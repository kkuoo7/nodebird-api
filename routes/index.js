const express = require("express"); 
const {v4 : uuidv4} = require("uuid"); 
const {User,Domain} = require("../models"); 
const {isLoggedin} = require("./middlewares");

const router = express.Router(); 
const URL = "http://localhost:8082/v2";

router.get("/", async (req, res, next) => {
    try { 
        const user = await User.findOne({
            where : {id : req.user && req.user.id || null}, 
            //req.user가 있으면 req.user.id 근데 그게 없으면 null
            include : {model : Domain}
        });

        console.log("routes의 index.js에서 user",user && user.Domains); 
        
        res.render("login",{
            user,
            domains : user && user.Domains,
            // user가 있으면 users.Domains
        }); 
    } catch (err) {
        console.error(err); 
        next(err);
    }
});

router.post("/domain", isLoggedin, async(req, res, next)=>{
    try {
        await Domain.create({
            UserId : req.user.id,
            host : req.body.host,
            type : req.body.type,
            clientSecret : uuidv4(), 
        }); // 여기서 도메인등록을 해서 도메인 데이터를 만든다. 
  
        res.redirect("/");
    } catch (err) {
        console.error(err);
        next(err); 
    }
});

module.exports = router; 
