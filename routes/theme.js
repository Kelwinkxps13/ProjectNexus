var express = require('express');
var path = require('path');
var fs = require('fs'); // Importando fs para manipulação de arquivos
var router = express.Router();
const multer = require('multer');

var theme_created = false;
var theme_edited = false;
var theme_deleted = false;

var item_created = false;
var item_edited = false;
var item_deleted = false;

var block_created = false;
var block_edited = false;
var block_deleted = false;


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
    const id = parseInt(req.params.id);
    const uploadPath = path.join(__dirname, '../public/images/theme', id.toString());
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
    const id = parseInt(req.params.id); // Obtém o ID do anime enviado no corpo da requisição
    const id_item = parseInt(req.body.id_item); // Obtém o ID do anime enviado no corpo da requisição
    const uploadPath = path.join(__dirname, '../public/images/theme', id.toString(), id_item.toString()); // Adiciona a pasta com o ID do anime
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
const db_main = path.join(__dirname, '../database', 'main.json');
const db_themes = path.join(__dirname, '../database', 'themes.json');

const get_db_main = () => {
  const rawData = fs.readFileSync(db_main);
  return JSON.parse(rawData); // Convertendo o JSON para um objeto JavaScript
};
const get_db_themes = () => {
  const rawData = fs.readFileSync(db_themes);
  return JSON.parse(rawData); // Convertendo o JSON para um objeto JavaScript
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

//create - tela de criação
router.get('/create', function (req, res, next) {
  check_main(req, res)
  const db_themes = get_db_themes();
  res.render('modulos/generic/create', {
    themes_foreach: db_themes,
    title: 'Adicionar Tema'
  });
});

//store - processa a criação o registro
router.post('/store', (req, res) => {
  check_main(req, res)
  const db_themes = get_db_themes();

  const lastId = Math.max(...db_themes.map(u => u.id), 0);
  const newData = {
    id: lastId + 1,
    title: req.body.title,
    description: req.body.description,
    itens: [],
    is_deleted: false
  };

  db_themes.push(newData);
  save_db_themes(db_themes);

  theme_created = true
  res.redirect(`/theme/show/${lastId + 1}`);
});

//show - lista o registro
router.get('/show/:id', function (req, res, next) {
  check_main(req, res)

  // pega o db themes
  const db_themes = get_db_themes();
  const id = parseInt(req.params.id);
  const db_theme_data = db_themes.find(item => item.id === parseInt(id))
  // verifica se o tamanho é zero

  if (!db_theme_data) {
    return res.status(404).json({ err: "Tema não encontrado!" });
  }

  console.log(db_theme_data)
  // pegando os dados dos itens
  const db_url = db_theme_data.itens

  // pega o tanto de themas deletados
  const is_deleted = db_theme_data.itens.filter(item => item.is_deleted === true).length;
  const total = db_theme_data.itens.length;
  let final_verification = false;

  // condicional caso o tanto de temas deletados seja igual o tanto de temas totais
  if (total - is_deleted == 0) {
    final_verification = true;
  }

  var msg_success;
  if (theme_created) {
    msg_success = verify_msg(theme_created, "Tema criado com sucesso!")
  } else if (theme_edited) {
    msg_success = verify_msg(theme_edited, "Tema editado com sucesso!")
  } else if (item_created) {
    msg_success = verify_msg(item_created, "Item criado com sucesso!")
  } else if (item_edited) {
    msg_success = verify_msg(item_edited, "Item editado com sucesso!")
  } else if (item_deleted) {
    msg_success = verify_msg(item_deleted, "Item excluído com sucesso!")
  }

  res.render('generic', {
    msg_success: msg_success,
    themes_foreach: db_themes,
    id: id,
    title: db_theme_data.title,
    db_url: db_url,
    db_theme: db_theme_data,
    final_verification: final_verification
  });
});

//edit - tela de edição
router.get('/edit/:id', function (req, res, next) {
  check_main(req, res)
  const db_themes = get_db_themes(); // Carregar os dados do JSON
  const id = parseInt(req.params.id);
  const k = db_themes.find(item => item.id === parseInt(id));

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).json({ err: "Tema não encontrado! "+id });
  } else {
    // Renderiza a página com os dados do anime correspondente
    res.render('modulos/generic/edit', {
      id: id,
      themes_foreach: db_themes,
      title: 'Editando tema ' + k.title,
      db: k, // Passa os dados de animes para o template
    });
  }
});

