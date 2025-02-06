
// o que ainda tenho que fazer pra deixar o projeto minimamente usavel:

// - crud basico dos cards ;
// - autenticacao de login ;
// - banco de dados verdadeiro usando mysql ;
// - pagina que vem depois que voce clica em "Veja!" no card, para cada card ;
// - melhorar o layout e design ;

// o que talvez eu faça:

// - diferenciar os usuarios do tipo comum, e do tipo admin, como por exemplo:
//   se o usuario for admin, ele consegue modificar os cards .
//   senao ele so poderá ver ;




var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var animesRouter = require('./routes/animes');
var jogosRouter = require('./routes/jogos');
var portfoliosRouter = require('./routes/portfolios');

var app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/animes', animesRouter);
app.use('/jogos', jogosRouter);
app.use('/portfolios', portfoliosRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
