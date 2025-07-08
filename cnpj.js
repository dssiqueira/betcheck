/**
 * BetCheck - Módulo de consulta de CNPJ
 * Realiza consultas à API pública de CNPJ e exibe os dados em um modal
 */

// Importa os módulos necessários
import { saveToCache, getFromCache } from './cache.js';

// Função para formatar o CNPJ com pontuação
function formatCNPJ(cnpj) {
  if (!cnpj) return '';
  
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/\D/g, '');
  
  // Aplica a máscara do CNPJ: 00.000.000/0000-00
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// Função para formatar valores monetários
function formatCurrency(value) {
  if (!value) return 'Não informado';
  
  // Converte para número se for string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Formata como moeda brasileira
  return numValue.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  });
}

// Função para formatar data no padrão brasileiro
function formatDate(dateString) {
  if (!dateString) return 'Não informada';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

// Função para construir o endereço completo
function buildFullAddress(estabelecimento) {
  if (!estabelecimento) return 'Endereço não disponível';
  
  const parts = [];
  
  if (estabelecimento.tipo_logradouro) {
    parts.push(estabelecimento.tipo_logradouro);
  }
  
  if (estabelecimento.logradouro) {
    parts.push(estabelecimento.logradouro);
  }
  
  if (estabelecimento.numero) {
    parts.push(estabelecimento.numero);
  }
  
  let address = parts.join(' ');
  
  if (estabelecimento.complemento) {
    address += `, ${estabelecimento.complemento}`;
  }
  
  if (estabelecimento.bairro) {
    address += ` - ${estabelecimento.bairro}`;
  }
  
  if (estabelecimento.cidade && estabelecimento.cidade.nome) {
    address += `, ${estabelecimento.cidade.nome}`;
  }
  
  if (estabelecimento.estado && estabelecimento.estado.sigla) {
    address += `/${estabelecimento.estado.sigla}`;
  }
  
  if (estabelecimento.cep) {
    address += ` - CEP: ${estabelecimento.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')}`;
  }
  
  return address;
}

// Função para consultar o CNPJ na API
async function fetchCNPJData(cnpj) {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // Cria uma chave única para o cache
  const cacheKey = `cnpj_${cleanCNPJ}`;
  
  // Tenta obter dados do cache primeiro
  const cachedData = await getFromCache(cacheKey);
  if (cachedData) {
    console.log(`Usando dados em cache para CNPJ ${cleanCNPJ}`);
    return cachedData;
  }
  
  // Se não houver cache, consulta a API
  console.log(`Consultando API para CNPJ ${cleanCNPJ}`);
  try {
    const response = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCNPJ}`);
    
    if (!response.ok) {
      throw new Error(`Erro na consulta: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Salva os dados no cache (30 dias de validade para dados de CNPJ)
    await saveToCache(cacheKey, data, 30);
    
    return data;
  } catch (error) {
    console.error('Erro ao consultar CNPJ:', error);
    throw error;
  }
}

