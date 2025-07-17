// Cache for the parsed CSV data
let betsData = null;

// Variável para rastrear quando os dados foram carregados pela última vez
let lastCheckTime = null;

// Função para calcular a similaridade entre duas strings (distância de Levenshtein normalizada)
function calculateSimilarity(str1, str2) {
  // Se as strings são idênticas, a similaridade é 1
  if (str1 === str2) return 1.0;
  
  // Se alguma string é vazia, a similaridade é 0
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  // Matriz para o algoritmo de distância de Levenshtein
  const matrix = [];
  
  // Inicializa a primeira linha e coluna da matriz
  for (let i = 0; i <= str1.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;
  
  // Preenche a matriz
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i-1] === str2[j-1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i-1][j] + 1,      // deleção
        matrix[i][j-1] + 1,      // inserção
        matrix[i-1][j-1] + cost  // substituição
      );
    }
  }
  
  // A distância de Levenshtein é o valor na posição final da matriz
  const distance = matrix[str1.length][str2.length];
  
  // Normaliza a distância para um valor entre 0 e 1
  // Onde 1 significa strings idênticas e 0 significa completamente diferentes
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - (distance / maxLength);
}

// Function to parse CSV data
async function parseCSV(forceReload = false) {
  try {
    // Adiciona um timestamp à URL para evitar o cache do navegador
    const timestamp = forceReload ? `?t=${Date.now()}` : '';
    const response = await fetch(`data/bets.csv${timestamp}`);
    const csvText = await response.text();
    
    // Melhor tratamento para CSV com quebras de linha dentro de campos entre aspas
    const result = [];
    let inQuotes = false;
    let currentLine = '';
    let lines = [];
    
    // Primeiro, reconstruímos as linhas corretamente, respeitando aspas
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
        currentLine += char;
      } else if (char === '\n' && !inQuotes) {
        // Quebra de linha real (não dentro de aspas)
        lines.push(currentLine);
        currentLine = '';
      } else {
        currentLine += char;
      }
    }
    
    // Adiciona a última linha se houver conteúdo
    if (currentLine.trim()) {
      lines.push(currentLine);
    }
    
    // Skip the header line
    const dataLines = lines.slice(1);
    
    // Process each line
    for (const line of dataLines) {
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Parse CSV line
      let columns = [];
      inQuotes = false;
      let currentColumn = '';
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          columns.push(currentColumn.trim());
          currentColumn = '';
        } else {
          currentColumn += char;
        }
      }
      
      // Add the last column
      columns.push(currentColumn.trim());
      
      // Clean up quotes from columns
      columns = columns.map(col => col.replace(/^"|"$/g, '').trim());
      
      // Skip lines with insufficient data
      if (columns.length < 6) continue;
      
      // Create entry with the data
      const entry = {
        requestNumber: columns[0],
        authorization: columns[1],
        companyName: columns[2],
        cnpj: columns[3],
        brand: columns[4],
        domain: columns[5]
      };
      
      // Only add entries that have valid domain (not 'não registrado' or 'à definir')
      if (entry.domain && 
          entry.domain !== 'não registrado' && 
          entry.domain !== 'à definir' &&
          entry.domain !== 'a definir') {
        // Log para debug
        console.log(`Domínio adicionado: ${entry.domain}`);
        result.push(entry);
      }
    }
    
    console.log(`Total de domínios carregados: ${result.length}`);
    return result;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}

