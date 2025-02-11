var express = require('express');
var router = express.Router();


// Caminho para o arquivo JSON
const dbPath = path.join(__dirname, '../database', 'gereric.json');

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

/* GET home page. */
//index - lista os registros
router.get('/', function (req, res, next) {
  const db = getDbData();
  const verify = db.main.length
  const all_themes = db.themes
  const is_deleted = all_themes.filter(item => item.is_deleted === true).length;
  const total = all_themes.length;
  const final_verification = true;
  if (total - is_deleted == 0) {
    final_verification = true;
  }else{
    final_verification = false;
  }
  if (verify == 0) {
    // redireciona para o index creator
    res,redirect("/create")
  } else {
    if (final_verification) {
      res.render('index', {
        title: 'Pagina Inicial',
        final_verification: final_verification
      });
    } else {
      res.render('index', {
        title: 'Pagina Inicial',
        db_url: db.main,
        final_verification: final_verification
      });
    }
  }
});

//create - tela de criação
router.get('/create', function (req, res, next) {
  res.render('indexcreator', {
    title: 'Criação Inicial'
  });
});

//store - processa a criação o registro
router.post('/store', (req, res) => {
  const db = getDbData();
  const main = db.main;

  const newData = {
    title: req.body.title,
    subtitle: req.body.subtitle,
    description1: req.body.description1,
    description2: req.body.description2
  };

  main.push(newData);
  saveDbData(db);

  res.redirect('/');
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

module.exports = router;
