# Arquitetura do Sistema - Biblioteca (LegacyReader)

Este documento descreve a organização técnica, o fluxo de dados e os padrões de design da aplicação.

## 🏗️ Visão Geral

A aplicação utiliza uma arquitetura **Main/Renderer** baseada em Electron, separando rigidamente a lógica de sistema (I/O, Processamento de Imagem, Gerenciamento de Arquivos) da interface de usuário.

- **Processo Principal (Main):** Node.js puro com APIs do Electron. Responsável pelo ciclo de sistema e I/O.
- **Processo de Renderização (Renderer):** React + TypeScript + Vite. Responsável pela UI.

---

## 💾 Camada de Persistência (Storage)

### 🔒 Serialização e Integridade (StorageManager)
O `StorageManager.ts` é o coração da persistência local-first. Ele foi refatorado para garantir máxima segurança:
- **Singleton:** Existe apenas uma instância global do Manager para evitar dessincronização de cache.
- **Global Write Queue:** Todas as operações de escrita são enfileiradas sequencialmente em uma fila de Promessas global.
- **Write-Through Cache:** O cache em memória é atualizado simultaneamente com o disco. Leituras sempre consultam o cache primeiro.
- **Atomic Writes:** Toda escrita utiliza um arquivo temporário (`.json.tmp`) que é renomeado após o sucesso, prevenindo corrupção de arquivos em caso de crash do processo.

---

## 🖼️ Mídia e Adaptadores (Media System)

### 🔌 MediaAdapter Pattern
Para suportar formatos heterogêneos (Quadrinhos vs. Livros), implementamos o padrão **Adapter**. O `MediaFactory` entrega o adaptador correto baseado na extensão do arquivo.

```typescript
interface MediaAdapter {
  getPages(chapterPath: string): Promise<MediaContent>;
  getCover(seriesPath: string): Promise<string>;
}
```

- **ArchiveAdapter (CBZ/CBR):** Lida com imagens dentro de ZIP/RAR.
- **PdfAdapter:** Converte e serve páginas de PDF.
- **EpubAdapter:** Mapeia a estrutura de capítulos HTML/XHTML de livros.

### 🛡️ Protocolo `lib-media://` (Virtual File System)
Acesso seguro e performático a mídias locais sem as restrições do protocolo `file://`.
- **Local:** `lib-media://local/[BASE64_PATH]` - Acesso a arquivos diretos no disco.
- **Archive:** `lib-media://archive/[BASE64_ZIP]/[BASE64_INTERNAL]` - Acesso a arquivos virtuais **dentro** de arquivos compactados (vital para E-Reader).
- **Filtros Sharp:** O protocolo suporta query parameters (`?brightness=1.2&contrast=1.1&grayscale=true&sharpness=5`) que disparam o processamento via **Sharp** no backend antes da entrega.

---

## 📖 Visualizadores (Viewers)

### 🎞️ Image Viewer (Quadrinhos/Mangás)
Projetado para sequências de imagens.
- **Modos:** Single Page, Double Page (pares fixos), Webtoon (scroll vertical).
- **Inteligência:** Intersection Observer para rastrear progresso no modo scroll.
- **Transições:** Animações CSS integradas no hook de navegação.

### 📚 Book Viewer (E-Reader)
Motor de leitura profissional para literatura textual (EPUB e PDF). A arquitetura é modular, com um componente orquestrador (`BookViewer`) e motores dedicados (`EpubViewer` e `PdfViewer`) isolando as complexidades de cada engine (`epub.js` e `pdf.js`).
- **Engine Nativa (EPUB):** Utiliza a biblioteca padrão da indústria `epub.js` (via `react-reader`), processando todo o arquivo no frontend para garantir paginação perfeita e sumário interativo.
- **Isolamento e Segurança:** O conteúdo do livro é carregado via `ArrayBuffer` no cliente e entregue ao motor de leitura (Iframe `src` isolado com `sandbox="allow-scripts"`). Isso elimina a necessidade de extrair recursos individuais via `lib-media://`, blindando a aplicação contra ataques de `Iframe Escape`.
- **Tipagem Forte:** O sistema utiliza interfaces rigorosas para abstrair as engines de terceiros, garantindo 100% de cobertura TypeScript sem o uso de `any`.
- **MediaServer Desacoplado:** O backend de mídia (`MediaServer`) atua como um roteador de estratégia, delegando a busca de arquivos para handlers específicos (`LocalMediaHandler`, `ArchiveMediaHandler`, `StorageMediaHandler`), garantindo alta coesão e facilidade de testes.
- **Preservação de Posição:** O leitor EPUB usa marcadores CFI estritos para garantir que o parágrafo exato lido pelo usuário seja persistido no banco e recarregado, mantendo a coerência no **Contador de Páginas Referencial** (Página X de Y).

---

## 🛠️ Padrões de Código

1. **Inversão de Dependência:** Handlers IPC não conhecem a lógica de formato; eles delegam para a `MediaFactory`.
2. **Contextual Hooks:** Hooks como `useNavigation` centralizam a lógica de progresso e regras de negócio de navegação.
3. **Zustand Persistence:** Sincronização automática entre preferências do Viewer e o backend.
