/**
 * Funções para gerenciamento de períodos no Dashboard DRE
 * Versão integrada com backend para salvar arquivos físicos
 */

// URL base da API do backend (ajuste conforme necessário)
const API_BASE_URL = 'http://localhost:3000/api';

// Verificar conexão com o servidor
async function verificarServidor() {
  try {
    const response = await fetch(`${API_BASE_URL}/status`);
    const data = await response.json();
    console.log('Status do servidor:', data);
    return data.status === 'online';
  } catch (erro) {
    console.error('Erro ao conectar com o servidor:', erro);
    return false;
  }
}

// Carregar dados de períodos do servidor
async function carregarPeriodos() {
  try {
    console.log('Carregando períodos do servidor...');

    const serverOnline = await verificarServidor();
    if (!serverOnline) {
      alert('O servidor não está acessível. Verifique se o servidor está rodando.');
      periodos = {};
      return;
    }

    // Fazer requisição para a API
    const response = await fetch(`${API_BASE_URL}/periodos`);
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar períodos: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Dados recebidos do servidor:', data);
    
    // Inicializar o objeto de períodos
    periodos = {};
    
    // Converter a lista de períodos para o formato esperado pela aplicação
    if (data.periodos && Array.isArray(data.periodos)) {
      data.periodos.forEach(item => {
        // Extrair ano e mês do período
        const [ano, mes] = item.periodo.split('-');
        
        // Criar entrada no objeto periodos
        periodos[item.periodo] = {
          processadoEm: new Date(item.dataUpload).toLocaleString('pt-BR'),
          nomeArquivo: item.nomeOriginal,
          // Os dados reais serão carregados sob demanda quando o período for selecionado
          dadosCarregados: false
        };
      });
    }
    
    console.log(`${Object.keys(periodos).length} períodos encontrados no servidor`);
  } catch (erro) {
    console.error('Erro ao carregar períodos do servidor:', erro);
    alert('Não foi possível carregar os períodos do servidor. Verifique se o servidor está rodando.');
    
    // Inicializar como objeto vazio em caso de erro
    periodos = {};
  }
}

// Atualizar o seletor de períodos
function atualizarSeletorPeriodos() {
  const seletor = document.getElementById('seletorPeriodo');
  if (!seletor) {
    console.error('Elemento seletorPeriodo não encontrado!');
    return;
  }
  
  // Guardar valor atual
  const valorAtual = seletor.value;
  
  // Limpar opções
  seletor.innerHTML = '<option value="">Selecione um período</option>';
  
  // Obter períodos ordenados (mais recentes primeiro)
  const periodosOrdenados = Object.keys(periodos).sort().reverse();
  
  // Adicionar opções
  periodosOrdenados.forEach(periodo => {
    const option = document.createElement('option');
    option.value = periodo;
    
    // Formatar data: YYYY-MM para MM/YYYY
    const [ano, mes] = periodo.split('-');
    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const nomeMes = nomesMeses[parseInt(mes) - 1];
    
    option.textContent = `${nomeMes} de ${ano}`;
    seletor.appendChild(option);
  });
  
  // Restaurar valor selecionado se ainda existir
  if (valorAtual && periodosOrdenados.includes(valorAtual)) {
    seletor.value = valorAtual;
  } else if (periodosOrdenados.length > 0) {
    // Selecionar o período mais recente se o anterior não existir mais
    seletor.value = periodosOrdenados[0];
  }
  
  // Atualizar o período atual
  periodoAtual = seletor.value;
}

