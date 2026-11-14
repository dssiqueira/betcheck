# BetCheck - Extensão para Chrome

> [!WARNING]
> **Projeto descontinuado e arquivado em novembro de 2026.**
>
> A [Medida Provisória nº 1.394, de 25 de setembro de 2026](https://www.congressonacional.leg.br/materias/medidas-provisorias/-/mpv/175871), proibiu em todo o território nacional a exploração, a oferta, a intermediação e a publicidade de apostas de quota fixa, e extinguiu as autorizações concedidas pelo Ministério da Fazenda. Com isso, a premissa do BetCheck (indicar se um site de apostas é **homologado**) deixou de existir: enquanto a MP estiver em vigor, nenhuma casa de apostas está autorizada a operar no Brasil, e a lista em `data/bets.csv` (julho de 2025) serve apenas como registro histórico.
>
> **Não use esta extensão para decidir se um site de apostas é confiável.** Se a MP for rejeitada ou perder a validade, o projeto pode ser retomado.

<p align="center">
  <img src="icons/BetCheck48.png" alt="BetCheck Logo"/>
</p>

BetCheck é uma extensão para o Chrome que verifica se um site de apostas está oficialmente homologado no Brasil, consultando uma base de dados oficial. A extensão oferece proteção contra sites de phishing e fornece informações detalhadas sobre empresas de apostas autorizadas.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Instalação](#instalação)
- [Como Usar](#como-usar)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Detalhes Técnicos](#detalhes-técnicos)
- [Contribuição](#contribuição)
- [Licença](#licença)

## 🔍 Visão Geral

No Brasil, apenas sites com domínio `.bet.br` são oficialmente homologados para operação de apostas. O BetCheck ajuda os usuários a identificar sites legítimos e evitar possíveis fraudes, verificando se o site atual está na lista oficial de casas de apostas autorizadas pelo Ministério da Fazenda.

## ✨ Funcionalidades

### Verificação de Sites Homologados
- ✅ Verifica se o site atual é uma casa de apostas homologada no Brasil
- 📊 Exibe o nome da empresa e o CNPJ para sites homologados
- 🔄 Mostra outros sites relacionados da mesma empresa (mesmo CNPJ)

### Detecção de Phishing
- 🚨 Alerta quando detecta possíveis tentativas de phishing
- 🔍 Identifica sites com nomes similares a bets homologadas usando distância de Levenshtein
- 🛡️ Verifica se o domínio termina com `.bet.br` (único domínio oficialmente homologado)
- ⚠️ Detecta sites que contêm termos relacionados a apostas mas não usam o domínio oficial

### Consulta de CNPJ
- 🏢 Permite consultar detalhes completos do CNPJ das empresas homologadas
- 💼 Exibe informações como razão social, capital social, data de abertura e endereço
- 👥 Lista os sócios da empresa com seus respectivos tipos e datas de entrada

### Interface Amigável
- 🎨 Design moderno com framework Bulma CSS
- 🔄 Indicador de carregamento durante as verificações
- 🏷️ Tags coloridas para status (verde para aprovado, vermelho para não aprovado)
- 📱 Layout responsivo com espaçamento e tipografia adequados

## 🛠️ Tecnologias Utilizadas

- **JavaScript (ES6+)**: Linguagem principal de programação
- **HTML5/CSS3**: Estrutura e estilização da interface
- **Bulma CSS**: Framework CSS para design responsivo
- **Font Awesome**: Biblioteca de ícones
- **Chrome Extension API**: APIs do navegador para extensões
- **API Pública de CNPJ**: Consulta de dados empresariais (https://publica.cnpj.ws)

## 📥 Instalação

### Método de Desenvolvimento
1. Clone este repositório ou faça o download dos arquivos
2. Abra o Chrome e navegue até `chrome://extensions/`
3. Ative o "Modo do desenvolvedor" no canto superior direito
4. Clique em "Carregar sem compactação"
5. Selecione a pasta do projeto BetCheck
6. A extensão será instalada e aparecerá na barra de ferramentas do Chrome

### Método para Usuários
1. Baixe a extensão da Chrome Web Store (link a ser adicionado quando disponível)
2. Clique em "Adicionar ao Chrome"
3. Confirme a instalação quando solicitado
4. A extensão será instalada e aparecerá na barra de ferramentas do Chrome

## 📝 Como Usar

### Verificação Básica
1. Navegue até um site de apostas que você deseja verificar
2. Clique no ícone da extensão BetCheck na barra de ferramentas
3. A extensão mostrará se o site é homologado ou não
4. Para sites homologados, serão exibidos:
   - Nome da empresa
   - CNPJ formatado
   - Selo de verificação oficial
   - Sites relacionados da mesma empresa (se houver)

### Consulta de CNPJ
1. Para sites homologados, clique no ícone de lupa ao lado do CNPJ
2. Um modal será exibido com informações detalhadas:
   - Razão social completa
   - CNPJ formatado
   - Capital social
   - Data de abertura
   - Endereço completo
   - Lista de sócios

### Análise de Phishing
- Para sites não homologados, a extensão realiza automaticamente uma análise de phishing
- Se detectado como possível phishing, um alerta será exibido com:
  - Motivo da suspeita
  - Lista de sites oficiais similares (quando relevante)
  - Recomendações de segurança

### Sites Relacionados
- Para sites homologados, a extensão exibe outros domínios da mesma empresa
- Clique em qualquer site relacionado para abri-lo em uma nova aba

## 📁 Estrutura do Projeto

```
betcheck/
├── manifest.json       # Configuração da extensão
├── popup.html         # Interface do usuário da extensão
├── popup.js           # Lógica da interface do usuário
├── popup.css          # Estilos específicos da interface
├── background.js      # Script de fundo que processa os dados
├── phishing.js        # Lógica de detecção de phishing
├── phishing-advanced.js # Análise avançada de phishing
├── cnpj.js            # Módulo de consulta e formatação de CNPJ
├── cache.js           # Sistema de cache para consultas
├── data/              # Diretório de dados
│   └── bets.csv       # Base de dados com as casas de apostas homologadas
└── icons/             # Ícones da extensão
    ├── BetCheck16.png # Ícone 16x16
    └── BetCheck48.png # Ícone 48x48
```

## 🔧 Detalhes Técnicos

### Verificação de Domínios
- A extensão normaliza os domínios para comparação (remove www, considera subdomínios)
- Verifica correspondências exatas e subdomínios de sites homologados
- Utiliza uma base de dados CSV com informações oficiais do Ministério da Fazenda

### Detecção de Phishing
- Implementa o algoritmo de distância de Levenshtein para detectar nomes similares
- Verifica padrões comuns em URLs de phishing (como números, hífens duplicados)
- Analisa termos relacionados a apostas em domínios não oficiais

### Consulta de CNPJ
- Utiliza a API pública de CNPJ (https://publica.cnpj.ws)
- Implementa sistema de cache para reduzir requisições repetidas
- Formata dados para melhor visualização (CNPJ, moeda, data, endereço)

### Interface do Usuário
- Design moderno com framework Bulma CSS
- Animações sutis para melhor experiência do usuário
- Indicadores visuais claros para diferentes estados (homologado, não homologado, phishing)

## 👥 Contribuição

Contribuições são bem-vindas! Se você deseja melhorar o BetCheck, siga estes passos:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Faça commit das suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Faça push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

---

Desenvolvido com ❤️ para proteger apostadores brasileiros
