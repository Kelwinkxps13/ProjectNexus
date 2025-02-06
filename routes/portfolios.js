var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs'); // Para manipulação do arquivo JSON
const multer = require('multer');

// Configuração do multer para salvar imagens na pasta correta
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/images/portfolio');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true }); // Cria a pasta se não existir
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Caminho para o arquivo JSON
const dbPath = path.join(__dirname, '../database', 'portfolios.json');

// Função para carregar dados do arquivo JSON
const getDbData = () => {
  const rawData = fs.readFileSync(dbPath);
  return JSON.parse(rawData); // Convertendo o JSON para um objeto JavaScript
};

// Função para salvar os dados no arquivo JSON
const saveDbData = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)); // Salvando os dados no arquivo
};

/* GET home page. */
router.get('/', function(req, res, next) {
  const db = getDbData(); // Carregar os dados do JSON
  res.render('modulos/portfolios', { 
    title: 'Portifólio', 
    content: '../modulos/portfolios',
    db_url: db // Passando os dados para o template
  });
});

router.get('/nome/:id', function (req, res, next) {
  const id = parseInt(req.params.id); // Obtém o ID da rota e converte para número
  const db = getDbData(); // Carrega os dados do JSON
  
  // Filtra o item correspondente ao ID
  const k = db.find(item => item.id === id);

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).send('Portifólio não encontrado');
  }

  // Renderiza a página com os dados do portfolios correspondente
  res.render('modulos/veja', {
    title: k.title,
    content: '../modulos/portfolios',
    db_url: k // Passa os dados do portfolios para o template
  });
});

router.get('/create', function(req, res, next) {
  res.render('modulos/create', { 
    title: 'Adicionar Portifólio',
    page: 'Portifólio',
    url: 'portfolios',
    content: '../modulos/create',
    db_url: [] // Passa um array vazio para a criação de novos portfólios
  });
});

router.post('/', upload.single('image'), (req, res) => {
  const db = getDbData();
  const lastId = Math.max(...db.map(u => u.id), 0);

  const newData = {
    id: lastId + 1,
    title: req.body.title,
    description: req.body.description,
    image: req.file ? `/images/portfolio/${req.file.filename}` : null,
    long_description: {
      about: { text: req.body.long_about_text },
      for_me: { text: req.body.long_for_me_text }
    },
    is_deleted: false
  };

  db.push(newData);
  saveDbData(db);

  res.redirect('/portfolios');
});

router.post('/att/:id', function (req, res, next) {
  const db = getDbData(); // Carregar os dados do JSON
  const id = req.params.id;
  const k = db.find(item => item.id === parseInt(id));

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).send('portfolio não encontrado: '+id);
  }else{
    k.is_deleted = true
    saveDbData(db);
    // Renderiza a página com os dados do portfolios correspondente
    res.redirect('/portfolios')
  }
  
});

router.post('/edit', upload.single('image'), function (req, res, next) {
  const db = getDbData(); // Carregar os dados do JSON
  const id = req.body.id;
  const k = db.find(item => item.id === parseInt(id));

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).send('portfolio não encontrado: ' + id);
  } else {
    // Atualiza os dados do portfolio
    k.title = req.body.title;
    k.description = req.body.description;
    k.long_description.about.text = req.body.long_about_text;
    k.long_description.for_me.text = req.body.long_for_me_text;

    // Verifica se uma nova imagem foi enviada
    if (req.file) {
      // Se houver, salva a nova imagem e atualiza o caminho
      k.image = `/images/portfolio/${req.file.filename}`;
    }

    // Salva os dados atualizados no arquivo JSON
    saveDbData(db);

    // Redireciona para a página de portfolios
    res.redirect('/portfolios');
  }
});

router.get('/edit/:id', function (req, res, next) {
  const db = getDbData(); // Carregar os dados do JSON
  const id = req.params.id;
  const k = db.find(item => item.id === parseInt(id));

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).send('portfolio não encontrado: '+id);
  }else{
    // Renderiza a página com os dados do portfolio correspondente
    res.render('modulos/edit', {
      page: "portfolios",
      title: 'Editando portfolio '+k.title,
      content: '../modulos/portfolios',
      db: k,
      url: 'portfolios', // Passa os dados de portfolios para o template
    });
  }
});

module.exports = router;



// var express = require('express');
// var router = express.Router();

// /* GET home page. */
// var path = require('path'); 
// const db = path.join(__dirname, '../database', 'portfolio.json');
// router.get('/', function(req, res, next) {
//   res.render('components/main', { 
//     title: 'Portifólio', 
//     content: '../modulos/portfolio' ,
//     db_url: db
//   });
// });
// router.get('/create', function(req, res, next) {
//   res.render('components/main', { 
//     title: 'Adicionar Portifólio',
//     page: 'Portifólio',
//     content: '../modulos/create',
//     db_url: db
//   });
// });

// module.exports = router;
