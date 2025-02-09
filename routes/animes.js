var express = require('express');
var path = require('path');
var fs = require('fs'); // Importando fs para manipulação de arquivos
var router = express.Router();
const multer = require('multer');

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

const storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    const animeId = req.body.id; // Obtém o ID do anime enviado no corpo da requisição
    const uploadPath = path.join(__dirname, '../public/images/animes', animeId.toString()); // Adiciona a pasta com o ID do anime
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true }); // Cria a pasta se não existir
    }
    cb(null, uploadPath); // Define o caminho de destino para salvar a imagem
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    cb(null, uniqueName); // Define o nome da imagem
  }
});


const upload = multer({ storage });
const upload2 = multer({ storage: storage2 });


// Caminho para o arquivo JSON
const dbPath = path.join(__dirname, '../database', 'animes.json');

// #########################################################################################################

// Configuração do multer para salvar imagens na pasta correta


// Função para carregar dados do arquivo JSON
const getDbData = () => {
  const rawData = fs.readFileSync(dbPath);
  return JSON.parse(rawData); // Convertendo o JSON para um objeto JavaScript
};

// Função para salvar os dados no arquivo JSON
const saveDbData = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)); // Salvando os dados no arquivo
};

// #########################################################################################################

//index - lista os registros
router.get('/', function (req, res, next) {
  const db = getDbData();
  const is_deleted = db.filter(item => item.is_deleted === true).length;
  const total = db.length;
  res.render('modulos/animes', {
    title: 'Animes',
    db_url: db,
    is_deleted: is_deleted,
    total: total
  });
});

//create - tela de criação
router.get('/create', function (req, res, next) {
  res.render('modulos/base/create', {
    title: 'Adicionar Animes',
    page: 'Animes',
    url: 'animes'
  });
});

//store - processa a criação o registro
router.post('/store', upload.single('image'), (req, res) => {
  const db = getDbData();
  const lastId = Math.max(...db.map(u => u.id), 0);

  const newData = {
    id: lastId + 1,
    title: req.body.title,
    description: req.body.description,
    image: req.file ? `/images/animes/${req.file.filename}` : null,
    long_description: [],
    is_deleted: false
  };

  db.push(newData);
  saveDbData(db);

  res.redirect('/animes');
});

//show - mostra UM registro
router.get('/show/:id', function (req, res, next) {
  const id = parseInt(req.params.id); // Obtém o ID da rota e converte para número
  const db = getDbData(); // Carrega os dados do JSON

  // Filtra o item correspondente ao ID
  const k = db.find(item => item.id === id);
  const k1 = k.long_description;

  const is_deleted = k1.filter(item => item.is_deleted === true).length;
  const total = k1.length;

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).send('Anime não encontrado');
  }

  // Renderiza a página com os dados do anime correspondente
  res.render('modulos/veja', {
    title: k.title,
    db_url: k1, // Passa os dados do anime para o template
    id: k.id,
    is_deleted: is_deleted,
    total: total,
    url: "animes"
  });
});

//edit - tela de edição
router.get('/edit/:id', function (req, res, next) {
  const db = getDbData(); // Carregar os dados do JSON
  const id = req.params.id;
  const k = db.find(item => item.id === parseInt(id));

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).send('Anime não encontrado: ' + id);
  } else {
    // Renderiza a página com os dados do anime correspondente
    res.render('modulos/base/edit', {
      page: "animes",
      title: 'Editando Anime ' + k.title,
      db: k,
      url: 'animes', // Passa os dados de animes para o template
    });
  }
});

//update - processa a atualização o registro
router.post('/update', upload.single('image'), function (req, res, next) {
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

//destroy - apaga um registro
router.post('/destroy/:id', function (req, res, next) {
  const db = getDbData(); // Carregar os dados do JSON
  const id = req.params.id;
  const k = db.find(item => item.id === parseInt(id));

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).send('Anime não encontrado: ' + id);
  } else {
    k.is_deleted = true
    saveDbData(db);
    // Renderiza a página com os dados do anime correspondente
    res.redirect('/animes')
  }

});


