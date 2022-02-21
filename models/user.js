const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      email: {
        type: Sequelize.STRING(40),
        allowNull: true,
        unique: true,
      },
      nick: {
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      provider: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'local',
      },
      snsId: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'User',
      tableName: 'users',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.User.hasMany(db.Post); // user.addposts 

    db.User.belongsToMany(db.User, { 
        foreignKey : 'followingId', // User와 User 간의 관계는 Follow 테이블에서 
        // Id 구별이 불가능하다. (UserId 와 UserId 로 나오기 때문)
        // 따라서 foreignKey를 설정하여 Follow 테이블에서 Id 구별이 가능하게 한다. 

        as : 'Followers',  // user.addFollowers
        // user.removeFollowers를 sequelize에서 자동으로 만들어준다. 
        through : "Follow",
    }); 

    db.User.belongsToMany(db.User, { 
        foreignKey : 'followerId',
        as : 'Followings',
        through : 'Follow'
    }); 

    
    db.User.belongsToMany(db.Post, {  // User와 Post간의 관계는 USerId , PostId로 
        // Like 테이블 내에서 구별이 가능하기 때문에 foriegnKey 항을 추가할 필요가 없다. 
        through: 'Like'
    })

    db.User.hasMany(db.Domain)

}
};