# Interface do Usuário

## Visão Geral

A interface do usuário do BetCheck foi projetada para ser intuitiva, informativa e visualmente atraente, utilizando o framework CSS Bulma e ícones Font Awesome. Este documento detalha os componentes da UI, estados visuais, animações e considerações de design que compõem a experiência do usuário da extensão.

## Estrutura da Interface

### Popup Principal

O popup principal é o ponto de entrada da extensão, exibido quando o usuário clica no ícone do BetCheck na barra de ferramentas do navegador. Sua estrutura básica é definida em `popup.html`:

```html
<div class="container">
  <!-- Cabeçalho -->
  <div class="header has-text-centered">
    <h1 class="title is-4">BetCheck</h1>
    <p class="subtitle is-6">Verificador de Sites de Apostas</p>
  </div>
  
  <!-- Indicador de carregamento -->
  <div id="loading" class="has-text-centered">
    <span class="icon is-large">
      <i class="fas fa-spinner fa-pulse fa-2x"></i>
    </span>
    <p>Verificando site...</p>
  </div>
  
  <!-- Conteúdo principal (inicialmente oculto) -->
  <div id="content" class="is-hidden">
    <!-- Status do site -->
    <div id="status-container" class="mb-4">
      <!-- Preenchido dinamicamente via JavaScript -->
    </div>
    
    <!-- Alerta de phishing (condicional) -->
    <div id="phishing-alert" class="is-hidden">
      <!-- Preenchido dinamicamente via JavaScript -->
    </div>
    
    <!-- Informações da empresa (condicional) -->
    <div id="company-info" class="is-hidden">
      <!-- Preenchido dinamicamente via JavaScript -->
    </div>
    
    <!-- Sites relacionados (condicional) -->
    <div id="related-sites" class="is-hidden">
      <!-- Preenchido dinamicamente via JavaScript -->
    </div>
  </div>
</div>

<!-- Modais (inicialmente ocultos) -->
<div id="cnpjModal" class="modal">
  <!-- Conteúdo do modal de CNPJ -->
</div>

<div id="cnpjLoadingModal" class="modal">
  <!-- Modal de carregamento durante consulta CNPJ -->
</div>

<div id="errorModal" class="modal">
  <!-- Modal de erro -->
</div>
```

### Componentes Principais

A interface é composta pelos seguintes componentes principais:

1. **Cabeçalho**: Título e subtítulo da extensão com estilo gradiente
2. **Indicador de Carregamento**: Spinner animado exibido durante a verificação
3. **Status do Site**: Indicador visual do resultado da verificação (aprovado/não aprovado)
4. **Alerta de Phishing**: Aviso destacado quando um site é detectado como possível phishing
5. **Informações da Empresa**: Card com detalhes da empresa (para sites aprovados)
6. **Sites Relacionados**: Lista de outros domínios da mesma empresa
7. **Modais**: Janelas pop-up para exibição de informações detalhadas

## Framework e Bibliotecas

### Bulma CSS

O BetCheck utiliza o framework Bulma CSS para estilização e layout:

1. **Sistema de Grid**: Organização responsiva dos elementos
2. **Componentes**: Utilização de cards, tags, modais e botões pré-estilizados
3. **Utilitários**: Classes para espaçamento, alinhamento e tipografia
4. **Cores**: Esquema de cores consistente para diferentes estados e elementos

```html
<!-- Exemplo de card usando Bulma -->
<div class="card">
  <div class="card-content">
    <div class="content">
      <p class="title is-5">Nome da Empresa</p>
      <p class="subtitle is-6">
        CNPJ: <a id="cnpj-link" href="#">XX.XXX.XXX/XXXX-XX</a>
      </p>
    </div>
  </div>
</div>
```

### Font Awesome

Os ícones são fornecidos pela biblioteca Font Awesome:

1. **Indicadores de Status**: Ícones de verificação, alerta e informação
2. **Animações**: Ícones animados para carregamento e alertas
3. **Interatividade**: Ícones clicáveis para ações específicas

```html
<!-- Exemplo de uso de ícones Font Awesome -->
<span class="icon has-text-success">
  <i class="fas fa-check-circle"></i>
</span>

<span class="icon has-text-danger">
  <i class="fas fa-exclamation-triangle"></i>
</span>
```

