/**
 * Script principal do Dashboard DRE
 * Inicialização e configuração dos eventos
 */

// Variáveis globais
let arquivoProcessado = null;
let dadosExtrato = [];
let dadosDRE = [];
let linhasNaoCategorizada = [];
let totalVilaIfood = 0;
let totalVilaPix = 0;
let totalAporteElcio = 0;
let totalAporteSidinei = 0;
let detalhesCategoria = {};
let categoriasPersonalizadas = {};

// Armazenamento de períodos
// Inicializar como objeto vazio - periodos.js irá atualizar isso com os dados do localStorage
let periodos = {}; 
let periodoAtual = ''; // formato: 'YYYY-MM'

// Elementos DOM
const loadingOverlay = document.getElementById('loadingOverlay');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const content = document.getElementById('content');
const inputArquivo = document.getElementById('inputArquivo');
const btnSelecionarPeriodo = document.getElementById('btnSelecionarPeriodo'); // Alterado: btnProcessarExtrato → btnSelecionarPeriodo
const btnExportarDRE = document.getElementById('btnExportarDRE');
const btnExportarRelatorioDRE = document.getElementById('btnExportarRelatorioDRE');
const btnSalvarCategorias = document.getElementById('btnSalvarCategorias');
const btnSalvarCategoriasMudancas = document.getElementById('btnSalvarCategoriasMudancas');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  console.log('main.js: DOM carregado e analisado');
  
  // Esconder loading overlay
  loadingOverlay.style.display = 'none';
  
  // Toggle sidebar
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('toggled');
      content.classList.toggle('toggled');
    });
  }
  
  // Eventos
  // Alterado: Removido o evento para btnProcessarExtrato
  // Vamos verificar se inputArquivo existe antes de adicionar o event listener
  if (inputArquivo) {
    inputArquivo.addEventListener('change', processarExtrato);
  }
  
  // Verificar se cada elemento existe antes de adicionar os event listeners
  if (btnExportarDRE) {
    btnExportarDRE.addEventListener('click', exportarDRE);
  }
  
  if (btnExportarRelatorioDRE) {
    btnExportarRelatorioDRE.addEventListener('click', exportarDRE);
  }
  
  if (btnSalvarCategorias) {
    btnSalvarCategorias.addEventListener('click', salvarCategorizacao);
  }
  
  if (btnSalvarCategoriasMudancas) {
    btnSalvarCategoriasMudancas.addEventListener('click', salvarCategorizacao);
  }
  
  // Inicializar dropdown de categorias
  atualizarDropdownCategorias();
  
  // Configurar modal de categorização
  const categoriaModal = document.getElementById('categoriaModal');
  if (categoriaModal) {
    categoriaModal.addEventListener('change', function() {
      const selectedValue = this.value;
      const customCategoryInput = document.getElementById('customCategoryInputGroup');
      
      if (selectedValue === 'nova') {
        customCategoryInput.style.display = 'block';
      } else {
        customCategoryInput.style.display = 'none';
      }
    });
  }
  
  // Botão de salvar categorização
  const btnSalvarCategorizacao = document.getElementById('btnSalvarCategorizacao');
  if (btnSalvarCategorizacao) {
    btnSalvarCategorizacao.addEventListener('click', function() {
      const fornecedor = document.getElementById('fornecedorModal').value;
      let categoria = document.getElementById('categoriaModal').value;
      
      // Se for categoria personalizada
      if (categoria === 'nova') {
        categoria = document.getElementById('customCategoryInput').value.trim();
        if (!categoria) {
          alert('Por favor, informe um nome para a nova categoria.');
          return;
        }
        
        // Verificar se a categoria já existe na estrutura
        let categoriaExistente = false;
        for (const grupo in estruturaDRE) {
          if (estruturaDRE[grupo].includes(categoria)) {
            categoriaExistente = true;
            break;
          }
        }
        
        if (!categoriaExistente) {
          // Adicionar à estrutura de categorias personalizadas
          if (!categoriasPersonalizadas['Outras Categorias']) {
            categoriasPersonalizadas['Outras Categorias'] = [];
          }
          if (!categoriasPersonalizadas['Outras Categorias'].includes(categoria)) {
            categoriasPersonalizadas['Outras Categorias'].push(categoria);
          }
        }
      }
      
      // Atualizar o mapeamento
      mapeamentoCategorias[fornecedor] = categoria;
      
      // Atualizar a interface
      atualizarCategorizacao();
      
      // Fechar o modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('categorizacaoModal'));
      modal.hide();
    });
  }
  
  // Evento para detectar mudança nos selects de categoria na tabela de itens não categorizados
  document.addEventListener('change', function(event) {
    if (event.target.classList.contains('categoria-select')) {
      const value = event.target.value;
      const inputCustom = event.target.nextElementSibling;
      
      if (value === 'nova') {
        inputCustom.style.display = 'block';
      } else {
        inputCustom.style.display = 'none';
      }
    }
  });
  
  // Carregar mapeamento salvo ao iniciar
  const resultadoCarregamento = carregarMapeamentoLocalStorage(mapeamentoCategorias, categoriasPersonalizadas);
  mapeamentoCategorias = resultadoCarregamento.mapeamentoCategorias;
  categoriasPersonalizadas = resultadoCarregamento.categoriasPersonalizadas;
  
  // Inicializar gerenciador de períodos
  // Os períodos são carregados e a interface atualizada no próprio arquivo periodos.js
  console.log('main.js: Inicialização concluída');
});