//update - processa a atualização o registro
router.post('/update', function (req, res, next) {
  check_main(req, res)
  const db_themes = get_db_themes(); // Carregar os dados do JSON
  const id = parseInt(req.body.id);
  const k = db_themes.find(item => item.id === parseInt(id));

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).json({ err: "Tema não encontrado! "+id });
  } else {
    // Atualiza os dados do tema
    k.title = req.body.title;
    k.subtitle = req.body.subtitle;
    k.description = req.body.description;

    // Salva os dados atualizados no arquivo JSON
    save_db_themes(db_themes);

    theme_edited = true;
    // Redireciona para a página de animes
    res.redirect(`/theme/show/${k.id}`);
  }
});

//destroy - apaga um registro
router.post('/destroy/:id', function (req, res, next) {
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
    var msg_success = verify_msg(theme_deleted, "tema excluído com sucesso!")
    res.render('editor', {
      msg_success: msg_success,
      themes_foreach: db_themes,
      title: 'Edição',
      final_verification: final_verification
    });
  }

});

// ########################################################################################


//index - lista os registros
router.get('/:id', function (req, res, next) {
  check_main(req, res)
  const db_themes = get_db_themes();
  const id = parseInt(req.params.id);
  const db_theme_data = db_themes.find(item => item.id === parseInt(id))
  if (!db_theme_data) {
    return res.status(404).json({ err: "Tema não encontrado!" });
  }
  const is_deleted = db.filter(item => item.is_deleted === true).length;
  const total = db.length;
  res.render('modulos/generic', {
    themes_foreach: db_themes,
    title: db_theme_data.title,
    db_url: db_theme_data.itens,
    is_deleted: is_deleted,
    total: total,
    id: id
  });
});

//create - tela de criação
router.get('/:id/create', function (req, res, next) {
  check_main(req, res)
  const db_themes = get_db_themes();
  const id = parseInt(req.params.id);
  const db_theme_data = db_themes.find(item => item.id === parseInt(id))
  if (!db_theme_data) {
    return res.status(404).json({ err: "Tema não encontrado!" });
  }
  res.render('modulos/base/create', {
    themes_foreach: db_themes,
    id: id,
    title: 'Adicionar ' + db_theme_data.title,
    page: db_theme_data.title
  });
});

//store - processa a criação o registro
router.post('/:id/store', upload.single('image'), (req, res) => {
  check_main(req, res)
  const db_themes = get_db_themes();
  const id = parseInt(req.params.id);
  const db_theme_data = db_themes.find(item => item.id === parseInt(id))
  if (!db_theme_data) {
    return res.status(404).json({ err: "Tema não encontrado!" });
  }
  const lastId = Math.max(...db_theme_data.itens.map(u => u.id), 0);

  var image_status;
  if (req.body.remove_image) {
    image_status = null;
  } else {

    const theme_path = path.join(__dirname, '../public/images/theme', id.toString());
    if (!fs.existsSync(theme_path)) {
      fs.mkdirSync(theme_path, { recursive: true }); // Cria a pasta para o anime, se não existir
    }
    image_status = req.file ? `/images/theme/${id}/${req.file.filename}` : null;
  }




  const newData = {
    id: lastId + 1,
    title: req.body.title,
    description: req.body.description,
    image: image_status,
    long_description: [],
    is_deleted: false
  };

  db_theme_data.itens.push(newData);
  save_db_themes(db_themes);


  item_created = true;
  res.redirect(`/theme/show/${id}`);
});

