// Este script garante que todas as abas funcionem corretamente,
// independentemente de onde os links estão localizados
document.addEventListener('DOMContentLoaded', function() {
    // Seleciona todos os links com o atributo data-bs-toggle="tab"
    const tabLinks = document.querySelectorAll('a[data-bs-toggle="tab"]');
    
    // Adiciona um event listener para cada link de aba
    tabLinks.forEach(link => {
      link.addEventListener('click', function(event) {
        // Previne o comportamento padrão do link
        event.preventDefault();
        
        // Remove a classe 'active' de todos os links de abas
        tabLinks.forEach(tabLink => {
          tabLink.classList.remove('active');
        });
        
        // Adiciona a classe 'active' ao link clicado
        this.classList.add('active');
        
        // Obtém o ID da aba a ser exibida a partir do atributo href
        const targetTabId = this.getAttribute('href');
        
        // Esconde todas as abas
        const tabPanes = document.querySelectorAll('.tab-pane');
        tabPanes.forEach(pane => {
          pane.classList.remove('show', 'active');
        });
        
        // Mostra a aba alvo
        const targetTab = document.querySelector(targetTabId);
        if (targetTab) {
          targetTab.classList.add('show', 'active');
        }
      });
    });
  });