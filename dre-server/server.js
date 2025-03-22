/**
 * server.js - Servidor Express simples para processar uploads de arquivos XLSX
 * 
 * Para usar este servidor:
 * 1. Instale Node.js se ainda não tiver: https://nodejs.org/
 * 2. Crie uma pasta para o projeto
 * 3. Salve este arquivo como server.js
 * 4. Execute no terminal:
 *    npm init -y
 *    npm install express multer cors
 * 5. Inicie o servidor: node server.js
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS para permitir requisições do frontend
app.use(cors());

// Middleware para processar JSON e form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta 'public'
app.use(express.static('public'));

// Garantir que a pasta uploads existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar o armazenamento para os arquivos enviados
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Body recebido:', req.body); // Log para debug

    // Obter o ano e mês do formulário com valores padrão caso não existam
    const ano = req.body.ano || new Date().getFullYear().toString();
    const mes = req.body.mes ? req.body.mes.toString().padStart(2, '0') : '01';
    
    console.log(`Salvando arquivo para o período: ${ano}-${mes}`);
    
    // Criar a estrutura de pastas se não existir
    const dir = path.join(__dirname, 'uploads', ano, mes);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Nomear o arquivo com ano-mes-timestamp.xlsx
    const ano = req.body.ano || new Date().getFullYear().toString();
    const mes = req.body.mes ? req.body.mes.toString().padStart(2, '0') : '01';
    const timestamp = Date.now();
    const filename = `${ano}-${mes}-${timestamp}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

// Criar o middleware de upload com a configuração
const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    console.log('Arquivo recebido:', file.originalname, file.mimetype);
    
    // Lista de tipos MIME para arquivos Excel
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream', // Para alguns browsers que enviam este tipo
      'application/zip' // Alguns browsers podem enviar xlsx como zip
    ];
    
    if (allowedMimes.includes(file.mimetype) || 
        file.originalname.endsWith('.xlsx') || 
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`));
    }
  }
});

// Endpoint para verificar se o servidor está rodando
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', message: 'Servidor rodando normalmente' });
});

// Endpoint para receber o upload do arquivo
app.post('/api/upload', (req, res) => {
  console.log('Requisição recebida em /api/upload');
  console.log('Headers:', req.headers);
  
  // Usar o middleware de upload como função para maior controle
  upload.single('arquivo')(req, res, function(err) {
    if (err) {
      console.error('Erro no processamento do upload:', err);
      return res.status(400).json({ 
        success: false, 
        message: 'Erro no processamento do upload: ' + err.message 
      });
    }
    
    if (!req.file) {
      console.error('Nenhum arquivo foi enviado');
      return res.status(400).json({ 
        success: false, 
        message: 'Nenhum arquivo foi enviado ou o campo do arquivo não é "arquivo"' 
      });
    }

    console.log('Arquivo recebido com sucesso:', req.file);
    console.log('Dados do formulário:', req.body);

    // Criar registro do período
    const ano = req.body.ano || new Date().getFullYear().toString();
    const mes = req.body.mes ? req.body.mes.toString().padStart(2, '0') : '01';
    const periodo = `${ano}-${mes}`;
    
    // Armazenar apenas o caminho relativo em vez do absoluto
    const nomeArquivo = path.basename(req.file.path);
    const caminhoRelativo = path.join(ano, mes, nomeArquivo);
    
    // Informações do arquivo salvo
    const fileInfo = {
      periodo: periodo,
      caminhoRelativo: caminhoRelativo, // Caminho relativo
      nomeArquivo: nomeArquivo, // Nome do arquivo
      nomeOriginal: req.file.originalname,
      tamanho: req.file.size,
      dataUpload: new Date().toISOString()
    };
    
    // Salvar informações no registro de períodos
    let registroPeriodos = [];
    const registroPath = path.join(__dirname, 'uploads', 'registro_periodos.json');
    
    if (fs.existsSync(registroPath)) {
      try {
        const registroData = fs.readFileSync(registroPath, 'utf8');
        registroPeriodos = JSON.parse(registroData);
        
        // Remover entrada anterior do mesmo período, se existir
        registroPeriodos = registroPeriodos.filter(reg => reg.periodo !== periodo);
      } catch (error) {
        console.error('Erro ao ler registro de períodos:', error);
        // Continuar com array vazio em caso de erro
      }
    }
    
    // Adicionar nova entrada
    registroPeriodos.push(fileInfo);
    
    // Salvar o registro atualizado
    try {
      fs.writeFileSync(registroPath, JSON.stringify(registroPeriodos, null, 2));
      
      res.json({ 
        success: true, 
        message: `Arquivo para o período ${periodo} salvo com sucesso`,
        fileInfo 
      });
    } catch (error) {
      console.error('Erro ao salvar registro de períodos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao salvar registro de períodos',
        error: error.message
      });
    }
  });
});

// Endpoint para listar os períodos disponíveis
app.get('/api/periodos', (req, res) => {
  const registroPath = path.join(__dirname, 'uploads', 'registro_periodos.json');
  
  if (!fs.existsSync(registroPath)) {
    return res.json({ periodos: [] });
  }
  
  try {
    const registroData = fs.readFileSync(registroPath, 'utf8');
    const registroPeriodos = JSON.parse(registroData);
    
    // Retornar apenas as informações necessárias
    const periodos = registroPeriodos.map(reg => ({
      periodo: reg.periodo,
      dataUpload: reg.dataUpload,
      nomeOriginal: reg.nomeOriginal
    }));
    
    res.json({ periodos });
  } catch (error) {
    console.error('Erro ao ler registro de períodos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao ler registro de períodos',
      error: error.message
    });
  }
});

// Endpoint para baixar um arquivo específico (MODIFICADO para usar caminhos relativos)
app.get('/api/download/:periodo', (req, res) => {
  const periodo = req.params.periodo;
  const registroPath = path.join(__dirname, 'uploads', 'registro_periodos.json');
  
  if (!fs.existsSync(registroPath)) {
    return res.status(404).json({ success: false, message: 'Nenhum registro encontrado' });
  }
  
  try {
    const registroData = fs.readFileSync(registroPath, 'utf8');
    const registroPeriodos = JSON.parse(registroData);
    
    // Encontrar o registro do período solicitado
    const registro = registroPeriodos.find(reg => reg.periodo === periodo);
    
    if (!registro) {
      return res.status(404).json({ success: false, message: `Período ${periodo} não encontrado` });
    }
    
    // Lidar com registros antigos que podem ter caminhoArquivo completo
    let caminhoArquivo;
    if (registro.caminhoRelativo) {
      // Novo formato com caminho relativo
      caminhoArquivo = path.join(__dirname, 'uploads', registro.caminhoRelativo);
    } else if (registro.caminhoArquivo) {
      // Formato antigo - tentar extrair o nome do arquivo e reconstruir o caminho
      const [ano, mes] = periodo.split('-');
      const nomeArquivo = path.basename(registro.caminhoArquivo);
      caminhoArquivo = path.join(__dirname, 'uploads', ano, mes, nomeArquivo);
    } else {
      // Nem caminhoRelativo nem caminhoArquivo estão disponíveis
      return res.status(404).json({ success: false, message: 'Informações de caminho não encontradas no registro' });
    }
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(caminhoArquivo)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Arquivo não encontrado no servidor',
        caminho: caminhoArquivo
      });
    }
    
    // Enviar o arquivo
    res.download(caminhoArquivo, registro.nomeOriginal);
  } catch (error) {
    console.error('Erro ao processar download:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao processar download',
      error: error.message
    });
  }
});

// Rota para deletar um período (MODIFICADO para usar caminhos relativos)
app.delete('/api/periodo/:periodo', (req, res) => {
  const periodo = req.params.periodo;
  const registroPath = path.join(__dirname, 'uploads', 'registro_periodos.json');
  
  if (!fs.existsSync(registroPath)) {
    return res.status(404).json({ success: false, message: 'Nenhum registro encontrado' });
  }
  
  try {
    const registroData = fs.readFileSync(registroPath, 'utf8');
    const registroPeriodos = JSON.parse(registroData);
    
    const registroIndex = registroPeriodos.findIndex(reg => reg.periodo === periodo);
    
    if (registroIndex === -1) {
      return res.status(404).json({ success: false, message: `Período ${periodo} não encontrado` });
    }
    
    // Obter o registro antes de removê-lo
    const registro = registroPeriodos[registroIndex];
    
    // Determinar o caminho do arquivo baseado no tipo de registro
    let caminhoArquivo;
    if (registro.caminhoRelativo) {
      // Novo formato com caminho relativo
      caminhoArquivo = path.join(__dirname, 'uploads', registro.caminhoRelativo);
    } else if (registro.caminhoArquivo) {
      // Formato antigo - manter compatibilidade
      caminhoArquivo = registro.caminhoArquivo;
      
      // Se o caminho antigo não existir, tentar reconstruir
      if (!fs.existsSync(caminhoArquivo)) {
        const [ano, mes] = periodo.split('-');
        const nomeArquivo = path.basename(registro.caminhoArquivo);
        caminhoArquivo = path.join(__dirname, 'uploads', ano, mes, nomeArquivo);
      }
    }
    
    // Tentar remover o arquivo físico
    if (caminhoArquivo && fs.existsSync(caminhoArquivo)) {
      fs.unlinkSync(caminhoArquivo);
    }
    
    // Remover o registro
    registroPeriodos.splice(registroIndex, 1);
    
    // Salvar o registro atualizado
    fs.writeFileSync(registroPath, JSON.stringify(registroPeriodos, null, 2));
    
    res.json({ success: true, message: `Período ${periodo} removido com sucesso` });
  } catch (error) {
    console.error('Erro ao remover período:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao remover período',
      error: error.message
    });
  }
});

// Função para migrar registros antigos para o novo formato (utilitário)
app.get('/api/migrar-registros', (req, res) => {
  const registroPath = path.join(__dirname, 'uploads', 'registro_periodos.json');
  
  if (!fs.existsSync(registroPath)) {
    return res.status(404).json({ success: false, message: 'Arquivo de registros não encontrado' });
  }
  
  try {
    const registroData = fs.readFileSync(registroPath, 'utf8');
    const registroPeriodos = JSON.parse(registroData);
    
    // Converter registros antigos para o novo formato
    const registrosAtualizados = registroPeriodos.map(registro => {
      // Se já tem caminhoRelativo, manter como está
      if (registro.caminhoRelativo) {
        return registro;
      }
      
      // Converter caminho absoluto para relativo
      if (registro.caminhoArquivo) {
        const nomeArquivo = path.basename(registro.caminhoArquivo);
        const [ano, mes] = registro.periodo.split('-');
        
        // Adicionar campos do novo formato
        registro.caminhoRelativo = path.join(ano, mes, nomeArquivo);
        registro.nomeArquivo = nomeArquivo;
      }
      
      return registro;
    });
    
    // Salvar registros atualizados
    fs.writeFileSync(registroPath, JSON.stringify(registrosAtualizados, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Registros migrados com sucesso',
      count: registrosAtualizados.length
    });
  } catch (error) {
    console.error('Erro ao migrar registros:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao migrar registros',
      error: error.message
    });
  }
});

// Endpoint para salvar categorizações no arquivo categorias.js
app.post('/api/salvar-categorias', (req, res) => {
  try {
    const { mapeamentoCategorias, categoriasPersonalizadas } = req.body;
    
    if (!mapeamentoCategorias || !categoriasPersonalizadas) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados incompletos. Ambos mapeamentoCategorias e categoriasPersonalizadas são necessários.'
      });
    }
    
    // Caminho para o arquivo categorias.js
    const categoriasPath = path.join(__dirname, '../categorias.js');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(categoriasPath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Arquivo categorias.js não encontrado'
      });
    }
    
    // Criar conteúdo do arquivo
    const conteudo = `// categorias.js - Mapeamento de fornecedores para categorias
const mapeamentoCategorias = ${JSON.stringify(mapeamentoCategorias, null, 2)};

// Estrutura de organização do DRE
const estruturaDRE = ${JSON.stringify(req.body.estruturaDRE || {
  "Receitas": [
    "Receitas IFOOD",
    "Crédito/Débito/Pix",
    "Aporte Sócio"
  ],
  "Custos Diretos": [
    "Ingredientes Frios", 
    "Ingredientes Secos", 
    "Carnes", 
    "Hortifruti", 
    "Chopp", 
    "Bebidas", 
    "Doces", 
    "Embalagem/Descartável"
  ],
  "Despesas de Vendas": [
    "Propaganda e Publicidade",
    "Anúncio",
    "Free Lance/taxa",
    "Artístico"
  ],
  "Despesas Administrativas": [
    "Material de Reposição",
    "Material de Limpeza/Higiene",
    "Manutenção Predial",
    "Manutenção de Informática",
    "Manutenção de Equipamentos",
    "Manutenção Móveis e Utensílios",
    "Sistema Cenna",
    "Material de Escritório",
    "Consultoria/Assessoria",
    "Contabilidade",
    "Advogado",
    "Locação Equipamentos",
    "Outras despesas ADM"
  ],
  "Despesas com Infraestrutura": [
    "Aluguel",
    "Condomínio",
    "Energia Elétrica",
    "Gás",
    "Telefone e TV a Cabo",
    "Serviços Gráficos",
    "Dedetização",
    "Seguro",
    "Aquisição de Equipamentos",
    "Combustível"
  ],
  "Despesas Financeiras": [
    "Despesa Bancária"
  ],
  "Despesas com Sócios": [
    "Despesas Sócios"
  ],
  "Impostos": [
    "Imposto de Renda",
    "DAS"
  ]
}, null, 2)};`;
    
    // Verificar se precisamos criar um backup hoje
    let backupPath = null;
    let backupCriado = false;
    
    // Pasta de backups
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Formato da data atual: YYYY-MM-DD
    const hoje = new Date().toISOString().split('T')[0];
    const backupDiario = path.join(backupDir, `categorias.backup-${hoje}.js`);
    
    // Verificar se já existe um backup para hoje
    if (!fs.existsSync(backupDiario)) {
      // Criar backup com a data de hoje
      backupPath = backupDiario;
      fs.copyFileSync(categoriasPath, backupPath);
      backupCriado = true;
      console.log(`Backup diário criado: ${backupPath}`);
    } else {
      console.log(`Backup diário já existe para ${hoje}, pulando criação`);
    }
    
    // Escrever o novo conteúdo no arquivo
    fs.writeFileSync(categoriasPath, conteudo);
    
    res.json({ 
      success: true, 
      message: 'Categorizações salvas com sucesso no arquivo categorias.js',
      backupCriado: backupCriado,
      backupPath: backupCriado ? path.basename(backupPath) : null
    });
  } catch (error) {
    console.error('Erro ao salvar categorizações:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao salvar categorizações no arquivo',
      error: error.message
    });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT}/api/status para verificar o status`);
  console.log(`Diretório de uploads: ${path.join(__dirname, 'uploads')}`);
  console.log(`Para migrar registros antigos, acesse http://localhost:${PORT}/api/migrar-registros`);
});