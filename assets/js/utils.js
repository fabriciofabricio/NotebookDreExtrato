/**
 * Funções utilitárias para o Dashboard DRE
 */

// Função para extrair data/hora da linha, focando especificamente na coluna G
function getDataHoraDaLinha(linha) {
    // Tentar obter a data diretamente da sétima coluna (índice 6)
    const keys = Object.keys(linha);
    if (keys.length > 6) {
      const colunaG = keys[6];
      return linha[colunaG];
    }
    
    // Fallbacks, caso não encontre pela posição da coluna
    if (linha['Data'] !== undefined) {
      return linha['Data'];
    } else if (linha['Data/Hora'] !== undefined) {
      return linha['Data/Hora'];
    }
    
    // Se não encontrar, retornar null
    return null;
  }
  
  // Função melhorada para formatar data/hora no padrão brasileiro
  function formatarDataHora(dataHora) {
    if (!dataHora) return '-';
    
    try {
      // Se for um objeto Date
      if (dataHora instanceof Date) {
        // Verificar se é uma data válida
        if (isNaN(dataHora.getTime())) {
          return '-';
        }
        
        // Garantir que estamos no ano de 2025 e dentro do mês de fevereiro
        const ano = dataHora.getFullYear();
        const mes = dataHora.getMonth() + 1; // JavaScript conta meses de 0-11
        
        // Se a data estiver fora do intervalo esperado (fevereiro de 2025), pode ser um erro de interpretação
        if (ano !== 2025 || (mes !== 2 && mes !== 3 && mes !== 1)) {
          // Provavelmente é uma data em formato americano MM/DD/YYYY, vamos corrigi-la
          // Invertendo mês e dia
          const dia = dataHora.getMonth() + 1;
          const mesCorrigido = dataHora.getDate();
          
          return `${String(dia).padStart(2, '0')}/${String(mesCorrigido).padStart(2, '0')}/${ano} ${String(dataHora.getHours()).padStart(2, '0')}:${String(dataHora.getMinutes()).padStart(2, '0')}`;
        }
        
        // Formato normal brasileiro
        return `${String(dataHora.getDate()).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano} ${String(dataHora.getHours()).padStart(2, '0')}:${String(dataHora.getMinutes()).padStart(2, '0')}`;
      }
      
      // Se for uma string que já está no formato correto, retornar como está
      if (typeof dataHora === 'string') {
        // Formato brasileiro DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}/.test(dataHora)) {
          return dataHora;
        }
        
        // Tenta converter para Date e formatar
        try {
          const [dataParte, horaParte] = dataHora.split(' ');
          if (dataParte && horaParte) {
            // Se parece estar em formato ISO ou outro formato reconhecível
            const data = new Date(dataHora);
            if (!isNaN(data.getTime())) {
              // Verificar se a data está dentro do período esperado (fevereiro de 2025)
              const ano = data.getFullYear();
              const mes = data.getMonth() + 1;
              
              if (ano !== 2025 || (mes !== 2 && mes !== 3 && mes !== 1)) {
                // Provavelmente é um erro de interpretação MM/DD/YYYY
                const partes = dataParte.split(/[\/\-]/);
                if (partes.length === 3) {
                  // Inverter mês e dia
                  return `${partes[1]}/${partes[0]}/${partes[2]} ${horaParte}`;
                }
              }
              
              return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${ano} ${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
            }
          }
        } catch (e) {
          console.log("Erro ao processar string de data:", e);
        }
        
        // Se não conseguimos processar como Date, retornar a string original
        return dataHora;
      }
      
      // Se for outro tipo, retornar como string
      return String(dataHora);
    } catch (e) {
      console.error('Erro ao formatar data/hora:', e);
      return '-';
    }
  }
  
  // Função para formatar valor monetário
  function formatarValor(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  
  // Função para converter string para número
  function converterParaNumero(valor) {
    if (valor === null || valor === undefined) {
      return 0;
    }
    
    if (typeof valor === 'number') {
      return valor;
    }
    
    // Verificar se é uma string
    if (typeof valor !== 'string') {
      return 0;
    }
    
    // Tratar caso especial "Grátis"
    if (valor === 'Grátis') {
      return 0;
    }
    
    // Remover símbolo de moeda, espaços e substituir vírgula por ponto
    let valorLimpo = valor.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
    
    // Se o valor começa com '-', é negativo
    const ehNegativo = valorLimpo.startsWith('-');
    if (ehNegativo) {
      valorLimpo = valorLimpo.substring(1);
    }
    
    // Converter para número
    let numero = parseFloat(valorLimpo);
    if (isNaN(numero)) {
      return 0;
    }
    
    // Aplicar sinal negativo se necessário
    return ehNegativo ? -numero : numero;
  }
  
  // Função para salvar o mapeamento atualizado no localStorage
  function salvarMapeamentoLocalStorage(mapeamentoCategorias, categoriasPersonalizadas) {
    try {
      localStorage.setItem('mapeamentoCategorias', JSON.stringify(mapeamentoCategorias));
      localStorage.setItem('categoriasPersonalizadas', JSON.stringify(categoriasPersonalizadas));
      console.log('Mapeamento salvo com sucesso no localStorage');
    } catch (erro) {
      console.error('Erro ao salvar mapeamento:', erro);
    }
  }
  
  // Função para carregar mapeamento do localStorage
  function carregarMapeamentoLocalStorage(mapeamentoCategorias, categoriasPersonalizadas) {
    try {
      const mapeamentoSalvo = localStorage.getItem('mapeamentoCategorias');
      const categoriasSalvas = localStorage.getItem('categoriasPersonalizadas');
      
      if (mapeamentoSalvo) {
        Object.assign(mapeamentoCategorias, JSON.parse(mapeamentoSalvo));
      }
      
      if (categoriasSalvas) {
        const categoriasCarregadas = JSON.parse(categoriasSalvas);
        Object.assign(categoriasPersonalizadas, categoriasCarregadas);
      }
      
      console.log('Mapeamento carregado do localStorage');
      return { mapeamentoCategorias, categoriasPersonalizadas };
    } catch (erro) {
      console.error('Erro ao carregar mapeamento:', erro);
      return { mapeamentoCategorias, categoriasPersonalizadas };
    }
  }