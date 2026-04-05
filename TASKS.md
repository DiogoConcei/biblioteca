# TASKS.md

## Em progresso
- [ ] **[FEAT] EPUB: Sincronização de Progresso (CFI)**
  - Implementar salvamento de posição exata (CFI) para EPUB.
  - Sincronização de progresso entre capítulos.
- [ ] **[FEAT] Sincronização Cloud (Google Drive)**
  - Implementar upload de progresso de leitura.
  - Sincronização de configurações entre dispositivos.

## Concluído recentemente
- [x] **[FEAT] E-Reader Proprietário (Customização)**
  - Implementado menu de tipografia (Fonte, Tamanho, Espaçamento, Margens).
  - Implementado Temas dinâmicos (Noite, Sépia, Dia) via Injeção de CSS no Iframe.
  - Corrigido carregamento de EPUBs (resolvido erro 404 de index.html através do EpubAdapter).
- [x] **[FIX] Estabilização do BookViewer**
  - Resolvido deadlock de renderização (loading infinito) em PDFs.
  - Implementado Double Buffering no Canvas para eliminar flicker em trocas de página.
  - Adicionado logs detalhados de processamento no frontend.
- [x] **[PERF] Otimização de PDF**
  - Refatorado `PdfAdapter` para evitar extração desnecessária de páginas para JPEG.
  - Carregamento nativo do PDF original via URL `lib-media://`.
- [x] **[FIX] Resiliência do MediaServer**
  - Corrigido erro 403 Forbidden no host `archive` (resolução de caminhos aninhados).
  - Implementada codificação Base64 segura para UTF-8 no transporte de paths.
  - Adicionados identificadores únicos (hashes) para pastas de cache de extração.
- [x] **[CORE] Limpeza de Código e Tipagem**
  - Removido uso de `any` em todo o projeto, substituindo por `unknown` ou tipos específicos.
  - Corrigida herança de interfaces de domínio (`Book`, `Comic`, `Manga`) usando Enums.
  - Eliminados avisos de lint e erros de build pendentes.

## Contexto da próxima sessão
O visualizador de EPUB agora suporta customização completa de aparência (Temas e Tipografia) e carrega corretamente os capítulos mapeados pelo EpubAdapter. O erro 404 de index.html foi resolvido usando URLs de recursos reais. Próximo foco: Implementar salvamento de posição exata (CFI) para EPUB ou Sincronização Cloud.
