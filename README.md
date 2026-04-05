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

### 🟢 Fase 1: Core & Estabilidade (Concluída)

- **Refatoração do StorageManager:** Implementado sistema de cache em memória (Source of Truth) com fila de escrita serializada e gravação atômica, eliminando riscos de corrupção.
- **Limpeza de Tipagem:** Remoção total de `any` e `@ts-ignore`, com adoção de tipagem forte em todo o projeto.
- **Padronização de Status:** Unificação de Enums entre Frontend e Backend.

### 🟡 Fase 2: Experiência de Leitura & Formatos (Concluída)

- **Suporte Nativo a PDF (Zero-Extraction):** Renderização sob demanda usando `pdfjs-dist` com Double Buffering no Canvas, permitindo abertura instantânea e navegação fluida em arquivos gigantes.
- **E-Reader Profissional (EPUB):** Motor de paginação horizontal por colunas dinâmicas (CSS Multi-column) com injeção de estilo lado-servidor.
- **Customização de Aparência:** Controle total de temas (Dia, Noite, Sépia), tipografia (família de fontes, tamanho, entrelinhamento) e margens.
- **Índice Unificado:** Painel lateral com Sumário lógico e Salto por Páginas para PDF e EPUB.

### 🟠 Fase 3: Ecossistema & Conectividade (Em progresso)

- **Sincronização de Progresso (CFI):** Implementação do Canonical Fragment Identifier para salvar a posição exata em textos fluidos, garantindo persistência mesmo após trocas de fontes.
- **Compartilhamento em Rede Local:** Transformar a Biblioteca em um servidor de mídia local, permitindo ler sua coleção em tablets ou celulares via navegador.
- **Sistema de Tie-ins Avançado:** Criar "Cronologias" onde o usuário pode seguir uma ordem de leitura que alterna automaticamente entre diferentes séries.

---

## 📝 Licença

Este projeto está sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes (ou consulte os autores).

---
