var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/login', function(req, res, next) {
  res.render('index', {
    title: "login"
  })
});

router.get('/*', function (req,res) {
  res.status(404).json({ err: "Não foi possivel encontrar essa página" });
});

module.exports = router;
