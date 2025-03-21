/**
 * Funções de processamento de dados para o Dashboard DRE
 */

// Processar o arquivo de extrato
async function processarExtrato() {
    if (!inputArquivo.files || inputArquivo.files.length === 0) {
      alert('Por favor, selecione um arquivo Excel.');
      return;
    }
    
    try {
      loadingOverlay.style.display = 'flex';
      
      // Obter mês e ano atual para sugerir o período
      const dataAtual = new Date();
      const mesAtual = dataAtual.getMonth() + 1; // 1-12
      const anoAtual = dataAtual.getFullYear();
      
      // Perguntar pelo período
      let mes = prompt("Informe o mês do extrato (1-12):", mesAtual);
      if (!mes || isNaN(mes) || mes < 1 || mes > 12) {
        alert('Mês inválido. Operação cancelada.');
        return;
      }
      
      let ano = prompt("Informe o ano do extrato:", anoAtual);
      if (!ano || isNaN(ano) || ano < 2020 || ano > 2030) {
        alert('Ano inválido. Operação cancelada.');
        return;
      }
      
      // Criar chave do período: YYYY-MM
      const periodo = `${ano}-${mes.toString().padStart(2, '0')}`;
      
      // Verificar se já existe
      if (periodos[periodo] && !confirm(`Já existe um extrato para ${mes}/${ano}. Deseja substituir?`)) {
        return;
      }
      
      // Ler o arquivo
      const arquivo = inputArquivo.files[0];
      const arrayBuffer = await arquivo.arrayBuffer();
      
      // Importar XLSX
      const XLSX = window.XLSX;
      
      // Ler o workbook com configurações especiais para datas
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), {
        cellDates: true,
        cellNF: true,
        dateNF: 'dd/mm/yyyy hh:mm', // Forçar formato brasileiro
        raw: false
      });
      
      // Selecionar a primeira planilha
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Converter para JSON
      const dados = XLSX.utils.sheet_to_json(sheet);
      
      // Obter as colunas da planilha
      const range = XLSX.utils.decode_range(sheet['!ref']);
      const colunas = [];
      
      // Ler a primeira linha para obter os headers
      for (let c = 0; c <= range.e.c; c++) {
        const cellAddress = XLSX.utils.encode_cell({r: 0, c: c});
        const cell = sheet[cellAddress];
        if (cell && cell.v) {
          colunas[c] = cell.v;
        }
      }
      
      // Processar os dados para o extrato modificado
      const dadosProcessados = processarDadosExtrato(dados, colunas);
      
      // Armazenar os dados processados
      dadosExtrato = dadosProcessados;
      
      // Salvar no armazenamento de períodos
      const dataHoraAtual = new Date().toLocaleString('pt-BR');
      periodos[periodo] = {
        dados: dadosProcessados,
        processadoEm: dataHoraAtual
      };
      
      // Definir como período atual
      periodoAtual = periodo;
      
      // Salvar no localStorage
      salvarPeriodos();
      
      // Atualizar interface do gerenciador de períodos
      atualizarSeletorPeriodos();
      atualizarListaPeriodos();
      
      // Atualizar exibição do período
      const nomesMeses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      const nomeMes = nomesMeses[parseInt(mes) - 1];
      document.getElementById('periodoInfo').textContent = `Período: ${nomeMes} de ${ano}`;
      
      // Gerar o DRE
      gerarDRE();
      
      // Mostrar mensagem de sucesso
      alert('Arquivo processado com sucesso!');
      
    } catch (erro) {
      console.error('Erro ao processar o arquivo:', erro);
      alert('Erro ao processar o arquivo: ' + (erro.message || 'Erro desconhecido'));
    } finally {
      loadingOverlay.style.display = 'none';
    }
  }
    
  // Gerar o DRE
  function gerarDRE() {
    try {
      loadingOverlay.style.display = 'flex';
      
      // Inicializar o objeto DRE para armazenar os valores por categoria
      const valorDRE = {};
      
      // Adicionar categorias personalizadas à estrutura DRE
      for (const grupo in categoriasPersonalizadas) {
        if (!estruturaDRE[grupo]) {
          estruturaDRE[grupo] = [];
        }
        
        categoriasPersonalizadas[grupo].forEach(categoria => {
          if (!estruturaDRE[grupo].includes(categoria)) {
            estruturaDRE[grupo].push(categoria);
          }
        });
      }
      
      // Inicializar todas as categorias com zero
      for (const grupo in estruturaDRE) {
        estruturaDRE[grupo].forEach(categoria => {
          valorDRE[categoria] = 0;
        });
      }
      
      // Inicializar contadores específicos para Vila Champagnat
      totalVilaIfood = 0;
      totalVilaPix = 0;
      totalAporteElcio = 0;
      totalAporteSidinei = 0;
      
      // Inicializar detalhes por categoria
      detalhesCategoria = {};
      for (const grupo in estruturaDRE) {
        estruturaDRE[grupo].forEach(categoria => {
          detalhesCategoria[categoria] = [];
        });
      }
      
      // Resetar linhas não categorizadas
      linhasNaoCategorizada = [];
      
      // Processar os dados para o DRE
      dadosExtrato.forEach(linha => {
        // Pegar o valor da coluna A (Valor)
        const valor = converterParaNumero(linha['Valor']);
        
        // Obter o nome do fornecedor/destino da coluna B
        const destino = linha['Destino'];
        
        // Extract date/time from the row
        const dataHora = getDataHoraDaLinha(linha);
        
        // Primeiro, verificar se há informação de IFOOD na coluna T (prioridade para IFOOD)
        if (linha['Coluna T'] && typeof linha['Coluna T'] === 'string' && 
            linha['Coluna T'].toUpperCase().includes('IFOOD')) {
          // Se tem informação de IFOOD na coluna T, categorizar como "Receitas IFOOD"
          valorDRE['Receitas IFOOD'] += valor > 0 ? valor : 0;
          
          // Adicionar ao detalhes da categoria
          if (valor > 0) {
            detalhesCategoria['Receitas IFOOD'].push({
              destino: destino || 'Desconhecido',
              valor: valor,
              dataHora: dataHora // Add the date/time
            });
          }
          
          // Se for VILA CHAMPAGNAT, contabilizar separadamente para relatório
          if (destino && destino.toUpperCase().includes('VILA CHAMPAGNAT BAR E RESTAURANTE LTDA')) {
            totalVilaIfood += valor > 0 ? valor : 0;
          }
        }
        // Verificar aportes dos sócios
        else if (linha['Coluna T'] && typeof linha['Coluna T'] === 'string') {
          // Verificar se é um aporte do Elcio
          if (linha['Coluna T'].includes('APORTE_SOCIO_ELCIO')) {
            valorDRE['Aporte Sócio'] = valorDRE['Aporte Sócio'] || 0;
            valorDRE['Aporte Sócio'] += valor > 0 ? valor : 0;
            
            // Contabilizar separadamente
            totalAporteElcio += valor > 0 ? valor : 0;
            
            // Adicionar ao detalhes da categoria
            if (valor > 0) {
              if (!detalhesCategoria['Aporte Sócio']) {
                detalhesCategoria['Aporte Sócio'] = [];
              }
              detalhesCategoria['Aporte Sócio'].push({
                destino: 'Elcio Venturi (Aporte)',
                valor: valor,
                dataHora: dataHora
              });
            }
          }
          // Verificar se é um aporte do Sidinei
          else if (linha['Coluna T'].includes('APORTE_SOCIO_SIDINEI')) {
            valorDRE['Aporte Sócio'] = valorDRE['Aporte Sócio'] || 0;
            valorDRE['Aporte Sócio'] += valor > 0 ? valor : 0;
            
            // Contabilizar separadamente
            totalAporteSidinei += valor > 0 ? valor : 0;
            
            // Adicionar ao detalhes da categoria
            if (valor > 0) {
              if (!detalhesCategoria['Aporte Sócio']) {
                detalhesCategoria['Aporte Sócio'] = [];
              }
              detalhesCategoria['Aporte Sócio'].push({
                destino: 'Sidinei Correa (Aporte)',
                valor: valor,
                dataHora: dataHora
              });
            }
          }
        }
        // Caso específico: VILA CHAMPAGNAT sem informação de IFOOD na coluna T
        else if (destino && destino.toUpperCase().includes('VILA CHAMPAGNAT BAR E RESTAURANTE LTDA')) {
          // Categorizar como "Crédito/Débito/Pix"
          valorDRE['Crédito/Débito/Pix'] += valor > 0 ? valor : 0;
          totalVilaPix += valor > 0 ? valor : 0;
          
          // Adicionar ao detalhes da categoria
          if (valor > 0) {
            detalhesCategoria['Crédito/Débito/Pix'].push({
              destino: destino,
              valor: valor,
              dataHora: dataHora // Add the date/time
            });
          }
        }
        // Categorizar o valor no DRE se o destino estiver no mapeamento (para outros casos)
        else if (destino && mapeamentoCategorias[destino]) {
          const categoria = mapeamentoCategorias[destino];
          
          // Para despesas, os valores devem ser positivos (embora representem saídas)
          // Para receitas, os valores também devem ser positivos
          if (categoria === 'Receitas IFOOD' || categoria === 'Crédito/Débito/Pix' || categoria === 'Aporte Sócio') {
            valorDRE[categoria] += valor > 0 ? valor : 0;
            
            // Adicionar ao detalhes da categoria
            if (valor > 0) {
              detalhesCategoria[categoria].push({
                destino: destino,
                valor: valor,
                dataHora: dataHora // Add the date/time
              });
            }
          } else {
            // Para categorias de despesas, usamos o módulo do valor (para garantir que despesas sejam sempre positivas)
            valorDRE[categoria] += Math.abs(valor);
            
            // Adicionar ao detalhes da categoria
            detalhesCategoria[categoria].push({
              destino: destino,
              valor: Math.abs(valor),
              dataHora: dataHora // Add the date/time
            });
          }
        } else if (destino && valor !== 0) {
          // Se tiver um destino que não está no mapeamento e um valor não zero, armazenar para listar no final
          linhasNaoCategorizada.push({
            destino: destino,
            valor: valor,
            dataHora: dataHora // Add the date/time
          });
        }
      });
      
      // Criar o DRE
      dadosDRE = [];
      
      // Inicializar totalizadores
      let totalReceitas = 0;
      let totalCustos = 0;
      let totalDespesasVendas = 0;
      let totalDespesasAdm = 0;
      let totalDespesasInfra = 0;
      let totalDespesasFinanceiras = 0;
      let totalDespesasSocios = 0;
      let totalImpostos = 0;
      
      // Adicionar as receitas
      estruturaDRE["Receitas"].forEach(categoria => {
        dadosDRE.push({
          "Grupo": "Receitas",
          "Categoria": categoria,
          "Valor": valorDRE[categoria]
        });
        totalReceitas += valorDRE[categoria];
      });
      
      // Adicionar linha de total de receitas
      dadosDRE.push({
        "Grupo": "",
        "Categoria": "TOTAL RECEITAS",
        "Valor": totalReceitas
      });
      
      // Pular uma linha para melhorar a visualização
      dadosDRE.push({ "Grupo": "", "Categoria": "", "Valor": "" });
      
      // Adicionar os custos diretos
      estruturaDRE["Custos Diretos"].forEach(categoria => {
        dadosDRE.push({
          "Grupo": "Custos Diretos",
          "Categoria": categoria,
          "Valor": valorDRE[categoria]
        });
        totalCustos += valorDRE[categoria];
      });
      
      // Adicionar linha de total de custos
      dadosDRE.push({
        "Grupo": "",
        "Categoria": "TOTAL CUSTOS DIRETOS",
        "Valor": totalCustos
      });
      
      // Lucro bruto
      const lucroBruto = totalReceitas - totalCustos;
      dadosDRE.push({
        "Grupo": "",
        "Categoria": "LUCRO BRUTO",
        "Valor": lucroBruto
      });
      
      // Pular uma linha para melhorar a visualização
      dadosDRE.push({ "Grupo": "", "Categoria": "", "Valor": "" });
      
      // Adicionar as despesas de vendas
      estruturaDRE["Despesas de Vendas"].forEach(categoria => {
        dadosDRE.push({
          "Grupo": "Despesas de Vendas",
          "Categoria": categoria,
          "Valor": valorDRE[categoria]
        });
        totalDespesasVendas += valorDRE[categoria];
      });
      
      // Adicionar linha de total de despesas de vendas
      dadosDRE.push({
        "Grupo": "",
        "Categoria": "TOTAL DESPESAS DE VENDAS",
        "Valor": totalDespesasVendas
      });
      
      // Pular uma linha para melhorar a visualização
      dadosDRE.push({ "Grupo": "", "Categoria": "", "Valor": "" });
      
      // Adicionar as despesas administrativas
      estruturaDRE["Despesas Administrativas"].forEach(categoria => {
        dadosDRE.push({
          "Grupo": "Despesas Administrativas",
          "Categoria": categoria,
          "Valor": valorDRE[categoria]
        });
        totalDespesasAdm += valorDRE[categoria];
      });
      
      // Adicionar linha de total de despesas administrativas
      dadosDRE.push({
        "Grupo": "",
        "Categoria": "TOTAL DESPESAS ADMINISTRATIVAS",
        "Valor": totalDespesasAdm
      });
      
      // Pular uma linha para melhorar a visualização
      dadosDRE.push({ "Grupo": "", "Categoria": "", "Valor": "" });
      
      // Adicionar as despesas com infraestrutura
      estruturaDRE["Despesas com Infraestrutura"].forEach(categoria => {
        dadosDRE.push({
          "Grupo": "Despesas com Infraestrutura",
          "Categoria": categoria,
          "Valor": valorDRE[categoria]
        });
        totalDespesasInfra += valorDRE[categoria];
      });
      
      // Adicionar linha de total de despesas com infraestrutura
      dadosDRE.push({
        "Grupo": "",
        "Categoria": "TOTAL DESPESAS COM INFRAESTRUTURA",
        "Valor": totalDespesasInfra
      });
      
      // Pular uma linha para melhorar a visualização
      dadosDRE.push({ "Grupo": "", "Categoria": "", "Valor": "" });
      
      // Adicionar as despesas financeiras
      estruturaDRE["Despesas Financeiras"].forEach(categoria => {
        dadosDRE.push({
          "Grupo": "Despesas Financeiras",
          "Categoria": categoria,
          "Valor": valorDRE[categoria]
        });
        totalDespesasFinanceiras += valorDRE[categoria];
      });
      
      // Adicionar linha de total de despesas financeiras
      dadosDRE.push({
        "Grupo": "",
        "Categoria": "TOTAL DESPESAS FINANCEIRAS",
        "Valor": totalDespesasFinanceiras
      });
      
      // Pular uma linha para melhorar a visualização
      dadosDRE.push({ "Grupo": "", "Categoria": "", "Valor": "" });
      
      // Adicionar as despesas com sócios
      estruturaDRE["Despesas com Sócios"].forEach(categoria => {
        dadosDRE.push({
          "Grupo": "Despesas com Sócios",
          "Categoria": categoria,
          "Valor": valorDRE[categoria]
        });
        totalDespesasSocios += valorDRE[categoria];
      });
      
      // Adicionar linha de total de despesas com sócios
      dadosDRE.push({
        "Grupo": "",
        "Categoria": "TOTAL DESPESAS COM SÓCIOS",
        "Valor": totalDespesasSocios
      });
      
      // Pular uma linha para melhorar a visualização
      dadosDRE.push({ "Grupo": "", "Categoria": "", "Valor": "" });
      
      // Adicionar os impostos
      estruturaDRE["Impostos"].forEach(categoria => {
        dadosDRE.push({
          "Grupo": "Impostos",
          "Categoria": categoria,
          "Valor": valorDRE[categoria]
        });
        totalImpostos += valorDRE[categoria];
      });
      
      // Adicionar linha de total de impostos
      dadosDRE.push({
        "Grupo": "",
        "Categoria": "TOTAL IMPOSTOS",
        "Valor": totalImpostos
      });
      
      // Pular uma linha para melhorar a visualização
      dadosDRE.push({ "Grupo": "", "Categoria": "", "Valor": "" });
      
      // Adicionar categorias personalizadas, se houver
      for (const grupo in categoriasPersonalizadas) {
        if (categoriasPersonalizadas[grupo].length > 0) {
          let totalGrupo = 0;
          
          // Adicionar cada categoria
          categoriasPersonalizadas[grupo].forEach(categoria => {
            dadosDRE.push({
              "Grupo": grupo,
              "Categoria": categoria,
              "Valor": valorDRE[categoria] || 0
            });
            totalGrupo += valorDRE[categoria] || 0;
          });
          
          // Adicionar total do grupo
          dadosDRE.push({
            "Grupo": "",
            "Categoria": `TOTAL ${grupo.toUpperCase()}`,
            "Valor": totalGrupo
          });
          
          // Pular uma linha
          dadosDRE.push({ "Grupo": "", "Categoria": "", "Valor": "" });
        }
      }
      
      // Calcular o total das despesas categorizadas
      const totalDespesasCategorizadas = totalDespesasVendas + totalDespesasAdm + totalDespesasInfra + 
                                        totalDespesasFinanceiras + totalDespesasSocios + totalImpostos;
      
      // Calcular e adicionar o total dos itens não categorizados
      let totalNaoCategorizado = 0;
      
      // Somar apenas os valores negativos (despesas) dos itens não categorizados
      linhasNaoCategorizada.forEach(item => {
        if (item.valor < 0) {
          totalNaoCategorizado += Math.abs(item.valor);
        }
      });
      
      // Adicionar os valores positivos (receitas) dos itens não categorizados ao total de receitas
      let receitasNaoCategorizadas = 0;
      linhasNaoCategorizada.forEach(item => {
        if (item.valor > 0) {
          receitasNaoCategorizadas += item.valor;
        }
      });
      
      // O total de despesas será a soma das despesas categorizadas mais as não categorizadas
      const totalDespesas = totalDespesasCategorizadas + totalNaoCategorizado;
      
      // O resultado final será o lucro bruto menos o total de despesas
      const resultado = lucroBruto - totalDespesas;
      
      // Adicionar a linha de resultado
      dadosDRE.push({
        "Grupo": "",
        "Categoria": "RESULTADO FINAL",
        "Valor": resultado
      });
      
      // Se existirem linhas não categorizadas, adicionar ao final do DRE
      if (linhasNaoCategorizada.length > 0) {
        // Adicionar duas linhas em branco para separação
        dadosDRE.push({ "Grupo": "", "Categoria": "", "Valor": "" });
        dadosDRE.push({ "Grupo": "", "Categoria": "", "Valor": "" });
        
        // Adicionar um cabeçalho para a seção
        dadosDRE.push({
          "Grupo": "NÃO CATEGORIZADO",
          "Categoria": "Fornecedores sem categoria definida",
          "Valor": ""
        });
        
        // Adicionar uma linha em branco
        dadosDRE.push({ "Grupo": "", "Categoria": "", "Valor": "" });
        
        // Adicionar cada linha não categorizada
        linhasNaoCategorizada.forEach(item => {
          dadosDRE.push({
            "Grupo": "Não Categorizado",
            "Categoria": item.destino,
            "Valor": item.valor
          });
        });
        
        // Adicionar o total não categorizado
        dadosDRE.push({
          "Grupo": "",
          "Categoria": "TOTAL NÃO CATEGORIZADO (DESPESAS)",
          "Valor": totalNaoCategorizado
        });
        
        // Adicionar informação que os valores não categorizados já estão incluídos no Resultado Final
        dadosDRE.push({
          "Grupo": "",
          "Categoria": "* Valores não categorizados já incluídos no Resultado Final",
          "Valor": ""
        });
      }
      
      // Atualizar a interface
      atualizarDashboard(totalReceitas, totalCustos, lucroBruto, resultado, totalDespesas);
      atualizarTabelaDRE();
      atualizarTabelasDespesas(valorDRE, totalCustos, totalDespesas);
      atualizarAlertaNaoCategorizado();
      atualizarDropdownCategorias();
      atualizarCategorizacao();
      
    } catch (erro) {
      console.error('Erro ao gerar DRE:', erro);
      alert('Erro ao gerar DRE: ' + (erro.message || 'Erro desconhecido'));
    } finally {
      loadingOverlay.style.display = 'none';
    }
  }
  
  // Exportar DRE para Excel
  function exportarDRE() {
    if (dadosDRE.length === 0) {
      alert('Não há dados para exportar. Por favor, processe um extrato primeiro.');
      return;
    }
    
    try {
      loadingOverlay.style.display = 'flex';
      
      // Criar workbook
      const XLSX = window.XLSX;
      const wb = XLSX.utils.book_new();
      
      // Converter dados para formato adequado
      const dadosExport = dadosDRE.map(linha => ({
        "Grupo": linha.Grupo,
        "Categoria": linha.Categoria,
        "Valor": typeof linha.Valor === 'number' ? linha.Valor : ''
      }));
      
      // Criar worksheet
      const ws = XLSX.utils.json_to_sheet(dadosExport);
      
      // Definir largura das colunas
      ws['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 15 }];
      
      // Adicionar a planilha ao workbook
      XLSX.utils.book_append_sheet(wb, ws, "DRE");
      
      // Gerar arquivo e download
      XLSX.writeFile(wb, "DRE_Exportado.xlsx");
      
      loadingOverlay.style.display = 'none';
    } catch (erro) {
      console.error('Erro ao exportar DRE:', erro);
      alert('Erro ao exportar DRE: ' + (erro.message || 'Erro desconhecido'));
      loadingOverlay.style.display = 'none';
    }
  }
  
  // Salvar categorização
  function salvarCategorizacao() {
    if (linhasNaoCategorizada.length === 0) {
      alert('Não há itens não categorizados para salvar.');
      return;
    }
    
    // Obter todos os selects de categoria
    const selects = document.querySelectorAll('.categoria-select');
    let alteracoes = 0;
    
    selects.forEach(select => {
      const fornecedor = select.getAttribute('data-fornecedor');
      const categoria = select.value;
      
      if (categoria && categoria !== '') {
        if (categoria === 'nova') {
          // Obter valor do campo de texto
          const inputCustom = select.nextElementSibling;
          if (inputCustom.value.trim() !== '') {
            const novaCategoria = inputCustom.value.trim();
            
            // Adicionar à estrutura de categorias personalizadas
            if (!categoriasPersonalizadas['Outras Categorias']) {
              categoriasPersonalizadas['Outras Categorias'] = [];
            }
            if (!categoriasPersonalizadas['Outras Categorias'].includes(novaCategoria)) {
              categoriasPersonalizadas['Outras Categorias'].push(novaCategoria);
            }
            
            // Atualizar o mapeamento
            mapeamentoCategorias[fornecedor] = novaCategoria;
            alteracoes++;
          }
        } else {
          // Atualizar o mapeamento com categoria existente
          mapeamentoCategorias[fornecedor] = categoria;
          alteracoes++;
        }
      }
    });
    
    if (alteracoes > 0) {
      // Salvar alterações no mapeamento
      salvarMapeamentoLocalStorage(mapeamentoCategorias, categoriasPersonalizadas);
      
      // Regenerar o DRE
      gerarDRE();
      alert(`${alteracoes} item(s) categorizado(s) com sucesso!`);
    } else {
      alert('Nenhuma alteração foi feita. Selecione categorias para os itens.');
    }
  }