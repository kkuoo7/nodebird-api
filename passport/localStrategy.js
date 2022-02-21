const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy; 
const bcrypt = require("bcrypt"); 

const {User} = require("../models"); 

module.exports = () => {
    passport.use(new LocalStrategy({
        usernameField : 'email', 
        passwordField : 'password'
    }, async (email, password, done)=>{ // LocalStrategy의 실제 전략을 수행하는 async 함수
        // 이 함수의 세 번째 매개변수인 done은 passport.authenticate의 콜백함수이다. 
        // 즉, done이 실행되면 passport.authenticate가 실행된다는 뜻!@
        
        console.log("LocalStrategy 실행");

        try {
            const exUser = await User.findOne({where: {email}}); 

            if(exUser) { // 유저가 있을 때 
                const result = await bcrypt.compare(password, exUser.password); 

                if(result) { // 입력된 번호가 비밀번호와 일치했을 때 
                    done(null, exUser); 
                } else {
                    done(null, false, {message : "비밀번호가 일치하지 않습니다"}); 
                }
            } else { // 해당 이메일을 가진 유저가 존재하지 않을 때 
                return done(null, false, {message : '가입되지 않은 회원입니다.'});
                // passport에서는 응답 대신에 done을 이용한다. 
                // done(서버에러, 성공여부, 클라이언트 에러)
            }
        } catch (error) {
            console.error(error); 
            done(error);
        }
    }));
}