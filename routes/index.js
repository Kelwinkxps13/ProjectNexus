var express = require('express');
var path = require('path');
var fs = require('fs'); // Importando fs para manipulação de arquivos
var router = express.Router();
const multer = require('multer');

var has_main = false
var is_main_created = false;
var main_was_created = false;
var edited_main = false;

var theme_created = false;
var theme_edited = false;


var theme_deleted = false;

function verify_msg(conditional, message) {
  var msg = 0;
  if (conditional) {
    msg = message;
    conditional = false;
  }
  return msg;
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/images/theme/banner');
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


// 1. Definir os caminhos dos arquivos JSON
const db_main = path.join(__dirname, '../database', 'main.json');
const db_themes = path.join(__dirname, '../database', 'themes.json');

// 2. Função para garantir que o arquivo exista
function ensureFileExists(filePath, defaultContent = {}) {
    if (!fs.existsSync(filePath)) {
        console.log(`Arquivo ${filePath} não encontrado. Criando...`);
        fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 4), 'utf8');
    }
}

// 3. Criar os arquivos se não existirem, com um conteúdo padrão
ensureFileExists(db_main, []);
ensureFileExists(db_themes, []);

// Função para carregar dados do arquivo JSON
const get_db_main = () => {
  const rawData = fs.readFileSync(db_main);
  return JSON.parse(rawData); // Convertendo o JSON para um objeto JavaScript
};
const get_db_themes = () => {
  const rawData = fs.readFileSync(db_themes);
  return JSON.parse(rawData); // Convertendo o JSON para um objeto JavaScript
};
// Função para salvar os dados no arquivo JSON
const save_db_main = (data) => {
  fs.writeFileSync(db_main, JSON.stringify(data, null, 2)); // Salvando os dados no arquivo
};
const save_db_themes = (data) => {
  fs.writeFileSync(db_themes, JSON.stringify(data, null, 2)); // Salvando os dados no arquivo
};


function check_main(req, res) {
  // pega o db main
  const db_main = get_db_main();
  // verifica se o tamanho é zero
  const verify_db_main = db_main.length
  // caso seu tamanho seja zero ou nulo
  if (verify_db_main == 0 || verify_db_main == null) {
    // redireciona para o index creator
    res.redirect("/create")
  }
}

// ########################################################################################

//index - lista os registros
router.get('/', function (req, res, next) {
  check_main(req, res)

  // pega o db main
  const db_main = get_db_main();
  // verifica se o tamanho é zero
  const verify_db_main = db_main.length

  const db_main_data = db_main.find(item => item.id === 1)

  // pega o db themes
  const db_themes = get_db_themes();
  // verifica se o tamanho é zero
  const total = db_themes.length

  // pega o tanto de themas deletados
  const is_deleted = db_themes.filter(item => item.is_deleted === true).length;
  let final_verification = false;

  // condicional caso o tanto de temas deletados seja igual o tanto de temas totais
  if (total - is_deleted == 0) {
    final_verification = true;
  }


  // caso seu tamanho seja zero ou nulo
  if (verify_db_main == 0 || verify_db_main == null) {
    // redireciona para o index creator
    has_main = true;
    res.redirect("/create")
  } else {
    var msg_success;
    var msg_warning = verify_msg(main_was_created, "pagina principal já criada!")

    if (edited_main) {
      msg_success = verify_msg(edited_main, "pagina principal editada com sucesso!")
    } else if (is_main_created) {
      msg_success = verify_msg(is_main_created, "pagina principal criada com sucesso!")
    } else if (theme_created) {
      msg_success = verify_msg(theme_created, "Categoria criada com sucesso!")
    } else if (theme_edited) {
      msg_success = verify_msg(theme_edited, "Categoria editada com sucesso!")
    }

    if (final_verification) {
      res.render('index', {
        msg_success: msg_success,
        msg_warning: msg_warning,
        themes_foreach: db_themes,
        title: 'Pagina Inicial',
        final_verification: final_verification,
        db_main: db_main_data
      });
    } else {
      res.render('index', {
        msg_success: msg_success,
        msg_warning: msg_warning,
        themes_foreach: db_themes,
        title: 'Pagina Inicial',
        db_main: db_main_data,
        final_verification: final_verification
      });
    }
  }
});

//create - tela de criação
router.get('/create', function (req, res, next) {
  // pega o db main
  const db_main = get_db_main();
  // verifica se o tamanho é zero
  const verify_db_main = db_main.length
  const db_themes = get_db_themes();
  // verifica se o tamanho é zero


  if (verify_db_main == 0) {
    res.render('indexcreator', {
      msg_warning: "pagina principal ainda não foi criada!",
      themes_foreach: db_themes,
      title: 'Criação Inicial'
    });
  } else {
    main_was_created = true
    res.redirect("/");
  }
});

//store - processa a criação o registro
router.post('/store', (req, res) => {
  const db_main = get_db_main();

  const newData = {
    id: 1,
    title: req.body.title,
    subtitle: req.body.subtitle,
    description: req.body.description
  };

  db_main.push(newData);
  save_db_main(db_main);

  is_main_created = true;
  res.redirect('/');
});