// Função para criar e exibir o modal com os dados do CNPJ
function showCNPJModal(cnpjData) {
  // Cria o elemento modal usando o estilo Bulma
  const modal = document.createElement('div');
  modal.className = 'modal is-active';
  modal.innerHTML = `
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Detalhes do CNPJ</p>
        <button class="delete close-modal" aria-label="close"></button>
      </header>
      <section class="modal-card-body">
        <div>
          <h4 class="title is-4">${cnpjData.razao_social || 'Empresa não informada'}</h4>
          <p><strong>CNPJ:</strong> ${formatCNPJ(cnpjData.estabelecimento?.cnpj || '')}</p>
          <p><strong>Capital Social:</strong> ${formatCurrency(cnpjData.capital_social)}</p>
          <p><strong>Data de Abertura:</strong> ${formatDate(cnpjData.estabelecimento?.data_inicio_atividade)}</p>
          <p><strong>Endereço:</strong> ${buildFullAddress(cnpjData.estabelecimento)}</p>
          
          ${cnpjData.socios && cnpjData.socios.length > 0 ? `
            <h5 class="title is-5 mt-4">Sócios</h5>
            <ul>
              ${cnpjData.socios.map(socio => `
                <li>
                  <strong>${socio.nome}</strong> 
                  ${socio.tipo ? `(${socio.tipo})` : ''}
                  ${socio.data_entrada ? ` - Desde ${formatDate(socio.data_entrada)}` : ''}
                </li>
              `).join('')}
            </ul>
          ` : '<p><em>Nenhum sócio encontrado</em></p>'}
        </div>
      </section>
      <footer class="modal-card-foot">
        <button class="button is-primary close-modal">Fechar</button>
      </footer>
    </div>
  `;
  
  // Adiciona o modal ao body
  document.body.appendChild(modal);
  
  // Adiciona evento para fechar o modal
  const closeButtons = modal.querySelectorAll('.delete, .close-modal');
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  });
  
  // Fecha o modal ao clicar no fundo (garantindo que o elemento existe)
  const modalBackground = modal.querySelector('.modal-background');
  if (modalBackground) {
    modalBackground.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }
}

// Função principal para consultar CNPJ e exibir modal
async function consultarCNPJ(cnpj) {
  try {
    // Exibe um indicador de carregamento usando o padrão Bulma CSS
    const loadingModal = document.createElement('div');
    loadingModal.className = 'modal is-active';
    loadingModal.innerHTML = `
      <div class="modal-background"></div>
      <div class="modal-card" style="background: transparent; box-shadow: none;">
        <section class="modal-card-body has-text-centered p-6">
          <div class="box has-text-centered p-5">
            <span class="icon is-large">
              <i class="fas fa-spinner fa-pulse fa-3x has-text-primary"></i>
            </span>
            <p class="mt-3 has-text-weight-medium">Consultando dados do CNPJ...</p>
          </div>
        </section>
      </div>
    `;
    document.body.appendChild(loadingModal);
    
    // Busca os dados do CNPJ
    const cnpjData = await fetchCNPJData(cnpj);
    
    // Remove o modal de carregamento
    document.body.removeChild(loadingModal);
    
    // Exibe o modal com os dados
    showCNPJModal(cnpjData);
  } catch (error) {
    // Remove o modal de carregamento se existir
    const loadingModal = document.querySelector('.modal');
    if (loadingModal) {
      document.body.removeChild(loadingModal);
    }
    
    // Exibe modal de erro usando o padrão Bulma CSS
    const errorModal = document.createElement('div');
    errorModal.className = 'modal is-active';
    errorModal.innerHTML = `
      <div class="modal-background"></div>
      <div class="modal-card">
        <header class="modal-card-head has-background-danger-light">
          <p class="modal-card-title has-text-danger">Erro na consulta</p>
          <button class="delete close-modal" aria-label="close"></button>
        </header>
        <section class="modal-card-body">
          <div class="content">
            <p>Não foi possível consultar os dados do CNPJ.</p>
            <p class="has-text-danger"><strong>Erro:</strong> ${error.message}</p>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-danger close-modal">Fechar</button>
        </footer>
      </div>
    `;
    
    document.body.appendChild(errorModal);
  
    // Configura os listeners para fechar o modal de erro
    const closeButtons = errorModal.querySelectorAll('.delete, .close-modal');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        document.body.removeChild(errorModal);
      });
    });
    
    // Fecha o modal ao clicar no fundo (garantindo que o elemento existe)
    const modalBackground = errorModal.querySelector('.modal-background');
    if (modalBackground) {
      modalBackground.addEventListener('click', () => {
        document.body.removeChild(errorModal);
      });
    }
  }
}

// Exporta as funções para uso em outros arquivos
export { consultarCNPJ, formatCNPJ };