// Function to check if a domain is in the approved list
function checkDomain(domain, betsData) {
  // Normalize the domain for comparison
  domain = domain.toLowerCase();
  
  // Remove www. prefix if present
  if (domain.startsWith('www.')) {
    domain = domain.substring(4);
  }
  
  // Extract the base domain (e.g., example.com from sub.example.com)
  const domainParts = domain.split('.');
  const baseDomain = domainParts.length >= 2 ? 
    `${domainParts[domainParts.length - 2]}.${domainParts[domainParts.length - 1]}` : 
    domain;
  
  console.log('Checking domain:', domain, 'Base domain:', baseDomain);
  console.log('Total de domínios na base:', betsData.length);
  
  // Imprimir os primeiros 10 domínios da base para debug
  console.log('Primeiros 10 domínios na base:');
  for (let i = 0; i < Math.min(10, betsData.length); i++) {
    console.log(`${i+1}. ${betsData[i].domain} (${betsData[i].companyName})`);
  }
  
  // ETAPA 1: Verificar correspondência exata
  for (const entry of betsData) {
    // Skip invalid domains
    if (!entry.domain || entry.domain === 'não registrado' || entry.domain === 'à definir' || entry.domain === 'a definir') {
      continue;
    }
    
    // Normalize the bet domain
    let normalizedBetDomain = entry.domain.toLowerCase().trim();
    
    // Remove www. prefix if present in the bet domain
    if (normalizedBetDomain.startsWith('www.')) {
      normalizedBetDomain = normalizedBetDomain.substring(4);
    }
    
    // Exact match
    if (domain === normalizedBetDomain) {
      console.log('Correspondência exata encontrada!');
      return {
        isApproved: true,
        companyName: entry.companyName,
        cnpj: entry.cnpj,
        domain: normalizedBetDomain,
        relatedSites: findRelatedSites(entry.cnpj, betsData, domain)
      };
    }
  }
  
  // ETAPA 2: Verificar subdomínios
  for (const entry of betsData) {
    if (!entry.domain) continue;
    
    let normalizedBetDomain = entry.domain.toLowerCase().trim();
    if (normalizedBetDomain.startsWith('www.')) {
      normalizedBetDomain = normalizedBetDomain.substring(4);
    }
    
    // Check if the domain is a subdomain of an approved domain
    if (domain.endsWith('.' + normalizedBetDomain)) {
      console.log('Correspondência de subdomínio encontrada!');
      return {
        isApproved: true,
        companyName: entry.companyName,
        cnpj: entry.cnpj,
        domain: normalizedBetDomain,
        relatedSites: findRelatedSites(entry.cnpj, betsData, domain)
      };
    }
    
    // Check if approved domain is a subdomain of the current domain
    if (normalizedBetDomain.endsWith('.' + domain)) {
      console.log('Domínio aprovado é subdomínio do domínio atual!');
      return {
        isApproved: true,
        companyName: entry.companyName,
        cnpj: entry.cnpj,
        domain: normalizedBetDomain,
        relatedSites: findRelatedSites(entry.cnpj, betsData, domain)
      };
    }
  }
  
  // ETAPA 3: Verificar correspondências parciais
  for (const entry of betsData) {
    if (!entry.domain) continue;
    
    let normalizedBetDomain = entry.domain.toLowerCase().trim();
    if (normalizedBetDomain.startsWith('www.')) {
      normalizedBetDomain = normalizedBetDomain.substring(4);
    }
    
    // Verificar se um domínio contém o outro
    if (normalizedBetDomain.includes(domain) || domain.includes(normalizedBetDomain)) {
      // Verificar se é uma correspondência significativa (não apenas uma letra ou duas)
      if (domain.length > 3 && normalizedBetDomain.length > 3) {
        console.log('Correspondência parcial significativa encontrada!');
        return {
          isApproved: true,
          companyName: entry.companyName,
          cnpj: entry.cnpj,
          domain: normalizedBetDomain,
          relatedSites: findRelatedSites(entry.cnpj, betsData, domain)
        };
      }
    }
    
    // Verificar se os domínios são muito similares (podem ter erros de digitação)
    const similarity = calculateSimilarity(domain, normalizedBetDomain);
    if (similarity > 0.85) { // 85% de similaridade é um bom limiar
      console.log(`Alta similaridade (${similarity.toFixed(2)}) encontrada entre ${domain} e ${normalizedBetDomain}`);
      return {
        isApproved: true,
        companyName: entry.companyName,
        cnpj: entry.cnpj,
        domain: normalizedBetDomain,
        relatedSites: findRelatedSites(entry.cnpj, betsData, domain)
      };
    }
  }
  
  // ETAPA 4: Verificar se o domínio atual é um subdomínio de qualquer domínio na lista
  // Por exemplo, se temos bet.br na lista e estamos verificando example.bet.br
  for (const entry of betsData) {
    if (!entry.domain) continue;
    
    let normalizedBetDomain = entry.domain.toLowerCase().trim();
    if (normalizedBetDomain.startsWith('www.')) {
      normalizedBetDomain = normalizedBetDomain.substring(4);
    }
    
    // Verificar se o domínio atual termina com o domínio da lista
    // Mas primeiro garantir que não é apenas uma terminação comum como .com.br
    if (normalizedBetDomain.length > 7 && domain.endsWith(normalizedBetDomain)) {
      console.log(`Domínio atual termina com domínio homologado: ${normalizedBetDomain}`);
      return {
        isApproved: true,
        companyName: entry.companyName,
        cnpj: entry.cnpj,
        domain: normalizedBetDomain,
        relatedSites: findRelatedSites(entry.cnpj, betsData, domain)
      };
    }
  }
  
  // ETAPA 5: Verificar se o domínio base (exemplo.com.br) corresponde
  for (const entry of betsData) {
    if (!entry.domain) continue;
    
    let normalizedBetDomain = entry.domain.toLowerCase().trim();
    if (normalizedBetDomain.startsWith('www.')) {
      normalizedBetDomain = normalizedBetDomain.substring(4);
    }
    
    // Extrair o domínio base da entrada
    const entryDomainParts = normalizedBetDomain.split('.');
    const entryBaseDomain = entryDomainParts.length >= 2 ? 
      `${entryDomainParts[entryDomainParts.length - 2]}.${entryDomainParts[entryDomainParts.length - 1]}` : 
      normalizedBetDomain;
    
    // Verificar se os domínios base correspondem
    if (baseDomain === entryBaseDomain && baseDomain.length > 5) { // Evitar falsos positivos com domínios muito curtos
      console.log(`Domínios base correspondem: ${baseDomain} = ${entryBaseDomain}`);
      return {
        isApproved: true,
        companyName: entry.companyName,
        cnpj: entry.cnpj,
        domain: normalizedBetDomain,
        relatedSites: findRelatedSites(entry.cnpj, betsData, domain)
      };
    }
  }
  
  console.log('Nenhuma correspondência encontrada para:', domain);
  return { isApproved: false };
}

