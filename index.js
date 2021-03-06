var path = require('path');     //node模块
var express = require('express');  
var session = require('express-session');   //记录登录用户的转台，类似于cookie
var MongoStore = require('connect-mongo')(session); //将session存储于mongod中
var flash = require('connect-flash');             //页面通知提示的中间件
var config = require('config-lite')(__dirname); //读取配置文件的中间件
var routes = require('./routes');  //路由文件
var pkg = require('./package'); //配置文件
var winston = require('winston');   //日志
var expressWinston = require('express-winston'); //  基于 winston 的用于 express 的日志中间件

var app = express();

// 设置模板目录
app.set('views', path.join(__dirname, 'views'));
// 设置模板引擎为 ejs
app.set('view engine', 'ejs');

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));




// session 中间件
app.use(session({
  name: config.session.key,// 设置 cookie 中保存 session id 的字段名称
  secret: config.session.secret,// 通过设置 secret 来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改
  resave: true,// 强制更新 session
  saveUninitialized: false,// 设置为 false，强制创建一个 session，即使用户未登录
  cookie: {
    maxAge: config.session.maxAge// 过期时间，过期后 cookie 中的 session id 自动删除
  },
  store: new MongoStore({// 将 session 存储到 mongodb
    url: config.mongodb// mongodb 地址
  })
}));








// flash 中间件，用来显示通知
app.use(flash());





// 处理表单及文件上传的中间件
app.use(require('express-formidable')({
  uploadDir: path.join(__dirname, 'public/img'),// 上传文件目录
  keepExtensions: true// 保留后缀
}));








// 设置模板全局常量
app.locals.blog = {
  title: pkg.name,
  description: pkg.description
};

// 添加模板必需的三个变量
app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  res.locals.success = req.flash('success').toString(); //中间件通知消息的方法flash
  res.locals.error = req.flash('error').toString();
  next();
});






// 正常请求的日志
app.use(expressWinston.logger({
  transports: [
    new (winston.transports.Console)({  //正常日志打入到终端上，并通过下面的方法写入文件
      json: true,
      colorize: true
    }),
    new winston.transports.File({
      filename: 'logs/success.log'
    })
  ]
}));

// 路由
routes(app);   //正常日志需要写到上面，错误日志需要写到下面


// 错误请求的日志
app.use(expressWinston.errorLogger({ //错误日志打入到终端上，并通过下面的方法写入文件
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true
    }),
    new winston.transports.File({
      filename: 'logs/error.log'
    })
  ]
}));

// error page
app.use(function (err, req, res, next) {     //错误处理机制，控制错误输出的恶内容  并不是处理错误的路径显示的页面，而是错误的代码
  res.render('error', {
    error: err
  });
});



if (module.parent) {
  module.exports = app;
} else {
  // 监听端口，启动程序
  app.listen(config.port, function () {
    console.log(`${pkg.name} listening on port ${config.port}`);
  });
}