## Estados Visuais

### Estado de Carregamento

Durante a verificação do site, a interface exibe um estado de carregamento:

1. **Spinner Animado**: Ícone de carregamento com animação de rotação
2. **Mensagem de Espera**: Texto informando que a verificação está em andamento
3. **Conteúdo Oculto**: Outros componentes permanecem ocultos até a conclusão

```javascript
// Exibição do estado de carregamento
function showLoading() {
  document.getElementById('loading').classList.remove('is-hidden');
  document.getElementById('content').classList.add('is-hidden');
}

// Ocultação do estado de carregamento
function hideLoading() {
  document.getElementById('loading').classList.add('is-hidden');
  document.getElementById('content').classList.remove('is-hidden');
}
```

### Site Aprovado

Quando um site é verificado como oficialmente aprovado, a interface exibe:

1. **Ícone de Verificação Verde**: Indicador visual de aprovação
2. **Mensagem de Confirmação**: Texto informando que o site é homologado
3. **Card de Informações**: Detalhes da empresa (nome e CNPJ clicável)
4. **Sites Relacionados**: Lista de outros domínios da mesma empresa (quando disponíveis)

```javascript
// Exibição de site aprovado
function displayApprovedSite(result) {
  const statusContainer = document.getElementById('status-container');
  
  statusContainer.innerHTML = `
    <div class="notification is-success">
      <span class="icon"><i class="fas fa-check-circle"></i></span>
      <span>Site Homologado</span>
    </div>
  `;
  
  // Exibe informações da empresa
  const companyInfo = document.getElementById('company-info');
  companyInfo.innerHTML = `
    <div class="card mb-4">
      <div class="card-content">
        <div class="content">
          <p class="title is-5">${result.companyName}</p>
          <p class="subtitle is-6">
            CNPJ: <a href="#" id="cnpj-link">${formatCNPJ(result.cnpj)}</a>
          </p>
        </div>
      </div>
    </div>
  `;
  companyInfo.classList.remove('is-hidden');
  
  // Configura o link de CNPJ para abrir o modal
  document.getElementById('cnpj-link').addEventListener('click', (e) => {
    e.preventDefault();
    exibirModalCNPJ(result.cnpj, result.companyName);
  });
  
  // Exibe sites relacionados se disponíveis
  if (result.relatedSites && result.relatedSites.length > 0) {
    displayRelatedSites(result.relatedSites);
  }
}
```

### Site Não Aprovado

Para sites não encontrados na lista oficial, a interface exibe:

1. **Ícone de X Vermelho**: Indicador visual de não aprovação
2. **Mensagem de Alerta**: Texto informando que o site não é homologado
3. **Recomendação**: Sugestão para o usuário ter cautela

```javascript
// Exibição de site não aprovado
function displayNotApprovedSite() {
  const statusContainer = document.getElementById('status-container');
  
  statusContainer.innerHTML = `
    <div class="notification is-danger">
      <span class="icon"><i class="fas fa-times-circle"></i></span>
      <span>Site Não Homologado</span>
    </div>
    <p class="has-text-centered">
      Este site não está na lista oficial de operadores autorizados no Brasil.
      <br>Tenha cautela ao utilizá-lo.
    </p>
  `;
}
```

### Alerta de Phishing

Quando um site é detectado como possível tentativa de phishing, a interface exibe um alerta destacado:

1. **Borda Vermelha Pulsante**: Animação para chamar atenção
2. **Ícone de Alerta**: Símbolo de aviso em destaque
3. **Mensagem Detalhada**: Explicação sobre o motivo da suspeita
4. **Sites Oficiais Similares**: Alternativas legítimas (quando relevante)