//show - mostra UM registro
router.get('/:id/show/:iditem', function (req, res, next) {
  check_main(req, res)
  const db_themes = get_db_themes();
  const id = parseInt(req.params.id);
  const db_theme_data = db_themes.find(item => item.id === parseInt(id))

  if (!db_theme_data) {
    return res.status(404).json({ err: "Tema não encontrado!" });
  }

  const iditem = parseInt(req.params.iditem); // Obtém o ID da rota e converte para número

  // Filtra o item correspondente ao ID
  const k = db_theme_data.itens.find(item => item.id === parseInt(iditem));
  const k1 = k.long_description;

  const is_deleted = k1.filter(item => item.is_deleted === true).length;
  const total = k1.length;

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).json({ err: db_theme_data.title + ' não encontrado'});
  }

  var msg_success;
    if (block_created) {
      msg_success = verify_msg(block_created, "Conteúdo criado com sucesso!")
    } else if (block_edited) {
      msg_success = verify_msg(block_edited, "Conteúdo editado com sucesso!")
    } else if (block_deleted) {
      msg_success = verify_msg(block_deleted, "Conteúdo excluído com sucesso!")
    }

  // Renderiza a página com os dados do anime correspondente
  res.render('modulos/veja', {
    msg_success: msg_success,
    themes_foreach: db_themes,
    title: k.title,
    db_url: k1, // Passa os dados do anime para o template
    id_item: k.id,
    id: id,
    is_deleted: is_deleted,
    total: total
  });
});

router.get('/:id/show/:iditem/editor', function (req, res, next) {
  check_main(req, res)
  const db_themes = get_db_themes();
  const id = parseInt(req.params.id);
  const db_theme_data = db_themes.find(item => item.id === parseInt(id))

  if (!db_theme_data) {
    return res.status(404).json({ err: "Tema não encontrado!" });
  }

  const iditem = parseInt(req.params.iditem); // Obtém o ID da rota e converte para número

  // Filtra o item correspondente ao ID
  const k = db_theme_data.itens.find(item => item.id === parseInt(iditem));
  const k1 = k.long_description;

  const is_deleted = k1.filter(item => item.is_deleted === true).length;
  const total = k1.length;

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).json({ err: db_theme_data.title + ' não encontrado'});
  }

  var msg_success;
    if (block_created) {
      msg_success = verify_msg(block_created, "Conteúdo criado com sucesso!")
    } else if (block_edited) {
      msg_success = verify_msg(block_edited, "Conteúdo editado com sucesso!")
    } else if (block_deleted) {
      msg_success = verify_msg(block_deleted, "Conteúdo excluído com sucesso!")
    }

  // Renderiza a página com os dados do anime correspondente
  res.render('modulos/vejaeditor', {
    msg_success: msg_success,
    themes_foreach: db_themes,
    title: k.title,
    db_url: k1, // Passa os dados do anime para o template
    id_item: k.id,
    id: id,
    is_deleted: is_deleted,
    total: total
  });
});

//edit - tela de edição
router.get('/:id/edit/:id_item', function (req, res, next) {
  check_main(req, res)
  const db_themes = get_db_themes();
  const id = parseInt(req.params.id);
  const db_theme_data = db_themes.find(item => item.id === parseInt(id))

  if (!db_theme_data) {
    return res.status(404).json({ err: "Tema não encontrado!" });
  }


  const id_item = parseInt(req.params.id_item);
  const k = db_theme_data.itens.find(item => item.id === parseInt(id_item));

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).json({ err: db_theme_data.title + ' não encontrado: ' + id});
  } else {
    // Renderiza a página com os dados do anime correspondente

    res.render('modulos/base/edit', {
      themes_foreach: db_themes,
      page: db_theme_data.title,
      title: 'Editando ' + k.title,
      db: k,
      id: id
    });
  }
});

