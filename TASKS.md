# TASKS.md

## Em progresso
- [ ] **[FEAT] E-Reader Proprietário (Fase 2: Renderer)**
  - Implementar `BookViewer.tsx` para renderização de HTML/EPUB.
  - Criar sistema de injeção de CSS para Temas (Dark, Sepia).
  - Implementar navegação por capítulos (TOC).
- [ ] **[FEAT] Automação de Metadados no Upload**
  - Integrar `MetadataScraperService` no fluxo de `UploadPopUp.tsx`.

## A fazer
- [ ] **[FEAT] Suporte Nativo a PDF (Zero-Extraction)**
  - Migrar para renderização sob demanda via buffer em memória no `PdfAdapter`.
- [ ] **[FEAT] Servidor de Mídia (LAN Sharing)**
  - Finalizar `MediaServer.ts`.
  - **SEGURANÇA:** Implementar Simple Token Auth para acesso via rede local.

## Débitos Técnicos & Bugs
- [ ] **[OPTIMIZE] Stream de Memória no MediaServer**
  - Substituir extração temporária do 7zip por leitura de buffer direto para CBZ/EPUB.

## Bloqueado
- [ ] **[FEAT] Sincronização Cloud (Google Drive/OneDrive)**

## Feito (esta sessão)
- [x] **[REFACT] StorageManager Robusto**
  - Implementada Fila Global de Escrita (Serialized Writes).
  - Implementado Cache Write-Through sincronizado.
  - Implementada Escrita Atômica com Temporary Swap (.tmp).
  - Padrão Singleton garantido em todo o projeto.
- [x] **[FEAT] Melhorias no Viewer**
  - Adicionado Modo Webtoon com Intersection Observer.
  - Adicionado Modo Double Page com pares fixos de páginas.
  - Implementadas Transições (Fade/Slide).
- [x] **[FEAT] Pós-processamento de Imagem (Sharp)**
  - Suporte a filtros (Brilho, Contraste, Nitidez, P&B) via query params no protocolo `lib-media://`.
- [x] **[ARCH] Base para Múltiplos Formatos**
  - Criada interface `MediaAdapter` e `MediaFactory`.
  - Implementados `PdfAdapter`, `ArchiveAdapter` e o esqueleto do `EpubAdapter`.
  - `MediaServer` agora suporta host `archive` para arquivos internos.
- [x] **[REFACT] Viewer Menu**
  - Organizado em abas, integrado com Settings Store e lógica movida para hooks.
- [x] **[STYLING] Padronização de Status e Formatos via Enums.**

## Contexto da próxima sessão
Base de dados e arquitetura de mídia estabilizadas. O backend agora consegue entregar conteúdos de diversos formatos via protocolo virtual. Próximo grande passo: Implementação da interface do E-Reader para livros.
