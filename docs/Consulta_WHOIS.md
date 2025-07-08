# Consulta WHOIS

## Visão Geral

A funcionalidade de consulta WHOIS do BetCheck permite aos usuários acessar informações detalhadas sobre o registro de domínios, fornecendo dados importantes para avaliar a credibilidade e legitimidade dos sites de apostas. Este documento detalha a implementação técnica, integração com API externa, exibição de dados e casos de uso específicos para esta funcionalidade.

## Importância da Consulta WHOIS

### Contexto de Segurança

No contexto de sites de apostas, as informações WHOIS são particularmente valiosas pelos seguintes motivos:

1. **Idade do Domínio**: Sites de phishing frequentemente utilizam domínios recém-registrados
2. **Transparência**: Operadores legítimos geralmente mantêm registros WHOIS completos e atualizados
3. **Jurisdição**: Permite verificar em qual país o domínio está registrado
4. **Consistência**: Ajuda a verificar se as informações de registro correspondem à empresa declarada

### Benefícios para o Usuário

A consulta WHOIS oferece diversos benefícios:

1. **Verificação Adicional**: Camada extra de validação além da verificação na lista oficial
2. **Detecção de Fraudes**: Identificação de domínios recentes que podem ser tentativas de phishing
3. **Informações Técnicas**: Acesso a dados como servidores DNS e status do domínio
4. **Tomada de Decisão**: Mais elementos para avaliar a confiabilidade de um site

## Implementação Técnica

### Integração com API WHOIS

O BetCheck utiliza a API da APILayer para consultas WHOIS:

```javascript
// Função para consultar dados WHOIS de um domínio
async function consultarWhois(domain) {
  // Remove prefixo www. se presente
  if (domain.startsWith('www.')) {
    domain = domain.substring(4);
  }
  
  // Verifica se já temos este domínio em cache
  const cachedData = await getCachedWhoisData(domain);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Configuração da requisição para a API da APILayer
    const apiKey = 'YOUR_APILAYER_API_KEY'; // Substituído em tempo de build
    const url = `https://api.apilayer.com/whois/query?domain=${domain}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na consulta WHOIS: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Processa e formata os dados recebidos
    const processedData = processWhoisData(data, domain);
    
    // Armazena em cache para consultas futuras
    await cacheWhoisData(domain, processedData);
    
    return processedData;
  } catch (error) {
    console.error('Erro ao consultar WHOIS:', error);
    throw error;
  }
}
```

### Processamento de Dados WHOIS

Os dados retornados pela API são processados para extrair as informações mais relevantes:

```javascript
// Função para processar e formatar dados WHOIS
function processWhoisData(data, domain) {
  // Extrai informações principais
  const creationDate = data.result?.creation_date || null;
  const expirationDate = data.result?.expiration_date || null;
  const registrar = data.result?.registrar || 'Não disponível';
  const nameServers = data.result?.name_servers || [];
  const status = data.result?.status || [];
  
  // Calcula a idade do domínio
  let domainAge = null;
  if (creationDate) {
    const creationTime = new Date(creationDate).getTime();
    const currentTime = new Date().getTime();
    const ageInDays = Math.floor((currentTime - creationTime) / (1000 * 60 * 60 * 24));
    
    // Formata a idade em anos, meses e dias
    const years = Math.floor(ageInDays / 365);
    const months = Math.floor((ageInDays % 365) / 30);
    const days = ageInDays % 30;
    
    domainAge = {
      days: ageInDays,
      formatted: years > 0 ? 
        `${years} ano(s), ${months} mês(es) e ${days} dia(s)` : 
        `${months} mês(es) e ${days} dia(s)`
    };
  }
  
  // Determina se o domínio é recente (menos de 6 meses)
  const isRecent = domainAge && domainAge.days < 180;
  
  return {
    domain,
    creationDate,
    expirationDate,
    registrar,
    nameServers,
    status,
    domainAge,
    isRecent,
    rawData: data.result // Mantém os dados brutos para referência
  };
}
```

### Sistema de Cache

Para otimizar o desempenho e reduzir requisições à API, o BetCheck implementa um sistema de cache:

```javascript
// Função para armazenar dados WHOIS em cache
async function cacheWhoisData(domain, data) {
  try {
    // Cria uma chave única para o cache
    const cacheKey = `whois_data_${domain}`;
    
    // Adiciona timestamp para controle de expiração
    const cacheData = {
      data: data,
      timestamp: Date.now()
    };
    
    // Armazena no storage local do Chrome
    await chrome.storage.local.set({ [cacheKey]: cacheData });
    
    return true;
  } catch (error) {
    console.error('Erro ao armazenar cache WHOIS:', error);
    return false;
  }
}

