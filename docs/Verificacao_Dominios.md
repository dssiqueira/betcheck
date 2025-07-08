# Verificação de Domínios

## Visão Geral

A verificação de domínios é o componente central do BetCheck, responsável por determinar se um site de apostas está oficialmente homologado no Brasil. Este documento detalha o processo completo de verificação, desde a carga dos dados oficiais até a apresentação dos resultados ao usuário.

## Fonte de Dados

### Arquivo CSV Oficial

O BetCheck utiliza como fonte primária o arquivo CSV oficial publicado pelo Ministério da Fazenda, localizado em `data/bets.csv`. Este arquivo contém os seguintes campos:

1. **Número do Processo**: Identificador único do processo de autorização (formato: número/ano)
2. **Autorização**: Detalhes da autorização concedida pelo Ministério da Fazenda
3. **Nome da Empresa**: Razão social completa da empresa autorizada
4. **CNPJ**: Número de CNPJ da empresa (formato: XX.XXX.XXX/XXXX-XX)
5. **Marca**: Nome comercial ou marca utilizada pelo site de apostas
6. **Domínio**: Domínio autorizado para operação (formato: dominio.bet.br)

### Processo de Carga e Atualização

O arquivo CSV é carregado e processado pelo BetCheck através da função `parseCSV()` no arquivo `background.js`. O processo segue os seguintes passos:

1. Leitura assíncrona do arquivo CSV usando `fetch()`
2. Divisão do conteúdo em linhas individuais
3. Processamento de cada linha, ignorando a linha de cabeçalho
4. Extração dos campos relevantes para cada entrada
5. Validação básica dos dados (verificação de campos vazios)
6. Armazenamento dos dados processados em memória para consulta rápida

```javascript
async function parseCSV() {
  try {
    const response = await fetch('data/bets.csv');
    const csvData = await response.text();
    
    const lines = csvData.split('\n');
    const betsData = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(';');
      if (columns.length < 6) continue;
      
      const entry = {
        requestNumber: columns[0],
        authorization: columns[1],
        companyName: columns[2],
        cnpj: columns[3],
        brand: columns[4],
        domain: columns[5]
      };
      
      if (!entry.domain) continue;
      betsData.push(entry);
    }
    
    return betsData;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}
```

## Algoritmo de Verificação de Domínios

### Função Principal: `checkDomain()`

A verificação de domínios é realizada pela função `checkDomain()` no arquivo `background.js`. Esta função recebe o domínio a ser verificado e os dados carregados do CSV, retornando um objeto com o resultado da verificação.

```javascript
function checkDomain(domain, betsData) {
  domain = domain.toLowerCase();
  if (domain.startsWith('www.')) {
    domain = domain.substring(4);
  }
  
  // Verificação direta e tratamento de casos especiais
  for (const betSite of betsData) {
    let normalizedBetDomain = betSite.domain.toLowerCase();
    if (normalizedBetDomain.startsWith('www.')) {
      normalizedBetDomain = normalizedBetDomain.substring(4);
    }
    
    if (domain === normalizedBetDomain) {
      const relatedSites = findRelatedSites(betSite.cnpj, betsData);
      return {
        isApproved: true,
        companyName: betSite.companyName,
        cnpj: betSite.cnpj,
        domain: betSite.domain,
        relatedSites: relatedSites.filter(site => site.domain !== betSite.domain)
      };
    }
  }
  
  // Verificação de subdomínios
  for (const betSite of betsData) {
    let normalizedBetDomain = betSite.domain.toLowerCase();
    if (normalizedBetDomain.startsWith('www.')) {
      normalizedBetDomain = normalizedBetDomain.substring(4);
    }
    
    if (domain.endsWith('.' + normalizedBetDomain)) {
      const relatedSites = findRelatedSites(betSite.cnpj, betsData);
      return {
        isApproved: true,
        companyName: betSite.companyName,
        cnpj: betSite.cnpj,
        domain: betSite.domain,
        relatedSites: relatedSites.filter(site => site.domain !== betSite.domain),
        isSubdomain: true
      };
    }
  }
  
  // Não encontrado na lista oficial
  return { isApproved: false };
}
```

### Etapas do Processo de Verificação

O processo de verificação de domínios segue estas etapas:

1. **Normalização do Domínio**:
   - Conversão para minúsculas
   - Remoção do prefixo "www." se presente

2. **Verificação Direta**:
   - Comparação exata com cada domínio na lista oficial
   - Quando há correspondência, retorna informações completas da empresa

3. **Verificação de Subdomínios**:
   - Verifica se o domínio atual é um subdomínio de um domínio oficial
   - Exemplo: se "promo.exemplo.bet.br" é verificado e "exemplo.bet.br" está na lista oficial

4. **Resultado da Verificação**:
   - Para sites aprovados: retorna detalhes da empresa e sites relacionados
   - Para sites não aprovados: retorna apenas o status negativo

## Sites Relacionados

### Função `findRelatedSites()`

Uma funcionalidade importante é a identificação de sites relacionados que pertencem à mesma empresa, baseada no CNPJ. Esta funcionalidade é implementada pela função `findRelatedSites()`:

