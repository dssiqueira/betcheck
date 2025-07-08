# Arquitetura Técnica

## Visão Geral

O BetCheck é uma extensão para o navegador Chrome desenvolvida utilizando tecnologias web padrão (HTML, CSS e JavaScript) e a API de extensões do Chrome. Este documento detalha a arquitetura técnica da extensão, incluindo a estrutura de arquivos, fluxo de dados, comunicação entre componentes e decisões de design técnico.

## Estrutura de Arquivos

### Organização do Projeto

O projeto BetCheck segue uma estrutura organizada de arquivos e diretórios:

```
betcheck/
├── manifest.json         # Configuração da extensão
├── popup.html            # Interface do popup principal
├── popup.js              # Lógica do popup
├── background.js         # Script de fundo (service worker)
├── phishing.js           # Módulo de detecção de phishing
├── cnpj.js               # Módulo de consulta de CNPJ
├── styles/               # Arquivos CSS
│   └── popup.css         # Estilos do popup
├── data/                 # Dados estáticos
│   └── bets.csv          # Lista de sites homologados
└── icons/                # Ícones da extensão
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Arquivos Principais

#### manifest.json

O `manifest.json` é o arquivo de configuração central da extensão, definindo metadados, permissões e comportamentos:

```json
{
  "manifest_version": 3,
  "name": "BetCheck",
  "version": "1.0.0",
  "description": "Verificador de sites de apostas homologados no Brasil",
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "permissions": [
    "activeTab",
    "storage"
  ],
  "background": {
    "service_worker": "background.js"
  }
}
```

#### background.js

O `background.js` funciona como um service worker, executando tarefas em segundo plano:

1. Processamento do arquivo CSV com sites homologados
2. Verificação de domínios
3. Detecção de phishing
4. Comunicação com o popup

#### popup.html e popup.js

Estes arquivos definem a interface do usuário e a lógica de interação:

1. `popup.html`: Estrutura HTML do popup, utilizando Bulma CSS
2. `popup.js`: Lógica para exibição de resultados, interação com modais e comunicação com o background script

#### Módulos Especializados

1. `phishing.js`: Implementa algoritmos de detecção de phishing
2. `cnpj.js`: Gerencia consultas à API de CNPJ e formatação de dados

## Fluxo de Dados

### Inicialização da Extensão

Quando o usuário clica no ícone da extensão, o seguinte fluxo é executado:

1. O navegador carrega `popup.html` e seus recursos associados
2. `popup.js` é executado e obtém a URL da aba atual
3. O domínio é extraído da URL e enviado para verificação
4. Uma mensagem é enviada ao background script solicitando a verificação
5. O popup exibe um indicador de carregamento enquanto aguarda a resposta

```javascript
// Em popup.js
async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

async function checkDomain(domain) {
  showLoading();
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'checkDomain',
      domain: domain
    });
    
    hideLoading();
    processResponse(response);
  } catch (error) {
    hideLoading();
    showError('Erro ao verificar o domínio. Tente novamente.');
    console.error('Error checking domain:', error);
  }
}
```

### Verificação de Domínio

O processo de verificação de domínio segue estas etapas:

1. O background script recebe a mensagem com o domínio a ser verificado
2. O arquivo CSV é carregado e processado (se ainda não estiver em memória)
3. O domínio é verificado contra a lista de sites homologados
4. Se não for encontrado, a verificação de phishing é executada
5. O resultado completo é enviado de volta ao popup

```javascript
// Em background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkDomain') {
    const domain = request.domain;
    
    parseCSV().then(betsData => {
      const result = checkDomain(domain, betsData);
      
      if (!result.isApproved) {
        const phishingCheck = checkPhishing(domain, betsData);
        result.phishing = phishingCheck;
      }
      
      sendResponse(result);
    });
    
    return true; // Indica que a resposta será assíncrona
  }
});
```

### Consulta de CNPJ

Quando o usuário solicita detalhes de CNPJ, o fluxo é:

1. O usuário clica no link de CNPJ no popup
2. `popup.js` chama a função `exibirModalCNPJ()` do módulo `cnpj.js`
3. Um modal de carregamento é exibido
4. O módulo verifica se os dados do CNPJ estão em cache
5. Se não estiverem, uma requisição é feita à API pública
6. Os dados são formatados e exibidos no modal principal
7. Os dados são armazenados em cache para consultas futuras

```javascript
// Em cnpj.js
export async function consultarCNPJ(cnpj) {
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
  
  // Verifica cache
  const cachedData = await getCachedCNPJData(cnpjLimpo);
  if (cachedData) {
    return cachedData;
  }
  
  // Consulta API
  const url = `https://publica.cnpj.ws/cnpj/${cnpjLimpo}`;
  const response = await fetch(url);
  const data = await response.json();
  
  // Armazena em cache
  await cacheCNPJData(cnpjLimpo, data);
  
  return data;
}
```

## Padrões de Comunicação

### Mensagens entre Scripts

A comunicação entre o popup e o background script é realizada através do sistema de mensagens do Chrome:

1. **Mensagens Unidirecionais**: Envio de dados sem espera por resposta
2. **Mensagens com Resposta**: Envio de dados com callback para resposta
3. **Mensagens Assíncronas**: Uso de Promises para gerenciar respostas assíncronas

```javascript
// Envio de mensagem do popup para o background
chrome.runtime.sendMessage(
  { action: 'checkDomain', domain: domain },
  response => {
    // Processa a resposta
  }
);

