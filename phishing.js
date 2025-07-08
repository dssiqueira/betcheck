/**
 * BetCheck - Módulo de Detecção de Phishing
 * 
 * Este módulo verifica se um site pode estar tentando se passar por uma bet homologada.
 * No Brasil, apenas os domínios .bet.br são oficialmente homologados.
 */

// Lista de palavras comuns em nomes de bets para verificação de similaridade
const COMMON_BET_TERMS = [
  'bet', 'bets', 'apostas', 'casino', 'cassino', 'jogo', 'jogos', 
  'esporte', 'esportes', 'sport', 'sports', 'gambling', 'gaming'
];

/**
 * Verifica se um domínio pode ser uma tentativa de phishing
 * @param {string} domain - O domínio a ser verificado
 * @param {Array} approvedSites - Lista de sites homologados
 * @returns {Object} Resultado da verificação de phishing
 */
function checkPhishing(domain, approvedSites) {
  // Normaliza o domínio para comparação
  domain = domain.toLowerCase();
  if (domain.startsWith('www.')) {
    domain = domain.substring(4);
  }
  
  // Se for um domínio .bet.br, não é phishing
  if (domain.endsWith('.bet.br')) {
    return { isPhishing: false };
  }
  
  // Verifica se o domínio contém termos comuns de apostas
  const containsBetTerms = COMMON_BET_TERMS.some(term => 
    domain.includes(term)
  );
  
  if (!containsBetTerms) {
    return { isPhishing: false };
  }
  
  // Verifica similaridade com sites homologados
  const similarSites = findSimilarSites(domain, approvedSites);
  
  if (similarSites.length > 0) {
    return {
      isPhishing: true,
      reason: 'domain_similarity',
      similarSites: similarSites
    };
  }
  
  // Se contém termos de apostas mas não é .bet.br, pode ser suspeito
  if (containsBetTerms) {
    return {
      isPhishing: true,
      reason: 'not_official_domain',
      message: 'Este site contém termos relacionados a apostas, mas não usa o domínio oficial .bet.br'
    };
  }
  
  return { isPhishing: false };
}

/**
 * Encontra sites homologados com nomes similares ao domínio fornecido
 * @param {string} domain - O domínio a ser verificado
 * @param {Array} approvedSites - Lista de sites homologados
 * @returns {Array} Lista de sites homologados similares
 */
function findSimilarSites(domain, approvedSites) {
  const similarSites = [];
  const domainWithoutTLD = domain.split('.')[0]; // Remove TLD para comparação
  
  for (const site of approvedSites) {
    // Pula sites sem domínio válido
    if (!site.domain || site.domain === 'não registrado' || site.domain === 'à definir') {
      continue;
    }
    
    const approvedDomain = site.domain.toLowerCase();
    const approvedDomainWithoutTLD = approvedDomain.split('.')[0];
    
    // Verifica se o nome do domínio (sem TLD) é similar
    if (isSimilarText(domainWithoutTLD, approvedDomainWithoutTLD)) {
      similarSites.push({
        domain: site.domain,
        companyName: site.companyName,
        cnpj: site.cnpj
      });
    }
  }
  
  return similarSites;
}

/**
 * Verifica se dois textos são similares usando distância de Levenshtein
 * @param {string} str1 - Primeiro texto
 * @param {string} str2 - Segundo texto
 * @returns {boolean} True se os textos forem similares
 */
function isSimilarText(str1, str2) {
  // Se um texto está contido no outro, são similares
  if (str1.includes(str2) || str2.includes(str1)) {
    return true;
  }
  
  // Implementação simples da distância de Levenshtein
  const distance = levenshteinDistance(str1, str2);
  
  // Define um limite de similaridade baseado no comprimento das strings
  const maxLength = Math.max(str1.length, str2.length);
  const similarityThreshold = Math.min(2, Math.floor(maxLength * 0.3)); // 30% de diferença ou no máximo 2 caracteres
  
  return distance <= similarityThreshold;
}

/**
 * Calcula a distância de Levenshtein entre duas strings
 * @param {string} str1 - Primeira string
 * @param {string} str2 - Segunda string
 * @returns {number} Distância de Levenshtein
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  // Matriz para programação dinâmica
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  // Inicialização
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  
  // Preenchimento da matriz
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deleção
        dp[i][j - 1] + 1,      // inserção
        dp[i - 1][j - 1] + cost // substituição
      );
    }
  }
  
  return dp[m][n];
}

// Exporta as funções para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkPhishing,
    findSimilarSites,
    isSimilarText,
    levenshteinDistance
  };
}
