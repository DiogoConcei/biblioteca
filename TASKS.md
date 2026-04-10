# TASKS.md

## Em progresso
- [ ] **[FEAT] Busca Automática de Metadados (Sinopse/Capa)**
  - Integrar o `MetadataManager` ao processo de Upload para preenchimento automático das séries.
  - Criar interface/botão no front-end para acionar a busca manual via IPC.
- [ ] **[FEAT] Scrapers de Capítulos**
  - Implementar busca automática de novos capítulos para séries existentes.
  - Integração com provedores externos para notificações de atualização.
- [ ] **[FEAT] Upload: Finalização QR Code**
  - Concluir fluxo de pareamento via QR Code.
  - Implementar recebimento de arquivos via WebSocket/HTTP.

## Concluído recentemente
- [x] **[FIX] E-Reader: Estabilização e Performance**
  - Resolvido crash `No Section Found` no `epub.js` via restauração segura de CFI e fallback para o início do livro.
  - Implementada navegação funcional via Sumário (TOC) no visualizador de EPUB.
  - Corrigido MIME Type (`application/epub+zip`) no protocolo `lib-media://` para compatibilidade total com o motor de leitura.
  - Adicionado componente de `Loading` integrado para EPUB e PDF com estilização via SCSS Modules.
- [x] **[FIX] Sistema de Arquivos: Virtualização de Caminhos (MAX_PATH)**
  - Implementada virtualização agressiva de caminhos no `FileManager.ts` (`buildChapterPath` e `buildImagePath`).
  - Nomes físicos de pastas e imagens agora usam prefixos curtos + hashes (ex: `spider-m_-a1b2c3`), resolvendo erros de `Input file is missing` no `sharp` causados pelo limite de 260 caracteres do Windows.
- [x] **[FIX] ComicManager: Automação de Capas**
  - Corrigida a lógica de criação de séries para extrair capas de edições (capítulos) e child series (Tie-ins) automaticamente durante o processamento inicial.
- [x] **[FIX] Qualidade de Código e Tipagem**
  - Removidos todos os usos de `any` no `StorageManager.ts` em conformidade com o mandato global, utilizando `Record<string, unknown>`.
- [x] **[FEAT] Configurações: Reset de Sistema**
  - Implementada funcionalidade de Reset de Configurações com UI dedicada em SCSS Modules.

## Contexto da próxima sessão
O sistema de leitura de livros e quadrinhos foi estabilizado com a resolução dos erros de path longo e falhas de carregamento de seção no EPUB. A extração de capas agora é automatizada e robusta. O foco principal volta para o desenvolvimento dos **Scrapers de Capítulos** e a finalização do pareamento via **QR Code** no Upload.
