# Biblioteca (LegacyReader) 📚

A **Biblioteca** (também conhecida como **LegacyReader**) é uma aplicação desktop robusta e moderna, desenvolvida para entusiastas de quadrinhos, mangás e literatura digital. Projetada para oferecer uma experiência de leitura imersiva e uma organização de coleção impecável, a aplicação combina o poder do **Electron** com a flexibilidade do **React**.

---

## ✨ Principais Funcionalidades

### 📖 Leitura Imersiva

- **Suporte Multi-formato:** Leitura nativa de arquivos `.cbr`, `.cbz`, além de suporte em expansão para `.pdf` e outros formatos.
- **Modos de Visualização:** Escolha entre página única, ajuste à largura e controle de zoom personalizado.
- **Navegação Fluida:** Transições suaves entre capítulos e páginas.

### 🗂️ Gerenciamento de Coleções

- **Organização Inteligente:** Catalogação automática de séries, mangás e quadrinhos.
- **Metadados Automáticos:** Integração com serviços de busca para obter capas, sinopses e detalhes da obra.
- **Categorização Personalizada:** Crie coleções, marque favoritos e gerencie seu progresso de leitura.
- **Tie-ins:** Suporte para gerenciamento de histórias conectadas e ordens de leitura.

### ⚙️ Configurações e Customização

- **Temas:** Suporte a modo claro, escuro e sincronização com o sistema.
- **Backup e Sincronização:** Sistema de backup automático programável com suporte a retenção de versões.
- **Privacidade:** Opções para gerenciar dados locais e logs de erro.

### 📥 Downloads e Uploads

- **Gerenciador de Downloads:** Acompanhe o progresso de novos conteúdos.
- **Upload Local:** Importação simplificada de pastas e arquivos locais para a biblioteca.

---

## 🛠️ Tecnologias Utilizadas

O projeto utiliza um stack moderno focado em performance e experiência do usuário:

- **Core:** [Electron](https://www.electronjs.org/) & [Vite](https://vitejs.dev/)
- **Frontend:** [React](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/)
- **Estado:** [Zustand](https://zustand-demo.pmnd.rs/) (Gerenciamento de estado leve e rápido)
- **UI:** [Material UI (MUI)](https://mui.com/) & [Lucide React](https://lucide.dev/) (Ícones)
- **Estilização:** [SASS/SCSS](https://sass-lang.com/) (Módulos)
- **Processamento:** [Sharp](https://sharp.pixelplumbing.com/) (Processamento de imagens ultra-rápido)
- **Documentos:** [PDF.js](https://mozilla.github.io/pdf.js/) (Renderização de PDFs)
- **Formulários:** [React Hook Form](https://react-hook-form.com/) & [Yup](https://github.com/jquense/yup)

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

Para iniciar o ambiente de desenvolvimento com Hot Reload:

```bash
npm run dev
```

### Build e Distribuição

Para gerar o executável da sua plataforma:

```bash
# Windows
npm run dist:win

# Linux
npm run dist:linux
```

---

## 📂 Estrutura do Projeto

- `electron/`: Código do processo principal, incluindo serviços de sistema, gerenciamento de arquivos e handlers IPC.
- `src/`: Código do processo de renderização (Frontend React).
  - `components/`: Componentes reutilizáveis da interface.
  - `hooks/`: Hooks customizados para lógica de negócio e integração com Electron.
  - `pages/`: Telas principais da aplicação (Home, Reader, Settings, etc).
  - `store/`: Gerenciamento de estado global com Zustand.
  - `types/`: Definições de tipos TypeScript.

---

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma **Issue** ou enviar um **Pull Request**.

1. Faça um Fork do projeto.
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`).
3. Envie suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`).
4. Push para a branch (`git push origin feature/nova-funcionalidade`).
5. Abra um Pull Request.

---

## 🗺️ Roadmap de Desenvolvimento

O desenvolvimento da Biblioteca está organizado em fases que priorizam a estabilidade do núcleo (Core), a eliminação de débitos técnicos e a expansão para novos formatos.

### 🟢 Fase 1: Consolidação & Débito Técnico (Curto Prazo)

_Foco: Unificação de sistemas e melhoria da manutenibilidade._

- **Refatoração do StorageManager:** Eliminar as "gambiarras genéricas" de leitura de JSON e implementar um sistema de cache em memória sincronizado para evitar leituras excessivas de disco.
- **Integração Total do Scraper:** Automatizar a busca de metadados durante o processo de Upload. O `MetadataScraperService` já possui os adaptadores (Jikan, Google Books), mas a UI ainda requer preenchimento manual excessivo.
- **Padronização de Status:** Unificar o tratamento de status (`Pendente`, `Em andamento`, `Completo`) entre o backend Electron e os enums do Frontend.

### 🟡 Fase 2: Experiência de Leitura & Formatos (Médio Prazo)

_Foco: Expandir o que o usuário pode ler e como ele lê._

- **Suporte Nativo a PDF (Zero-Extraction):** Implementar renderização sob demanda usando `pdfjs-dist`. Em vez de extrair todas as páginas para o disco, a aplicação renderiza apenas a página atual solicitada, permitindo abertura instantânea de arquivos PDF gigantes.
- **Módulo EPUB/Livros:** Implementar o `EpubAdapter` para suporte a literatura textual, permitindo ajuste de fonte, entrelinhamento e temas de leitura (sépia, noturno).
- **Modos de Visualização Dinâmicos:**
  - **Webtoon Mode:** Rolagem vertical contínua com pré-carregamento (lazy loading) inteligente.
  - **Double Page Mode:** Visualização de duas páginas lado a lado com detecção de "Spread Pages" (páginas duplas que devem ser exibidas juntas).
- **Pós-processamento de Imagem:** Filtros em tempo real via Sharp (Brilho, Contraste, Nitidez e Limpeza de ruído) para restaurar a qualidade de scans antigos.

### 🟠 Fase 3: Ecossistema & Conectividade (Longo Prazo)

_Foco: Sincronização e recursos avançados._

- **Sincronização Cloud:** Implementar o upload de backups e progresso de leitura para Google Drive/OneDrive.
- **Compartilhamento em Rede Local:** Transformar a Biblioteca em um servidor de mídia local, permitindo ler sua coleção em tablets ou celulares via navegador na mesma rede Wi-Fi.
- **Sistema de Tie-ins Avançado:** Criar "Cronologias" onde o usuário pode seguir uma ordem de leitura que alterna automaticamente entre diferentes séries (comum em eventos de quadrinhos).

---

## 📝 Licença

Este projeto está sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes (ou consulte os autores).

---