// Função para recuperar dados WHOIS em cache
async function getCachedWhoisData(domain) {
  try {
    const cacheKey = `whois_data_${domain}`;
    
    // Recupera dados do storage
    const result = await chrome.storage.local.get(cacheKey);
    const cachedItem = result[cacheKey];
    
    // Verifica se existe cache e se não expirou (30 dias)
    if (cachedItem && Date.now() - cachedItem.timestamp < 30 * 24 * 60 * 60 * 1000) {
      return cachedItem.data;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao recuperar cache WHOIS:', error);
    return null;
  }
}
```

## Interface do Usuário

### Dois Modos de Exibição

A funcionalidade de consulta WHOIS é apresentada de duas formas diferentes, dependendo do contexto:

#### 1. Para Sites Homologados

Para sites que estão na lista oficial, a consulta WHOIS é disponibilizada como uma opção adicional:

```html
<!-- Botão de consulta WHOIS para sites homologados -->
<div class="has-text-centered mt-2">
  <button id="whois-button" class="button is-small is-info">
    <span class="icon">
      <i class="fas fa-search"></i>
    </span>
    <span>Consultar WHOIS</span>
  </button>
</div>
```

```javascript
// Configuração do botão de WHOIS para sites homologados
document.getElementById('whois-button').addEventListener('click', () => {
  const domain = currentDomain; // Domínio atual sendo verificado
  showWhoisModal(domain);
});

// Função para exibir modal com informações WHOIS
function showWhoisModal(domain) {
  // Exibe o modal de carregamento
  document.getElementById('whoisLoadingModal').classList.add('is-active');
  
  // Consulta os dados WHOIS
  consultarWhois(domain)
    .then(whoisData => {
      // Fecha o modal de carregamento
      document.getElementById('whoisLoadingModal').classList.remove('is-active');
      
      // Preenche os dados no modal principal
      document.getElementById('whoisModalTitle').textContent = `Informações WHOIS: ${domain}`;
      
      // Preenche as informações básicas
      document.getElementById('whoisRegistrar').textContent = whoisData.registrar;
      document.getElementById('whoisCreationDate').textContent = formatDate(whoisData.creationDate);
      document.getElementById('whoisExpirationDate').textContent = formatDate(whoisData.expirationDate);
      document.getElementById('whoisAge').textContent = whoisData.domainAge ? whoisData.domainAge.formatted : 'N/A';
      
      // Preenche os servidores DNS
      const dnsServersList = document.getElementById('whoisDnsServers');
      dnsServersList.innerHTML = '';
      
      if (whoisData.nameServers && whoisData.nameServers.length > 0) {
        whoisData.nameServers.forEach(server => {
          const serverItem = document.createElement('li');
          serverItem.textContent = server;
          dnsServersList.appendChild(serverItem);
        });
      } else {
        const noServers = document.createElement('li');
        noServers.textContent = 'Informações não disponíveis';
        dnsServersList.appendChild(noServers);
      }
      
      // Preenche os status do domínio
      const statusList = document.getElementById('whoisStatus');
      statusList.innerHTML = '';
      
      if (whoisData.status && whoisData.status.length > 0) {
        whoisData.status.forEach(status => {
          const statusItem = document.createElement('li');
          statusItem.textContent = status;
          statusList.appendChild(statusItem);
        });
      } else {
        const noStatus = document.createElement('li');
        noStatus.textContent = 'Informações não disponíveis';
        statusList.appendChild(noStatus);
      }
      
      // Exibe o modal principal
      document.getElementById('whoisModal').classList.add('is-active');
    })
    .catch(error => {
      // Fecha o modal de carregamento
      document.getElementById('whoisLoadingModal').classList.remove('is-active');
      
      // Exibe modal de erro
      document.getElementById('errorModalMessage').textContent = 
        `Não foi possível consultar informações WHOIS para ${domain}. Tente novamente mais tarde.`;
      document.getElementById('errorModal').classList.add('is-active');
      
      console.error('Erro ao exibir modal WHOIS:', error);
    });
}
```

#### 2. Para Sites Suspeitos de Phishing

Para sites detectados como possível phishing, as informações WHOIS são exibidas automaticamente como parte do alerta:

```javascript
// Função para exibir alerta de phishing com informações WHOIS
async function displayPhishingAlertWithWhois(phishingData, domain) {
  const phishingAlert = document.getElementById('phishing-alert');
  
  // Conteúdo básico do alerta de phishing
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
  
  // Adiciona indicador de carregamento para WHOIS
  alertContent += `
    <div id="whois-loading" class="mt-3">
      <p class="has-text-centered">
        <span class="icon">
          <i class="fas fa-spinner fa-pulse"></i>
        </span>
        Consultando informações de registro do domínio...
      </p>
    </div>
    <div id="whois-data" class="is-hidden"></div>
  `;
  
  alertContent += `</div>`;
  phishingAlert.innerHTML = alertContent;
  phishingAlert.classList.remove('is-hidden');
  
  // Consulta informações WHOIS
  try {
    const whoisData = await consultarWhois(domain);
    
    // Remove o indicador de carregamento
    document.getElementById('whois-loading').classList.add('is-hidden');
    
    // Prepara o conteúdo WHOIS
    let whoisContent = `
      <div class="box mt-3">
        <h4 class="title is-6">
          <span class="icon"><i class="fas fa-id-card"></i></span>
          Informações de Registro do Domínio
        </h4>
    `;
    
    // Destaca domínios recentes
    if (whoisData.isRecent) {
      whoisContent += `
        <div class="notification is-warning is-light">
          <span class="icon"><i class="fas fa-exclamation-circle"></i></span>
          <strong>Atenção:</strong> Este domínio foi registrado recentemente 
          (menos de 6 meses), o que é comum em sites fraudulentos.
        </div>
      `;
    }
    
    // Informações básicas
    whoisContent += `
      <div class="content">
        <ul>
          <li><strong>Data de Registro:</strong> ${formatDate(whoisData.creationDate) || 'Não disponível'}</li>
          <li><strong>Idade do Domínio:</strong> ${whoisData.domainAge ? whoisData.domainAge.formatted : 'Não disponível'}</li>
          <li><strong>Registrador:</strong> ${whoisData.registrar}</li>
        </ul>
      </div>
    `;
    
    whoisContent += `</div>`;
    
    // Exibe as informações WHOIS
    const whoisDataElement = document.getElementById('whois-data');
    whoisDataElement.innerHTML = whoisContent;
    whoisDataElement.classList.remove('is-hidden');
    
  } catch (error) {
    // Em caso de erro, exibe mensagem simplificada
    document.getElementById('whois-loading').classList.add('is-hidden');
    
    const whoisDataElement = document.getElementById('whois-data');
    whoisDataElement.innerHTML = `
      <div class="notification is-light mt-3">
        <span class="icon"><i class="fas fa-info-circle"></i></span>
        Não foi possível consultar informações de registro deste domínio.
      </div>
    `;
    whoisDataElement.classList.remove('is-hidden');
    
    console.error('Erro ao consultar WHOIS para alerta de phishing:', error);
  }
}
```

### Elementos da Interface

A funcionalidade de consulta WHOIS utiliza os seguintes elementos de UI:

1. **Para Sites Homologados**:
   - Botão de consulta com ícone de lupa
   - Modal com informações detalhadas
   - Seções organizadas para diferentes tipos de dados

2. **Para Sites Suspeitos**:
   - Card integrado ao alerta de phishing
   - Destaque visual para domínios recentes
   - Informações resumidas mais relevantes para análise de risco

### Formatação de Dados

Os dados WHOIS são formatados para melhor compreensão:

```javascript
// Função para formatar datas
function formatDate(dateString) {
  if (!dateString) return 'Não disponível';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return dateString; // Retorna a string original em caso de erro
  }
}