//edit - tela de edição
router.get('/edit', function (req, res, next) {
  check_main(req, res)
  const db_main = get_db_main();
  const db_themes = get_db_themes();

  if (!db_main) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).json({ err: 'main nao encontrada'});
  } else {
    // Renderiza a página com os dados do anime correspondente
    res.render('indexeditor', {
      main: db_main[0],
      themes_foreach: db_themes,
      title: 'Editando main'
    });
  }
});

//update - processa a atualização o registro
router.post('/update', function (req, res, next) {
  check_main(req, res)
  const db_main = get_db_main();
  const db_themes = get_db_themes();

  if (!db_main) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).json({ err: 'main nao encontrada'});
  } else {
    // Atualiza os dados do tema
    db_main[0].title = req.body.title;
    db_main[0].subtitle = req.body.subtitle;
    db_main[0].description = req.body.description;

    // Salva os dados atualizados no arquivo JSON
    save_db_main(db_main);

    edited_main = true;
    // Redireciona para a página de animes
    res.redirect(`/`);
  }
});


// ########################################################################################

router.get('/editor', function (req, res, next) {
  check_main(req, res)
  const db_themes = get_db_themes();

  const total = db_themes.length
  const is_deleted = db_themes.filter(item => item.is_deleted === true).length;
  let final_verification = false;

  // condicional caso o tanto de temas deletados seja igual o tanto de temas totais
  if (total - is_deleted == 0) {
    final_verification = true;
  }

  var msg_success;
  msg_success = verify_msg(theme_deleted, "Categoria excluída com sucesso!")

  res.render('editor', {
    msg_success: msg_success,
    themes_foreach: db_themes,
    title: 'Edição',
    final_verification: final_verification
  });
});


// criação, edição e exclusão de uma categoria

router.post('/theme/store', upload.single('image'), (req, res) => {
  check_main(req, res)
  const db_themes = get_db_themes();

  const lastId = Math.max(...db_themes.map(u => u.id), 0);

  var image_status;
  if (req.body.remove_image) {
    image_status = null;
  } else {

    const theme_path = path.join(__dirname, '../public/images/theme/banner');
    if (!fs.existsSync(theme_path)) {
      fs.mkdirSync(theme_path, { recursive: true }); // Cria a pasta para o anime, se não existir
    }
    image_status = req.file ? `/images/theme/banner/${req.file.filename}` : null;
  }
  console.log(image_status)
  const newData = {
    id: lastId + 1,
    title: req.body.title,
    description: req.body.description,
    image: image_status,
    itens: [],
    is_deleted: false
  };

  db_themes.push(newData);
  save_db_themes(db_themes);

  theme_created = true
  res.redirect(`/`);
});

router.post('/theme/update', upload.single('image'), (req, res) => {
  check_main(req, res)
  const db_themes = get_db_themes(); // Carregar os dados do JSON
  const id = parseInt(req.body.id);
  const k = db_themes.find(item => item.id === parseInt(id));

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).json({ err: "Tema não encontrado! "+id });
  } else {

    if (req.body.remove_image) {
        k.image = null;
      } else {
    
        const theme_path = path.join(__dirname, '../public/images/theme/banner');
        if (!fs.existsSync(theme_path)) {
          fs.mkdirSync(theme_path, { recursive: true }); // Cria a pasta para o anime, se não existir
        }
        // Verifica se uma nova imagem foi enviada
        if (req.file) {
          // Se houver, salva a nova imagem e atualiza o caminho
          k.image = `/images/theme/banner/${req.file.filename}`;
        }
      }

    // Atualiza os dados do tema
    k.title = req.body.title;
    k.subtitle = req.body.subtitle;
    k.description = req.body.description;

    // Salva os dados atualizados no arquivo JSON
    save_db_themes(db_themes);

    theme_edited = true;
    // Redireciona para a página de animes
    res.redirect(`/`);
  }
});

router.post('/theme/destroy/:id', function (req, res, next) {
  check_main(req, res)
  const db_themes = get_db_themes(); // Carregar os dados do JSON
  const id = parseInt(req.params.id);
  const k = db_themes.find(item => item.id === parseInt(id));

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).json({ err: "Tema não encontrado! "+id });
  } else {
    k.is_deleted = true
    save_db_themes(db_themes);
    // Renderiza a página com os dados do anime correspondente


    const total = db_themes.length
    const is_deleted = db_themes.filter(item => item.is_deleted === true).length;
    let final_verification = false;

    // condicional caso o tanto de temas deletados seja igual o tanto de temas totais
    if (total - is_deleted == 0) {
      final_verification = true;
    }


    theme_deleted = true;
    res.redirect('/editor')
  }

});
// ########################################################################################

router.get('/*', function (req, res) {
  res.status(404).json({ err: "Não foi possivel encontrar essa página" });
});

// ########################################################################################

module.exports = router;