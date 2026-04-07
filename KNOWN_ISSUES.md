# KNOWN_ISSUES.md

## 🚀 Performance e Otimização

### 1. Latência no Protocolo 'archive' (7-Zip CLI)
**Problema:** Atualmente, o host `archive` do `MediaServer` utiliza o executável do 7-Zip para extrair arquivos individuais (HTML, imagens) para uma pasta de cache no disco antes de servi-los ao visualizador. Isso causa latência perceptível em arquivos grandes e gera I/O desnecessário.
**Status:** Melhorado com cache por hash de arquivo. EPUBs agora são lidos via `ArrayBuffer` no cliente e não sofrem desse gargalo de extração por capítulo.
**Ação Futura:** Migrar para leitura direta via buffer em memória (stream) para arquivos ZIP/CBZ para eliminar totalmente a dependência do executável externo e I/O de disco temporário.

### 2. Memória em PDFs Extensos (PDF.js)
**Problema:** A renderização vetorial de PDFs grandes diretamente no frontend pode consumir quantidades significativas de RAM em capítulos com muitas páginas complexas caso não haja virtualização.
**Status:** Monitorando. Estabilizações recentes resolveram deadlocks de renderização, mas a virtualização de páginas (descarregar do DOM páginas distantes do scroll) permanece como uma melhoria planejada.

---

## 🐛 Bugs e Instabilidades

### 1. Imagens não carregam no LAN Sharing (Mobile)
**Status:** **Resolvido**. Corrigido via `encodeURIComponent` no frontend mobile e transformação de URLs `lib-media://` em rotas HTTP no servidor LAN.

### 2. MediaServer LAN com Auth Básica
**Status:** **Resolvido e Validado**. O sistema de Token via Query String e Headers está funcional e integrado ao sistema de auto-conexão via QR Code.

### 3. Sincronização de Progresso (CFI)
**Problema:** O progresso de leitura em EPUBs era baseado no índice do arquivo HTML. Se o usuário estivesse no meio de um capítulo longo, retornaria para o topo dele ao reiniciar.
**Status:** **Resolvido** para EPUB com suporte total a CFI (Canonical Fragment Identifier). Mantido no registro para garantir paridade em futuros formatos de texto fluido.

### 4. Customização de Texto (EPUB)
**Problema:** O `BookViewer` inicialmente utilizava injeção de CSS estático, impedindo a troca de fontes, cores de fundo ou espaçamento em tempo real.
**Status:** **Resolvido** na Fase 2 do E-Reader com a implementação de menus de configurações de tipografia e temas.

### 5. Renderização de PDF no Mobile (LAN)
**Problema:** PDFs exibem ícones de imagem quebrada no mobile, indicando falha na rota de renderização servida pelo servidor LAN.
**Status:** **Em investigação**. Provável erro de contexto ou falta de dependências de Canvas no processo Main ao rodar fora do Electron puro.

### 6. Visualização de EPUB no Mobile (LAN)
**Problema:** EPUBs apresentam bugs visuais ou de carregamento no iframe mobile.
**Status:** **Em investigação**. Necessário validar links relativos dentro do iframe quando servidos via LAN Server.

### 7. Download sob Demanda falhando no Mobile
**Problema:** Clicar em capítulos não baixados no mobile resulta em erro silencioso ou travamento, mesmo com a implementação de download On-the-Fly.
**Status:** **Em investigação**. Suspeita de timeout na requisição HTTP ou erro de permissão de escrita ao acionar managers do Main.
