const express= require("express");

const passport= require("passport");
const bcrypt = require("bcrypt");
const {isLoggedin, isNotLoggedin} = require("./middlewares");

const User = require("../models/user");

const router = express.Router(); 

// 회원가입
router.post('/join',isNotLoggedin, async (req,res,next) => {
    
    const {email,nick,password} = req.body; 

    try {
        const exUser = await User.findOne({where : {email}}); // 공식문서보고 findOne이 
        // 비동기인지 아닌지 체크해서 await을 앞에 붙이는 것이다. 

        // 회원가입한 유저가 이미 존재할 때 
        if(exUser) { 
            return res.redirect('/join?error=exist'); // 1 요청 1 응답 이기에 
            // return을 빼먹으면 안된다. 

            // return res.status(403).send('이미 사용중인 아이디입니다.')
        }
        
        // 신규 가입을 할 때 비밀번호 해쉬화
        const hash = await bcrypt.hash(password,12);

        // 테이블에 새로운 데이터를 만든다. 
        // email : email 하면 번거로우니까 그냥 한번 만 쓰는 것이다.   
        await User.create({
            email,
            nick,
            password : hash,
        }); 

        return res.redirect('/'); // 서버가 클라이언트를 기본url로 변경한다. 
    } catch (error) {
        console.error(error);
        return next(error);
    }
}); 

// 로그인 기능
router.post("/login", isNotLoggedin, (req, res, next) => { // 미들웨어 확장법 

    passport.authenticate('local', (authError, user, info) => { 
        console.log("auth/login 라우터에서 passport.authenticate 실행");

        // 'local' 을 통해 localStartegy 실행. 
        // 거기서 done을 반환하면 passport.authenticate의 콜백함수 실행 

        if(authError) {
            console.error(authError); 
            return next(authError);  // 미들웨어 확장 (req, res, next) => { }
            // 을 안하면 next(authError)을 쓸 수가 없다. 
            // 그래서 passport.authenticate 시 미들웨어 확장이 필수적이다. 
        }

        if(!user) {
            return res.redirect(`/?loginError=${info.message}`); 
        }

        // req.login은 passport login 이다. passport login 이 실행되면 
        // **** passport.serializeUser(callback)이 실행된다. 
        return req.login(user, async (loginError) => {
            
            if(loginError){ // 사실 여기서 에러는 날 일이 거의 없다. 
                console.error(loginError);
                return next(loginError);
            } 

            // 로그인 에러가 없으면 
            return res.redirect('/');

            // return res.status(200).json(user); 
            // 사용자 정보를 프론트에 넘겨주는 코드 

        });

    })(req, res, next); // 미들웨어 확장 즉시실행함수 
});

router.get("/logout",isLoggedin,(req,res)=>{
    req.logout(); 
    req.session.destroy(); // 세션에 저장된 쿠키와 사용자 id 제거 

    res.redirect("/");
})



router.get("/kakao", passport.authenticate('kakao')); // auth/kakao 에서 로그인 전략 수행 

router.get('/kakao/callback', passport.authenticate('kakao', { 
    // auth/kakao 에서 했던 전략의 성공여부를 ./callback 으로 받는다.
    failureRedirect : "/", // 실패시 어느 주소로 redirect 할 지

}), (req, res) => {
    res.redirect("/");
});

module.exports = router;