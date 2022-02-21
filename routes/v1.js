const express = require("express"); 
const jwt = require("jsonwebtoken"); 

const {verifyToken, deprecated} = require("./middlewares");
const {Domain,User, Post, Hashtag} = require("../models"); 

const router = express.Router(); 
router.use(deprecated); // 이제 v1으로 접근한 모든 요청들이 에러 메시지를 받는다. 

router.post("/token", async (req, res) => {
    const {clientSecret} = req.body;  
    // 클라이언트가 서버로 보내준 데이터가 req.body안에 들어있다. 
    // 도메인 등록을 한 도메인주소 비밀키이다. 
    
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

        const token = jwt.sign({ // id,nick을 속성으로 가지고 있는 토큰을 만든다. 
            id : domain.User.id,
            nick :  domain.User.nick,
        }, process.env.JWT_SECRET, {
            expiresIn : '1m',
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

router.get("/test", verifyToken, (req, res) => {
    res.json(req.decoded); 
}); 

router.get("/posts/my",verifyToken,(req,res)=>{
    console.log("v1.js, posts/my,  req.decoded : ",req.decoded);

    Post.findAll({where : {userId : req.decoded.id}})
    .then((posts)=>{
        console.log("posts : ",posts);
        res.json({
            code : 200,
            payload : posts,
        });
    }) 
    .catch((error)=>{
        console.error(error); 

        return res.status(500).json({
            code : 500,
            message : "서버 에러",
        }); 
    })
});

router.get('/posts/hashtag/:title',verifyToken,async(req,res,next)=>{ // 받은 url을 통해 데이터 베이스에 접근 
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
            message : "서버 에러",
        });
    }
}); 

module.exports = router;