// v2는 version2의 축약형으로 apiLimiter를 만들어서 사용자마다 요청횟수를 다르게 하였다.

const express = require("express"); 
const jwt = require("jsonwebtoken"); 
const cors = require("cors"); 
const url = require("url");

const {verifyToken, apiLimiter, premiumApiLimiter} = require("./middlewares");
const {Domain,User, Post, Hashtag} = require("../models"); 

const router = express.Router(); 

router.use(async(req, res, next) => {

    const domain  = await Domain.findOne({
        //req.get("origin") => 다른 도메인의 클라이언트가 보내준 요청의 origin(http포함 주소)
        where : {host : url.parse(req.get('origin')).host},
        // url.parse()는 http와 https 프로토콜을 떼주는 메소드 
    }); 

    console.log("req.origin :", req.get('origin'));

    if(domain) { // 일치하는 도메인이 있으면 cors를 허용한다. 
        cors({
            origin: req.get("origin"), // 허용할 도메인의 주소 
            credentials: true, // 다른 도메인 간의 쿠키 공유를 허용한다. 
        })(req, res, next); // 사용자 정의 미들웨어 사용하는 방법(미들웨어 확장)
    } else {
        next(); 
    }
}); 

router.use(async (req, res, next) => {
    
    try {
        const domain = await Domain.findOne({
            where : {host : url.parse(req.get('origin')).host},
        }); 
    
        if(domain.type === "premium"){ // 요청한 domain 타입에 따라 사용량을 다르게 두자. 
            premiumApiLimiter(req, res, next); 
            // 사용자 정의 미들웨어를 사용하는 방법
        } else {
            apiLimiter(req, res, next); 
        }
    } 
    catch (err) {
        console.error(err);
        next(err);
    }
    
    
});

router.post("/token", async (req, res)=> { // 토큰을 생성하는 라우터 

    const {clientSecret} = req.body;  // nodecat(nodebird의 2차 서비스) 서버에서 호출한 post 요청에  
    // 도메인 등록을 한 도메인주소 비밀키가 들어있다. 
    console.log(clientSecret)

    try {
        const domain = await Domain.findOne({ // index.js,localhost:8082/domain 주소에서 만든 도메인 데이터를 조회한다. 
            where : {clientSecret},
            include : {
                model : User,
                attributes : ['nick','id'],
            }
        });
        
        if(!domain) {
            return res.status(401).json({
                code : 401, 
                message : "등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요",
            }); 
        }


        // id, 닉네임, 비밀번호 , 옵션이 들어간 token을 생성한다. 
        const token = jwt.sign({ // id,nick을 속성으로 가지고 있는 토큰을 만든다. 
            id : domain.User.id, // 
            nick :  domain.User.nick,
        }, process.env.JWT_SECRET, {
            expiresIn : '30m',
            issuer : 'nodebird'
        });

        return res.json({
            code : 200,
            message : "토큰이 발급되었습니다.",
            token, // res.json() 으로 토큰을 넘겨준다.
            // 이러면 req.data을 이용하여 json 파일에 접근이 가능하다. 
        }); 
    
    } catch (error) {
        console.error(error); 
        next(error); 
    }
}); 

router.get("/test", verifyToken, (req,res)=> {
    res.json(req.decoded); 
}); 


// nodecat(nodebird의 2차서비스)의 서버에서 호출한 get요청 => 사용자가 쓴 게시글을 보내줘야함
router.get("/posts/my", verifyToken, (req, res) => { 
    console.log("v3.js, posts/my,  req.decoded : ",req.decoded);
    
    // verifyToken 미들웨어에서 req.decoded 생성 
    Post.findAll({where : {userId : req.decoded.id}})
    .then((posts)=>{
        res.json({
            code : 200,
            payload : posts,
        });
    }) 
    .catch((error)=>{
        console.error(error); 

        return res.status(500).json({
            code : 500,
            message : "데이터 베이스 연동과정 실패"
        }); 
    })
});

// 해쉬태그가 담긴 게시글을 응답하는 라우터
router.get('/posts/hashtag/:title', verifyToken, async(req, res, next) => { // 받은 url을 통해 데이터 베이스에 접근 
    // 데이터베이스를 res.json()으로 반환해준다. 
    console.log("title :",decodeURIComponent(req.params.title));

    try {
        const hashtag = await Hashtag.findOne({where : {title : req.params.title}}); 
        if(!hashtag){
            return res.status(404).json({
                code : 404,
                message : "검색 결과가 없습니다.",
            }); 
        }

        const posts = await hashtag.getPosts(); 
        
        return res.json({
            code : 200,
            paylaod : posts,
        });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({
            code : 500,
            message : "데이터 베이스 연동과정 실패"
        });
    }
}); 

// follower, following 데이터 불러오기 
router.get("/follow", verifyToken, async(req, res)=>{
    //console.log("IN v2, req.session.jwt.id :",req.session.jwt.id); 
    console.log("IN v2, req.decoded.id :",req.decoded.id );

    try{
        const user = await User.findOne({
            where : {id : req.decoded.id}
        })

        const follower = await user.getFollowers({attributes : ['id','nick']}); 
        // 사용자 정보에 follower 까지 같이 조회 

        const following = await user.getFollowings({attributes : ['id','nick']}); 

        // const following = await User.findOne( {
        //     where : {id : req.decoded.id}, 
        //     attributes : ['id', 'nick'],
        //     include : [
        //         {
        //             model : User,
        //             attributes:['id', 'nick'],
        //             as: 'Followings',
        //         }
        //     ]
        // });

        return res.json({
            code : 200,
            follower,
            following,
        }); 
        // 걍 화면에 보여주는 역활 
    } catch (error){
        console.error(error); 

        res.status(500).json({
            code : 500, 
            message : "데이터 베이스 연동과정 실패"
        })
    }
})

module.exports = router;