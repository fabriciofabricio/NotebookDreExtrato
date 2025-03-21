/**
 * Script para atribuir períodos corretos aos arquivos
 * Salve como atribuir-periodos.js na pasta dre-server
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Diretório raiz de uploads
const uploadsDir = path.join(__dirname, 'uploads');
const registroPath = path.join(uploadsDir, 'registro_periodos.json');

// Interface para entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Definir o mapeamento de arquivos para períodos
// Edite esta tabela para definir o período real de cada arquivo
const mapeamentoPeriodos = {
  // Formato: 'nome-do-arquivo.xlsx': 'YYYY-MM'
  '2025-01-1742517004585.xlsx': '2025-02', // Fevereiro 2025
  '2025-01-1742517053785.xlsx': '2025-01', // Janeiro 2025
  '2025-01-1742517074234.xlsx': '2024-12', // Dezembro 2024
  '2025-01-1742517224198.xlsx': '2024-11', // Novembro 2024
  '2025-01-1742517310218.xlsx': '2024-10', // Outubro 2024
  '2025-01-1742517521585.xlsx': '2024-09', // Setembro 2024
  '2025-01-1742517654165.xlsx': '2024-08', // Agosto 2024
  '2025-01-1742517729257.xlsx': '2024-07', // Julho 2024
  '2025-01-1742517805807.xlsx': '2024-06', // Junho 2024
  '2025-01-1742517862892.xlsx': '2024-05', // Maio 2024
  '2025-01-1742517930326.xlsx': '2024-04', // Abril 2024
  '2025-01-1742518018338.xlsx': '2024-03', // Março 2024
  '2025-01-1742518065776.xlsx': '2024-02', // Fevereiro 2024
  '2025-01-1742518188320.xlsx': '2024-01'  // Janeiro 2024
};

// Ler o arquivo de registro
function lerRegistro() {
  if (!fs.existsSync(registroPath)) {
    console.log('Arquivo de registro não encontrado!');
    return [];
  }
  
  const registroData = fs.readFileSync(registroPath, 'utf8');
  return JSON.parse(registroData);
}

// Listar arquivos na pasta 2025/01
function listarArquivos() {
  const diretorio = path.join(uploadsDir, '2025', '01');
  
  if (!fs.existsSync(diretorio)) {
    console.log('Diretório 2025/01 não encontrado!');
    return [];
  }
  
  return fs.readdirSync(diretorio)
    .filter(arquivo => arquivo.endsWith('.xlsx') || arquivo.endsWith('.xls'))
    .sort();
}

// Função principal para atribuir períodos
async function atribuirPeriodos() {
  // Ler registros existentes
  const registros = lerRegistro();
  console.log(`Total de ${registros.length} registros encontrados`);
  
  // Listar arquivos
  const arquivos = listarArquivos();
  console.log(`\nTotal de ${arquivos.length} arquivos encontrados na pasta 2025/01:`);
  
  arquivos.forEach((arquivo, index) => {
    console.log(`${index + 1}. ${arquivo} => ${mapeamentoPeriodos[arquivo] || 'Sem período definido'}`);
  });
  
  // Confirmar se o usuário deseja continuar com o mapeamento definido
  const resposta = await new Promise(resolve => {
    rl.question('\nDeseja aplicar os períodos definidos para os arquivos? (s/n): ', answer => {
      resolve(answer.toLowerCase());
    });
  });
  
  if (resposta !== 's' && resposta !== 'sim') {
    console.log('Operação cancelada pelo usuário.');
    rl.close();
    return;
  }
  
  // Fazer backup do arquivo original
  const backupPath = `${registroPath}.backup-${Date.now()}.json`;
  if (fs.existsSync(registroPath)) {
    fs.copyFileSync(registroPath, backupPath);
    console.log(`\nBackup do registro original criado em: ${backupPath}`);
  }
  
  // Criar novos registros com os períodos corretos
  const novosRegistros = [];
  let erros = 0;
  
  for (const arquivo of arquivos) {
    const periodo = mapeamentoPeriodos[arquivo];
    
    if (!periodo) {
      console.log(`ERRO: Período não definido para o arquivo ${arquivo}`);
      erros++;
      continue;
    }
    
    // Verificar se o arquivo existe
    const arquivoPath = path.join(uploadsDir, '2025', '01', arquivo);
    if (!fs.existsSync(arquivoPath)) {
      console.log(`ERRO: Arquivo não encontrado: ${arquivoPath}`);
      erros++;
      continue;
    }
    
    // Obter informações do arquivo
    const stat = fs.statSync(arquivoPath);
    
    // Criar registro para o arquivo com o período correto
    const registro = {
      periodo: periodo,
      caminhoRelativo: path.join('2025', '01', arquivo),
      nomeArquivo: arquivo,
      nomeOriginal: arquivo,
      tamanho: stat.size,
      dataUpload: new Date().toISOString()
    };
    
    // Verificar se já existe um registro para este período
    const registroExistente = novosRegistros.find(reg => reg.periodo === periodo);
    if (registroExistente) {
      console.log(`AVISO: Já existe um registro para o período ${periodo}. Substituindo...`);
    }
    
    novosRegistros.push(registro);
    console.log(`Período ${periodo} atribuído ao arquivo ${arquivo}`);
  }
  
  // Adicionar registros existentes que não são da pasta 2025/01
  for (const reg of registros) {
    // Verificar se o registro não é da pasta 2025/01
    if (reg.caminhoRelativo && !reg.caminhoRelativo.startsWith(path.join('2025', '01'))) {
      // Verificar se já temos um registro para este período
      const existente = novosRegistros.find(r => r.periodo === reg.periodo);
      
      if (!existente) {
        novosRegistros.push(reg);
        console.log(`Mantido registro existente para o período ${reg.periodo}`);
      }
    }
  }
  
  // Salvar os novos registros
  fs.writeFileSync(registroPath, JSON.stringify(novosRegistros, null, 2));
  console.log(`\nNovos registros salvos (${novosRegistros.length} registros)`);
  
  if (erros > 0) {
    console.log(`Atenção: ocorreram ${erros} erros durante o processo.`);
  }
  
  rl.close();
}

// Executar o script
atribuirPeriodos().catch(error => {
  console.error('Erro:', error);
  rl.close();
});