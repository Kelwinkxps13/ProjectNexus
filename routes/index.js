var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  is_authenticated = true;
  if (is_authenticated) {
    res.render('modulos/home', { 
      title: 'Home', 
      content: '../modulos/home' 
    });
  }else{
    res.redirect('/login1');
  }
  
});
router.get('/login1', function(req, res, next) {
  res.render('login1', { 
    title: 'Login', 
    content: '../modulos/home' 
  });
});

router.post('/validate1login', function(req, res, next) {
  // validação
  res.redirect('/login2'); 
});
router.get('/login2', function(req, res, next) {
  res.render('login2', { 
    title: 'Login', 
    content: '../modulos/home' 
  });
});
router.post('/validate2login', function(req, res, next) {
  // validação
  res.redirect('/'); 
});

module.exports = router;
