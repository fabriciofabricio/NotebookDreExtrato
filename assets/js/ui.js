/**
 * Funções relacionadas à interface do usuário do Dashboard DRE
 */

// Atualizar o dashboard
function atualizarDashboard(totalReceitas, totalCustos, lucroBruto, resultado, totalDespesas) {
    document.getElementById('totalReceitas').textContent = formatarValor(totalReceitas);
    document.getElementById('receitasIfood').textContent = `IFOOD: ${formatarValor(totalVilaIfood)}`;
    document.getElementById('receitasCredito').textContent = `Crédito/Débito: ${formatarValor(totalVilaPix)}`;
    
    // Adicionar os aportes dos sócios se o elemento existir
    if (document.getElementById('aportesSocios')) {
      document.getElementById('aportesSocios').textContent = 
        `Aportes: Elcio: ${formatarValor(totalAporteElcio)} | Sidinei: ${formatarValor(totalAporteSidinei)}`;
    }
    
    document.getElementById('totalCustos').textContent = formatarValor(totalCustos);
    const custosPercent = totalReceitas > 0 ? (totalCustos / totalReceitas) * 100 : 0;
    document.getElementById('custosProgress').style.width = `${Math.min(custosPercent, 100)}%`;
    document.getElementById('custosPercentual').textContent = `${custosPercent.toFixed(1)}% das receitas`;
    
    document.getElementById('lucroBruto').textContent = formatarValor(lucroBruto);
    const lucroPercent = totalReceitas > 0 ? (lucroBruto / totalReceitas) * 100 : 0;
    document.getElementById('lucroProgress').style.width = `${Math.min(lucroPercent, 100)}%`;
    document.getElementById('lucroPercentual').textContent = `${lucroPercent.toFixed(1)}% das receitas`;
    
    document.getElementById('resultadoFinal').textContent = formatarValor(resultado);
    const resultadoPercent = totalReceitas > 0 ? (resultado / totalReceitas) * 100 : 0;
    document.getElementById('resultadoProgress').style.width = `${Math.min(resultadoPercent, 100)}%`;
    document.getElementById('resultadoPercentual').textContent = `${resultadoPercent.toFixed(1)}% das receitas`;
  }
  
  // Atualizar a tabela DRE
  function atualizarTabelaDRE() {
    const tabelaDRE = document.getElementById('tabelaDRE');
    tabelaDRE.innerHTML = '';
    
    dadosDRE.forEach(linha => {
      const tr = document.createElement('tr');
      
      // Aplicar estilo com base no tipo de linha
      if (linha.Categoria.startsWith('TOTAL') || linha.Categoria === 'LUCRO BRUTO' || linha.Categoria === 'RESULTADO FINAL') {
        tr.classList.add('table-info', 'fw-bold');
      } else if (linha.Grupo === 'NÃO CATEGORIZADO') {
        tr.classList.add('table-warning', 'fw-bold');
      } else if (linha.Grupo === 'Não Categorizado') {
        tr.classList.add('table-light');
      } else if (linha.Categoria.startsWith('* Valores não categorizados')) {
        tr.classList.add('table-warning', 'fst-italic');
        tr.style.fontSize = '0.9rem';
      } else if (linha.Grupo === '') {
        // Linha vazia
        tr.style.height = '10px';
      }
      
      // Criar células
      const tdGrupo = document.createElement('td');
      tdGrupo.textContent = linha.Grupo;
      tr.appendChild(tdGrupo);
      
      const tdCategoria = document.createElement('td');
      tdCategoria.textContent = linha.Categoria;
      tr.appendChild(tdCategoria);
      
      const tdValor = document.createElement('td');
      tdValor.textContent = linha.Valor === '' ? '' : formatarValor(linha.Valor);
      tdValor.classList.add('text-end');
      tr.appendChild(tdValor);
      
      tabelaDRE.appendChild(tr);
    });
  }
  
  // Atualizar tabelas de despesas
  function atualizarTabelasDespesas(valorDRE, totalCustos, totalDespesas) {
    // Tabela de despesas por categoria
    const despesasCategorias = document.getElementById('despesasCategorias');
    despesasCategorias.innerHTML = '';
    
    // Agrupar despesas por grupo
    const gruposDespesas = {
      'Despesas de Vendas': 0,
      'Despesas Administrativas': 0,
      'Despesas com Infraestrutura': 0,
      'Despesas Financeiras': 0,
      'Despesas com Sócios': 0,
      'Impostos': 0
    };
    
    // Adicionar grupos personalizados
    for (const grupo in categoriasPersonalizadas) {
      if (grupo !== 'Receitas' && grupo !== 'Custos Diretos') {
        gruposDespesas[grupo] = 0;
      }
    }
    
    // Calcular totais por grupo
    for (const grupo in estruturaDRE) {
      if (grupo !== 'Receitas' && grupo !== 'Custos Diretos') {
        estruturaDRE[grupo].forEach(categoria => {
          gruposDespesas[grupo] += valorDRE[categoria];
        });
      }
    }
    
    // Adicionar linhas na tabela
    for (const grupo in gruposDespesas) {
      const tr = document.createElement('tr');
      
      const tdCategoria = document.createElement('td');
      tdCategoria.textContent = grupo;
      tr.appendChild(tdCategoria);
      
      const tdValor = document.createElement('td');
      tdValor.textContent = formatarValor(gruposDespesas[grupo]);
      tr.appendChild(tdValor);
      
      const tdPercentual = document.createElement('td');
      const percentual = totalDespesas > 0 ? (gruposDespesas[grupo] / totalDespesas) * 100 : 0;
      tdPercentual.textContent = `${percentual.toFixed(1)}%`;
      tr.appendChild(tdPercentual);
      
      despesasCategorias.appendChild(tr);
    }
    
    // Calcular total não categorizado (apenas despesas)
    let totalNaoCategorizado = 0;
    linhasNaoCategorizada.forEach(item => {
      if (item.valor < 0) {
        totalNaoCategorizado += Math.abs(item.valor);
      }
    });
    
    // Adicionar linha para itens não categorizados, se houver
    if (totalNaoCategorizado > 0) {
      const tr = document.createElement('tr');
      tr.classList.add('table-warning');
      
      const tdCategoria = document.createElement('td');
      tdCategoria.textContent = 'Não Categorizado';
      tr.appendChild(tdCategoria);
      
      const tdValor = document.createElement('td');
      tdValor.textContent = formatarValor(totalNaoCategorizado);
      tr.appendChild(tdValor);
      
      const tdPercentual = document.createElement('td');
      const percentual = totalDespesas > 0 ? (totalNaoCategorizado / totalDespesas) * 100 : 0;
      tdPercentual.textContent = `${percentual.toFixed(1)}%`;
      tr.appendChild(tdPercentual);
      
      despesasCategorias.appendChild(tr);
    }
    
    // Tabela de custos diretos
    const custosCategorias = document.getElementById('custosCategorias');
    custosCategorias.innerHTML = '';
    
    estruturaDRE['Custos Diretos'].forEach(categoria => {
      const tr = document.createElement('tr');
      
      const tdCategoria = document.createElement('td');
      tdCategoria.textContent = categoria;
      tr.appendChild(tdCategoria);
      
      const tdValor = document.createElement('td');
      tdValor.textContent = formatarValor(valorDRE[categoria]);
      tr.appendChild(tdValor);
      
      const tdPercentual = document.createElement('td');
      const percentual = totalCustos > 0 ? (valorDRE[categoria] / totalCustos) * 100 : 0;
      tdPercentual.textContent = `${percentual.toFixed(1)}%`;
      tr.appendChild(tdPercentual);
      
      custosCategorias.appendChild(tr);
    });
  }
  
  // Atualizar alerta sobre itens não categorizados
  function atualizarAlertaNaoCategorizado() {
    const alertRow = document.getElementById('alertRow');
    alertRow.innerHTML = '';
    
    if (linhasNaoCategorizada.length > 0) {
      // Contar quantos são despesas e quantos são receitas
      let contDespesas = 0;
      let contReceitas = 0;
      
      linhasNaoCategorizada.forEach(item => {
        if (item.valor < 0) {
          contDespesas++;
        } else if (item.valor > 0) {
          contReceitas++;
        }
      });
      
      const alert = document.createElement('div');
      alert.className = 'col-12';
      
      let mensagem = `<i class="fas fa-exclamation-triangle me-2"></i>`;
      if (contDespesas > 0 && contReceitas > 0) {
        mensagem += `<span>Existem <strong>${contDespesas}</strong> despesas e <strong>${contReceitas}</strong> receitas não categorizadas. As despesas não categorizadas já afetam o resultado final.</span>`;
      } else if (contDespesas > 0) {
        mensagem += `<span>Existem <strong>${contDespesas}</strong> despesas não categorizadas. Estes valores já afetam o resultado final.</span>`;
      } else if (contReceitas > 0) {
        mensagem += `<span>Existem <strong>${contReceitas}</strong> receitas não categorizadas.</span>`;
      } else {
        mensagem += `<span>Existem <strong>${linhasNaoCategorizada.length}</strong> itens não categorizados.</span>`;
      }
      
      alert.innerHTML = `
        <div class="alert alert-warning">
          <div class="d-flex justify-content-between align-items-center">
            <div>${mensagem}</div>
            <button class="btn btn-sm btn-outline-dark" id="btnVerNaoCategorizado">
              Ver Detalhes
            </button>
          </div>
        </div>
      `;
      
      alertRow.appendChild(alert);
      
      // Adicionar evento ao botão
      document.getElementById('btnVerNaoCategorizado').addEventListener('click', function() {
        // Mudar para a aba de itens não categorizados
        document.querySelector('a[href="#itens-nao-categorizados"]').click();
      });
    }
  }
  
  // Função para preencher dropdown de categorias
  function atualizarDropdownCategorias() {
    const menuCategorias = document.getElementById('menuCategorias');
    
    // Se o elemento não existir, saia da função para evitar erros
    if (!menuCategorias) return;
    
    menuCategorias.innerHTML = '';
    
    // Preencher com as categorias da estrutura DRE
    for (const grupo in estruturaDRE) {
      // Criar cabeçalho do grupo
      const headerItem = document.createElement('li');
      const headerLink = document.createElement('a');
      headerLink.className = 'dropdown-item fw-bold text-primary';
      headerLink.textContent = grupo;
      headerLink.href = '#';
      headerItem.appendChild(headerLink);
      menuCategorias.appendChild(headerItem);
      
      // Adicionar divider
      const divider = document.createElement('li');
      divider.innerHTML = '<hr class="dropdown-divider">';
      menuCategorias.appendChild(divider);
      
      // Adicionar itens do grupo
      estruturaDRE[grupo].forEach(categoria => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'dropdown-item';
        link.textContent = categoria;
        link.href = '#';
        link.addEventListener('click', function() {
          mostrarDetalhesCategoria(categoria);
        });
        item.appendChild(link);
        menuCategorias.appendChild(item);
      });
      
      // Adicionar divider após cada grupo
      const finalDivider = document.createElement('li');
      finalDivider.innerHTML = '<hr class="dropdown-divider">';
      menuCategorias.appendChild(finalDivider);
    }
    
    // Categorias personalizadas
    for (const grupo in categoriasPersonalizadas) {
      if (categoriasPersonalizadas[grupo] && categoriasPersonalizadas[grupo].length > 0) {
        // Criar cabeçalho do grupo
        const headerItem = document.createElement('li');
        const headerLink = document.createElement('a');
        headerLink.className = 'dropdown-item fw-bold text-primary';
        headerLink.textContent = grupo;
        headerLink.href = '#';
        headerItem.appendChild(headerLink);
        menuCategorias.appendChild(headerItem);
        
        // Adicionar divider
        const divider = document.createElement('li');
        divider.innerHTML = '<hr class="dropdown-divider">';
        menuCategorias.appendChild(divider);
        
        // Adicionar itens do grupo
        categoriasPersonalizadas[grupo].forEach(categoria => {
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.className = 'dropdown-item';
          link.textContent = categoria;
          link.href = '#';
          link.addEventListener('click', function() {
            mostrarDetalhesCategoria(categoria);
          });
          item.appendChild(link);
          menuCategorias.appendChild(item);
        });
        
        // Adicionar divider após cada grupo
        const finalDivider = document.createElement('li');
        finalDivider.innerHTML = '<hr class="dropdown-divider">';
        menuCategorias.appendChild(finalDivider);
      }
    }
    
    // Adicionar opção para ver itens não categorizados
    if (linhasNaoCategorizada.length > 0) {
      const headerItem = document.createElement('li');
      const headerLink = document.createElement('a');
      headerLink.className = 'dropdown-item fw-bold text-warning';
      headerLink.textContent = 'Não Categorizado';
      headerLink.href = '#';
      headerItem.appendChild(headerLink);
      menuCategorias.appendChild(headerItem);
      
      const divider = document.createElement('li');
      divider.innerHTML = '<hr class="dropdown-divider">';
      menuCategorias.appendChild(divider);
      
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'dropdown-item text-warning';
      link.textContent = `Itens Não Categorizados (${linhasNaoCategorizada.length})`;
      link.href = '#';
      link.addEventListener('click', function() {
        document.querySelector('a[href="#itens-nao-categorizados"]').click();
      });
      item.appendChild(link);
      menuCategorias.appendChild(item);
    }
  }
  
  // Mostrar detalhes de uma categoria
  function mostrarDetalhesCategoria(categoria) {
    const tituloCategoriaDetalhes = document.getElementById('tituloCategoriaDetalhes');
    const dropdownCategoria = document.getElementById('dropdownCategoria');
    const detalhesCategoriaBody = document.getElementById('detalhesCategoriaBody');
    
    if (!tituloCategoriaDetalhes || !dropdownCategoria || !detalhesCategoriaBody) return;
    
    tituloCategoriaDetalhes.textContent = categoria;
    dropdownCategoria.textContent = categoria;
    
    detalhesCategoriaBody.innerHTML = '';
    
    if (!detalhesCategoria || !detalhesCategoria[categoria] || detalhesCategoria[categoria].length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4; // Updated to span 4 columns (including the new date/time column)
      td.textContent = 'Nenhum item encontrado nesta categoria.';
      td.className = 'text-center';
      tr.appendChild(td);
      detalhesCategoriaBody.appendChild(tr);
      return;
    }
    
    // Calcular o total da categoria
    const totalCategoria = detalhesCategoria[categoria].reduce((total, item) => total + item.valor, 0);
    
    // Ordenar por valor (maior para menor)
    const itensOrdenados = [...detalhesCategoria[categoria]].sort((a, b) => b.valor - a.valor);
    
    // Adicionar cada item
    itensOrdenados.forEach(item => {
      const tr = document.createElement('tr');
      
      const tdDestino = document.createElement('td');
      tdDestino.textContent = item.destino;
      tr.appendChild(tdDestino);
      
      // Data/Hora column (moved before Valor)
      const tdDataHora = document.createElement('td');
      tdDataHora.textContent = formatarDataHora(item.dataHora);
      tr.appendChild(tdDataHora);
      
      const tdValor = document.createElement('td');
      tdValor.textContent = formatarValor(item.valor);
      tr.appendChild(tdValor);
      
      const tdPercentual = document.createElement('td');
      const percentual = totalCategoria > 0 ? (item.valor / totalCategoria) * 100 : 0;
      tdPercentual.textContent = `${percentual.toFixed(1)}%`;
      tr.appendChild(tdPercentual);
      
      detalhesCategoriaBody.appendChild(tr);
    });
  }
  
  // Atualizar a interface de categorização
  function atualizarCategorizacao() {
    const itemsCategorization = document.getElementById('itemsCategorization');
    itemsCategorization.innerHTML = '';
    
    if (linhasNaoCategorizada.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5; // Updated to span 5 columns (including the new date/time column)
      td.textContent = 'Todos os itens estão categorizados!';
      td.className = 'text-center';
      tr.appendChild(td);
      itemsCategorization.appendChild(tr);
      return;
    }
    
    // Ordenar por valor (despesas primeiro, depois receitas)
    const itensOrdenados = [...linhasNaoCategorizada].sort((a, b) => {
      if (a.valor < 0 && b.valor >= 0) return -1;
      if (a.valor >= 0 && b.valor < 0) return 1;
      return Math.abs(b.valor) - Math.abs(a.valor);
    });
    
    itensOrdenados.forEach((item, index) => {
      const tr = document.createElement('tr');
      
      // Removido o estilo que alterava o fundo para amarelo nas despesas
      // Mantendo o fundo branco para todos os itens nesta aba
      
      const tdDestino = document.createElement('td');
      tdDestino.textContent = item.destino;
      tr.appendChild(tdDestino);
      
      // Data/Hora column (moved before Valor)
      const tdDataHora = document.createElement('td');
      tdDataHora.textContent = formatarDataHora(item.dataHora);
      tr.appendChild(tdDataHora);
      
      const tdValor = document.createElement('td');
      tdValor.textContent = formatarValor(item.valor);
      
      // Apenas colorir o texto em vermelho para despesas, sem alterar o fundo
      if (item.valor < 0) {
        tdValor.classList.add('text-danger');
      } else if (item.valor > 0) {
        tdValor.classList.add('text-success');
      }
      
      tr.appendChild(tdValor);
      
      const tdCategoria = document.createElement('td');
      const dropdownHTML = criarDropdownCategorias(item.destino, index);
      tdCategoria.innerHTML = dropdownHTML;
      tr.appendChild(tdCategoria);
      
      const tdAcoes = document.createElement('td');
      tdAcoes.innerHTML = `
        <button class="btn btn-sm btn-outline-primary me-2" data-bs-toggle="modal" data-bs-target="#categorizacaoModal" data-fornecedor="${item.destino}" data-valor="${item.valor}" data-data-hora="${formatarDataHora(item.dataHora)}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger">
          <i class="fas fa-times"></i>
        </button>
      `;
      tr.appendChild(tdAcoes);
      
      itemsCategorization.appendChild(tr);
    });
    
    // Adicionar nota informativa sobre itens não categorizados
    if (itensOrdenados.some(item => item.valor < 0)) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.className = 'text-muted fst-italic small';
      td.innerHTML = '<i class="fas fa-info-circle me-2"></i> As despesas (valores negativos) já estão sendo contabilizadas no Resultado Final, mesmo antes de categorizar.';
      tr.appendChild(td);
      itemsCategorization.appendChild(tr);
    }
    
    // Configurar eventos do modal
    const categorizacaoModal = document.getElementById('categorizacaoModal');
    categorizacaoModal.addEventListener('show.bs.modal', function (event) {
      const button = event.relatedTarget;
      const fornecedor = button.getAttribute('data-fornecedor');
      const valor = button.getAttribute('data-valor');
      const dataHora = button.getAttribute('data-data-hora');
      
      document.getElementById('fornecedorModal').value = fornecedor;
      document.getElementById('dataHoraModal').value = dataHora;
      document.getElementById('valorModal').value = valor;
      
      // Preencher o dropdown de categorias
      const categoriaModal = document.getElementById('categoriaModal');
      categoriaModal.innerHTML = '';
      
      // Opção vazia no topo
      const optionEmpty = document.createElement('option');
      optionEmpty.value = '';
      optionEmpty.textContent = 'Selecione uma categoria';
      categoriaModal.appendChild(optionEmpty);
      
      // Adicionar todas as categorias agrupadas
      for (const grupo in estruturaDRE) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = grupo;
        
        estruturaDRE[grupo].forEach(categoria => {
          const option = document.createElement('option');
          option.value = categoria;
          option.textContent = categoria;
          optgroup.appendChild(option);
        });
        
        categoriaModal.appendChild(optgroup);
      }
      
      // Adicionar categorias personalizadas
      for (const grupo in categoriasPersonalizadas) {
        if (categoriasPersonalizadas[grupo] && categoriasPersonalizadas[grupo].length > 0) {
          const optgroup = document.createElement('optgroup');
          optgroup.label = grupo;
          
          categoriasPersonalizadas[grupo].forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            optgroup.appendChild(option);
          });
          
          categoriaModal.appendChild(optgroup);
        }
      }
      
      // Opção para criar nova categoria
      const optionNova = document.createElement('option');
      optionNova.value = 'nova';
      optionNova.textContent = '+ Criar nova categoria';
      categoriaModal.appendChild(optionNova);
      
      // Esconder o campo de nova categoria
      document.getElementById('customCategoryInputGroup').style.display = 'none';
      document.getElementById('customCategoryInput').value = '';
    });
  }
  
  // Criar dropdown de categorias para a tabela de itens não categorizados
  function criarDropdownCategorias(fornecedor, index) {
    let html = `
      <select class="form-select form-select-sm categoria-select" data-fornecedor="${fornecedor}" data-index="${index}">
        <option value="">Selecione uma categoria</option>
    `;
    
    // Adicionar grupos e categorias
    for (const grupo in estruturaDRE) {
      html += `<optgroup label="${grupo}">`;
      
      estruturaDRE[grupo].forEach(categoria => {
        html += `<option value="${categoria}">${categoria}</option>`;
      });
      
      html += `</optgroup>`;
    }
    
    // Adicionar categorias personalizadas
    for (const grupo in categoriasPersonalizadas) {
      if (categoriasPersonalizadas[grupo] && categoriasPersonalizadas[grupo].length > 0) {
        html += `<optgroup label="${grupo}">`;
        
        categoriasPersonalizadas[grupo].forEach(categoria => {
          html += `<option value="${categoria}">${categoria}</option>`;
        });
        
        html += `</optgroup>`;
      }
    }
    
    // Opção para criar nova categoria
    html += `
        <option value="nova">+ Criar nova categoria</option>
      </select>
      <input type="text" class="form-control form-control-sm mt-2 custom-category-input" style="display: none;" placeholder="Digite o nome da nova categoria">
    `;
    
    return html;
  }