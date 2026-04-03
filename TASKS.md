# TASKS.md

## Em progresso

- [ ] **[FEAT] E-Reader Proprietário (Fase 3: Customização)**
  - Implementar menu de tipografia (Fonte, Tamanho, Espaçamento).
  - Implementar Temas dinâmicos (Noite, Sépia, Dia) via Injeção de CSS.
  - Suporte a CFI para salvamento de posição exata no EPUB.
- [ ] **[OPTIMIZE] Zero-Disk I/O no MediaServer**
  - Migrar extração do 7zip para leitura direta de buffer em memória para arquivos pequenos.

## A fazer

- [ ] **[FEAT] Automação de Metadados (MetadataScraperService)**
- [ ] **[FEAT] Servidor de Mídia (LAN Sharing com Auth)**

## Débitos Técnicos & Bugs

- [ ] **[UI] Virtualização de Páginas no PDF** (Para livros > 1000 páginas).

## Feito (esta sessão)

- [x] **[SECURITY] Validação de Caminhos no MediaServer**
  - Implementação de `isPathSafe` para evitar leitura de arquivos arbitrários via `lib-media://`.
- [x] **[STABILITY] Gerenciamento de Memória no PDF Reader**
  - Implementação de `pdfDoc.destroy()` no `BookViewer` para evitar leaks.
- [x] **[SECURITY] Sandboxing do E-Reader**
  - Adicionado `sandbox` ao iframe de EPUB e diretrizes no `GEMINI.md`.
- [x] **[REFACT] StorageManager Singleton & Atomic**
  - Fila global de escrita e cache Write-Through sincronizado.
- [x] **[FEAT] Motor de E-Reader (PDF & EPUB)**
  - Renderização vetorial de PDF no frontend.
  - Parsing real de Manifesto EPUB (.opf) e Spine.
  - Suporte a links relativos dentro de livros via protocolo `archive`.
- [x] **[FEAT] BookPage Dedicada**
  - Nova interface imersiva para literatura com Hero Background e Glassmorphism.
- [x] **[FEAT] Melhorias no Viewer de Imagens**
  - Modo Webtoon com Intersection Observer.
  - Modo Double Page com pares fixos.
  - Filtros Sharp (Brilho, Contraste, Nitidez, P&B) em tempo real.
- [x] **[ARCH] MediaAdapter Pattern**
  - Desacoplamento total via `MediaFactory`, `PdfAdapter`, `ArchiveAdapter` e `EpubAdapter`.
- [x] **[FIX] Estabilidade e Segurança**
  - Polyfills para `URL.parse`, correção de CSP para Workers e fim das dependências circulares.

## Contexto da próxima sessão

O sistema agora é um verdadeiro leitor híbrido (Quadrinhos + Livros). O backend entrega capítulos reais de EPUB e o frontend renderiza PDF nativamente. Próximo foco: Refinar a experiência do E-Reader com controles de texto e temas.
