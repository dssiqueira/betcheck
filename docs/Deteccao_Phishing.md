# Detecção de Phishing

## Visão Geral

A detecção de phishing é um componente crítico do BetCheck, projetado para identificar sites maliciosos que tentam imitar operadores legítimos de apostas. Este documento detalha os algoritmos, heurísticas e implementação técnica do sistema de detecção de phishing.

## Fundamentos da Detecção de Phishing

### Contexto do Problema

No mercado brasileiro de apostas online, sites de phishing representam uma ameaça significativa:

1. **Imitação de Marcas**: Criação de sites com nomes muito similares a operadores legítimos
2. **Domínios Enganosos**: Uso de variações de domínios oficiais (ex: "betano-brasil" em vez de "betano.bet.br")
3. **Visual Similar**: Cópia do design e identidade visual de sites legítimos
4. **Termos de Apostas**: Uso de palavras-chave relacionadas a apostas para parecer autêntico

### Abordagem Multi-camadas

O BetCheck implementa uma estratégia de detecção em múltiplas camadas:

1. **Verificação de Domínio Oficial**: Confirma se o domínio termina com `.bet.br` (único TLD oficialmente autorizado)
2. **Análise de Termos**: Identifica termos relacionados a apostas em domínios não oficiais
3. **Detecção de Similaridade**: Usa o algoritmo de Levenshtein para encontrar similaridades com sites oficiais
4. **Análise de Padrões**: Identifica padrões comuns em URLs de phishing

## Implementação Técnica

### Arquivo Principal: `phishing.js`

O módulo de detecção de phishing está implementado no arquivo `phishing.js`, que contém as funções principais para análise e detecção:

```javascript
// Lista de termos comuns relacionados a apostas
const COMMON_BET_TERMS = [
  'bet', 'bets', 'apostas', 'aposta', 'casino', 'cassino', 
  'sport', 'esporte', 'odds', 'gambling', 'game', 'jogo', 
  'win', 'ganhe', 'bonus', 'bônus', 'pix', 'saque', 'deposito'
];

// Função principal de verificação de phishing
function checkPhishing(domain, approvedSites) {
  domain = domain.toLowerCase();
  
  // Se for um domínio oficial .bet.br, não é phishing
  if (domain.endsWith('.bet.br')) {
    return { isPhishing: false };
  }
  
  // Verifica se contém termos relacionados a apostas
  const containsBetTerms = COMMON_BET_TERMS.some(term => domain.includes(term));
  
  if (containsBetTerms) {
    // Busca sites similares na lista oficial
    const similarSites = findSimilarSites(domain, approvedSites);
    
    if (similarSites.length > 0) {
      return {
        isPhishing: true,
        reason: 'domain_similarity',
        similarSites: similarSites
      };
    }
    
    // Se contém termos de apostas mas não é um domínio oficial
    return {
      isPhishing: true,
      reason: 'not_official_domain',
      message: 'Este site contém termos relacionados a apostas mas não usa o domínio oficial .bet.br'
    };
  }
  
  // Se não contém termos de apostas, não é considerado phishing
  return { isPhishing: false };
}
```

### Algoritmo de Distância de Levenshtein

O algoritmo de Levenshtein é fundamental para detectar similaridades entre domínios:

```javascript
// Implementação do algoritmo de Levenshtein para calcular a distância entre strings
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
      if (b.charAt(i-1) === a.charAt(j-1)) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i-1][j-1] + 1, // substituição
          Math.min(
            matrix[i][j-1] + 1,   // inserção
            matrix[i-1][j] + 1    // exclusão
          )
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

// Função para determinar se dois textos são similares baseado na distância de Levenshtein
function isSimilarText(text1, text2) {
  // Para strings curtas, permitimos menos diferenças
  const maxDistance = Math.min(text1.length, text2.length) <= 5 ? 1 : 2;
  
  // Calcula a distância de Levenshtein
  const distance = levenshteinDistance(text1, text2);
  
  // Verifica se a distância está dentro do limite aceitável
  return distance <= maxDistance;
}
```

### Identificação de Sites Similares

A função `findSimilarSites()` compara o domínio atual com todos os sites aprovados para encontrar similaridades:

```javascript
function findSimilarSites(domain, approvedSites) {
  const similarSites = [];
  
  // Extrai a parte principal do domínio (sem TLD)
  const domainWithoutTLD = domain.split('.')[0];
  
  // Compara com cada site aprovado
  for (const site of approvedSites) {
    const approvedDomainWithoutTLD = site.domain.toLowerCase().split('.')[0];
    
    // Verifica similaridade usando o algoritmo de Levenshtein
    if (isSimilarText(domainWithoutTLD, approvedDomainWithoutTLD)) {
      similarSites.push({
        domain: site.domain,
        companyName: site.companyName,
        cnpj: site.cnpj
      });
    }
    
    // Verifica também se o domínio atual é uma substring do domínio aprovado
    // ou vice-versa (para casos como "bet365" vs "365bet")
    if (domainWithoutTLD.includes(approvedDomainWithoutTLD) || 
        approvedDomainWithoutTLD.includes(domainWithoutTLD)) {
      if (!similarSites.some(s => s.domain === site.domain)) {
        similarSites.push({
          domain: site.domain,
          companyName: site.companyName,
          cnpj: site.cnpj
        });
      }
    }
  }
  
  return similarSites;
}
```

