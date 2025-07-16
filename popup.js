// Importa os módulos necessários
import { consultarCNPJ, formatCNPJ } from './cnpj.js';
import { advancedPhishingCheck, checkSuspiciousTerms, hasPhishingPattern } from './phishing-advanced.js';
import { getFromCache, saveToCache } from './cache.js';
import Stats from './stats.js';

/**
 * Realiza uma análise simplificada de phishing para o domínio atual
 * @param {string} domain - Domínio a ser analisado
 */
function performAdvancedPhishingCheck(domain) {
  try {
    // Cria elementos para exibir a análise de phishing se ainda não existirem
    const resultElement = document.getElementById('result');
    let advancedAnalysisElement = document.getElementById('advanced-analysis');
    
    if (!advancedAnalysisElement) {
      advancedAnalysisElement = document.createElement('div');
      advancedAnalysisElement.id = 'advanced-analysis';
      advancedAnalysisElement.className = 'box mt-4';
      
      const cardHeader = document.createElement('div');
      cardHeader.className = 'has-text-centered mb-3';
      cardHeader.innerHTML = `
        <h4 class="title is-5">
          <span class="icon"><i class="fas fa-search-plus"></i></span>
          Análise Avançada de Phishing
        </h4>
      `;
      advancedAnalysisElement.appendChild(cardHeader);
      
      const cardContent = document.createElement('div');
      cardContent.className = 'content';
      
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'loading-indicator has-text-centered';
      loadingIndicator.innerHTML = `
        <span class="icon is-large">
          <i class="fas fa-circle-notch fa-spin fa-2x"></i>
        </span>
        <p>Analisando domínio...</p>
      `;
      
      const analysisContent = document.createElement('div');
      analysisContent.className = 'analysis-content is-hidden';
      
      cardContent.appendChild(loadingIndicator);
      cardContent.appendChild(analysisContent);
      advancedAnalysisElement.appendChild(cardContent);
      
      resultElement.appendChild(advancedAnalysisElement);
    }
    
    const loadingIndicator = document.querySelector('.loading-indicator');
    const analysisContent = document.querySelector('.analysis-content');
    
    // Mostra o indicador de carregamento
    loadingIndicator.classList.remove('is-hidden');
    analysisContent.classList.add('is-hidden');
    
    // Pequeno delay para mostrar o indicador de carregamento
    setTimeout(() => {
      // Faz a análise diretamente no popup sem depender do background script
      const analysis = analyzePhishingRisk(domain);
      
      // Esconde o indicador de carregamento
      loadingIndicator.classList.add('is-hidden');
      analysisContent.classList.remove('is-hidden');
      
      // Exibe os resultados da análise
      displayPhishingAnalysisResults(analysis);
    }, 500);
    
  } catch (error) {
    console.error('Erro na análise avançada de phishing:', error);
    showAnalysisError('Erro inesperado durante a análise');
  }
  
  // Função auxiliar para exibir erros de análise
  function showAnalysisError(errorMessage) {
    const loadingIndicator = document.querySelector('.loading-indicator');
    const analysisContent = document.querySelector('.analysis-content');
    
    if (loadingIndicator && analysisContent) {
      loadingIndicator.classList.add('is-hidden');
      analysisContent.classList.remove('is-hidden');
      analysisContent.innerHTML = `
        <div class="notification is-warning">
          <p class="has-text-centered">
            <span class="icon"><i class="fas fa-exclamation-triangle"></i></span>
            ${errorMessage || 'Não foi possível realizar a análise avançada.'}
          </p>
        </div>
      `;
    }
  }
}

/**
 * Analisa o risco de phishing de um domínio
 * @param {string} domain - Domínio a ser analisado
 * @returns {Object} - Resultado da análise
 */
