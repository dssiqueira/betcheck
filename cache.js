/**
 * Módulo de cache para a extensão BetCheck
 * Implementa funções para armazenar e recuperar dados em cache usando chrome.storage.local
 */

// Tempo padrão de expiração do cache em dias
const DEFAULT_CACHE_DAYS = 7;

/**
 * Salva dados no cache com tempo de expiração
 * @param {string} key - Chave única para identificar os dados
 * @param {any} data - Dados a serem armazenados
 * @param {number} expirationDays - Dias até a expiração do cache (padrão: 7)
 * @returns {Promise} - Promise que resolve quando os dados são salvos
 */
function saveToCache(key, data, expirationDays = DEFAULT_CACHE_DAYS) {
  return new Promise((resolve) => {
    const expiration = Date.now() + (expirationDays * 24 * 60 * 60 * 1000);
    const cacheItem = { data, expiration };
    
    chrome.storage.local.set({ [key]: JSON.stringify(cacheItem) }, () => {
      console.log(`Cache salvo para ${key}`);
      resolve();
    });
  });
}

/**
 * Recupera dados do cache se ainda forem válidos
 * @param {string} key - Chave dos dados a serem recuperados
 * @returns {Promise<any|null>} - Promise que resolve com os dados ou null se não existirem ou estiverem expirados
 */
async function getFromCache(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      if (result[key]) {
        try {
          const cacheItem = JSON.parse(result[key]);
          
          // Verifica se o cache ainda é válido
          if (cacheItem.expiration > Date.now()) {
            console.log(`Cache encontrado para ${key}`);
            resolve(cacheItem.data);
            return;
          }
          
          // Cache expirado, remove
          console.log(`Cache expirado para ${key}`);
          chrome.storage.local.remove(key);
        } catch (error) {
          console.error('Erro ao processar cache:', error);
          chrome.storage.local.remove(key);
        }
      }
      resolve(null);
    });
  });
}

/**
 * Limpa um item específico do cache
 * @param {string} key - Chave do item a ser removido
 * @returns {Promise} - Promise que resolve quando o item é removido
 */
function clearCacheItem(key) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, () => {
      console.log(`Cache removido para ${key}`);
      resolve();
    });
  });
}

/**
 * Limpa todo o cache da extensão
 * @returns {Promise} - Promise que resolve quando todo o cache é limpo
 */
function clearAllCache() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => {
      console.log('Cache completamente limpo');
      resolve();
    });
  });
}

// Exporta as funções para uso em outros módulos
export { saveToCache, getFromCache, clearCacheItem, clearAllCache };