// Atualizar a lista de períodos
function atualizarListaPeriodos() {
  const lista = document.getElementById('listaPeriodos');
  if (!lista) {
    console.error('Elemento listaPeriodos não encontrado!');
    return;
  }
  
  lista.innerHTML = '';
  
  // Obter períodos ordenados (mais recentes primeiro)
  const periodosOrdenados = Object.keys(periodos).sort().reverse();
  
  if (periodosOrdenados.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 3;
    td.textContent = 'Nenhum período cadastrado';
    td.className = 'text-center';
    tr.appendChild(td);
    lista.appendChild(tr);
    return;
  }
  
  // Adicionar linhas na tabela
  periodosOrdenados.forEach(periodo => {
    const tr = document.createElement('tr');
    
    // Destacar período atual
    if (periodo === periodoAtual) {
      tr.classList.add('table-primary');
    }
    
    // Coluna: Período
    const tdPeriodo = document.createElement('td');
    const [ano, mes] = periodo.split('-');
    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const nomeMes = nomesMeses[parseInt(mes) - 1];
    tdPeriodo.textContent = `${nomeMes} de ${ano}`;
    tr.appendChild(tdPeriodo);
    
    // Coluna: Data de Processamento
    const tdData = document.createElement('td');
    tdData.textContent = periodos[periodo].processadoEm || '-';
    tr.appendChild(tdData);
    
    // Coluna: Ações
    const tdAcoes = document.createElement('td');
    tdAcoes.innerHTML = `
      <button class="btn btn-sm btn-outline-primary me-2" data-periodo="${periodo}" title="Carregar">
        <i class="fas fa-sync-alt"></i>
      </button>
      <button class="btn btn-sm btn-outline-secondary me-2" data-periodo="${periodo}" title="Download">
        <i class="fas fa-download"></i>
      </button>
      <button class="btn btn-sm btn-outline-danger" data-periodo="${periodo}" title="Excluir">
        <i class="fas fa-trash"></i>
      </button>
    `;
    tr.appendChild(tdAcoes);
    
    // Adicionar eventos nos botões
    // Botão de carregar
    tdAcoes.querySelector('.btn-outline-primary').addEventListener('click', function() {
      carregarPeriodo(periodo);
    });
    
    // Botão de download
    tdAcoes.querySelector('.btn-outline-secondary').addEventListener('click', function() {
      downloadArquivoPeriodo(periodo);
    });
    
    // Botão de excluir
    tdAcoes.querySelector('.btn-outline-danger').addEventListener('click', function() {
      if (confirm(`Tem certeza que deseja excluir o período ${tdPeriodo.textContent}?`)) {
        removerPeriodo(periodo);
      }
    });
    
    lista.appendChild(tr);
  });
}

// Adicionar novo período
async function adicionarNovoPeriodo() {
  console.log("Função adicionarNovoPeriodo iniciada");
  
  // Verificar conexão com o servidor
  const serverOnline = await verificarServidor();
  if (!serverOnline) {
    alert('O servidor não está acessível. Verifique se o servidor está rodando.');
    return;
  }
  
  // Verificar elementos do formulário
  const mesPeriodo = document.getElementById('mesPeriodo');
  const anoPeriodo = document.getElementById('anoPeriodo');
  const arquivoInput = document.getElementById('arquivoPeriodo');
  
  if (!mesPeriodo || !anoPeriodo || !arquivoInput) {
    console.error("Erro: elementos do formulário não encontrados");
    alert("Erro interno: elementos do formulário não encontrados");
    return;
  }
  
  const mes = mesPeriodo.value;
  const ano = anoPeriodo.value;
  
  // Verificar se o arquivo foi selecionado
  if (!arquivoInput.files || arquivoInput.files.length === 0) {
    alert('Por favor, selecione um arquivo Excel.');
    return;
  }
  
  const arquivo = arquivoInput.files[0];
  
  if (!mes || !ano || !arquivo) {
    alert('Por favor, preencha todos os campos.');
    return;
  }
  
  // Criar chave do período: YYYY-MM
  const periodo = `${ano}-${mes.padStart(2, '0')}`;
  
  // Verificar se já existe
  if (periodos[periodo] && !confirm(`Já existe um extrato para ${mes}/${ano}. Deseja substituir?`)) {
    return;
  }
  
  loadingOverlay.style.display = 'flex';
  
  try {
    console.log("Enviando arquivo para o servidor...");
    console.log("Dados do formulário:", { mes, ano, arquivo: arquivo.name });
    
    // Criar FormData para enviar o arquivo
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    formData.append('ano', ano);
    formData.append('mes', mes);
    
    console.log("FormData criado, enviando para:", `${API_BASE_URL}/upload`);
    
    // Enviar para o servidor
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    
    console.log("Resposta recebida:", response.status, response.statusText);
    
    const data = await response.json();
    console.log("Dados da resposta:", data);
    
    if (!data.success) {
      throw new Error(data.message || 'Erro desconhecido ao processar o arquivo');
    }
    
    console.log("Arquivo enviado com sucesso:", data);
    
    // Adicionar o período localmente
    periodos[periodo] = {
      processadoEm: new Date().toLocaleString('pt-BR'),
      nomeArquivo: arquivo.name,
      dadosCarregados: false
    };
    
    // Atualizar interface
    atualizarSeletorPeriodos();
    atualizarListaPeriodos();
    
    // Limpar formulário
    document.getElementById('formNovoPeriodo').reset();
    
    // Perguntar se deseja carregar o período adicionado
    if (confirm('Período adicionado com sucesso! Deseja carregá-lo agora?')) {
      carregarPeriodo(periodo);
    }
    
  } catch (erro) {
    console.error('Erro ao processar o arquivo:', erro);
    alert('Erro ao processar o arquivo: ' + (erro.message || 'Erro desconhecido'));
  } finally {
    loadingOverlay.style.display = 'none';
  }
}

