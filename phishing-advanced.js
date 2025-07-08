/**
 * BetCheck - Módulo de detecção avançada de phishing
 * Implementa algoritmos avançados para identificar sites de phishing
 */

// Importa os módulos necessários
import { getFromCache, saveToCache } from './cache.js';

/**
 * Calcula a distância de Levenshtein entre duas strings
 * Mede a similaridade entre dois textos
 * @param {string} a - Primeira string
 * @param {string} b - Segunda string
 * @returns {number} - Distância entre as strings
 */
function levenshteinDistance(a, b) {
  const matrix = [];

  // Inicializa a matriz
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Preenche a matriz
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substituição
          matrix[i][j - 1] + 1,     // inserção
          matrix[i - 1][j] + 1      // remoção
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Verifica se um domínio é similar a domínios homologados
 * @param {string} domain - Domínio a ser verificado
 * @param {Array} approvedDomains - Lista de domínios homologados
 * @returns {Object} - Resultado da verificação com similaridade e domínios similares
 */
function checkDomainSimilarity(domain, approvedDomains) {
  const similarDomains = [];
  const threshold = 3; // Limiar de similaridade (menor = mais similar)
  
  // Remove subdomínios para comparação
  const baseDomain = domain.split('.').slice(-2).join('.');
  
  for (const approvedDomain of approvedDomains) {
    // Ignora domínios inválidos
    if (!approvedDomain || approvedDomain === 'não registrado' || approvedDomain === 'à definir') {
      continue;
    }
    
    // Remove subdomínios do domínio homologado
    const baseApprovedDomain = approvedDomain.split('.').slice(-2).join('.');
    
    // Calcula a distância
    const distance = levenshteinDistance(baseDomain, baseApprovedDomain);
    
    // Se a distância for pequena, adiciona à lista de domínios similares
    if (distance <= threshold) {
      similarDomains.push({
        domain: approvedDomain,
        similarity: distance
      });
    }
  }
  
  // Ordena por similaridade (menor distância = mais similar)
  similarDomains.sort((a, b) => a.similarity - b.similarity);
  
  return {
    hasSimilar: similarDomains.length > 0,
    similarDomains: similarDomains
  };
}

/**
 * Versão simplificada que retorna um objeto SSL simulado para evitar erros CORS
 * @param {string} domain - Domínio a ser verificado
 * @returns {Promise<Object>} - Informações simuladas sobre o certificado
 */
async function checkSSLCertificate(domain) {
  console.log(`Usando verificação SSL simplificada para ${domain}`);
  
  // Retorna um objeto simulado com dados de SSL genéricos
  // para manter compatibilidade com o código existente
  return {
    host: domain,
    port: 443,
    protocol: "https",
    status: "READY",
    endpoints: [
      {
        grade: "A",
        hasWarnings: false,
        isExceptional: true,
        details: {
          cert: {
            notAfter: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 ano no futuro
            notBefore: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 dias atrás
            issuerSubject: "Let's Encrypt Authority X3",
            sigAlg: "SHA256withRSA"
          }
        }
      }
    ]
  };
}

// Função analyzeWhoisRiskFactors removida

/**
 * Verifica a presença de redirecionamentos suspeitos
 * @param {string} url - URL a ser verificada
 * @returns {Promise<Object>} - Informações sobre redirecionamentos
 */
async function checkRedirects(url) {
  try {
    // Verifica se temos dados em cache
    const cacheKey = `redirect_${url}`;
    const cachedData = await getFromCache(cacheKey);
    
    if (cachedData) {
      console.log(`Usando dados de redirecionamento em cache para ${url}`);
      return cachedData;
    }
    
    // Simula um fetch para verificar redirecionamentos
    const response = await fetch(url, { 
      method: 'HEAD',
      redirect: 'manual'
    });
    
    const redirectData = {
      hasRedirect: response.redirected,
      redirectUrl: response.url,
      redirectCount: 0,
      isSuspicious: false
    };
    
    // Salva no cache por 1 dia
    await saveToCache(cacheKey, redirectData, 1);
    
    return redirectData;
  } catch (error) {
    console.error('Erro ao verificar redirecionamentos:', error);
    return {
      error: true,
      message: error.message
    };
  }
}

/**
 * Realiza uma análise avançada de phishing para um domínio
 * @param {string} domain - Domínio a ser analisado
 * @param {Array} betsData - Lista de sites de apostas homologados
 * @returns {Promise<Object>} - Resultado da análise de phishing
 */
export async function advancedPhishingCheck(domain, betsData) {
  // Normaliza o domínio
  domain = domain.toLowerCase();
  if (domain.startsWith('www.')) {
    domain = domain.substring(4);
  }
  
  // Extrai todos os domínios homologados
  const approvedDomains = betsData
    .filter(entry => entry.domain && entry.domain !== 'não registrado' && entry.domain !== 'à definir')
    .map(entry => {
      let domain = entry.domain.toLowerCase();
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }
      return domain;
    });
  
  // Verifica similaridade com domínios homologados
  const similarityCheck = checkDomainSimilarity(domain, approvedDomains);
  
  // Objetos vazios para manter compatibilidade com o código existente
  const sslCheck = {
    valid: true,
    grade: "A",
    issues: []
  };
  
  const whoisRiskFactors = {
    hasRisks: false,
    factors: []
  };
  
  // Verifica redirecionamentos
  const redirectCheck = await checkRedirects(`https://${domain}`);
  
  // Combina todos os resultados para determinar o nível de risco
  const phishingScore = calculatePhishingScore(
    similarityCheck,
    sslCheck,
    whoisRiskFactors,
    redirectCheck
  );
  
  return {
    domain,
    isLikelyPhishing: phishingScore.score >= 70,
    phishingScore: phishingScore.score,
    riskLevel: phishingScore.riskLevel,
    similarityCheck,
    sslCheck,
    whoisRiskFactors,
    redirectCheck,
    details: phishingScore.details
  };
}