// Function to find related sites with the same CNPJ
function findRelatedSites(cnpj, betsData, currentDomain = '') {
  const relatedSites = [];
  
  // Normaliza o domínio atual para comparação
  let normalizedCurrentDomain = '';
  if (currentDomain) {
    normalizedCurrentDomain = currentDomain.toLowerCase();
    if (normalizedCurrentDomain.startsWith('www.')) {
      normalizedCurrentDomain = normalizedCurrentDomain.substring(4);
    }
  }
  
  console.log(`Procurando sites relacionados para CNPJ: ${cnpj}`);
  console.log(`Total de entradas na base de dados: ${betsData.length}`);
  console.log(`Domínio atual (para exclusão): ${normalizedCurrentDomain}`);
  
  // Debug: Verificar todas as entradas com o mesmo CNPJ
  const entriesWithSameCnpj = betsData.filter(entry => entry.cnpj === cnpj);
  console.log(`Entradas com CNPJ ${cnpj}:`, entriesWithSameCnpj);
  console.log(`Número de entradas com o mesmo CNPJ: ${entriesWithSameCnpj.length}`);
  
  // Verificar se o CNPJ é válido
  if (!cnpj || cnpj === 'undefined' || cnpj === 'null') {
    console.error('CNPJ inválido:', cnpj);
    return [];
  }
  
  // Primeiro, colete todos os domínios válidos com o mesmo CNPJ
  const validDomains = [];
  
  for (const entry of betsData) {
    // Verifica se a entrada tem CNPJ e domínio válidos
    if (!entry.domain || !entry.cnpj || 
        entry.domain === 'não registrado' || 
        entry.domain === 'à definir' || 
        entry.domain === 'a definir') {
      continue;
    }
    
    // Normaliza o domínio da entrada
    let normalizedEntryDomain = entry.domain.toLowerCase().trim();
    if (normalizedEntryDomain.startsWith('www.')) {
      normalizedEntryDomain = normalizedEntryDomain.substring(4);
    }
    
    // Se o CNPJ corresponde e não é o domínio atual
    if (entry.cnpj === cnpj) {
      // Adiciona à lista de domínios válidos
      validDomains.push({
        domain: entry.domain,
        normalizedDomain: normalizedEntryDomain,
        brand: entry.brand || entry.companyName
      });
    }
  }
  
  console.log(`Domínios válidos encontrados para CNPJ ${cnpj}:`, validDomains);
  
  // Agora, adicione à lista de sites relacionados apenas os que não são o domínio atual
  for (const site of validDomains) {
    // Verifica se não é o domínio atual
    if (site.normalizedDomain !== normalizedCurrentDomain) {
      console.log(`Adicionando site relacionado: ${site.domain} (${site.brand})`);
      relatedSites.push({
        domain: site.domain,
        brand: site.brand
      });
    } else {
      console.log(`Ignorando domínio atual: ${site.domain}`);
    }
  }
  
  console.log(`Encontrados ${relatedSites.length} sites relacionados para CNPJ ${cnpj}:`, relatedSites);
  return relatedSites;
}

