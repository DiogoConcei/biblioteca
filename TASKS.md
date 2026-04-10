# TASKS.md

## Em progresso
- [ ] **[FEAT] Scrapers de Capítulos**
  - Implementar busca automática de novos capítulos para séries existentes.
  - Integração com provedores externos para notificações de atualização.
- [ ] **[FEAT] Upload: Finalização QR Code**
  - Concluir fluxo de pareamento via QR Code.
  - Implementar recebimento de arquivos via WebSocket/HTTP.

## Concluído recentemente
- [x] **[FEAT] LAN Sharing: Persistência e UX Premium**
  - Implementado `localStorage` no mobile para persistência de sessão (não precisa logar ao atualizar).
  - Adicionada limpeza automática de parâmetros sensíveis da URL (`token`, `host`) após conexão.
  - Implementado **Sincronização Bidirecional de Progresso**: marcar como lido no celular atualiza o PC em tempo real.
  - Adicionado **Overlay de Status de Download** no mobile: polling de progresso no servidor com mensagens dinâmicas ("Processando no Servidor...", "Baixando do Remoto...").
  - Adicionada funcionalidade de **Exclusão Remota de Downloads**: botão de lixeira permite deletar arquivos do PC host via celular.
- [x] **[FIX] LAN Sharing: Nitidez Máxima em PDF**
  - Renderização de PDF no servidor atualizada para **Escala 3.0** e **Qualidade 90%** (resolvido pixelamento em telas Retina/OLED).
  - Implementado **Cache Imutável Agressivo** (`max-age=31536000, immutable`) para páginas de PDF, garantindo abertura instantânea após o primeiro carregamento.
- [x] **[FIX] LAN Sharing: Estabilidade e Compatibilidade Total**
  - Implementado renderizador de PDF no servidor (`/api/media/pdf/page`) para visualização nativa no mobile.
  - Ajustado sandbox do visualizador de EPUB para permitir carregamento de recursos internos (CSS/Imagens).
  - Implementado sistema de **Download On-Demand** no servidor LAN, permitindo baixar capítulos remotamente.
  - Corrigido problema de variável indefinida (`content`) na transformação de recursos complexos.
  - Adicionado suporte a Hostname Real (`meu-pc.local`) para descoberta via rede.

## Contexto da próxima sessão
O sistema de **LAN Sharing** atingiu maturidade elevada com persistência de sessão, sincronização de progresso, exclusão remota e renderização de PDF em alta qualidade. Resta apenas corrigir o método de download no `BookManager` para permitir downloads sob demanda de livros pelo celular (atualmente gera erro de `TypeError`). O foco principal passará a ser o desenvolvimento dos **Scrapers de Capítulos**.
