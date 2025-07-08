# Consulta de CNPJ

## Visão Geral

A funcionalidade de consulta de CNPJ do BetCheck permite aos usuários acessar informações detalhadas sobre as empresas por trás dos sites de apostas. Este documento explica a implementação técnica, integração com API externa, formatação de dados, sistema de cache e interface do usuário para esta funcionalidade.

## Importância da Consulta de CNPJ

### Contexto Regulatório

No Brasil, todas as empresas de apostas legalizadas devem:
1. Possuir um CNPJ (Cadastro Nacional da Pessoa Jurídica) ativo
2. Estar devidamente registradas junto aos órgãos competentes
3. Ter transparência em suas informações corporativas

### Benefícios para o Usuário

A consulta de CNPJ oferece diversos benefícios:
1. **Transparência**: Acesso às informações oficiais da empresa
2. **Confiança**: Verificação da existência legal e tempo de operação
3. **Tomada de Decisão**: Dados para avaliar a credibilidade do operador
4. **Proteção**: Identificação de empresas recém-criadas ou suspeitas

## Implementação Técnica

### Arquivo Principal: `cnpj.js`

A funcionalidade de consulta de CNPJ está implementada no arquivo `cnpj.js`, que funciona como um módulo ES6 com funções para consulta, formatação e exibição de dados:

```javascript
// Função principal para consultar CNPJ
export async function consultarCNPJ(cnpj) {
  // Remove caracteres não numéricos
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
  
  // Verifica se já temos este CNPJ em cache
  const cachedData = await getCachedCNPJData(cnpjLimpo);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // URL da API pública de CNPJ
    const url = `https://publica.cnpj.ws/cnpj/${cnpjLimpo}`;
    
    // Realiza a consulta
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro na consulta: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Armazena em cache para consultas futuras
    await cacheCNPJData(cnpjLimpo, data);
    
    return data;
  } catch (error) {
    console.error('Erro ao consultar CNPJ:', error);
    throw error;
  }
}
```

### Integração com API Pública

O BetCheck utiliza a API pública de CNPJ disponível em `https://publica.cnpj.ws` para obter dados oficiais:

1. **Endpoint Utilizado**: `https://publica.cnpj.ws/cnpj/{numero_cnpj}`
2. **Método de Requisição**: GET
3. **Formato de Resposta**: JSON
4. **Dados Retornados**:
   - Razão social
   - Nome fantasia
   - Data de abertura
   - Capital social
   - Endereço completo
   - Situação cadastral
   - Quadro societário
   - Atividades econômicas

### Sistema de Cache

Para otimizar o desempenho e reduzir requisições à API, o BetCheck implementa um sistema de cache usando o `chrome.storage.local`:

```javascript
// Função para armazenar dados de CNPJ em cache
async function cacheCNPJData(cnpj, data) {
  try {
    // Cria uma chave única para o cache
    const cacheKey = `cnpj_data_${cnpj}`;
    
    // Adiciona timestamp para controle de expiração
    const cacheData = {
      data: data,
      timestamp: Date.now()
    };
    
    // Armazena no storage local do Chrome
    await chrome.storage.local.set({ [cacheKey]: cacheData });
    
    return true;
  } catch (error) {
    console.error('Erro ao armazenar cache:', error);
    return false;
  }
}

// Função para recuperar dados em cache
async function getCachedCNPJData(cnpj) {
  try {
    const cacheKey = `cnpj_data_${cnpj}`;
    
    // Recupera dados do storage
    const result = await chrome.storage.local.get(cacheKey);
    const cachedItem = result[cacheKey];
    
    // Verifica se existe cache e se não expirou (7 dias)
    if (cachedItem && Date.now() - cachedItem.timestamp < 7 * 24 * 60 * 60 * 1000) {
      return cachedItem.data;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao recuperar cache:', error);
    return null;
  }
}
```

### Funções de Formatação

O módulo inclui diversas funções para formatação dos dados recebidos da API:

