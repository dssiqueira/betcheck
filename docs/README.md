# Documentação do BetCheck

## Visão Geral

Este diretório contém a documentação completa do BetCheck, uma extensão para navegadores Chrome que verifica a homologação de sites de apostas no Brasil. A documentação está organizada em múltiplos arquivos Markdown, cada um focado em um aspecto específico do projeto.

## Estrutura da Documentação

A documentação está dividida nos seguintes arquivos:

1. [**Contexto**](./Contexto.md) - Visão geral do projeto, cenário regulatório brasileiro, motivação e objetivos
2. [**Verificação de Domínios**](./Verificacao_Dominios.md) - Processo de verificação de sites usando o CSV oficial
3. [**Detecção de Phishing**](./Deteccao_Phishing.md) - Algoritmos e métodos para identificação de sites fraudulentos
4. [**Consulta CNPJ**](./Consulta_CNPJ.md) - Funcionalidade de consulta detalhada de dados empresariais
5. [**Consulta WHOIS**](./Consulta_WHOIS.md) - Verificação de informações de registro de domínios
6. [**Interface do Usuário**](./Interface_Usuario.md) - Componentes visuais e experiência do usuário
7. [**Arquitetura Técnica**](./Arquitetura_Tecnica.md) - Estrutura do código, fluxo de dados e padrões técnicos

## Guia Rápido

### Para Usuários

Se você é um usuário da extensão BetCheck, recomendamos começar pelos seguintes documentos:

- [**Contexto**](./Contexto.md) - Para entender o propósito da extensão
- [**Interface do Usuário**](./Interface_Usuario.md) - Para aprender a usar a extensão

### Para Desenvolvedores

Se você é um desenvolvedor que deseja contribuir ou entender o código:

1. Comece pelo [**Contexto**](./Contexto.md) para entender o problema que estamos resolvendo
2. Leia a [**Arquitetura Técnica**](./Arquitetura_Tecnica.md) para ter uma visão geral do projeto
3. Aprofunde-se nos documentos específicos de cada funcionalidade conforme necessário

## Principais Funcionalidades

A extensão BetCheck possui as seguintes funcionalidades principais, cada uma documentada em detalhes:

### 1. Verificação de Domínios Homologados

Verifica se o site atual está na lista oficial de sites de apostas autorizados no Brasil. Utiliza um arquivo CSV oficial como fonte de dados e implementa verificações de domínios exatos e subdomínios.

[Leia mais sobre Verificação de Domínios](./Verificacao_Dominios.md)

### 2. Detecção de Phishing

Identifica possíveis tentativas de phishing relacionadas a sites de apostas, utilizando múltiplas técnicas como verificação de TLD oficial, análise de similaridade de domínios e heurísticas específicas.

[Leia mais sobre Detecção de Phishing](./Deteccao_Phishing.md)

### 3. Consulta de CNPJ

Permite consultar informações detalhadas sobre a empresa responsável pelo site de apostas, incluindo dados cadastrais, capital social, endereço e sócios.

[Leia mais sobre Consulta de CNPJ](./Consulta_CNPJ.md)

### 4. Consulta WHOIS

Verifica informações de registro do domínio, como data de criação, registrador e servidores DNS, ajudando a identificar sites recém-criados que podem ser suspeitos.

[Leia mais sobre Consulta WHOIS](./Consulta_WHOIS.md)

### 5. Sites Relacionados

Identifica e exibe outros sites operados pela mesma empresa (mesmo CNPJ), ajudando o usuário a encontrar alternativas oficiais.

[Leia mais na seção de Verificação de Domínios](./Verificacao_Dominios.md#identificação-de-sites-relacionados)

## Fluxo de Funcionamento

O fluxo básico de funcionamento da extensão é:

1. O usuário acessa um site de apostas
2. A extensão verifica o domínio contra a lista oficial
3. Se o site está na lista, exibe informações da empresa e opções adicionais
4. Se não está na lista, verifica possível phishing e exibe alertas apropriados
5. O usuário pode consultar informações adicionais (CNPJ, WHOIS) conforme necessário

Para uma visão mais detalhada do fluxo de dados e da arquitetura, consulte o documento [Arquitetura Técnica](./Arquitetura_Tecnica.md).

## Tecnologias Utilizadas

A extensão BetCheck utiliza as seguintes tecnologias principais:

- **JavaScript** - Linguagem principal de programação
- **Chrome Extensions API** - Para integração com o navegador
- **Bulma CSS** - Framework CSS para a interface
- **Font Awesome** - Biblioteca de ícones
- **APIs Externas**:
  - API pública de CNPJ (https://publica.cnpj.ws)
  - API WHOIS da APILayer (https://api.apilayer.com/whois)

## Contribuição

Se você deseja contribuir para o projeto BetCheck, recomendamos:

1. Familiarizar-se com a documentação completa
2. Verificar issues abertas no repositório
3. Seguir as convenções de código existentes
4. Submeter pull requests com descrições claras das mudanças

## Manutenção

A documentação deve ser atualizada sempre que houver mudanças significativas no código ou nas funcionalidades da extensão. Cada arquivo de documentação deve ser tratado como uma entidade separada, mas mantendo a consistência com o restante da documentação.
