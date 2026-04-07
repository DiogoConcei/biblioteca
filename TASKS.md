# TASKS.md

## Em progresso
- [ ] **[FEAT] LAN Sharing: Leitura via Rede**
  - [x] Implementar Servidor HTTP paralelo (Express) para dispositivos móveis.
  - [x] Criar sistema de Auth via Simple Token.
  - [ ] Resolver falha na exibição de imagens (capas/páginas) na versão mobile.
  - [ ] Desenvolver visualizador de capítulos web para mobile.
- [ ] **[FEAT] Scrapers de Capítulos**
  - Implementar busca automática de novos capítulos para séries existentes.
  - Integração com provedores externos para notificações de atualização.
- [ ] **[FEAT] Upload: Finalização QR Code**
  - Concluir fluxo de pareamento via QR Code.
  - Implementar recebimento de arquivos via WebSocket/HTTP.

## Concluído recentemente
- [x] **[FEAT] Nova Arquitetura do Leitor EPUB (`react-reader` & `epub.js`)**
  - Implementado motor de renderização `epub.js` para paginação nativa e perfeita.
  - Carregamento de EPUB alterado para `ArrayBuffer` em memória, eliminando a necessidade de extração por capítulo e requisições fantasmas (`403 Forbidden`).
  - Suporte total a CFI para preservação da posição exata e **Contador de Páginas Referencial** (Página X de Y).
  - Implementado percentual de leitura e título dinâmico do capítulo no PageControl.
  - Design Premium: Visual de "Página de Livro" com sombras em camadas, centralização e diagramação elegante.
- [x] **[CORE] Desacoplamento do MediaServer**
  - Refatoração do monolítico `MediaServer.ts` em handlers de protocolo (`LocalMediaHandler`, `ArchiveMediaHandler`, `StorageMediaHandler`) usando padrão Strategy.
  - Segurança reforçada: CSP atualizado e remoção do privilégio `allow-same-origin` (Prevenção de Iframe Escape).
- [x] **[CORE] Tipagem Estrita (Zero Any)**
  - Remoção completa de tipos `any` nos visualizadores e hooks.
  - Definição de interfaces robustas para motores externos (`EpubRendition`, `EpubLocation`).
- [x] **[FEAT] Índice & Sumário Unificado**
  - Adicionado painel lateral com Sumário lógico (EPUB/PDF) e Salto por Páginas (grade numérica).
- [x] **[FIX] Estabilização Crítica de PDF**
  - Resolvido deadlock de renderização e loop de dependência no useEffect.
  - Corrigido problema de "página única" (total de páginas agora lido do pdfDocument).
  - Removidos indicadores visuais obstrutivos ("Carregando...") durante a troca de páginas.
- [x] **[CORE] Padronização & Design**
  - Definido Modo Escuro (Dark) como padrão global do sistema e do leitor.
  - Limpeza total de tipagem (100% conformidade com lint e build).

## Contexto da próxima sessão
A base do **LAN Sharing** foi implementada, incluindo o servidor Express e a SPA mobile básica. No entanto, as imagens (capas e páginas) não estão sendo exibidas no dispositivo móvel, mesmo após ajustes na codificação de caminhos. O próximo passo deve focar na investigação da entrega desses ativos via HTTP e, em seguida, prosseguir para os **Scrapers de Capítulos**.