## Heurísticas de Detecção

### Verificação de Domínio Oficial

A primeira camada de verificação é baseada no TLD (Top-Level Domain):

1. **Regra Principal**: No Brasil, apenas domínios terminados em `.bet.br` são oficialmente autorizados para apostas
2. **Implementação**: Verificação direta usando `domain.endsWith('.bet.br')`
3. **Lógica**: Se um domínio usa o TLD oficial, é considerado legítimo e passa para a verificação na lista oficial

### Análise de Termos Relacionados a Apostas

A segunda camada identifica termos comuns em sites de apostas:

1. **Lista de Termos**: Inclui palavras como "bet", "apostas", "casino", "sport", "odds", etc.
2. **Implementação**: Verifica se o domínio contém qualquer termo da lista
3. **Lógica**: Se um domínio contém termos de apostas mas não usa o TLD oficial, é potencialmente suspeito

### Detecção de Similaridade com Sites Oficiais

A terceira camada usa o algoritmo de Levenshtein para detectar similaridades:

1. **Extração do Domínio Base**: Remove o TLD e compara apenas a parte principal do domínio
2. **Cálculo de Distância**: Determina quantas operações (inserções, exclusões, substituições) são necessárias para transformar um domínio em outro
3. **Limiar Adaptativo**: Usa um limiar proporcional ao tamanho do domínio (1 para domínios curtos, 2 para mais longos)
4. **Verificação de Substring**: Complementa a análise de Levenshtein verificando se um domínio está contido no outro

### Padrões Adicionais de Detecção

Além das técnicas principais, o sistema identifica padrões comuns em URLs de phishing:

1. **Números Adicionais**: Detecção de variantes como "betano123", "bet365-br"
2. **Hífens e Underscores**: Identificação de padrões como "bet_365", "betano-oficial"
3. **Palavras Geográficas**: Detecção de sufixos como "brasil", "br", "oficial"
4. **Combinações de Marcas**: Identificação de domínios que combinam nomes de operadores diferentes

## Integração com o Sistema Principal

### Fluxo de Verificação

O sistema de detecção de phishing é integrado ao fluxo principal de verificação:

1. Primeiro, o domínio é verificado na lista oficial de sites aprovados
2. Se não for encontrado, o sistema de detecção de phishing é acionado
3. Os resultados da detecção são incluídos na resposta enviada ao popup

```javascript
// Em background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkDomain') {
    const domain = request.domain;
    
    parseCSV().then(betsData => {
      const result = checkDomain(domain, betsData);
      
      // Se o site não está aprovado, verifica phishing
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

### Exibição de Alertas

Os resultados da detecção de phishing são exibidos ao usuário de forma clara e informativa:

1. **Alerta Visual**: Destaque em vermelho com ícone de aviso
2. **Mensagem Explicativa**: Descrição do motivo pelo qual o site é suspeito
3. **Sites Oficiais Similares**: Lista de alternativas legítimas quando relevante
4. **Recomendações**: Orientações sobre como proceder com segurança

## Avaliação e Precisão

### Métricas de Eficácia

A eficácia do sistema de detecção de phishing pode ser avaliada através de:

1. **Taxa de Verdadeiros Positivos**: Percentual de sites de phishing corretamente identificados
2. **Taxa de Falsos Positivos**: Percentual de sites legítimos incorretamente marcados como phishing
3. **Taxa de Verdadeiros Negativos**: Percentual de sites legítimos corretamente identificados
4. **Taxa de Falsos Negativos**: Percentual de sites de phishing não detectados

### Limitações Conhecidas

O sistema atual possui algumas limitações:

1. **Dependência de Termos**: Sites de phishing que não usam termos comuns de apostas podem não ser detectados
2. **Similaridade Limitada**: A detecção baseada em Levenshtein pode não capturar todas as variações possíveis
3. **Foco em Texto**: Não analisa elementos visuais ou estrutura do site, apenas o domínio
4. **Sem Aprendizado**: O sistema não se adapta automaticamente a novos padrões de phishing

## Considerações Futuras

### Melhorias Potenciais

O sistema de detecção de phishing pode ser aprimorado com:

1. **Aprendizado de Máquina**: Implementação de algoritmos de ML para detecção mais precisa
2. **Análise Visual**: Comparação de screenshots para detectar clones visuais
3. **Verificação de Certificados SSL**: Análise da validade e idade dos certificados
4. **Reputação de Domínio**: Integração com bases de dados de reputação de domínios
5. **Análise de Conteúdo**: Verificação do conteúdo da página além do domínio
6. **Feedback do Usuário**: Sistema para usuários reportarem falsos positivos/negativos

### Expansão de Funcionalidades

Possíveis expansões incluem:

1. **Bloqueio Proativo**: Opção para bloquear automaticamente sites detectados como phishing
2. **Relatórios Detalhados**: Informações mais detalhadas sobre por que um site foi marcado como suspeito
3. **Integração com Bases de Dados Externas**: Conexão com listas de phishing conhecidas
4. **Notificações em Tempo Real**: Alertas quando o usuário está prestes a acessar um site suspeito
5. **Análise de Links**: Verificação de links em emails e mensagens antes de serem acessados