// Carregar período selecionado no dropdown
function carregarPeriodoSelecionado() {
  const periodo = document.getElementById('seletorPeriodo').value;
  if (!periodo) {
    alert('Por favor, selecione um período.');
    return;
  }
  
  carregarPeriodo(periodo);
}

// Carregar um período específico
async function carregarPeriodo(periodo) {
  if (!periodos[periodo]) {
    alert('Período não encontrado.');
    return;
  }
  
  // Atualizar o período atual e o seletor
  periodoAtual = periodo;
  document.getElementById('seletorPeriodo').value = periodo;
  
  loadingOverlay.style.display = 'flex';
  
  try {
    // Verificar se os dados já foram carregados
    if (!periodos[periodo].dadosCarregados || !periodos[periodo].dados) {
      console.log(`Baixando dados do período ${periodo} do servidor...`);
      
      // Fazer o download do arquivo XLSX do servidor
      const response = await fetch(`${API_BASE_URL}/download/${periodo}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao baixar arquivo: ${response.status} ${response.statusText}`);
      }
      
      // Converter para ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();
      
      // Processar o XLSX
      const XLSX = window.XLSX;
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), {
        cellDates: true,
        cellNF: true,
        dateNF: 'dd/mm/yyyy hh:mm',
        raw: false
      });
      
      // Selecionar a primeira planilha
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Converter para JSON
      const dados = XLSX.utils.sheet_to_json(sheet);
      
      // Obter cabeçalhos
      const range = XLSX.utils.decode_range(sheet['!ref']);
      const colunas = [];
      
      for (let c = 0; c <= range.e.c; c++) {
        const cellAddress = XLSX.utils.encode_cell({r: 0, c: c});
        const cell = sheet[cellAddress];
        if (cell && cell.v) {
          colunas[c] = cell.v;
        }
      }
      
      // Processar os dados
      const dadosProcessados = processarDadosExtrato(dados, colunas);
      
      // Armazenar os dados processados
      periodos[periodo].dados = dadosProcessados;
      periodos[periodo].dadosCarregados = true;
      
      console.log(`Dados do período ${periodo} carregados: ${dadosProcessados.length} registros`);
    } else {
      console.log(`Usando dados já carregados do período ${periodo}`);
    }
    
    // Carregar dados para processamento
    dadosExtrato = periodos[periodo].dados;
    
    // Gerar DRE com os dados carregados
    gerarDRE();
    
    // Atualizar exibição do período
    const [ano, mes] = periodo.split('-');
    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const nomeMes = nomesMeses[parseInt(mes) - 1];
    document.getElementById('periodoInfo').textContent = `Período: ${nomeMes} de ${ano}`;
    
    // Atualizar destaque na lista de períodos
    atualizarListaPeriodos();
    
    // Mudar para a aba Dashboard
    document.querySelector('a[href="#dashboard"]').click();
    
    // Mostrar mensagem
    alert(`Dados do período ${nomeMes} de ${ano} carregados com sucesso!`);
    
  } catch (erro) {
    console.error(`Erro ao carregar período ${periodo}:`, erro);
    alert(`Erro ao carregar dados do período: ${erro.message || 'Erro desconhecido'}`);
  } finally {
    loadingOverlay.style.display = 'none';
  }
}

// Fazer download do arquivo original de um período
function downloadArquivoPeriodo(periodo) {
  if (!periodos[periodo]) {
    alert('Período não encontrado.');
    return;
  }
  
  // Redirecionar para o endpoint de download
  window.open(`${API_BASE_URL}/download/${periodo}`, '_blank');
}