//update - processa a atualização o registro
router.post('/:id/update', upload.single('image'), function (req, res, next) {
  check_main(req, res)
  const db_themes = get_db_themes();
  const id = parseInt(req.params.id);
  const db_theme_data = db_themes.find(item => item.id === parseInt(id))

  if (!db_theme_data) {
    return res.status(404).json({ err: "Tema não encontrado!" });
  }


  const id_item = parseInt(req.body.id_item);
  const k = db_theme_data.itens.find(item => item.id === parseInt(id_item));




  if (req.body.remove_image) {
    k.image = null;
  } else {

    const theme_path = path.join(__dirname, '../public/images/theme', id.toString());
    if (!fs.existsSync(theme_path)) {
      fs.mkdirSync(theme_path, { recursive: true }); // Cria a pasta para o anime, se não existir
    }
    // Verifica se uma nova imagem foi enviada
    if (req.file) {
      // Se houver, salva a nova imagem e atualiza o caminho
      k.image = `/images/theme/${id}/${req.file.filename}`;
    }
  }



  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).json({ err: db_theme_data.title + ' não encontrado: ' + id});
  } else {
    // Atualiza os dados do anime
    k.title = req.body.title;
    k.description = req.body.description;



    // Salva os dados atualizados no arquivo JSON
    save_db_themes(db_themes);

    // Redireciona para a página de animes
    item_edited = true;
    res.redirect(`/theme/show/${id}`);
  }
});

//destroy - apaga um registro
router.post('/:id/destroy/:id_item', function (req, res, next) {
  check_main(req, res)
  const db_themes = get_db_themes();
  const id = parseInt(req.params.id);
  const db_theme_data = db_themes.find(item => item.id === parseInt(id))

  if (!db_theme_data) {
    return res.status(404).json({ err: "Tema não encontrado!" });
  }

  const id_item = parseInt(req.params.id_item);
  const k = db_theme_data.itens.find(item => item.id === parseInt(id_item));

  if (!k) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).json({ err: db_theme_data.title + ' não encontrado: ' + id});
  } else {
    k.is_deleted = true
    save_db_themes(db_themes);
    // Renderiza a página com os dados do anime correspondente
    item_deleted = true;
    res.redirect(`/theme/show/${id}`)
  }

});


// #########################################################################################################

//create block
router.get('/:id/createblock/:id_item', function (req, res, next) {
  check_main(req, res)
  const db_themes = get_db_themes();
  const id = parseInt(req.params.id);
  const db_theme_data = db_themes.find(item => item.id === parseInt(id))
  if (!db_theme_data) {
    return res.status(404).json({ err: "Tema não encontrado!" });
  }

  const id_item = parseInt(req.params.id_item);
  res.render('modulos/block/create', {
    themes_foreach: db_themes,
    title: 'Adicionar Bloco',
    id_item: id_item,
    id: id
  });
});

//store block
router.post('/:id/storeblock', upload2.single('image'), (req, res) => {
  check_main(req, res)
  const db_themes = get_db_themes();
  const id = parseInt(req.params.id);
  const db_theme_data = db_themes.find(item => item.id === parseInt(id))

  if (!db_theme_data) {
    return res.status(404).json({ err: "Tema não encontrado!" });
  }



  const id_item = parseInt(req.body.id_item);

  // qual o anime
  const k = db_theme_data.itens.find(item => item.id == parseInt(id_item));
  console.log(id)
  console.log(id_item)
  console.log(k)
  const k1 = k.long_description;

  // verifica qual o ultimo bloco adicionado

  const lastId = Math.max(...k1.map(u => u.id), 0);


  var image_status = null;
  if (req.body.remove_image) {
    image_status = null;
  } else {

    const theme_path = path.join(__dirname, '../public/images/theme', id.toString(), id_item.toString());
    if (!fs.existsSync(theme_path)) {
      fs.mkdirSync(theme_path, { recursive: true }); // Cria a pasta para o anime, se não existir
    }
    image_status = req.file ? `/images/theme/${id}/${id_item}/${req.file.filename}` : null;
  }




  // cria o novo bloco
  const newData = {
    id: lastId + 1,
    title: req.body.title,
    description: req.body.description,
    image: image_status,
    is_deleted: false
  };

  // empurra o novo bloco para os blocos daquele anime em especifico
  k1.push(newData);

  // salva
  save_db_themes(db_themes);

  block_created = true;
  res.redirect(`/theme/${id}/show/${id_item}`);
});

