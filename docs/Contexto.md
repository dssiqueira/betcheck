# Contexto do Projeto BetCheck

## Introdução

O BetCheck é uma extensão para o navegador Chrome desenvolvida para verificar a autenticidade e legalidade de sites de apostas no Brasil. Este documento fornece o contexto completo do projeto, incluindo sua motivação, cenário regulatório, problemas que busca resolver e sua importância para os usuários.

## Cenário Regulatório das Apostas no Brasil

### Histórico da Regulamentação

Em dezembro de 2018, o Brasil aprovou a Lei nº 13.756/2018, que legalizou as apostas esportivas de quota fixa no país. Desde então, o governo brasileiro tem trabalhado na regulamentação do setor, estabelecendo regras para a operação de casas de apostas.

Em julho de 2023, o governo publicou a Portaria nº 1.330/2023 do Ministério da Fazenda, estabelecendo os procedimentos para autorização e operação de sites de apostas no Brasil. Esta portaria definiu que apenas empresas devidamente autorizadas podem operar no país, utilizando exclusivamente o domínio `.bet.br`.

### Processo de Homologação

As empresas interessadas em operar no mercado brasileiro de apostas devem passar por um rigoroso processo de homologação que inclui:

1. Registro formal junto ao Ministério da Fazenda
2. Pagamento de taxas de licenciamento
3. Comprovação de capacidade financeira
4. Implementação de medidas de jogo responsável
5. Obtenção de CNPJ ativo no Brasil
6. Registro do domínio com extensão `.bet.br`

Após aprovação, as empresas são incluídas em uma lista oficial de operadores autorizados, publicada e atualizada periodicamente pelo governo.

## Problema Endereçado

### Proliferação de Sites Não Autorizados

Mesmo com a regulamentação em andamento, o mercado brasileiro de apostas online enfrenta desafios significativos:

1. **Sites ilegais**: Operadores sem autorização continuam atuando no país
2. **Phishing e fraudes**: Criação de sites falsos que imitam operadores legítimos
3. **Falta de transparência**: Dificuldade dos usuários em identificar sites confiáveis
4. **Proteção inadequada**: Sites não autorizados frequentemente carecem de medidas de proteção ao consumidor

### Riscos para os Usuários

Os apostadores que utilizam sites não homologados estão sujeitos a diversos riscos:

- Perda de depósitos e ganhos
- Roubo de dados pessoais e financeiros
- Ausência de mecanismos de jogo responsável
- Falta de recursos legais em caso de disputas
- Exposição a práticas predatórias de jogo

## Propósito do BetCheck

### Objetivos Principais

O BetCheck foi desenvolvido com os seguintes objetivos:

1. **Verificação instantânea**: Permitir que os usuários verifiquem rapidamente se um site de apostas está oficialmente homologado no Brasil
2. **Detecção de phishing**: Identificar tentativas de phishing que visam imitar sites legítimos
3. **Transparência corporativa**: Fornecer informações detalhadas sobre as empresas por trás dos sites de apostas
4. **Educação do usuário**: Conscientizar os apostadores sobre a importância de utilizar apenas sites regulamentados

### Público-Alvo

A extensão é destinada a:

- Apostadores brasileiros que desejam garantir a legalidade dos sites que utilizam
- Profissionais de segurança cibernética monitorando ameaças no setor de apostas
- Reguladores e autoridades interessados em monitorar o cumprimento das normas
- Operadores legítimos que desejam diferenciar-se de sites fraudulentos

## Abordagem Técnica

### Fonte de Dados Oficial

O BetCheck utiliza como fonte primária de dados o arquivo CSV oficial publicado pelo Ministério da Fazenda, contendo a lista completa de operadores autorizados. Este arquivo inclui:

- Número do processo de autorização
- Detalhes da autorização concedida
- Nome da empresa
- CNPJ
- Nome da marca
- Domínio autorizado

### Métodos de Verificação

A extensão emprega múltiplas camadas de verificação:

1. **Verificação direta de domínio**: Comparação exata com a lista oficial
2. **Análise de subdomínios**: Verificação de variações e subdomínios
3. **Detecção de similaridade**: Uso do algoritmo de Levenshtein para identificar tentativas de typosquatting
4. **Análise de termos**: Identificação de termos relacionados a apostas em domínios não oficiais

### Integração com APIs Públicas

Para enriquecer as informações disponíveis, o BetCheck integra-se com:

- API pública de consulta de CNPJ
- Serviços WHOIS para verificação de registros de domínio

## Impacto Esperado

### Benefícios para os Usuários

- Redução do risco de fraudes e golpes relacionados a apostas
- Maior confiança ao utilizar sites de apostas online
- Acesso facilitado a informações corporativas dos operadores
- Identificação rápida de sites potencialmente maliciosos

### Contribuição para o Ecossistema

- Promoção de um ambiente de apostas mais seguro e transparente
- Incentivo à conformidade regulatória por parte dos operadores
- Redução da atuação de sites ilegais no mercado brasileiro
- Apoio aos esforços governamentais de regulamentação do setor

## Evolução do Projeto

O BetCheck foi concebido como um projeto em constante evolução, com planos para:

1. Atualizações automáticas da base de dados de sites homologados
2. Melhorias contínuas nos algoritmos de detecção de phishing
3. Expansão das informações disponibilizadas sobre os operadores
4. Desenvolvimento de recursos adicionais de proteção ao usuário

Este documento de contexto serve como base para entender a motivação, escopo e importância do projeto BetCheck, fornecendo o pano de fundo necessário para compreender os demais documentos técnicos e funcionais da extensão.
