var express = require('express');
var path = require('path');
var fs = require('fs'); // Importando fs para manipulação de arquivos
var router = express.Router();

var has_main = false
var is_main_created = false;
var main_was_created = false;
var edited_main = false;


var theme_deleted = false;

function verify_msg(conditional, message) {
  var msg = 0;
  if (conditional) {
    msg = message;
    conditional = false;
  }
  return msg;
}

// Caminho para o arquivo JSON
const db_main = path.join(__dirname, '../database', 'main.json');
const db_themes = path.join(__dirname, '../database', 'themes.json');

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

  res.render('editor', {
    themes_foreach: db_themes,
    title: 'Edição',
    final_verification: final_verification
  });
});

// ########################################################################################

router.get('/*', function (req, res) {
  res.status(404).json({ err: "Não foi possivel encontrar essa página" });
});

// ########################################################################################

module.exports = router;