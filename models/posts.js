var marked = require('marked');
var Post = require('../lib/mongo').Post; //db的一个实例，下面有很多的方法

var CommentModel = require('./comments');  //  评论数据库的方法

// 给 post 添加留言数 commentsCount
Post.plugin('addCommentsCount', {
  afterFind: function (posts) {
    return Promise.all(posts.map(function (post) {
      return CommentModel.getCommentsCount(post._id).then(function (commentsCount) {
        post.commentsCount = commentsCount;
        return post;
      });
    }));
  },
  afterFindOne: function (post) {
    if (post) {
      return CommentModel.getCommentsCount(post._id).then(function (count) {
        post.commentsCount = count;
        return post;
      });
    }
    return post;
  }
});

// 将 post 的 content 从 markdown 转换成 html
Post.plugin('contentToHtml', {
  afterFind: function (posts) {
    return posts.map(function (post) {
      post.content = marked(post.content);
      return post;
    });
  },
  afterFindOne: function (post) {
    if (post) {
      post.content = marked(post.content);
    }
    return post;
  }
});



// 上面两个方法Post.plugin都是给db实例增加方法






module.exports = {
  // 创建一篇文章
  create: function create(post) {
    return Post.create(post).exec();//结束，传递给下一个函数作为参数
  },

  // 通过文章 id 获取一篇文章
  getPostById: function getPostById(postId) {
    return Post
      .findOne({ _id: postId })
      .populate({ path: 'author', model: 'User' })
      .addCreatedAt()
      .addCommentsCount()
      .contentToHtml()
      .exec();//结束，传递给下一个函数作为参数
  },

  // 按创建时间降序获取所有用户文章或者某个特定用户的所有文章
  getPosts: function getPosts(author) {
    var query = {};
    if (author) {
      query.author = author;  //也可以根据用户名去选择该用户的所有文章进行降序排列
    }
    return Post
      .find(query)
      .populate({ path: 'author', model: 'User' })
      .sort({ _id: -1 }) //排序
      .addCreatedAt() //增加时间戳
      .addCommentsCount() //增加评论属
      .contentToHtml() //内容从markdown转化为html
      .exec(); //结束，传递给下一个函数作为参数
  },

  // 通过文章 id 给 pv 加 1
  incPv: function incPv(postId) {
    return Post
      .update({ _id: postId }, { $inc: { pv: 1 } })
      .exec();
  },

  // 通过文章 id 获取一篇原生文章（编辑文章）
  getRawPostById: function getRawPostById(postId) {
    return Post
      .findOne({ _id: postId })
      .populate({ path: 'author', model: 'User' })
      .exec();
  },

  // 通过用户 id 和文章 id 更新一篇文章
  updatePostById: function updatePostById(postId, author, data) {
    return Post.update({ author: author, _id: postId }, { $set: data }).exec();
  },

  // 通过用户 id 和文章 id 删除一篇文章
  delPostById: function delPostById(postId, author) {
    return Post.remove({ author: author, _id: postId })
      .exec()
      .then(function (res) {
        // 文章删除后，再删除该文章下的所有留言
        if (res.result.ok && res.result.n > 0) {
          return CommentModel.delCommentsByPostId(postId);
        }
      });
  }
};