// Recebimento de mensagem no background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkDomain') {
    // Processa a requisição
    sendResponse({ result: 'dados' }); // Envia resposta síncrona
    
    // OU
    
    processarAsync().then(result => {
      sendResponse(result); // Envia resposta assíncrona
    });
    
    return true; // Indica que a resposta será assíncrona
  }
});
```

### Armazenamento Local

O BetCheck utiliza o `chrome.storage.local` para persistir dados entre sessões:

1. **Cache de CNPJ**: Armazenamento de resultados de consultas anteriores
2. **Configurações**: Potencial armazenamento de preferências do usuário
3. **Histórico**: Possível armazenamento de sites verificados recentemente

```javascript
// Armazenamento de dados
async function cacheCNPJData(cnpj, data) {
  const cacheKey = `cnpj_data_${cnpj}`;
  const cacheData = {
    data: data,
    timestamp: Date.now()
  };
  
  await chrome.storage.local.set({ [cacheKey]: cacheData });
}

// Recuperação de dados
async function getCachedCNPJData(cnpj) {
  const cacheKey = `cnpj_data_${cnpj}`;
  const result = await chrome.storage.local.get(cacheKey);
  const cachedItem = result[cacheKey];
  
  if (cachedItem && Date.now() - cachedItem.timestamp < 7 * 24 * 60 * 60 * 1000) {
    return cachedItem.data;
  }
  
  return null;
}
```

## Modularização e Organização do Código

### Separação de Responsabilidades

O código do BetCheck segue o princípio de separação de responsabilidades:

1. **background.js**: Processamento de dados e lógica principal
2. **popup.js**: Interface do usuário e interações
3. **phishing.js**: Algoritmos de detecção de phishing
4. **cnpj.js**: Consulta e formatação de dados de CNPJ

### Padrões de Design

A extensão implementa vários padrões de design:

1. **Módulos ES6**: Organização do código em módulos independentes
2. **Async/Await**: Gerenciamento de operações assíncronas
3. **Event-Driven**: Arquitetura baseada em eventos e callbacks
4. **Caching**: Armazenamento temporário de dados frequentemente acessados

```javascript
// Exemplo de uso de módulos ES6
import { consultarCNPJ, formatarCNPJ } from './cnpj.js';

// Exemplo de async/await
async function verificarSite() {
  try {
    const tab = await getCurrentTab();
    const domain = new URL(tab.url).hostname;
    const result = await checkDomain(domain);
    updateUI(result);
  } catch (error) {
    handleError(error);
  }
}
```

## Gerenciamento de Recursos

### Otimização de Desempenho

O BetCheck implementa várias estratégias para otimizar o desempenho:

1. **Carregamento Assíncrono**: Operações pesadas são executadas em segundo plano
2. **Caching**: Armazenamento de resultados de consultas para reduzir requisições
3. **Processamento Eficiente**: Algoritmos otimizados para verificação rápida
4. **Feedback Visual**: Indicadores de carregamento para melhorar a percepção de desempenho

### Gerenciamento de Memória

Para garantir eficiência no uso de recursos:

1. **Escopo Limitado**: Variáveis são declaradas no escopo mais restrito possível
2. **Limpeza de Listeners**: Event listeners são removidos quando não mais necessários
3. **Estruturas de Dados Eficientes**: Uso de estruturas apropriadas para cada caso
4. **Expiração de Cache**: Dados em cache têm prazo de validade para evitar crescimento indefinido

## Segurança e Privacidade

### Práticas de Segurança

O BetCheck implementa práticas de segurança importantes:

1. **Content Security Policy**: Restrições para prevenir injeção de código
2. **HTTPS**: Todas as requisições externas são feitas via HTTPS
3. **Validação de Entrada**: Dados recebidos são validados antes do processamento
4. **Sanitização de Saída**: Dados são tratados antes de serem exibidos ao usuário

### Considerações de Privacidade

A extensão respeita a privacidade do usuário:

1. **Dados Locais**: Informações são armazenadas apenas localmente
2. **Permissões Mínimas**: Apenas as permissões necessárias são solicitadas
3. **Transparência**: Clareza sobre quais dados são coletados e como são usados
4. **Sem Rastreamento**: Nenhum dado de navegação é enviado para servidores externos

## Tratamento de Erros

### Estratégia de Tratamento

O BetCheck implementa uma estratégia robusta de tratamento de erros:

1. **Try-Catch**: Blocos para capturar e tratar exceções
2. **Fallbacks**: Comportamentos alternativos quando operações falham
3. **Mensagens Amigáveis**: Feedback compreensível para o usuário
4. **Logging**: Registro detalhado de erros no console para depuração

```javascript
// Exemplo de tratamento de erros
async function checkDomain(domain) {
  showLoading();
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'checkDomain',
      domain: domain
    });
    
    hideLoading();
    processResponse(response);
  } catch (error) {
    hideLoading();
    showError('Erro ao verificar o domínio. Tente novamente.');
    console.error('Error checking domain:', error);
  }
}

