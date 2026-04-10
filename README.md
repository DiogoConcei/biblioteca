# Biblioteca (LegacyReader) 📚

A **Biblioteca** (também conhecida como **LegacyReader**) é uma aplicação desktop robusta e moderna, desenvolvida para entusiastas de quadrinhos, mangás e literatura digital. Projetada para oferecer uma experiência de leitura imersiva e uma organização de coleção impecável, a aplicação combina o poder do **Electron** com a flexibilidade do **React**.

---

## ✨ Principais Funcionalidades

### 📖 Leitura Imersiva

- **Suporte Multi-formato:** Leitura nativa de arquivos `.cbr`, `.cbz`, `.pdf` (vetorial) e `.epub` (texto fluido).
- **E-Reader Avançado:** Suporte a temas (Claro, Escuro, Sépia), ajuste de tipografia (tamanho, fonte, entrelinhamento) e navegação por capítulos (TOC/CFI).
- **Modos de Visualização:** Escolha entre página única, página dupla (quadrinhos), ajuste à largura e controle de zoom personalizado.
- **Navegação Fluida:** Transições suaves e salvamento automático de progresso com precisão de parágrafo (CFI) para livros.

### 🗂️ Gerenciamento de Coleções

- **Organização Inteligente:** Catalogação automática de séries, mangás e quadrinhos com virtualização de caminhos para máxima compatibilidade com o Windows.
- **Metadados Automáticos:** Integração com serviços de busca para obter capas, sinopses e detalhes da obra.
- **Categorização Personalizada:** Crie coleções, marque favoritos e gerencie seu progresso de leitura.
- **Tie-ins & Child Series:** Suporte para gerenciamento de histórias conectadas e ordens de leitura complexas.

### 🌐 Ecossistema & Conectividade

- **LAN Sharing:** Transforme seu PC em um servidor de mídia e leia sua coleção em qualquer dispositivo (Tablet/Mobile) via navegador, com sincronização de progresso em tempo real.
- **Pareamento Facilitado:** Conexão automática via QR Code e descoberta de rede (mDNS).
- **Acesso Remoto:** Gerenciamento de downloads e exclusão de arquivos diretamente pelo dispositivo móvel.

### ⚙️ Configurações e Segurança

- **Virtualização de Caminhos (MAX_PATH):** Sistema robusto que contorna o limite de 260 caracteres do Windows, garantindo que arquivos com nomes longos nunca causem falhas no processamento de imagens.
- **Backup e Sincronização:** Sistema de backup automático programável com suporte a retenção de versões.
- **Privacidade:** Opções para gerenciar dados locais e logs de erro.

---

## 🛠️ Tecnologias Utilizadas

O projeto utiliza um stack moderno focado em performance e experiência do usuário:

- **Core:** [Electron](https://www.electronjs.org/) & [Vite](https://vitejs.dev/)
- **Frontend:** [React](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/)
- **Estado:** [Zustand](https://zustand-demo.pmnd.rs/)
- **UI:** [Material UI (MUI)](https://mui.com/), [Lucide React](https://lucide.dev/) & [SCSS Modules](https://sass-lang.com/)
- **Processamento:** [Sharp](https://sharp.pixelplumbing.com/) (Processamento de imagens ultra-rápido)
- **Motores de Leitura:** [PDF.js](https://mozilla.github.io/pdf.js/) & [Epub.js](http://epubjs.org/)
- **Servidor:** [Express](https://expressjs.com/) (LAN Sharing) & [mDNS](https://github.com/agnat/node-mdns)

---

## 🚀 Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS recomendada)
- npm ou yarn

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/biblioteca.git
   cd biblioteca
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

### Desenvolvimento

Para iniciar o ambiente de desenvolvimento:
```bash
npm run dev
```

---

## 🗺️ Roadmap de Desenvolvimento

### 🟢 Fase 1: Core & Estabilidade (Concluída)
- Refatoração do StorageManager com fila de escrita serializada.
- Remoção total de `any` e adoção de tipagem forte (`Record<string, unknown>`).

### 🟢 Fase 2: Experiência de Leitura & Formatos (Concluída)
- Suporte nativo a PDF vetorial e E-Reader profissional para EPUB.
- Customização total de tipografia e temas de leitura.
- **Virtualização de Caminhos:** Solução definitiva para erros de `MAX_PATH` no Windows.

### 🟢 Fase 3: Ecossistema & Conectividade (Concluída)
- **Sincronização de Progresso (CFI):** Persistência exata da posição de leitura.
- **LAN Sharing:** Servidor de mídia completo com QR Code e sincronização mobile.
- **Download On-Demand:** Baixar capítulos remotamente via rede local.

### 🟡 Fase 4: Expansão (Em planejamento)
- **Scrapers de Capítulos:** Busca automática de atualizações.
- **Plugins de Metadados:** Suporte a provedores externos customizáveis.

---

## 📝 Licença

Este projeto está sob a licença MIT.