```javascript
// Formata CNPJ: 12345678000199 -> 12.345.678/0001-99
export function formatarCNPJ(cnpj) {
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
  return cnpjLimpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

// Formata valor monetário: 1000000 -> R$ 1.000.000,00
export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

// Formata data: 2020-01-01 -> 01/01/2020
export function formatarData(data) {
  if (!data) return 'N/A';
  
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Consolida endereço em uma única string formatada
export function formatarEndereco(endereco) {
  if (!endereco) return 'Endereço não disponível';
  
  const {
    tipo_logradouro,
    logradouro,
    numero,
    complemento,
    bairro,
    municipio,
    uf,
    cep
  } = endereco;
  
  let enderecoFormatado = `${tipo_logradouro || ''} ${logradouro || ''}, ${numero || 'S/N'}`;
  
  if (complemento) {
    enderecoFormatado += ` - ${complemento}`;
  }
  
  enderecoFormatado += `\n${bairro || ''} - ${municipio?.nome || ''}, ${uf || ''}`;
  
  if (cep) {
    enderecoFormatado += `\nCEP: ${cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')}`;
  }
  
  return enderecoFormatado;
}
```

## Interface do Usuário

### Modal de Detalhes do CNPJ

A consulta de CNPJ é apresentada em um modal interativo que exibe os dados formatados:

```javascript
// Função para exibir modal com detalhes do CNPJ
export function exibirModalCNPJ(cnpj, companyName) {
  // Exibe o modal de carregamento
  document.getElementById('cnpjLoadingModal').classList.add('is-active');
  
  // Consulta o CNPJ
  consultarCNPJ(cnpj)
    .then(data => {
      // Fecha o modal de carregamento
      document.getElementById('cnpjLoadingModal').classList.remove('is-active');
      
      // Preenche os dados no modal principal
      document.getElementById('cnpjModalTitle').textContent = data.razao_social || companyName;
      document.getElementById('cnpjFormatado').textContent = formatarCNPJ(cnpj);
      document.getElementById('capitalSocial').textContent = formatarMoeda(data.capital_social || 0);
      document.getElementById('dataAbertura').textContent = formatarData(data.data_inicio_atividade);
      document.getElementById('enderecoCompleto').textContent = formatarEndereco(data.estabelecimento?.endereco);
      
      // Preenche a lista de sócios
      const sociosList = document.getElementById('sociosList');
      sociosList.innerHTML = '';
      
      if (data.socios && data.socios.length > 0) {
        data.socios.forEach(socio => {
          const socioItem = document.createElement('div');
          socioItem.className = 'box';
          
          const socioNome = document.createElement('p');
          socioNome.className = 'has-text-weight-bold';
          socioNome.textContent = socio.nome || 'Nome não disponível';
          
          const socioTipo = document.createElement('p');
          socioTipo.textContent = `Tipo: ${socio.tipo || 'N/A'}`;
          
          const socioData = document.createElement('p');
          socioData.textContent = `Data de entrada: ${formatarData(socio.data_entrada) || 'N/A'}`;
          
          socioItem.appendChild(socioNome);
          socioItem.appendChild(socioTipo);
          socioItem.appendChild(socioData);
          
          sociosList.appendChild(socioItem);
        });
      } else {
        const noSocios = document.createElement('p');
        noSocios.textContent = 'Informações sobre sócios não disponíveis';
        sociosList.appendChild(noSocios);
      }
      
      // Exibe o modal principal
      document.getElementById('cnpjModal').classList.add('is-active');
    })
    .catch(error => {
      // Fecha o modal de carregamento
      document.getElementById('cnpjLoadingModal').classList.remove('is-active');
      
      // Exibe modal de erro
      document.getElementById('errorModalMessage').textContent = 
        `Não foi possível consultar o CNPJ ${formatarCNPJ(cnpj)}. Tente novamente mais tarde.`;
      document.getElementById('errorModal').classList.add('is-active');
      
      console.error('Erro ao exibir modal de CNPJ:', error);
    });
}
```

### Elementos da Interface

A funcionalidade de consulta de CNPJ utiliza os seguintes elementos de UI:

1. **Link de CNPJ Clicável**: No card de informações da empresa
2. **Modal de Carregamento**: Exibido durante a consulta à API
3. **Modal Principal**: Apresenta os dados formatados do CNPJ
4. **Modal de Erro**: Exibido em caso de falha na consulta

### Interação do Usuário

O fluxo de interação do usuário com a funcionalidade é:

1. Usuário clica no CNPJ exibido no card de informações da empresa
2. Um modal de carregamento é exibido enquanto a consulta é realizada
3. Após o carregamento, o modal principal exibe os dados formatados
4. O usuário pode fechar o modal clicando no botão "Fechar" ou fora da área do modal

## Tratamento de Erros

### Cenários de Erro

O sistema está preparado para lidar com diversos cenários de erro:

1. **API Indisponível**: Falha na conexão com a API de CNPJ
2. **CNPJ Inválido**: Formato incorreto ou CNPJ inexistente
3. **Timeout**: Tempo limite excedido na consulta
4. **Dados Incompletos**: API retorna dados parciais ou malformados

### Implementação do Tratamento

O tratamento de erros é implementado em múltiplos níveis:

```javascript
// Na função de consulta
export async function consultarCNPJ(cnpj) {
  try {
    // Código de consulta...
  } catch (error) {
    console.error('Erro ao consultar CNPJ:', error);
    throw error; // Propaga o erro para tratamento na UI
  }
}