// Função para formatar status de domínio
function formatDomainStatus(status) {
  if (!status || status.length === 0) return 'Não disponível';
  
  // Mapeamento de códigos de status para descrições amigáveis
  const statusMap = {
    'clientDeleteProhibited': 'Proteção contra exclusão',
    'clientTransferProhibited': 'Proteção contra transferência',
    'clientUpdateProhibited': 'Proteção contra atualização',
    'serverDeleteProhibited': 'Proteção contra exclusão (servidor)',
    'serverTransferProhibited': 'Proteção contra transferência (servidor)',
    'serverUpdateProhibited': 'Proteção contra atualização (servidor)',
    'ok': 'Ativo'
  };
  
  return status.map(s => statusMap[s] || s).join(', ');
}
```

## Análise de Risco

### Indicadores de Risco

A funcionalidade de consulta WHOIS contribui para a análise de risco através de vários indicadores:

1. **Idade do Domínio**: Domínios com menos de 6 meses são destacados como potencialmente suspeitos
2. **Correspondência de Datas**: Inconsistência entre a data de registro e o tempo declarado de operação
3. **Privacidade de WHOIS**: Uso de serviços de privacidade para ocultar informações de registro
4. **Jurisdição**: Registro em países conhecidos por regulamentação fraca

### Algoritmo de Avaliação

O BetCheck implementa um algoritmo básico para avaliar o risco com base nos dados WHOIS:

```javascript
// Função para avaliar o nível de risco com base nos dados WHOIS
function evaluateWhoisRisk(whoisData) {
  let riskLevel = 'low'; // Valores possíveis: low, medium, high
  let riskFactors = [];
  
  // Verifica a idade do domínio
  if (whoisData.domainAge) {
    if (whoisData.domainAge.days < 30) {
      riskLevel = 'high';
      riskFactors.push('Domínio extremamente recente (menos de 30 dias)');
    } else if (whoisData.domainAge.days < 180) {
      riskLevel = Math.max(riskLevel === 'low' ? 'medium' : riskLevel);
      riskFactors.push('Domínio recente (menos de 6 meses)');
    }
  } else {
    riskLevel = Math.max(riskLevel === 'low' ? 'medium' : riskLevel);
    riskFactors.push('Informação de idade do domínio não disponível');
  }
  
  // Verifica se há privacidade de WHOIS
  if (whoisData.rawData && whoisData.rawData.registrant_name && 
      whoisData.rawData.registrant_name.toLowerCase().includes('privacy')) {
    riskLevel = Math.max(riskLevel === 'low' ? 'medium' : riskLevel);
    riskFactors.push('Informações de registro protegidas por serviço de privacidade');
  }
  
  // Verifica se o domínio está próximo da expiração
  if (whoisData.expirationDate) {
    const expirationTime = new Date(whoisData.expirationDate).getTime();
    const currentTime = new Date().getTime();
    const daysToExpiration = Math.floor((expirationTime - currentTime) / (1000 * 60 * 60 * 24));
    
    if (daysToExpiration < 30) {
      riskLevel = Math.max(riskLevel === 'low' ? 'medium' : riskLevel);
      riskFactors.push('Domínio próximo da data de expiração');
    }
  }
  
  return {
    level: riskLevel,
    factors: riskFactors
  };
}
```

## Integração com o Sistema Principal

### Fluxo de Verificação

A consulta WHOIS é integrada ao fluxo principal de verificação:

1. Para sites homologados, é oferecida como opção adicional
2. Para sites suspeitos de phishing, é executada automaticamente
3. Os resultados são incorporados à interface de acordo com o contexto

```javascript
// Em popup.js
async function processResponse(response) {
  if (response.isApproved) {
    // Site aprovado
    displayApprovedSite(response);
    
    // Adiciona botão de consulta WHOIS
    addWhoisButton(response.domain);
  } else {
    // Site não aprovado
    displayNotApprovedSite();
    
    // Verifica se há alerta de phishing
    if (response.phishing && response.phishing.isPhishing) {
      // Exibe alerta com consulta WHOIS automática
      await displayPhishingAlertWithWhois(response.phishing, response.domain);
    }
  }
}
```

### Comunicação com Background Script

A funcionalidade de WHOIS pode ser implementada diretamente no popup ou via background script:

```javascript
// Alternativa: Implementação via background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'consultarWhois') {
    const domain = request.domain;
    
    consultarWhois(domain)
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Indica que a resposta será assíncrona
  }
});
```

## Considerações de Privacidade e Segurança

### Dados Sensíveis

A consulta WHOIS lida com dados públicos de registro, mas algumas considerações são importantes:

1. **API Key Segura**: A chave da API é armazenada de forma segura e não exposta no código-fonte
2. **Dados Mínimos**: Apenas as informações necessárias são extraídas e armazenadas
3. **Cache Local**: Dados são armazenados apenas no navegador do usuário
4. **Expiração de Dados**: Cache tem prazo de validade para garantir dados atualizados

### Limitações da API

É importante considerar as limitações da API WHOIS:

1. **Limites de Requisição**: A maioria das APIs WHOIS tem limites de uso
2. **Privacidade de WHOIS**: Muitos registros agora ocultam informações devido a regulamentações de privacidade
3. **Variação de Formatos**: Diferentes registradores podem fornecer dados em formatos diferentes
4. **Disponibilidade**: Nem todos os TLDs têm informações WHOIS completas disponíveis

## Tratamento de Erros

### Cenários de Erro

O sistema está preparado para lidar com diversos cenários de erro:

1. **API Indisponível**: Falha na conexão com a API WHOIS
2. **Limites Excedidos**: Quando o limite de requisições da API é atingido
3. **Domínio Inválido**: Formato incorreto ou domínio inexistente
4. **Dados Incompletos**: API retorna dados parciais ou malformados

### Implementação do Tratamento

O tratamento de erros é implementado em múltiplos níveis:

```javascript
// Na função de consulta
async function consultarWhois(domain) {
  try {
    // Código de consulta...
  } catch (error) {
    console.error('Erro ao consultar WHOIS:', error);
    
    // Tenta usar dados em cache mesmo expirados em caso de falha na API
    const expiredCache = await getExpiredWhoisCache(domain);
    if (expiredCache) {
      console.log('Usando dados WHOIS expirados do cache');
      return {
        ...expiredCache,
        fromExpiredCache: true
      };
    }
    
    throw error; // Propaga o erro se não houver cache
  }
}