```javascript
function findRelatedSites(cnpj, betsData) {
  const relatedSites = [];
  for (const entry of betsData) {
    if (entry.cnpj === cnpj) {
      relatedSites.push({
        domain: entry.domain,
        brand: entry.brand || entry.companyName
      });
    }
  }
  return relatedSites;
}
```

### Importância dos Sites Relacionados

A identificação de sites relacionados oferece vários benefícios:

1. **Transparência**: Mostra todos os domínios operados pela mesma empresa
2. **Confiança**: Permite que os usuários identifiquem outros sites legítimos da mesma operadora
3. **Prevenção de Fraudes**: Ajuda a distinguir entre sites oficiais relacionados e possíveis imitações

## Casos Especiais e Tratamento de Exceções

### Domínios com Variações

O algoritmo de verificação considera várias situações especiais:

1. **Variações de WWW**: Trata domínios com e sem o prefixo "www." como equivalentes
2. **Subdomínios**: Reconhece subdomínios de domínios oficiais como legítimos
3. **Case Insensitive**: Ignora diferenças entre maiúsculas e minúsculas na comparação

### Tratamento de Erros

O sistema implementa tratamento de erros robusto:

1. **Falha na Carga do CSV**: Retorna um array vazio e registra o erro no console
2. **Entradas Inválidas no CSV**: Ignora linhas com formato incorreto ou campos ausentes
3. **Domínios Vazios**: Pula entradas sem domínio definido

## Integração com o Sistema de Mensagens

### Comunicação Background-Popup

A verificação de domínios é iniciada quando o usuário abre o popup da extensão em um site. O processo de comunicação segue este fluxo:

1. O popup envia uma mensagem solicitando a verificação do domínio atual
2. O background script recebe a mensagem e executa a verificação
3. O resultado é enviado de volta ao popup para exibição

```javascript
// Em background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkDomain') {
    const domain = request.domain;
    
    parseCSV().then(betsData => {
      const result = checkDomain(domain, betsData);
      
      // Adiciona verificação de phishing
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

## Desempenho e Otimização

### Estratégias de Otimização

Para garantir verificações rápidas e eficientes, o BetCheck implementa várias estratégias:

1. **Carregamento Assíncrono**: O CSV é carregado de forma assíncrona para não bloquear a interface
2. **Normalização Prévia**: Os domínios são normalizados antes da comparação para reduzir processamento
3. **Verificação em Duas Etapas**: Primeiro verifica correspondência exata, depois subdomínios
4. **Estrutura de Dados Eficiente**: Utiliza arrays e objetos JavaScript otimizados para consultas rápidas

### Considerações de Escalabilidade

O sistema foi projetado considerando o crescimento da base de dados:

1. **Tamanho do CSV**: O algoritmo funciona eficientemente mesmo com centenas ou milhares de entradas
2. **Atualizações Frequentes**: Permite atualizações da base de dados sem necessidade de reinstalação da extensão
3. **Processamento Incremental**: Processa apenas as linhas válidas do CSV, ignorando entradas problemáticas

## Testes e Validação

### Cenários de Teste

O sistema de verificação de domínios deve ser testado nos seguintes cenários:

1. **Domínios Exatos**: Verificação de domínios que correspondem exatamente aos da lista
2. **Variações de WWW**: Teste com e sem o prefixo "www."
3. **Subdomínios**: Verificação de subdomínios de sites oficiais
4. **Case Sensitivity**: Teste com variações de maiúsculas e minúsculas
5. **Domínios Não Aprovados**: Verificação de domínios ausentes na lista oficial
6. **Domínios Similares**: Teste com domínios similares aos oficiais (para integração com detecção de phishing)

### Validação de Resultados

Os resultados da verificação devem ser validados para garantir:

1. **Precisão**: Correspondência correta entre domínios e entradas no CSV
2. **Completude**: Inclusão de todas as informações relevantes no resultado
3. **Consistência**: Comportamento consistente em diferentes navegadores e versões
4. **Desempenho**: Tempo de resposta aceitável mesmo com CSV grande

## Considerações Futuras

### Melhorias Potenciais

O sistema de verificação de domínios pode ser aprimorado com:

1. **Atualização Automática do CSV**: Implementação de mecanismo para atualizar automaticamente a base de dados
2. **Cache de Resultados**: Armazenamento temporário de resultados frequentes para melhorar desempenho
3. **Verificação Offline**: Possibilidade de verificar domínios mesmo sem conexão à internet
4. **Algoritmos Avançados**: Implementação de técnicas mais sofisticadas de correspondência de domínios
5. **Integração com APIs Externas**: Consulta a APIs oficiais do governo para verificação em tempo real

### Expansão de Funcionalidades

Possíveis expansões incluem:

1. **Histórico de Verificações**: Registro de sites verificados pelo usuário
2. **Alertas Proativos**: Notificação ao usuário antes de acessar sites não aprovados
3. **Verificação em Massa**: Possibilidade de verificar múltiplos domínios simultaneamente
4. **Exportação de Resultados**: Permitir que usuários exportem resultados de verificação
5. **Integração com Sistemas de Segurança**: Compartilhamento de dados com ferramentas de segurança cibernética
