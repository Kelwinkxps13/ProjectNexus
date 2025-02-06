var express = require('express');
var path = require('path');
var fs = require('fs'); // Importando fs para manipulação de arquivos
var router = express.Router();
const multer = require('multer');

// Configuração do multer para salvar imagens na pasta correta
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/images/animes');
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
const dbPath = path.join(__dirname, '../database', 'animes.json');

// Função para carregar dados do arquivo JSON
const getDbData = () => {
  const rawData = fs.readFileSync(dbPath);
  return JSON.parse(rawData); // Convertendo o JSON para um objeto JavaScript
};

// Função para salvar os dados no arquivo JSON
const saveDbData = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)); // Salvando os dados no arquivo
};

/* GET animes page. */
router.get('/', function (req, res, next) {
  const db = getDbData(); // Carregar os dados do JSON
  res.render('modulos/animes', {
    title: 'Animes',
    content: '../modulos/animes',
    db_url: db // Passa os dados de animes para o template
  });
});

router.get('/nome/:id', function (req, res, next) {
  const id = parseInt(req.params.id); // Obtém o ID da rota e converte para número
  const db = getDbData(); // Carrega os dados do JSON
  
  // Filtra o item correspondente ao ID
  const k = db.find(item => item.id === id);

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).send('Anime não encontrado');
  }

  // Renderiza a página com os dados do anime correspondente
  res.render('modulos/veja', {
    title: k.title,
    content: '../modulos/animes',
    db_url: k // Passa os dados do anime para o template
  });
});

router.get('/create', function (req, res, next) {
  res.render('modulos/create', {
    title: 'Adicionar Animes',
    page: 'Animes',
    url: 'animes',
    content: '../modulos/create',
    db_url: [] // Passa um array vazio para a criação de novos animes
  });
});

router.post('/', upload.single('image'), (req, res) => {
  const db = getDbData();
  const lastId = Math.max(...db.map(u => u.id), 0);

  const newData = {
    id: lastId + 1,
    title: req.body.title,
    description: req.body.description,
    image: req.file ? `/images/animes/${req.file.filename}` : null,
    long_description: {
      about: { text: req.body.long_about_text },
      for_me: { text: req.body.long_for_me_text }
    },
    is_deleted: false
  };

  db.push(newData);
  saveDbData(db);

  res.redirect('/animes');
});












//bloco
router.get('/createblock/:id', function (req, res, next) {
  const id = parseInt(req.params.id); // Obtém o ID da rota e converte para número
  const db = getDbData(); // Carrega os dados do JSON
  
  // Filtra o item correspondente ao ID
  const k = db.find(item => item.id === id);

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).send('Anime não encontrado');
  }

  // Renderiza a página com os dados do anime correspondente
  res.render('modulos/createblock', {
    title: k.title,
    url: 'animes',
    content: '../modulos/animes',
    db_url: k // Passa os dados do anime para o template
  });
});

router.post('/addblock/:id', upload.single('image'), (req, res) => {
  const db = getDbData(); 
  const k = db.find(item => item.id === parseInt(id));

  const lastId = Math.max(...k.long_description.map(u => u.id), 0);

  const newData = {
    id: lastId + 1,
    title: req.body.title,
    text: req.body.text,
    image: req.file ? `/images/animes/${req.file.filename}` : null,
  };

  k.long_description.push(newData);
  saveDbData(k.long_description);
    res.redirect('/animes/'+id)
});

router.post('/att/:id', function (req, res, next) {
  const db = getDbData(); // Carregar os dados do JSON
  const id = req.params.id;
  const k = db.find(item => item.id === parseInt(id));

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).send('Anime não encontrado: '+id);
  }else{
    k.is_deleted = true
    saveDbData(db);
    // Renderiza a página com os dados do anime correspondente
    res.redirect('/animes')
  }
  
});

router.post('/edit', upload.single('image'), function (req, res, next) {
  const db = getDbData(); // Carregar os dados do JSON
  const id = req.body.id;
  const k = db.find(item => item.id === parseInt(id));

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).send('Anime não encontrado: ' + id);
  } else {
    // Atualiza os dados do anime
    k.title = req.body.title;
    k.description = req.body.description;
    k.long_description.about.text = req.body.long_about_text;
    k.long_description.for_me.text = req.body.long_for_me_text;

    // Verifica se uma nova imagem foi enviada
    if (req.file) {
      // Se houver, salva a nova imagem e atualiza o caminho
      k.image = `/images/animes/${req.file.filename}`;
    }

    // Salva os dados atualizados no arquivo JSON
    saveDbData(db);

    // Redireciona para a página de animes
    res.redirect('/animes');
  }
});


router.get('/edit/:id', function (req, res, next) {
  const db = getDbData(); // Carregar os dados do JSON
  const id = req.params.id;
  const k = db.find(item => item.id === parseInt(id));

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).send('Anime não encontrado: '+id);
  }else{
    // Renderiza a página com os dados do anime correspondente
    res.render('modulos/edit', {
      page: "animes",
      title: 'Editando Anime '+k.title,
      content: '../modulos/animes',
      db: k,
      url: 'animes', // Passa os dados de animes para o template
    });
  }
});

module.exports = router;



// var express = require('express');
// var router = express.Router();


// //piv means Public Images to View
// /* GET animes page. */

// var path = require('path'); 
// const db = path.join(__dirname, '../database', 'animes.json');
// router.get('/', function (req, res, next) {
//   res.render('components/main', {
//     title: 'Animes',
//     content: '../modulos/animes',
//     db_url: db
//   });
// });
// router.get('/create', function (req, res, next) {
//   res.render('components/main', {
//     title: 'Adicionar Animes',
//     page: 'Animes',
//     content: '../modulos/create',
//     db_url: db
//   });
// });

// router.post('/', function (req, res, next) {
//   let lastId = Math.max(...db.map(u => u.id))

//   let new_data = {
//     id: ++lastId,
//     title: req.body.title,
//     description: req.body.description,
//     image: req.body.image
//   }

//   db.push(new_data)
  
//   res.render('components/main', {
//     title: 'Animes',
//     content: '../modulos/animes',
//     db_url: db
//   });
// });