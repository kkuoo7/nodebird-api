const jwt = require("jsonwebtoken"); 
const RateLimit = require("express-rate-limit"); 

exports.verifyToken = (req, res, next) => {
 try {
     req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
     // req.headers.authorization에는 req.session.jwt가 들어가 있다. 
     // nodecat의 index.js에서 req.session.jwt에 tokenResult.data.token을 넣어두었다. 
     // token에는 id,nick,비밀키,옵션이 있다. 이 중 비밀키가 동일한 지 jwt.verify가 검증. 
     // 확인되면 req.decoded에 token을 넣어둔다. 

     return next(); 
 } catch(error) {
     
     if(error.name === 'TokenExpiredError') {
         return res.status(419).json({
             code : 419,
             message : "토큰이 만료되었습니다. -middlewares.js",
         }); 
     }

     return res.status(401).json({
         code : 401,
         message : '유효하지 않은 토큰입니다.',
     });
 } 
};

exports.apiLimiter = new RateLimit({
    windowMs : 60*1000, // 1000밀리초 * 60 = 1분 
    max : 5, // 제한 시간 안에 몇 번 호출할 수 있는 지

    handler(req, res){  // 제한 초과 시 콜백함수
        res.status(this.statusCode).json({
            code : this.statusCode, // 기본값 429 
            message : "1분에 1번만 요청할 수 있습니다.",
        }); 
    }, 
}); 

exports.premiumApiLimiter = new RateLimit({
    windowMs : 60*1000, 
    max : 1000, 

    handler(req, res){
        res.status(this.statusCode).json({
            code : this.statusCode, // 기본값 429 
            message : "1분에 1000번만 요청할 수 있습니다.",
        }); 
    }, 
}); 

exports.deprecated = (req, res) => {
    res.status(410).json({
        code : 410,
        message : '해당 라우터는 구 버전에서 운영이 제한됩니다. 새로운 버전으로 직접 교체해주세요.',
    })
}; 


exports.isLoggedin = (req,res,next)=>{
    if(req.isAuthenticated()) {
        next(); 
    } else {
        res.status(403);
        res.redirect("/");
    }
}

exports.isNotLoggedin = (req,res,next)=>{ 
    if(!req.isAuthenticated()){ // 로그인이 안되어있을 때
        next(); 
    } else {
        const message = encodeURIComponent('로그인한 상태입니다.'); 
        
        res.redirect(`?/error=${message}`);
    }
}