// Remover um período
async function removerPeriodo(periodo) {
  if (!periodos[periodo]) {
    alert('Período não encontrado.');
    return;
  }
  
  loadingOverlay.style.display = 'flex';
  
  try {
    // Enviar requisição DELETE para o servidor
    const response = await fetch(`${API_BASE_URL}/periodo/${periodo}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `Erro ao remover período: ${response.status} ${response.statusText}`);
    }
    
    // Remover do objeto local
    delete periodos[periodo];
    
    // Se removeu o período atual, limpar os dados atuais
    if (periodo === periodoAtual) {
      dadosExtrato = [];
      dadosDRE = [];
      periodoAtual = '';
      document.getElementById('periodoInfo').textContent = 'Período: -';
      
      // Atualizar dashboard com valores zerados
      atualizarDashboard(0, 0, 0, 0, 0);
      atualizarTabelaDRE();
      atualizarTabelasDespesas({}, 0, 0);
    }
    
    // Atualizar interface
    atualizarSeletorPeriodos();
    atualizarListaPeriodos();
    
    alert('Período removido com sucesso!');
    
  } catch (erro) {
    console.error('Erro ao remover período:', erro);
    alert('Erro ao remover período: ' + (erro.message || 'Erro desconhecido'));
  } finally {
    loadingOverlay.style.display = 'none';
  }
}

// Processar dados do extrato
function processarDadosExtrato(dados, colunas) {
  // Pegar índice da coluna O
  const colunaONome = colunas[14]; // índice 14 = coluna O
  
  // Processar dados (código similar ao atual processarExtrato)
  return dados.map(linha => {
    const valor = converterParaNumero(linha['Valor']);
    const tarifa = converterParaNumero(linha['Tarifa']);
    const valorLiquido = valor - tarifa;
    
    const resultado = { ...linha };
    resultado['Valor Líquido'] = valorLiquido;
    
    // Processamento para Coluna T (IFOOD, ELCIO, SIDINEI)
    if (colunaONome && linha[colunaONome]) {
      const valorColunaO = linha[colunaONome];
      if (typeof valorColunaO === 'string') {
        if (valorColunaO.includes('IFOOD')) {
          resultado['Coluna T'] = valorColunaO;
        }
        else if (valorColunaO.includes('ELCIO VENTURI')) {
          resultado['Coluna T'] = 'APORTE_SOCIO_ELCIO:' + valorColunaO;
        }
        else if (valorColunaO.includes('SIDINEI CORREA')) {
          resultado['Coluna T'] = 'APORTE_SOCIO_SIDINEI:' + valorColunaO;
        }
      }
    }
    
    return resultado;
  });
}

// Inicializar eventos quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', async function() {
  console.log("DOM carregado, inicializando eventos de períodos");
  
  // Configurar event listener para o formulário
  const formNovoPeriodo = document.getElementById('formNovoPeriodo');
  if (formNovoPeriodo) {
    formNovoPeriodo.addEventListener('submit', function(e) {
      e.preventDefault();
      adicionarNovoPeriodo();
    });
    console.log("Event listener adicionado ao formulário");
  } else {
    console.error("Formulário de novo período não encontrado!");
  }
  
  // Também adicionar event listener diretamente ao botão
  const btnAdicionarPeriodo = document.getElementById('btnAdicionarPeriodo');
  if (btnAdicionarPeriodo) {
    btnAdicionarPeriodo.addEventListener('click', function(e) {
      e.preventDefault();
      adicionarNovoPeriodo();
    });
    console.log("Event listener adicionado ao botão");
  } else {
    console.error("Botão de adicionar período não encontrado!");
  }
  
  // Configurar event listener para o botão de carregar período
  const btnCarregarPeriodo = document.getElementById('btnCarregarPeriodo');
  if (btnCarregarPeriodo) {
    btnCarregarPeriodo.addEventListener('click', carregarPeriodoSelecionado);
  } else {
    console.error("Botão de carregar período não encontrado!");
  }
  
  // Carregar períodos do servidor e atualizar a interface
  try {
    await carregarPeriodos();
    atualizarSeletorPeriodos();
    atualizarListaPeriodos();
  } catch (erro) {
    console.error("Erro ao inicializar períodos:", erro);
  }
});