```javascript
// Exibição de alerta de phishing
function displayPhishingAlert(phishingData) {
  const phishingAlert = document.getElementById('phishing-alert');
  
  let alertContent = `
    <div class="notification is-danger phishing-alert-box">
      <div class="phishing-alert-header">
        <span class="icon is-large"><i class="fas fa-exclamation-triangle fa-lg"></i></span>
        <span class="has-text-weight-bold">ALERTA DE PHISHING</span>
      </div>
      <p class="mt-2">Este site pode ser uma tentativa de phishing!</p>
  `;
  
  // Adiciona mensagem específica baseada no motivo
  if (phishingData.reason === 'domain_similarity' && phishingData.similarSites) {
    alertContent += `
      <p>Este domínio é similar a sites oficiais homologados:</p>
      <div class="tags">
    `;
    
    phishingData.similarSites.forEach(site => {
      alertContent += `
        <span class="tag is-info">
          <span class="icon"><i class="fas fa-check-circle"></i></span>
          ${site.domain}
        </span>
      `;
    });
    
    alertContent += `</div>`;
  } else if (phishingData.reason === 'not_official_domain') {
    alertContent += `
      <p>${phishingData.message}</p>
      <p class="has-text-weight-bold">
        Lembre-se: Apenas sites com domínio .bet.br são oficialmente autorizados no Brasil.
      </p>
    `;
  }
  
  alertContent += `</div>`;
  phishingAlert.innerHTML = alertContent;
  phishingAlert.classList.remove('is-hidden');
}
```

## Modais Interativos

### Modal de Consulta CNPJ

O modal de consulta de CNPJ exibe informações detalhadas sobre a empresa:

1. **Cabeçalho**: Nome da empresa e CNPJ formatado
2. **Informações Principais**: Capital social, data de abertura e endereço
3. **Quadro Societário**: Lista de sócios com detalhes
4. **Botão de Fechamento**: Opção para fechar o modal

```html
<div id="cnpjModal" class="modal">
  <div class="modal-background"></div>
  <div class="modal-card">
    <header class="modal-card-head">
      <p id="cnpjModalTitle" class="modal-card-title">Detalhes da Empresa</p>
      <button class="delete" aria-label="close"></button>
    </header>
    <section class="modal-card-body">
      <div class="content">
        <p><strong>CNPJ:</strong> <span id="cnpjFormatado"></span></p>
        <p><strong>Capital Social:</strong> <span id="capitalSocial"></span></p>
        <p><strong>Data de Abertura:</strong> <span id="dataAbertura"></span></p>
        
        <h4>Endereço</h4>
        <p id="enderecoCompleto"></p>
        
        <h4>Sócios</h4>
        <div id="sociosList"></div>
      </div>
    </section>
    <footer class="modal-card-foot">
      <button class="button" aria-label="close">Fechar</button>
    </footer>
  </div>
</div>
```

### Modal de Carregamento

Durante a consulta à API de CNPJ, um modal de carregamento é exibido:

1. **Fundo Semitransparente**: Bloqueia interações com a interface principal
2. **Spinner Animado**: Indicador visual de processamento
3. **Mensagem de Espera**: Texto informando que a consulta está em andamento

```html
<div id="cnpjLoadingModal" class="modal">
  <div class="modal-background"></div>
  <div class="modal-content has-text-centered">
    <div class="box">
      <span class="icon is-large">
        <i class="fas fa-spinner fa-pulse fa-2x"></i>
      </span>
      <p class="mt-2">Consultando informações do CNPJ...</p>
    </div>
  </div>
</div>
```

### Modal de Erro

Em caso de falha na consulta de CNPJ ou outras operações, um modal de erro é exibido:

1. **Ícone de Erro**: Indicador visual de problema
2. **Mensagem de Erro**: Texto explicativo sobre o problema
3. **Botão de Fechamento**: Opção para fechar o modal

```html
<div id="errorModal" class="modal">
  <div class="modal-background"></div>
  <div class="modal-card">
    <header class="modal-card-head has-background-danger">
      <p class="modal-card-title has-text-white">Erro</p>
      <button class="delete" aria-label="close"></button>
    </header>
    <section class="modal-card-body">
      <div class="content has-text-centered">
        <span class="icon is-large has-text-danger">
          <i class="fas fa-exclamation-circle fa-2x"></i>
        </span>
        <p id="errorModalMessage" class="mt-2"></p>
      </div>
    </section>
    <footer class="modal-card-foot">
      <button class="button" aria-label="close">Fechar</button>
    </footer>
  </div>
</div>
```

## Elementos Visuais Especiais

### Animações e Transições

O BetCheck utiliza animações sutis para melhorar a experiência do usuário:

1. **Spinner de Carregamento**: Animação de rotação contínua
2. **Pulsação de Alerta**: Efeito de pulsação na borda do alerta de phishing
3. **Fade de Modais**: Transição suave ao abrir e fechar modais
4. **Hover em Elementos Clicáveis**: Mudança de estilo ao passar o mouse

```css
/* Exemplo de animação de pulsação para alerta de phishing */
@keyframes pulse-border {
  0% { border-color: rgba(255, 56, 96, 0.8); }
  50% { border-color: rgba(255, 56, 96, 1); }
  100% { border-color: rgba(255, 56, 96, 0.8); }
}

.phishing-alert-box {
  border: 3px solid rgba(255, 56, 96, 0.9);
  animation: pulse-border 2s infinite;
}
```

### Tags e Badges

Para exibir informações compactas, o BetCheck utiliza tags coloridas:

1. **Sites Relacionados**: Tags azuis com domínios relacionados
2. **Sites Oficiais**: Tags verdes com ícone de verificação
3. **Status de Verificação**: Badges indicando o resultado da verificação

```html
<!-- Exemplo de exibição de sites relacionados com tags -->
<div id="related-sites" class="box">
  <h4 class="title is-6">Sites Relacionados</h4>
  <div class="tags">
    <span class="tag is-info">exemplo1.bet.br</span>
    <span class="tag is-info">exemplo2.bet.br</span>
    <span class="tag is-info">exemplo3.bet.br</span>
  </div>
</div>
```

### Gradientes e Sombras

Para criar uma interface moderna e profissional, o BetCheck utiliza:

1. **Cabeçalho com Gradiente**: Degradê em tons de roxo no cabeçalho
2. **Sombras Sutis**: Efeito de elevação em cards e modais
3. **Bordas Arredondadas**: Cantos suaves em todos os elementos
4. **Contraste Adequado**: Cores de fundo e texto com bom contraste

```css
/* Exemplo de estilo para cabeçalho com gradiente */
.header {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  padding: 1.5rem 1rem;
  border-radius: 6px 6px 0 0;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
```

## Responsividade

### Adaptação a Diferentes Tamanhos

O popup do BetCheck é projetado para ser responsivo dentro das limitações de uma extensão:

1. **Largura Fixa**: Definida para proporcionar boa legibilidade (320-400px)
2. **Altura Adaptável**: Ajusta-se ao conteúdo com scrolling quando necessário
3. **Layout Fluido**: Elementos se adaptam à largura disponível
4. **Tipografia Responsiva**: Tamanhos de fonte adequados para leitura em popup

```css
/* Configuração básica de responsividade */
body {
  width: 360px;
  min-height: 200px;
  max-height: 600px;
  overflow-y: auto;
}

/* Ajustes para elementos em espaços restritos */
@media (max-width: 340px) {
  .title.is-4 {
    font-size: 1.2rem;
  }
  
  .subtitle.is-6 {
    font-size: 0.9rem;
  }
}
```

### Scrolling e Overflow

Para lidar com conteúdo extenso em um espaço limitado:

1. **Scrolling Vertical**: Permite rolar o conteúdo quando excede a altura máxima
2. **Conteúdo Priorizado**: Informações mais importantes são exibidas primeiro
3. **Modais com Scroll**: Modais com muito conteúdo permitem rolagem interna

## Acessibilidade

### Práticas Implementadas

O BetCheck implementa várias práticas de acessibilidade:

1. **Contraste Adequado**: Cores de texto e fundo com contraste suficiente
2. **Textos Alternativos**: Descrições para ícones e elementos visuais
3. **Foco Visível**: Indicadores claros de foco para navegação por teclado
4. **Estrutura Semântica**: Uso apropriado de cabeçalhos e landmarks
5. **Mensagens de Erro Claras**: Feedback compreensível em caso de problemas

```html
<!-- Exemplo de uso de atributos de acessibilidade -->
<button class="delete" aria-label="close"></button>

<span class="icon" aria-hidden="true">
  <i class="fas fa-check-circle"></i>
</span>
<span>Site Homologado</span>
```

## Interatividade

### Elementos Clicáveis

A interface possui diversos elementos interativos:

1. **Link de CNPJ**: Abre o modal com informações detalhadas
2. **Botões de Fechamento**: Fecham modais e alertas
3. **Tags de Sites**: Podem ser clicáveis para navegação direta (implementação futura)

### Eventos e Handlers

A interatividade é gerenciada por event listeners em `popup.js`:

```javascript
// Configuração de event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Inicia a verificação do site atual
  getCurrentTab().then(tab => {
    const url = new URL(tab.url);
    const domain = url.hostname;
    checkDomain(domain);
  });
  
  // Configura fechamento de modais
  const closeButtons = document.querySelectorAll('.modal .delete, .modal button.button');
  closeButtons.forEach(button => {
    const modal = button.closest('.modal');
    button.addEventListener('click', () => {
      modal.classList.remove('is-active');
    });
  });
  
  // Fecha modais ao clicar no fundo
  const modalBackgrounds = document.querySelectorAll('.modal-background');
  modalBackgrounds.forEach(background => {
    const modal = background.closest('.modal');
    background.addEventListener('click', () => {
      modal.classList.remove('is-active');
    });
  });
});
```

## Considerações de Design

### Princípios de UI/UX

O design da interface segue princípios fundamentais de UI/UX:

1. **Clareza**: Informações apresentadas de forma direta e compreensível
2. **Hierarquia Visual**: Elementos organizados por ordem de importância
3. **Feedback Imediato**: Resposta visual para ações do usuário
4. **Consistência**: Padrões visuais e comportamentais uniformes
5. **Minimalismo**: Apenas informações essenciais são exibidas

### Esquema de Cores

O esquema de cores foi escolhido para transmitir significado e emoção:

1. **Verde (#23d160)**: Indica aprovação, segurança, confiança
2. **Vermelho (#ff3860)**: Indica rejeição, perigo, alerta
3. **Azul (#3273dc)**: Indica informação, links, elementos interativos
4. **Roxo (Gradiente)**: Identidade visual da extensão, modernidade
5. **Cinza Claro (#f5f5f5)**: Fundo neutro para conteúdo

### Tipografia

A tipografia foi selecionada para garantir boa legibilidade:

1. **Família Sans-serif**: Fonte limpa e moderna (herdada do Bulma)
2. **Tamanhos Variados**: Hierarquia clara com diferentes tamanhos
3. **Peso da Fonte**: Uso de negrito para destacar informações importantes
4. **Espaçamento**: Adequado entre linhas e parágrafos para facilitar leitura

## Testes e Validação

### Cenários de Teste

A interface deve ser testada nos seguintes cenários:

1. **Sites Aprovados**: Verificação da exibição correta de informações
2. **Sites Não Aprovados**: Verificação da mensagem de alerta
3. **Detecção de Phishing**: Verificação do alerta e informações relacionadas
4. **Consulta de CNPJ**: Teste do modal e exibição de dados
5. **Erros de Conexão**: Verificação das mensagens de erro
6. **Diferentes Navegadores**: Compatibilidade com Chrome e derivados

### Feedback dos Usuários

Áreas para coletar feedback dos usuários:

1. **Clareza das Informações**: As mensagens são compreensíveis?
2. **Facilidade de Uso**: A interface é intuitiva?
3. **Desempenho**: A extensão responde rapidamente?
4. **Utilidade**: As informações apresentadas são úteis?
5. **Sugestões de Melhorias**: Funcionalidades adicionais desejadas

## Considerações Futuras

### Melhorias Potenciais

A interface do usuário pode ser aprimorada com:

1. **Tema Escuro**: Opção de alternância entre temas claro e escuro
2. **Personalização**: Configurações para ajustar a exibição de informações
3. **Histórico**: Visualização de sites verificados anteriormente
4. **Notificações**: Alertas proativos ao acessar sites suspeitos
5. **Tutoriais Interativos**: Guias para novos usuários

### Expansão de Funcionalidades

Possíveis expansões da interface incluem:

1. **Dashboard**: Visão consolidada de estatísticas e informações
2. **Comparação de Sites**: Ferramenta para comparar diferentes operadores
3. **Integração com Favoritos**: Marcação de sites confiáveis
4. **Relatórios Detalhados**: Exportação de informações em diferentes formatos
5. **Comunidade**: Recursos para feedback coletivo sobre operadores