// #########################################################################################################

//create block
router.get('/createblock/:id', function (req, res, next) {
  const id = req.params.id;
  res.render('modulos/block/create', {
    title: 'Adicionar Bloco',
    url: 'animes',
    id: id
  });
});

//store block
router.post('/storeblock', upload2.single('image'), (req, res) => {
  const db = getDbData();
  const id = req.body.id;

  // qual o anime
  const k = db.find(item => item.id == (id));
  const k1 = k.long_description;


  const is_deleted = k1.filter(item => item.is_deleted === true).length;

  // verifica qual o ultimo bloco adicionado

  const lastId = Math.max(...k1.map(u => u.id), 0);

  const animePath = path.join(__dirname, '../public/images/animes', id.toString());
  if (!fs.existsSync(animePath)) {
    fs.mkdirSync(animePath, { recursive: true }); // Cria a pasta para o anime, se não existir
  }


  // cria o novo bloco
  const newData = {
    id: lastId + 1,
    title: req.body.title,
    description: req.body.description,
    image: req.file ? `/images/animes/${id}/${req.file.filename}` : null,
    is_deleted: false
  };

  // empurra o novo bloco para os blocos daquele anime em especifico
  k1.push(newData);

  // salva
  saveDbData(db);

  res.redirect(`/animes/show/${id}`);
});

//show block
//no necessary

//edit block
router.get('/editblock/:id/:idblock', function (req, res, next) {
  const db = getDbData(); // Carregar os dados do JSON
  const id = req.params.id;
  const k = db.find(item => item.id === parseInt(id));
  const k1 = k.long_description;

  const idblock = req.params.idblock;
  const kblock = k1.find(item => item.id === parseInt(idblock));

  if (!kblock) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).send('Anime não encontrado: ' + id);
  } else {
    // Renderiza a página com os dados do anime correspondente
    res.render('modulos/block/edit', {
      title: 'Editando Bloco ' + kblock.title,
      db: kblock,
      id: id,
      url: 'animes', // Passa os dados de animes para o template
    });
  }
});

//update block
router.post('/updateblock', upload2.single('image'), function (req, res, next) {
  const db = getDbData(); // Carregar os dados do JSON
  const id = req.body.id;
  const k = db.find(item => item.id === parseInt(id));
  const k1 = k.long_description;

  const idblock = req.body.idblock;
  const kblock = k1.find(item => item.id === parseInt(idblock));


  const animePath = path.join(__dirname, '../public/images/animes', id.toString());
  if (!fs.existsSync(animePath)) {
    fs.mkdirSync(animePath, { recursive: true }); // Cria a pasta para o anime, se não existir
  }

  if (!kblock) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).send('Bloco não encontrado: ' + id);
  } else {
    // Atualiza os dados do anime
    kblock.title = req.body.title;
    kblock.description = req.body.description;

    // Verifica se uma nova imagem foi enviada
    if (req.file) {
      // Se houver, salva a nova imagem e atualiza o caminho
      kblock.image = `/images/animes/${id}/${req.file.filename}`;
    }

    // Salva os dados atualizados no arquivo JSON
    saveDbData(db);

    // Redireciona para a página de animes
    res.redirect(`/animes/show/${id}`);
  }
});

//destroy block
router.post('/destroyblock/:id/:idblock', function (req, res, next) {
  const db = getDbData(); // Carregar os dados do JSON
  const id = req.params.id;
  const k = db.find(item => item.id === parseInt(id));
  const k1 = k.long_description;

  const idblock = req.params.idblock;
  const kblock = k1.find(item => item.id === parseInt(idblock));

  if (!kblock) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).send('Anime não encontrado: ' + id);
  } else {
    kblock.is_deleted = true
    saveDbData(db);
    // Renderiza a página com os dados do anime correspondente
    res.redirect(`/animes/show/${id}`)
  }

});

// #########################################################################################################


module.exports = router;