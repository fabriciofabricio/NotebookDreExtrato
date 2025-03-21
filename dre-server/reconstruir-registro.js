/**
 * Script para recriar o arquivo registro_periodos.json com base nos arquivos existentes
 * Salve este arquivo como reconstruir-registro.js na pasta dre-server
 */

const fs = require('fs');
const path = require('path');

// Diretório raiz de uploads
const uploadsDir = path.join(__dirname, 'uploads');
const registroPath = path.join(uploadsDir, 'registro_periodos.json');

// Array para armazenar os registros encontrados
const registros = [];

// Procurar arquivos .xlsx nas pastas de anos/meses
function buscarArquivos() {
  // Listar diretórios de anos
  const anos = fs.readdirSync(uploadsDir).filter(item => {
    const itemPath = path.join(uploadsDir, item);
    const stat = fs.statSync(itemPath);
    return stat.isDirectory() && /^\d{4}$/.test(item); // Formato de 4 dígitos para ano
  });

  console.log(`Anos encontrados: ${anos.join(', ')}`);

  // Para cada ano, procurar os diretórios de meses
  anos.forEach(ano => {
    const anoDir = path.join(uploadsDir, ano);
    
    const meses = fs.readdirSync(anoDir).filter(item => {
      const itemPath = path.join(anoDir, item);
      const stat = fs.statSync(itemPath);
      return stat.isDirectory() && /^\d{2}$/.test(item); // Formato de 2 dígitos para mês
    });

    console.log(`Meses encontrados para ${ano}: ${meses.join(', ')}`);

    // Para cada mês, procurar os arquivos Excel
    meses.forEach(mes => {
      const mesDir = path.join(anoDir, mes);
      
      const arquivos = fs.readdirSync(mesDir).filter(item => {
        return item.endsWith('.xlsx') || item.endsWith('.xls'); // Apenas arquivos Excel
      });

      console.log(`Arquivos encontrados para ${ano}-${mes}: ${arquivos.length}`);

      // Para cada arquivo, criar um registro
      arquivos.forEach(arquivo => {
        const arquivoPath = path.join(mesDir, arquivo);
        const stat = fs.statSync(arquivoPath);
        
        // Período baseado no ano e mês do diretório
        const periodo = `${ano}-${mes}`;
        
        // Usar a data de modificação do arquivo como dataUpload
        const dataUpload = stat.mtime.toISOString();
        
        // Extrair parte do nome para usar como nomeOriginal
        let nomeOriginal = arquivo;
        if (arquivo.includes('-')) {
          // Tenta remover prefixos como "2025-01-123456789.xlsx"
          const partes = arquivo.split('-');
          if (partes.length >= 3) {
            // Pega apenas o timestamp e extensão
            const timestamp = partes[2].split('.')[0];
            nomeOriginal = `Extrato-${periodo}-${timestamp}.xlsx`;
          }
        }
        
        // Construir o registro
        const registro = {
          periodo: periodo,
          caminhoRelativo: path.join(ano, mes, arquivo),
          nomeArquivo: arquivo,
          nomeOriginal: nomeOriginal,
          tamanho: stat.size,
          dataUpload: dataUpload
        };
        
        registros.push(registro);
      });
    });
  });
}

// Salvar os registros encontrados no arquivo JSON
function salvarRegistros() {
  // Ordenar os registros por período (mais recente primeiro)
  registros.sort((a, b) => b.periodo.localeCompare(a.periodo));
  
  // Criar backup do arquivo original se existir
  if (fs.existsSync(registroPath)) {
    const backupPath = `${registroPath}.backup-${Date.now()}.json`;
    fs.copyFileSync(registroPath, backupPath);
    console.log(`Backup do registro original criado em: ${backupPath}`);
  }
  
  // Salvar no arquivo
  fs.writeFileSync(registroPath, JSON.stringify(registros, null, 2));
  
  console.log(`Total de ${registros.length} registros salvos em ${registroPath}`);
}

// Executar o script
try {
  console.log('Iniciando busca de arquivos...');
  buscarArquivos();
  
  console.log('Salvando registros...');
  salvarRegistros();
  
  console.log('Script concluído com sucesso!');
} catch (error) {
  console.error('Erro ao executar o script:', error);
}