// Na exibição do modal
export function exibirModalCNPJ(cnpj, companyName) {
  // ...
  consultarCNPJ(cnpj)
    .then(data => {
      // Código de sucesso...
    })
    .catch(error => {
      // Fecha o modal de carregamento
      document.getElementById('cnpjLoadingModal').classList.remove('is-active');
      
      // Exibe modal de erro com mensagem amigável
      document.getElementById('errorModalMessage').textContent = 
        `Não foi possível consultar o CNPJ ${formatarCNPJ(cnpj)}. Tente novamente mais tarde.`;
      document.getElementById('errorModal').classList.add('is-active');
      
      // Registra o erro detalhado no console para depuração
      console.error('Erro ao exibir modal de CNPJ:', error);
    });
}
```

## Otimização e Desempenho

### Estratégias de Otimização

Para garantir uma experiência fluida ao usuário, o BetCheck implementa várias estratégias:

1. **Sistema de Cache**: Armazena consultas recentes para acesso rápido
2. **Carregamento Assíncrono**: Não bloqueia a interface durante consultas
3. **Feedback Visual**: Indicadores de carregamento para manter o usuário informado
4. **Timeout Configurável**: Limita o tempo de espera por respostas da API
5. **Expiração de Cache**: Atualiza dados após período definido (7 dias)

### Métricas de Desempenho

As principais métricas de desempenho monitoradas são:

1. **Tempo de Resposta**: Duração média das consultas à API
2. **Taxa de Acerto do Cache**: Percentual de consultas atendidas pelo cache
3. **Taxa de Erro**: Percentual de consultas que resultam em erro
4. **Tamanho do Cache**: Volume de dados armazenados localmente

## Considerações de Privacidade e Segurança

### Dados Sensíveis

A consulta de CNPJ lida com dados empresariais públicos, mas algumas considerações são importantes:

1. **Armazenamento Local**: Dados são armazenados apenas no navegador do usuário
2. **Sem Rastreamento**: Nenhuma informação de consulta é enviada para servidores próprios
3. **Dados Públicos**: Apenas informações publicamente disponíveis são exibidas
4. **Expiração de Dados**: Cache tem prazo de validade para garantir dados atualizados

### Boas Práticas Implementadas

O sistema segue boas práticas de segurança:

1. **HTTPS**: Todas as consultas à API são realizadas via conexão segura
2. **Validação de Entrada**: CNPJ é validado antes da consulta
3. **Sanitização de Saída**: Dados recebidos são tratados antes da exibição
4. **Tratamento de Erros**: Mensagens de erro não expõem detalhes técnicos ao usuário

## Considerações Futuras

### Melhorias Potenciais

A funcionalidade de consulta de CNPJ pode ser aprimorada com:

1. **Múltiplas Fontes de Dados**: Integração com outras APIs para dados complementares
2. **Histórico de Consultas**: Registro das empresas consultadas pelo usuário
3. **Alertas Personalizados**: Notificações sobre mudanças em empresas específicas
4. **Visualização Avançada**: Gráficos e visualizações das relações societárias
5. **Exportação de Dados**: Opção para exportar informações em formatos como PDF ou CSV

### Expansão de Funcionalidades

Possíveis expansões incluem:

1. **Análise de Risco**: Avaliação automática da credibilidade da empresa
2. **Monitoramento**: Acompanhamento de alterações cadastrais em CNPJs específicos
3. **Comparação**: Ferramenta para comparar dados de diferentes empresas
4. **Integração com Órgãos Oficiais**: Consulta direta a bases governamentais
5. **Verificação Cruzada**: Correlação com outras fontes de dados para validação adicional
