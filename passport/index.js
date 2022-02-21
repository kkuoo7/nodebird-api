const passport = require("passport");

const local = require('./localStrategy');
const kakao = require("./kakaoStrategy"); 

const {User}  = require("../models/index.js"); 

module.exports = () => {
    passport.serializeUser((user,done)=>{ // req.session에 아이디를 저장할 수 있게 해준다. 
        done(null,user.id); // user.id는 deserializeUser의 매개변수가 된다. 
    }); 

    passport.deserializeUser((id,done)=>{
        User.findOne({
            where : {id}, 

            include : [{
                model : User,
                attributes : ['id','nick'],
                as : "Followers",
            }, {
                model : User,
                attributes : ['id','nick'],
                as : "Followings"
            }]
        })
            .then((user)=>{done(null,user)}) // done(user)를 req.user 객체에 저장
            .catch((err=>done(err))); 
    });

    local(); 
    kakao();
}