function showError(message) {
  const errorContainer = document.getElementById('error-container');
  errorContainer.textContent = message;
  errorContainer.classList.remove('is-hidden');
}
```

### Cenários de Erro

A extensão está preparada para lidar com diversos cenários de erro:

1. **Falha na Carga do CSV**: Exibição de mensagem de erro e opção de tentar novamente
2. **API Indisponível**: Tratamento de falhas na consulta de CNPJ
3. **Timeout**: Limite de tempo para operações que podem demorar
4. **Dados Inválidos**: Validação e tratamento de dados inconsistentes

## Compatibilidade

### Compatibilidade de Navegadores

O BetCheck é projetado para o Chrome e navegadores baseados em Chromium:

1. **Chrome**: Navegador principal suportado
2. **Edge**: Compatível por usar o mesmo motor Chromium
3. **Opera**: Compatível por usar o mesmo motor Chromium
4. **Brave**: Compatível por usar o mesmo motor Chromium

### Compatibilidade de Versões

A extensão considera a compatibilidade com diferentes versões:

1. **Manifest V3**: Utiliza a versão mais recente da API de extensões
2. **JavaScript ES6+**: Utiliza recursos modernos de JavaScript
3. **CSS Moderno**: Utiliza recursos CSS atuais suportados pelos navegadores alvo

## Testes

### Estratégia de Testes

Uma estratégia abrangente de testes deve incluir:

1. **Testes Unitários**: Verificação de funções individuais
2. **Testes de Integração**: Verificação da interação entre componentes
3. **Testes End-to-End**: Verificação do fluxo completo da extensão
4. **Testes Manuais**: Verificação de aspectos visuais e de usabilidade

### Cenários de Teste

Os principais cenários a serem testados incluem:

1. **Sites Homologados**: Verificação correta de sites na lista oficial
2. **Sites Não Homologados**: Identificação correta de sites ausentes da lista
3. **Detecção de Phishing**: Precisão na identificação de sites suspeitos
4. **Consulta de CNPJ**: Funcionamento correto da consulta e exibição de dados
5. **Tratamento de Erros**: Comportamento adequado em cenários de falha

## Implantação

### Processo de Build

O processo de build da extensão envolve:

1. **Minificação**: Redução do tamanho dos arquivos JavaScript e CSS
2. **Empacotamento**: Criação do arquivo .zip para submissão
3. **Versionamento**: Atualização do número de versão no manifest.json
4. **Testes Finais**: Verificação da extensão empacotada

### Publicação

O processo de publicação na Chrome Web Store envolve:

1. **Criação de Conta**: Registro como desenvolvedor
2. **Submissão**: Upload do pacote da extensão
3. **Descrição**: Preenchimento de detalhes, screenshots e ícones
4. **Revisão**: Aguardar aprovação da Google
5. **Atualizações**: Processo para enviar novas versões

## Manutenção e Evolução

### Atualizações de Dados

O arquivo CSV com sites homologados precisa ser atualizado regularmente:

1. **Fonte Oficial**: Obtenção da lista atualizada do Ministério da Fazenda
2. **Processo de Atualização**: Substituição do arquivo CSV e incremento de versão
3. **Verificação**: Testes para garantir que a nova lista funciona corretamente

### Roadmap Técnico

Possíveis evoluções técnicas para o BetCheck:

1. **Atualização Automática de Dados**: Busca periódica da lista oficial
2. **API Própria**: Desenvolvimento de backend para centralizar verificações
3. **Machine Learning**: Implementação de algoritmos avançados para detecção de phishing
4. **Extensão para Outros Navegadores**: Adaptação para Firefox, Safari, etc.
5. **Aplicativo Móvel**: Versão para dispositivos Android e iOS

## Considerações de Escalabilidade

### Crescimento da Base de Dados

Com o aumento do número de sites homologados, considerações importantes incluem:

1. **Estrutura de Dados Eficiente**: Otimização para consultas rápidas mesmo com muitos registros
2. **Paginação**: Possível implementação de carregamento parcial para grandes conjuntos de dados
3. **Indexação**: Estruturas otimizadas para busca por domínio e CNPJ

### Aumento de Usuários

Com o crescimento da base de usuários, considerações importantes incluem:

1. **Desempenho**: Otimização contínua para garantir resposta rápida
2. **Feedback**: Mecanismos para coletar e analisar feedback dos usuários
3. **Suporte**: Canais para atender dúvidas e problemas dos usuários