//show block
//no necessary

//edit block
router.get('/:id/editblock/:id_item/:idblock', function (req, res, next) {
  check_main(req, res)
  const db_themes = get_db_themes();
  const id = parseInt(req.params.id);
  const db_theme_data = db_themes.find(item => item.id === parseInt(id))
  if (!db_theme_data) {
    return res.status(404).json({ err: "Tema não encontrado!" });
  }

  const id_item = parseInt(req.params.id_item);
  const k = db_theme_data.itens.find(item => item.id === parseInt(id_item));
  const k1 = k.long_description;

  const idblock = parseInt(req.params.idblock);
  const kblock = k1.find(item => item.id === parseInt(idblock));

  if (!kblock) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).json({ err: db_theme_data.title + ' não encontrado: ' + id});
  } else {
    // Renderiza a página com os dados do anime correspondente
    res.render('modulos/block/edit', {
      themes_foreach: db_themes,
      title: 'Editando Bloco ' + kblock.title,
      db: kblock,
      id_item: id_item,
      id: id// Passa os dados de animes para o template
    });
  }
});

//update block
router.post('/:id/updateblock', upload2.single('image'), function (req, res, next) {
  check_main(req, res)
  const db_themes = get_db_themes();
  const id = parseInt(req.params.id);
  const db_theme_data = db_themes.find(item => item.id === parseInt(id))

  if (!db_theme_data) {
    return res.status(404).json({ err: "Tema não encontrado!" });
  }


  const id_item = parseInt(req.body.id_item);
  const k = db_theme_data.itens.find(item => item.id === parseInt(id_item));
  const k1 = k.long_description;

  const idblock = parseInt(req.body.idblock);
  const kblock = k1.find(item => item.id === parseInt(idblock));



  if (req.body.remove_image) {
    kblock.image = null;
  } else {

    const animePath = path.join(__dirname, '../public/images/theme', id.toString(), id_item.toString());
    if (!fs.existsSync(animePath)) {
      fs.mkdirSync(animePath, { recursive: true }); // Cria a pasta para o anime, se não existir
    }
    // Verifica se uma nova imagem foi enviada
    if (req.file) {
      // Se houver, salva a nova imagem e atualiza o caminho
      kblock.image = `/images/theme/${id}/${id_item}/${req.file.filename}`;
    }
  }



  if (!kblock) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).json({ err: 'Bloco não encontrado: ' + id_item});
  } else {
    // Atualiza os dados do anime
    kblock.title = req.body.title;
    kblock.description = req.body.description;


    // Salva os dados atualizados no arquivo JSON
    save_db_themes(db_themes);

    // Redireciona para a página de animes
    block_edited = true;
    res.redirect(`/theme/${id}/show/${id_item}`);
  }
});

//destroy block
router.post('/:id/destroyblock/:id_item/:idblock', function (req, res, next) {
  check_main(req, res)
  const db_themes = get_db_themes();
  const id = parseInt(req.params.id);
  const db_theme_data = db_themes.find(item => item.id === parseInt(id))

  if (!db_theme_data) {
    return res.status(404).json({ err: "Tema não encontrado!" });
  }

  const id_item = parseInt(req.params.id_item);
  const k = db_theme_data.itens.find(item => item.id === parseInt(id_item));
  const k1 = k.long_description;

  const idblock = parseInt(req.params.idblock);
  const kblock = k1.find(item => item.id === parseInt(idblock));

  if (!kblock) {
    // Retorna 404 se o ID não for encontrado
    return res.status(404).json({ err: db_theme_data.title + ' não encontrado: ' + id});
  } else {
    kblock.is_deleted = true
    save_db_themes(db_themes);
    // Renderiza a página com os dados do anime correspondente
    block_deleted = true;
    res.redirect(`/theme/${id}/show/${id_item}`)
  }

});

// #########################################################################################################


router.get('/*', function (req, res) {
  res.status(404).json({ err: "Não foi possivel encontrar essa página" });
});


module.exports = router;