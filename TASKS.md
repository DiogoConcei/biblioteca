# TASKS.md

## Em progresso
- [ ] **[FEAT] Scrapers de Capítulos**
  - Implementar busca automática de novos capítulos para séries existentes.
  - Integração com provedores externos para notificações de atualização.
- [ ] **[FEAT] Upload: Finalização QR Code**
  - Concluir fluxo de pareamento via QR Code.
  - Implementar recebimento de arquivos via WebSocket/HTTP.

## Concluído recentemente
- [x] **[FEAT] LAN Sharing: Ecossistema de Leitura Web**
  - Implementado sistema de descoberta via mDNS (`biblioteca.local`).
  - Adicionado gerador de QR Code para conexão instantânea (URL + Token).
  - Desenvolvido Visualizador Web (SPA) com navegação de séries, capítulos e leitura vertical (Webtoon).
  - Corrigido processamento de imagens e codificação de caminhos (`encodeURIComponent`) para exibição mobile.
  - Adicionado tratamento robusto de erros (`ENOENT`) com mensagens claras no frontend mobile.
- [x] **[FIX] LAN Sharing: Exibição de Imagens Mobile**
  - Corrigido problema de codificação de caracteres especiais (`+`, `/`) na Query String das imagens via `encodeURIComponent`.
  - Adicionado logs detalhados de erro no `LanServer` para diagnóstico de falhas de I/O e permissão.
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
O sistema de **LAN Sharing** está totalmente funcional, com suporte a mDNS, QR Code de conexão automática e um visualizador de capítulos web para dispositivos móveis. A leitura de quadrinhos e mangás via rede foi estabilizada. O próximo passo é iniciar o desenvolvimento dos **Scrapers de Capítulos** para automação da biblioteca.
