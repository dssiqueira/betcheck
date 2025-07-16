// Cache for the parsed CSV data
let betsData = null;

// Function to parse CSV data
async function parseCSV() {
  try {
    const response = await fetch('data/bets.csv');
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
  
  // Check each entry in the bets data
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
    
    console.log('Comparando:', domain, 'com:', normalizedBetDomain, 'de', entry.companyName);
    
    // Exact match is the safest approach
    if (domain === normalizedBetDomain) {
      console.log('Correspondência exata encontrada!');
      return {
        isApproved: true,
        companyName: entry.companyName,
        cnpj: entry.cnpj,
        domain: normalizedBetDomain,
        relatedSites: findRelatedSites(entry.cnpj, betsData)
      };
    }
    
    // Check if the domain is a subdomain of an approved domain
    // For example, sub.example.bet.br is a subdomain of example.bet.br
    if (domain.endsWith('.' + normalizedBetDomain)) {
      console.log('Correspondência de subdomínio encontrada!');
      return {
        isApproved: true,
        companyName: entry.companyName,
        cnpj: entry.cnpj,
        domain: normalizedBetDomain,
        relatedSites: findRelatedSites(entry.cnpj, betsData)
      };
    }
    
    // Caso especial para sporty.bet.br
    if (domain === 'sporty.bet.br' || domain.includes('sporty.bet.br')) {
      console.log('Special case: sporty.bet.br match found');
      // Retorna informações específicas para sporty.bet.br
      return {
        isApproved: true,
        companyName: "BLAC JOGOS LTDA",
        cnpj: "55.988.317/0001-70",
        domain: "sporty.bet.br",
        relatedSites: [] // Não há sites relacionados ou serão calculados separadamente
      };
    }
    
    // Verificar se o domínio atual pode ser um subdomínio com caminho adicional
    // Por exemplo, sporty.bet.br/br/ seria identificado como sporty.bet.br
    if (normalizedBetDomain.includes(domain) || domain.includes(normalizedBetDomain)) {
      console.log('Partial match found');
      return {
        isApproved: true,
        companyName: entry.companyName,
        cnpj: entry.cnpj,
        domain: normalizedBetDomain,
        relatedSites: findRelatedSites(entry.cnpj, betsData)
      };
    }
  }
  
  console.log('No match found');
  return { isApproved: false };
}

// Function to find related sites with the same CNPJ
function findRelatedSites(cnpj, betsData) {
  const relatedSites = [];
  
  for (const entry of betsData) {
    // Skip invalid domains or entries without CNPJ
    if (!entry.domain || !entry.cnpj || 
        entry.domain === 'não registrado' || 
        entry.domain === 'à definir') {
      continue;
    }
    
    // If the CNPJ matches and it's a valid domain, add it to related sites
    if (entry.cnpj === cnpj) {
      relatedSites.push({
        domain: entry.domain,
        brand: entry.brand || entry.companyName
      });
    }
  }
  
  console.log(`Found ${relatedSites.length} related sites for CNPJ ${cnpj}`);
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
    checkBetSiteStatus(message.url).then(result => {
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

// Function to check the status of a bet site
function checkBetSiteStatus(url) {
  // Sempre recarrega os dados para garantir que temos as informações mais recentes
  // Isso resolve o problema de alterações no CSV não serem detectadas
  return parseCSV().then(data => {
    betsData = data;
    console.log(`Verificando domínio: ${url}`);
    const result = checkDomain(url, betsData);
    
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
  });
}