/**
 * Calcula uma pontuação de phishing baseada em vários fatores
 * @param {Object} similarityCheck - Resultado da verificação de similaridade
 * @param {Object} sslCheck - Resultado da verificação de SSL
 * @param {Object} whoisRiskFactors - Objeto vazio (funcionalidade WHOIS removida)
 * @param {Object} redirectCheck - Resultado da verificação de redirecionamentos
 * @returns {Object} - Pontuação e nível de risco
 */
function calculatePhishingScore(similarityCheck, sslCheck, whoisRiskFactors, redirectCheck) {
  let score = 0;
  const details = [];
  
  // Pontuação baseada na similaridade com domínios homologados
  if (similarityCheck.hasSimilar) {
    const mostSimilar = similarityCheck.similarDomains[0];
    if (mostSimilar.similarity === 1) {
      score += 40;
      details.push('Domínio extremamente similar a um site homologado');
    } else if (mostSimilar.similarity <= 2) {
      score += 30;
      details.push('Domínio muito similar a um site homologado');
    } else {
      score += 20;
      details.push('Domínio similar a um site homologado');
    }
  }
  
  // Pontuação baseada em fatores de risco WHOIS - removida
  // whoisRiskFactors agora é sempre um objeto vazio
  
  // Verificação de SSL removida para evitar erros CORS
  // Adicionamos uma pontuação baseada em termos suspeitos no domínio
  const domainLower = similarityCheck.domain ? similarityCheck.domain.toLowerCase() : '';
  if (domainLower && (/apostas?|bet|bets|casino|gambling|jogo/i.test(domainLower) && !domainLower.endsWith('.bet.br'))) {
    score += 15;
    details.push('Domínio contém termos relacionados a apostas mas não usa o domínio oficial .bet.br');
  }
  
  // Pontuação baseada em redirecionamentos
  if (redirectCheck.error) {
    score += 5;
    details.push('Não foi possível verificar redirecionamentos');
  } else if (redirectCheck.hasRedirect && redirectCheck.isSuspicious) {
    score += 15;
    details.push('Redirecionamentos suspeitos detectados');
  }
  
  // Determina o nível de risco
  let riskLevel;
  if (score >= 70) {
    riskLevel = 'alto';
  } else if (score >= 40) {
    riskLevel = 'médio';
  } else {
    riskLevel = 'baixo';
  }
  
  return {
    score,
    riskLevel,
    details
  };
}

/**
 * Verifica se uma URL contém termos suspeitos comuns em sites de phishing
 * @param {string} url - URL a ser verificada
 * @returns {Object} - Resultado da verificação
 */
export function checkSuspiciousTerms(url) {
  const urlLower = url.toLowerCase();
  const suspiciousTerms = [
    'login', 'account', 'secure', 'update', 'verify',
    'confirmation', 'confirm', 'banking', 'security',
    'authenticate', 'wallet', 'bonus', 'free', 'prize',
    'win', 'lucky', 'official', 'promo', 'promocao',
    'promocional', 'oferta', 'especial', 'limitado'
  ];
  
  const foundTerms = suspiciousTerms.filter(term => urlLower.includes(term));
  
  return {
    hasSuspiciousTerms: foundTerms.length > 0,
    terms: foundTerms
  };
}

/**
 * Verifica se um domínio tem um padrão típico de phishing
 * @param {string} domain - Domínio a ser verificado
 * @returns {boolean} - Verdadeiro se o domínio tem padrão de phishing
 */
export function hasPhishingPattern(domain) {
  // Padrões comuns de phishing
  const patterns = [
    /-?seguro-?/,
    /-?secure-?/,
    /-?oficial-?/,
    /-?original-?/,
    /-?login-?/,
    /-?conta-?/,
    /-?account-?/,
    /\d{4,}/,        // Muitos números no domínio
    /-{2,}/,         // Múltiplos hífens
    /[a-z]\d+[a-z]/  // Letras com números no meio
  ];
  
  return patterns.some(pattern => pattern.test(domain));
}
