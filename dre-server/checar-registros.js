/**
 * Script para verificar os arquivos registrados vs. arquivos reais
 * Salve como checar-registros.js na pasta dre-server
 */

const fs = require('fs');
const path = require('path');

// Diretório raiz de uploads
const uploadsDir = path.join(__dirname, 'uploads');
const registroPath = path.join(uploadsDir, 'registro_periodos.json');

console.log('===== VERIFICAÇÃO DE REGISTROS DE PERÍODOS =====');

// Verificar se o arquivo de registro existe
if (!fs.existsSync(registroPath)) {
  console.log('Arquivo de registro não encontrado!');
  process.exit(1);
}

// Ler o arquivo de registro
const registroData = fs.readFileSync(registroPath, 'utf8');
const registros = JSON.parse(registroData);

console.log(`Total de ${registros.length} períodos registrados:`);

// Verificar cada registro
registros.forEach(registro => {
  console.log(`\n== Período: ${registro.periodo} ==`);
  
  // Verificar caminho relativo
  let caminhoArquivo;
  if (registro.caminhoRelativo) {
    caminhoArquivo = path.join(__dirname, 'uploads', registro.caminhoRelativo);
    console.log(`Caminho relativo: ${registro.caminhoRelativo}`);
  } else if (registro.caminhoArquivo) {
    caminhoArquivo = registro.caminhoArquivo;
    console.log(`Caminho absoluto: ${registro.caminhoArquivo}`);
  } else {
    console.log('Nenhum caminho encontrado no registro!');
    return;
  }
  
  // Verificar se o arquivo existe
  const arquivoExiste = fs.existsSync(caminhoArquivo);
  console.log(`Arquivo registrado existe: ${arquivoExiste ? 'SIM' : 'NÃO'}`);
  
  if (arquivoExiste) {
    console.log(`Nome do arquivo: ${path.basename(caminhoArquivo)}`);
    console.log(`Tamanho: ${fs.statSync(caminhoArquivo).size} bytes`);
  }
  
  // Verificar pasta do período
  const [ano, mes] = registro.periodo.split('-');
  const periodoDir = path.join(__dirname, 'uploads', ano, mes);
  
  if (fs.existsSync(periodoDir)) {
    const arquivosNaPasta = fs.readdirSync(periodoDir).filter(f => 
      f.endsWith('.xlsx') || f.endsWith('.xls')
    );
    
    console.log(`\nTotal de ${arquivosNaPasta.length} arquivos na pasta ${ano}/${mes}:`);
    
    arquivosNaPasta.forEach((arquivo, index) => {
      const arquivoPath = path.join(periodoDir, arquivo);
      const isRegistrado = caminhoArquivo && 
                          (caminhoArquivo === arquivoPath || 
                           path.basename(caminhoArquivo) === arquivo);
      
      console.log(`${index + 1}. ${arquivo} (${fs.statSync(arquivoPath).size} bytes)${isRegistrado ? ' - REGISTRADO' : ''}`);
    });
  } else {
    console.log(`\nPasta ${ano}/${mes} não encontrada!`);
  }
});