function analyzePhishingRisk(domain) {
  // Normaliza o domínio
  const normalizedDomain = domain.replace(/^www\./, '');
  
  // Verifica se o domínio contém termos suspeitos
  const hasSuspiciousTerms = /apostas?|bet|bets|casino|gambling|jogo/i.test(normalizedDomain);
  const isNotOfficialDomain = !normalizedDomain.endsWith('.bet.br');
  
  // Determina o nível de risco
  let phishingScore = 0;
  let riskLevel = 'Baixo';
  let isLikelyPhishing = false;
  const details = [];
  
  if (hasSuspiciousTerms && isNotOfficialDomain) {
    phishingScore = 70;
    riskLevel = 'Médio';
    details.push('Domínio contém termos relacionados a apostas mas não usa o domínio oficial .bet.br');
  }
  
  // Verifica padrões comuns de phishing
  const hasPhishingPattern = /-?seguro-?|-?secure-?|-?oficial-?|-?original-?|-?login-?|-?conta-?|-?account-?|\d{4,}|-{2,}|[a-z]\d+[a-z]/i.test(normalizedDomain);
  
  if (hasPhishingPattern) {
    phishingScore += 30;
    details.push('Domínio contém padrões comuns de phishing');
    
    if (phishingScore >= 70) {
      riskLevel = 'Alto';
      isLikelyPhishing = true;
    } else if (phishingScore >= 40) {
      riskLevel = 'Médio';
    }
  }
  
  return {
    domain: domain,
    isLikelyPhishing: isLikelyPhishing,
    phishingScore: phishingScore,
    riskLevel: riskLevel,
    details: details
  };
}

/**
 * Exibe os resultados da análise de phishing na interface
 * @param {Object} analysis - Resultados da análise
 */