// Função para recuperar cache expirado em caso de emergência
async function getExpiredWhoisCache(domain) {
  try {
    const cacheKey = `whois_data_${domain}`;
    const result = await chrome.storage.local.get(cacheKey);
    const cachedItem = result[cacheKey];
    
    if (cachedItem) {
      return cachedItem.data;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao recuperar cache expirado:', error);
    return null;
  }
}
```

## Otimização e Desempenho

### Estratégias de Otimização

Para garantir uma experiência fluida ao usuário, o BetCheck implementa várias estratégias:

1. **Sistema de Cache**: Armazena consultas recentes para acesso rápido
2. **Consulta Seletiva**: Realiza consulta WHOIS apenas quando necessário
3. **Processamento Assíncrono**: Não bloqueia a interface durante consultas
4. **Dados Mínimos**: Armazena apenas as informações essenciais

### Priorização de Carregamento

Para sites suspeitos de phishing, a interface é otimizada para mostrar informações críticas primeiro:

1. O alerta de phishing é exibido imediatamente
2. Um indicador de carregamento é mostrado para a consulta WHOIS
3. As informações WHOIS são adicionadas quando disponíveis, sem bloquear a interface

## Considerações Futuras

### Melhorias Potenciais

A funcionalidade de consulta WHOIS pode ser aprimorada com:

1. **Múltiplas Fontes**: Integração com várias APIs WHOIS para maior confiabilidade
2. **Análise Histórica**: Verificação de mudanças no registro ao longo do tempo
3. **Verificação de Certificados SSL**: Complementar dados WHOIS com informações de certificados
4. **Visualização Avançada**: Gráficos e visualizações das informações de registro
5. **Correlação com Outros Dados**: Cruzamento com informações de CNPJ e lista oficial

### Expansão de Funcionalidades

Possíveis expansões incluem:

1. **Alertas Personalizados**: Configuração de critérios específicos para alertas
2. **Monitoramento**: Acompanhamento de alterações em registros WHOIS
3. **Exportação de Dados**: Opção para exportar informações em formatos como PDF ou CSV
4. **Verificação em Massa**: Análise de múltiplos domínios relacionados
5. **Integração com Bases de Reputação**: Conexão com bases de dados de domínios maliciosos