// Load the CSV data when the extension is installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  betsData = await parseCSV();
  console.log('BetCheck: CSV data loaded', betsData);
});

// Importa as funções de detecção de phishing
importScripts('phishing.js');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkBetSite") {
    // Verifica se deve forçar o recarregamento dos dados
    const forceReload = message.forceReload === true;
    console.log(`Verificando site ${message.url} (forceReload: ${forceReload})`);
    
    checkBetSiteStatus(message.url, forceReload).then(result => {
      sendResponse(result);
    });
    return true; // Required to use sendResponse asynchronously
  }
  
  // Nova mensagem para obter dados de sites homologados para análise avançada de phishing
  if (message.action === "getBetsData") {
    parseCSV().then(betsData => {
      sendResponse(betsData);
    }).catch(error => {
      console.error('Erro ao obter dados de sites homologados:', error);
      sendResponse(null);
    });
    return true; // Required to use sendResponse asynchronously
  }
  
  // Removido handler de verificação de SSL para evitar problemas de CORS
  
  // Handler simplificado para análise de phishing (sem chamadas assíncronas)
  if (message.action === "performPhishingAnalysis") {
    console.log(`Background: Iniciando análise simplificada de phishing para ${message.domain}`);
    
    try {
      // Cria uma análise simples sem depender de dados externos
      const normalizedDomain = message.domain.replace(/^www\./, '');
      
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
      
      // Envia o resultado de volta para o popup
      sendResponse({
        success: true,
        phishingAnalysis: {
          domain: message.domain,
          isLikelyPhishing: isLikelyPhishing,
          phishingScore: phishingScore,
          riskLevel: riskLevel,
          details: details
        }
      });
    } catch (error) {
      console.error(`Background: Erro ao analisar phishing para ${message.domain}:`, error);
      sendResponse({
        error: true,
        message: error.message || 'Erro ao analisar phishing'
      });
    }
    
    return true; // Required to use sendResponse asynchronously
  }
});

/**
 * Calcula a similaridade entre duas strings usando a distância de Levenshtein
 * @param {string} str1 - Primeira string
 * @param {string} str2 - Segunda string
 * @returns {number} - Valor de similaridade entre 0 e 1
 */
function calculateSimilarity(str1, str2) {
  // Implementação da distância de Levenshtein
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Matriz para armazenar os resultados parciais
  const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
  
  // Inicializa a primeira coluna e linha
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  // Preenche a matriz
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deleção
        matrix[i][j - 1] + 1,      // inserção
        matrix[i - 1][j - 1] + cost // substituição
      );
    }
  }
  
  // Calcula a distância
  const distance = matrix[len1][len2];
  
  // Normaliza para obter um valor entre 0 e 1
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 1.0; // Ambas strings vazias são 100% similares
  
  return 1.0 - distance / maxLen;
}
// Function to check the status of a betting site
function checkBetSiteStatus(url, forceReload = false) {
  console.log(`Verificando status do site: ${url} (forceReload: ${forceReload})`);
  
  // Função para processar o resultado e verificar phishing
  const processResult = (result) => {
    // Se o site não for homologado, verifica se pode ser phishing
    if (!result.isApproved) {
      console.log(`Domínio ${url} não aprovado, verificando phishing`);
      const phishingResult = checkPhishing(url, betsData);
      if (phishingResult.isPhishing) {
        result.phishingWarning = phishingResult;
      }
    } else {
      console.log(`Domínio ${url} aprovado!`);
    }
    return result;
  };
  
  // Sempre recarregar os dados quando o popup é aberto pela primeira vez
  // ou quando forceReload é true
  const shouldReload = forceReload || !lastCheckTime || (Date.now() - lastCheckTime > 60000); // 1 minuto
  
  if (shouldReload) {
    console.log('Recarregando dados do CSV...');
    return parseCSV(true).then(data => {
      betsData = data;
      lastCheckTime = Date.now();
      console.log(`Dados do CSV recarregados. Total de entradas: ${betsData.length}`);
      console.log(`Verificando domínio: ${url}`);
      const result = checkDomain(url, betsData);
      return processResult(result);
    }).catch(error => {
      console.error('Erro ao verificar status do site de apostas (com recarga):', error);
      return { isApproved: false, error: error.message };
    });
  } else {
    // Usa os dados já carregados
    console.log(`Usando dados já carregados. Total de entradas: ${betsData.length}`);
    console.log(`Verificando domínio: ${url}`);
    const result = checkDomain(url, betsData);
    return Promise.resolve(processResult(result));
  }
}
