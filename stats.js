// stats.js - Módulo para gerenciar estatísticas de uso da extensão

/**
 * Objeto para gerenciar estatísticas de uso
 */
const Stats = {
  // Chaves usadas no localStorage
  KEYS: {
    APPROVED_SITES: 'betcheck_approved_sites',
    SUSPICIOUS_SITES: 'betcheck_suspicious_sites',
    TOTAL_CHECKS: 'betcheck_total_checks'
  },
  
  /**
   * Inicializa as estatísticas se não existirem
   */
  initialize() {
    if (localStorage.getItem(this.KEYS.APPROVED_SITES) === null) {
      localStorage.setItem(this.KEYS.APPROVED_SITES, '0');
    }
    
    if (localStorage.getItem(this.KEYS.SUSPICIOUS_SITES) === null) {
      localStorage.setItem(this.KEYS.SUSPICIOUS_SITES, '0');
    }
    
    if (localStorage.getItem(this.KEYS.TOTAL_CHECKS) === null) {
      localStorage.setItem(this.KEYS.TOTAL_CHECKS, '0');
    }
  },
  
  /**
   * Incrementa o contador de sites aprovados
   */
  incrementApproved() {
    const current = parseInt(localStorage.getItem(this.KEYS.APPROVED_SITES) || '0');
    localStorage.setItem(this.KEYS.APPROVED_SITES, (current + 1).toString());
    this.incrementTotal();
  },
  
  /**
   * Incrementa o contador de sites suspeitos
   */
  incrementSuspicious() {
    const current = parseInt(localStorage.getItem(this.KEYS.SUSPICIOUS_SITES) || '0');
    localStorage.setItem(this.KEYS.SUSPICIOUS_SITES, (current + 1).toString());
    this.incrementTotal();
  },
  
  /**
   * Incrementa o contador total de verificações
   */
  incrementTotal() {
    const current = parseInt(localStorage.getItem(this.KEYS.TOTAL_CHECKS) || '0');
    localStorage.setItem(this.KEYS.TOTAL_CHECKS, (current + 1).toString());
  },
  
  /**
   * Retorna o número de sites aprovados verificados
   */
  getApprovedCount() {
    return parseInt(localStorage.getItem(this.KEYS.APPROVED_SITES) || '0');
  },
  
  /**
   * Retorna o número de sites suspeitos verificados
   */
  getSuspiciousCount() {
    return parseInt(localStorage.getItem(this.KEYS.SUSPICIOUS_SITES) || '0');
  },
  
  /**
   * Retorna o número total de verificações
   */
  getTotalCount() {
    return parseInt(localStorage.getItem(this.KEYS.TOTAL_CHECKS) || '0');
  },
  
  /**
   * Atualiza os elementos da UI com as estatísticas atuais
   */
  updateUI() {
    const approvedElement = document.getElementById('approved-count');
    const suspiciousElement = document.getElementById('suspicious-count');
    const totalElement = document.getElementById('total-count');
    
    if (approvedElement) {
      approvedElement.textContent = this.getApprovedCount().toString();
    }
    
    if (suspiciousElement) {
      suspiciousElement.textContent = this.getSuspiciousCount().toString();
    }
    
    if (totalElement) {
      totalElement.textContent = this.getTotalCount().toString();
    }
  },
  
  /**
   * Reseta todas as estatísticas para zero
   */
  reset() {
    localStorage.setItem(this.KEYS.APPROVED_SITES, '0');
    localStorage.setItem(this.KEYS.SUSPICIOUS_SITES, '0');
    localStorage.setItem(this.KEYS.TOTAL_CHECKS, '0');
    this.updateUI();
  }
};

// Exporta o objeto Stats
export default Stats;
