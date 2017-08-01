
# 文件夹的用途
* models: 存放操作数据库的文件
* public: 存放静态文件，如样式、图片等
* routes: 存放路由文件
* views: 存放模板文件
* index.js: 程序主文件
* package.json: 存储项目名、描述、作者、依赖等等信息
* middlewares:权限管理的文件



# 包的用途
* express: web 框架
* express-session: session 中间件
* connect-mongo: 将 session 存储于 mongodb，结合 express-session 使用
* connect-flash: 页面通知提示的中间件，基于 session 实现
* ejs: 模板
* express-formidable: 接收表单及文件的上传中间件
* config-lite: 读取配置文件
* marked: markdown 解析
* moment: 时间格式化
* mongolass: mongodb 驱动
* objectid-to-timestamp: 根据 ObjectId 生成时间戳
* sha1: sha1 加密，用于密码加密
* winston: 日志
* express-winston: 基于 winston 的用于 express 的日志中间件
* logs:存放日志的位置





# 功能与设计
> 接口的请求是restful的设计风格

#会话
> 1、由于 HTTP 协议是无状态的协议，所以服务端需要记录用户的状态时，就需要用某种机制来识具体的用户，这个机制就是会话（Session）;
  2、最终通过的express-session这个中间件来实现，原理：session 中间件会在 req 上添加 session 对象，即 req.session 初始值为 {}，当我们登录后设置 req.session.user = 用户信息，返回浏览器的头信息中会带上 set-cookie 将 session id 写到浏览器 cookie 中，那么该用户下次请求时，通过带上来的 cookie 中的 session id 我们就可以查找到该用户，并将用户信息保存到 req.session.user。

# 页面的通知
> 通过connect-flash中间件来实现，它是基于session实现的，它的原理很简单：设置初始值 req.session.flash={}，通过 req.flash(name, value) 设置这个对象下的字段和值，通过 req.flash(name) 获取这个对象下的值，同时删除这个字段。






#模版中存在的变量
<pre>
header.ejs    		blog.title  
components:
	nav.ejs       		blog.title  blog.description
	nav-setting.ejs 	user._id(href="/posts?author=<%= user._id %>")
	notification.ejs 	success   error
	components.ejs 		comments(arr)   foreach(  comment {comment.author.avatar/_id/name, comment.created_at, comment.content})

	post-content.ejs    post(帖子)以及相关的_id/created_at
</pre>



# 运行

## 根据路由先进入posts,帖子的首页

请求回来的数据例子：
通过models(请求数据库的方法，getPosts)从数据库获取回来的数据如下(arr)：
*  1、数据库的字段都可以参考lib下的mongo.js文件
<pre>
arr = [{  _id: 5976e7e3d1fb521b10206879,
    author: 
            { _id: 5976b2e73f04590a9eb0fb42,
               name: 'jeremy',
               password: '7c222fb2927d828af22f592134e8932480637c0d',
               gender: 'x',
               bio: '1111',
               avatar: 'upload_0f7235b65aa52a5dfeaa970658d95218.jpg' 
            },
    title: '第三篇文章',
    content: '<p>你猜我猜你猜不猜啊啊－－－－－</p>\n',
    pv: 6,
    created_at: '2017-07-25 14:40',
    commentsCount: 2 
}, {   _id: 5976bbe53f04590a9eb0fb47,
    author: 
            { _id: 5976b2e73f04590a9eb0fb42,
               name: 'jeremy',
               password: '7c222fb2927d828af22f592134e8932480637c0d',
               gender: 'x',
               bio: '1111',
               avatar: 'upload_0f7235b65aa52a5dfeaa970658d95218.jpg' 
            },
    title: 'sec',
    content: '<p>这个是第二部片文章，不知道写什么，反正也是测试!!!!!</p>\n',
    pv: 4,
    created_at: '2017-07-25 11:32',
    commentsCount: 0 
}]
</pre>

* 2、渲染posts模版 <br />
	变量blog，生成好的
	req中的变量还没有，

* 3、查看帖子的详情，一个a连接(routes -> posts.js  /:postsid) 都是根据id查找到内容的数据，评论的数据，最后浏览加1

* 4、查看某个人的所有的帖子，在帖子详情的留言板块中点击人名字，跳转的路径，posts?author = _id,根据id查回所有符合id的数据







## 注册
> 渲染模版signup
填写表格，在请求的时候校验（routes/signuo.js）,用户信息写入数据库，调用creat方法，创建成功后，将信息存入session（req.session.user = user;）然后flash，跳转到posts首页（首页会检测session的信息，模版的渲染中会有是否有user，从而渲染不同的下拉菜单）;
博客详情也会根据是否有user来渲染评论框
跟帖子有的的删除，留言等都在posts路由上


## 登录
> 渲染模版signin
填写数据，同时检测数据，post请求,如果请求成功，则将信息写入session，并且删除密码，flash信息，跳转到posts

## 登出
> 请求接口get
清除req.session.user = null;
flash退出成功消息
跳转到posts首页

## 发表文章
> 渲染模版create
post提交，并检验数据，数据库创建数据，flash信息，跳转posts+_id页面

## 编辑文章
> 首页跳转路由，然后渲染模版edit
根据id从数据库取回要编辑的文章的data，然后渲染数据，再次提交，更新数据库数据，更新成功后跳转页面