function displayPhishingAnalysisResults(analysis) {
  const analysisContent = document.querySelector('.analysis-content');
  
  if (!analysisContent) return;
  
  // Determina a classe de cor baseada no nível de risco
  let riskClass = 'is-success';
  let riskIcon = 'fa-shield-check';
  
  // Normaliza o nível de risco para minúsculas para comparação
  const riskLevel = analysis.riskLevel ? analysis.riskLevel.toLowerCase() : 'baixo';
  
  if (riskLevel === 'alto') {
    riskClass = 'is-danger';
    riskIcon = 'fa-exclamation-triangle';
  } else if (riskLevel === 'médio') {
    riskClass = 'is-warning';
    riskIcon = 'fa-exclamation';
  }
  
  // Constrói o HTML para exibir os resultados
  let html = `
    <div class="notification ${riskClass}">
      <p class="has-text-weight-bold">
        <span class="icon"><i class="fas ${riskIcon}"></i></span>
        Nível de risco: ${analysis.riskLevel ? analysis.riskLevel.toUpperCase() : 'BAIXO'} (${analysis.phishingScore || 0}/100)
      </p>
    </div>
    
    <div class="content">
      <p class="has-text-weight-bold">Fatores de risco detectados:</p>
      <ul>
  `;
  
  // Adiciona os detalhes da análise
  if (analysis.details && analysis.details.length > 0) {
    analysis.details.forEach(detail => {
      html += `<li>${detail}</li>`;
    });
  } else {
    html += `<li>Nenhum fator de risco significativo detectado.</li>`;
  }
  
  html += `</ul>`;
  
  // Dica sobre domínios oficiais
  html += `
    <div class="notification is-info is-light mt-3">
      <p><i class="fas fa-info-circle mr-2"></i> <strong>Dica:</strong> Sites de apostas oficialmente homologados no Brasil utilizam o domínio <strong>.bet.br</strong>.</p>
    </div>
  `;
  
  // Fecha a div de conteúdo
  html += `</div>`;
  
  // Adiciona informações de segurança adicionais
  if (analysis.isLikelyPhishing) {
    html += `
      <div class="box mt-3 has-background-danger-light">
        <h4 class="title is-5">Recomendações de Segurança</h4>
        <div class="content">
          <ul>
            <li>Não compartilhe dados pessoais ou financeiros com este site.</li>
            <li>Verifique sempre a URL antes de fazer login ou depósitos.</li>
            <li>Prefira sempre sites com domínio oficial .bet.br.</li>
            <li>Em caso de dúvida, consulte a lista oficial de sites homologados no site da Secretaria de Prêmios e Apostas.</li>
          </ul>
        </div>
      </div>
    `;
  }
  
  // Atualiza o conteúdo
  analysisContent.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
  // Inicializa as estatísticas
  Stats.initialize();
  
  // Atualiza a UI do modal de informações com as estatísticas atuais
  Stats.updateUI();

  const loadingElement = document.getElementById('loading');
  const resultElement = document.getElementById('result');
  const statusHero = document.getElementById('status-hero');
  const statusIcon = document.getElementById('status-icon');
  const statusMessage = document.getElementById('status-message');
  const detailsElement = document.getElementById('details');
  const companyNameElement = document.getElementById('company-name');
  const companyCnpjElement = document.getElementById('company-cnpj');
  const relatedSitesElement = document.getElementById('related-sites');
  const relatedSitesListElement = document.getElementById('related-sites-list');
  const phishingWarningElement = document.getElementById('phishing-warning');
  const phishingMessageElement = document.getElementById('phishing-message');
  const phishingSimilarSitesElement = document.getElementById('phishing-similar-sites');
  const phishingSimilarSitesListElement = document.getElementById('phishing-similar-sites-list');
  // Get the current tab URL
  chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
    try {
      const currentUrl = tabs[0].url;
      let hostname = new URL(currentUrl).hostname;
      
      // Adiciona log para debug
      console.log('URL atual:', currentUrl);
      console.log('Hostname extraído:', hostname);
      
      // Caso especial para sporty.bet.br
      if (hostname.includes('sporty.bet.br')) {
        hostname = 'sporty.bet.br';
        console.log('Caso especial detectado para sporty.bet.br');
      }
      
      // Send message to background script to check if the site is approved
      chrome.runtime.sendMessage({action: "checkBetSite", url: hostname}, function(response) {
        // Hide loading spinner
        loadingElement.classList.add('is-hidden');
        
        // Show result container
        resultElement.classList.remove('is-hidden');
        
        if (response && response.isApproved) {
          // Site is approved
          statusHero.classList.add('has-background-success-light');
          statusIcon.innerHTML = '<i class="fas fa-check-circle fa-2x has-text-success"></i>';
          statusMessage.textContent = "Site de apostas homologado";
          
          // Incrementa o contador de sites homologados
          Stats.incrementApproved();
          
          // Exibe o selo de verificação
          document.getElementById('verification-badge').classList.remove('is-hidden');
          
          // Exibe a data de verificação
          document.getElementById('verification-date').classList.remove('is-hidden');
          const verificationDate = document.getElementById('verification-date');
          verificationDate.textContent = `Verificado em ${new Date().toLocaleDateString('pt-BR')}`;
          verificationDate.classList.remove('is-hidden');
          
          // Removido ícone de consulta WHOIS
          
          // Display company details
          detailsElement.classList.remove('is-hidden');
          companyNameElement.textContent = response.companyName || 'N/A';
          
          // Formata o CNPJ e adiciona ícone de consulta
          const formattedCnpj = formatCNPJ(response.cnpj);
          companyCnpjElement.innerHTML = `
            <span class="tag is-info is-light">
              <span>CNPJ: ${formattedCnpj}</span>
            </span>
            <span class="icon is-small clickable-icon ml-2" title="Consultar detalhes do CNPJ" data-cnpj="${response.cnpj}">
              <i class="fas fa-search"></i>
            </span>
          `;
          
          // Adiciona evento de clique no ícone de consulta de CNPJ
          // Usa MutationObserver para garantir que o elemento esteja no DOM
          const setupCNPJClickEvent = () => {
            const cnpjIcon = document.querySelector('.clickable-icon[data-cnpj]');
            if (cnpjIcon) {
              // Verifica se o evento já foi adicionado para evitar duplicação
              if (!cnpjIcon.hasAttribute('data-event-added')) {
                cnpjIcon.addEventListener('click', function() {
                  const cnpj = this.getAttribute('data-cnpj');
                  if (cnpj) {
                    console.log(`Consultando CNPJ: ${cnpj}`);
                    consultarCNPJ(cnpj);
                  } else {
                    console.error('Atributo data-cnpj não encontrado');
                  }
                });
                // Marca o elemento para evitar adicionar o evento múltiplas vezes
                cnpjIcon.setAttribute('data-event-added', 'true');
                console.log('Evento de clique para consulta de CNPJ adicionado com sucesso');
              }
              return true;
            } else {
              console.log('Elemento de consulta de CNPJ ainda não está no DOM');
              return false;
            }
          };
          
          // Tenta configurar o evento imediatamente
          if (!setupCNPJClickEvent()) {
            // Se não conseguir, tenta novamente após um curto intervalo
            setTimeout(setupCNPJClickEvent, 200);
          }
          
          // Display related sites if available
          if (response.relatedSites && response.relatedSites.length > 0) {
            // Clear previous content
            relatedSitesListElement.innerHTML = '';
            
            // Add each related site as a tag
            response.relatedSites.forEach(site => {
              // Skip the current site
              if (hostname.includes(site.domain)) {
                return;
              }
              
              // Cria um elemento de link em vez de span
              const tag = document.createElement('a');
              tag.className = 'tag is-info is-light is-clickable';
              tag.href = `https://${site.domain}`;
              tag.target = '_blank'; // Abre em nova aba
              
              // Adiciona estilo para cursor pointer e hover
              tag.style.cursor = 'pointer';
              tag.style.marginRight = '5px';
              tag.style.marginBottom = '5px';
              
              // Create the domain text
              const domainText = document.createTextNode(site.domain);
              tag.appendChild(domainText);
              
              // Add tooltip with brand name if available
              if (site.brand) {
                tag.title = `${site.brand} - Clique para abrir`;
                tag.setAttribute('data-tooltip', `${site.brand} - Clique para abrir`);
                
                // Adiciona classe para tooltip do Bulma
                tag.classList.add('has-tooltip-bottom');
              } else {
                tag.title = 'Clique para abrir';
              }
              
              // Adiciona ícone de link externo
              const iconSpan = document.createElement('span');
              iconSpan.className = 'icon is-small ml-1';
              const icon = document.createElement('i');
              icon.className = 'fas fa-external-link-alt';
              icon.style.fontSize = '0.7em';
              iconSpan.appendChild(icon);
              tag.appendChild(iconSpan);
              
              relatedSitesListElement.appendChild(tag);
            });
            
            // Only show the related sites section if we have sites to display
            // (other than the current one)
            if (relatedSitesListElement.children.length > 0) {
              relatedSitesElement.classList.remove('is-hidden');
            } else {
              relatedSitesElement.classList.add('is-hidden');
            }
          } else {
            relatedSitesElement.classList.add('is-hidden');
          }
        } else {
          // Site is not approved
          statusHero.classList.add('has-background-danger-light');
          statusIcon.innerHTML = '<i class="fas fa-times-circle fa-2x has-text-danger"></i>';
          statusMessage.textContent = "Site Não Homologado";
          
          // Incrementa o contador de sites suspeitos
          Stats.incrementSuspicious();
          
          // Esconde o selo de verificação e a data
          document.getElementById('verification-badge').classList.add('is-hidden');
          document.getElementById('verification-date').classList.add('is-hidden');
          
          // No details to show for non-approved sites
          detailsElement.classList.add('is-hidden');
          relatedSitesElement.classList.add('is-hidden');
          
          // Realiza análise avançada de phishing para sites não homologados
          // Só realiza a análise se não houver alerta de phishing do background
          if (!response.phishingWarning || !response.phishingWarning.isPhishing) {
            performAdvancedPhishingCheck(hostname);
          }
          
          // Verifica se há alerta de phishing
          if (response.phishingWarning && response.phishingWarning.isPhishing) {
            // Exibe o alerta de phishing
            phishingWarningElement.classList.remove('is-hidden');
            
            // Adiciona efeito de destaque ao alerta
            setTimeout(() => {
              phishingWarningElement.classList.add('is-pulse');
            }, 300);
            
            // Define a mensagem de alerta
            if (response.phishingWarning.reason === 'domain_similarity') {
              phishingMessageElement.innerHTML = "<strong>ATENÇÃO!</strong> Este site pode estar tentando se passar por um site oficial de apostas.<br><br>No Brasil, apenas domínios <strong>.bet.br</strong> são oficialmente homologados.";
              
              // Exibe sites similares se houver
              if (response.phishingWarning.similarSites && response.phishingWarning.similarSites.length > 0) {
                phishingSimilarSitesElement.classList.remove('is-hidden');
                phishingSimilarSitesListElement.innerHTML = '';
                
                // Adiciona cada site similar como uma tag clicável
                response.phishingWarning.similarSites.forEach(site => {
                  // Verifica se o site é um objeto ou uma string
                  const domainName = site && site.domain ? site.domain : site;
                  
                  // Cria um elemento de link em vez de span
                  const tag = document.createElement('a');
                  tag.className = 'tag is-success is-clickable';
                  tag.href = `https://${domainName}`;
                  tag.target = '_blank'; // Abre em nova aba
                  tag.style.cursor = 'pointer';
                  tag.style.marginRight = '5px';
                  tag.style.marginBottom = '5px';
                  tag.title = 'Site oficial homologado - Clique para abrir';
                  
                  // Add checkmark icon
                  const iconSpan = document.createElement('span');
                  iconSpan.className = 'icon is-small';
                  const icon = document.createElement('i');
                  icon.className = 'fas fa-check-circle';
                  iconSpan.appendChild(icon);
                  tag.appendChild(iconSpan);
                  
                  // Add space after icon
                  tag.appendChild(document.createTextNode(' '));
                  
                  // Add domain text
                  tag.appendChild(document.createTextNode(domainName));
                  
                  // Adiciona ícone de link externo
                  const linkIconSpan = document.createElement('span');
                  linkIconSpan.className = 'icon is-small ml-1';
                  const linkIcon = document.createElement('i');
                  linkIcon.className = 'fas fa-external-link-alt';
                  linkIcon.style.fontSize = '0.7em';
                  linkIconSpan.appendChild(linkIcon);
                  tag.appendChild(linkIconSpan);
                  
                  phishingSimilarSitesListElement.appendChild(tag);
                });
              } else {
                phishingSimilarSitesElement.classList.add('is-hidden');
              }
            } else if (response.phishingWarning.reason === 'not_official_domain') {
              phishingMessageElement.innerHTML = "<strong>ATENÇÃO!</strong> Este site contém termos relacionados a apostas, mas <strong>não usa o domínio oficial .bet.br</strong>.<br><br>Apenas sites com domínio .bet.br são homologados no Brasil.";
              phishingSimilarSitesElement.classList.add('is-hidden');
            }
            
            // Removida consulta de WHOIS para sites suspeitos
            
          } else {
            // Esconde o alerta de phishing se não houver
            phishingWarningElement.classList.add('is-hidden');
          }
        }
      });
    } catch (error) {
      // Hide loading spinner
      loadingElement.classList.add('is-hidden');
      
      // Show result with error
      resultElement.classList.remove('is-hidden');
      statusHero.classList.add('has-background-warning-light');
      statusIcon.innerHTML = '<i class="fas fa-exclamation-triangle fa-2x has-text-warning"></i>';
      statusMessage.textContent = "Erro ao verificar o site";
      
      // Esconde o selo de verificação e a data
      document.getElementById('verification-badge').classList.add('is-hidden');
      document.getElementById('verification-date').classList.add('is-hidden');
      
      // Adiciona mensagem de erro mais detalhada
      const errorMessage = document.createElement('p');
      errorMessage.className = 'has-text-centered mt-2 has-text-grey';
      errorMessage.textContent = 'Ocorreu um erro ao verificar este site. Por favor, tente novamente mais tarde.';
      statusHero.querySelector('.has-text-centered').appendChild(errorMessage);
      
      // Hide details and related sites
      detailsElement.classList.add('is-hidden');
      relatedSitesElement.classList.add('is-hidden');
      
      console.error('Error checking site:', error);
    }
  });

  // Configuração do modal de informações
  const infoIcon = document.getElementById('info-icon');
  const infoModal = document.getElementById('info-modal');
  const closeButtons = document.querySelectorAll('#info-modal .delete, #info-modal .close-modal');

  // Abre o modal quando o ícone de informação é clicado
  infoIcon.addEventListener('click', () => {
    // Atualiza as estatísticas antes de abrir o modal
    Stats.updateUI();
    infoModal.classList.add('is-active');
  });

  // Fecha o modal quando os botões de fechar são clicados
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      infoModal.classList.remove('is-active');
    });
  });

  // Fecha o modal quando o fundo é clicado
  document.querySelector('#info-modal .modal-background').addEventListener('click', () => {
    infoModal.classList.remove('is-active');
  });

  // Fecha o modal quando a tecla ESC é pressionada
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && infoModal.classList.contains('is-active')) {
      infoModal.classList.remove('is-active');
    }
  });
});
