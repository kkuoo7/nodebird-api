const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;

const { User } = require('../models');

module.exports = () => {
  passport.use(new KakaoStrategy({
      clientID : process.env.KAKAO_ID, // 노출하면 안되므로 .env 파일에 저장 
      callbackURL : '/auth/kakao/callback', // 카카오로 부터 인증결과를 받아올 라우터 주소
      
  }, async (accessToken, refreshToken, profile, done)=>{

      console.log("In KakaoStrategy.js, kakao profile :", profile); 
      // 카카오에서 보내주는 것이므로 console.log로 확인해야함

      try {
          const exUser = await User.findOne({where : {
              snsId : profile.id, 
              provider: 'kakao'
          }}); 

          if(exUser) {
              done(null,exUser); 
          } 
          else {
              const newUser = await User.create({
                  email : profile._json && profile._json.kakao_account_email,
                  nick : profile.displayName,
                  snsId : profile.id,
                  provider : 'kakao',
              }); 
              
              done(null,newUser);
          }
          
      } catch (error) {
          console.error(error);
          done(error);
      }
  }));
}