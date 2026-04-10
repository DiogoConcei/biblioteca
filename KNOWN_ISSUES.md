# KNOWN_ISSUES.md

## 🚀 Performance e Otimização

### 1. Latência no Protocolo 'archive' (7-Zip CLI)
**Problema:** Atualmente, o host `archive` do `MediaServer` utiliza o executável do 7-zip para extrair arquivos individuais (HTML, imagens) para uma pasta de cache no disco antes de servi-los ao visualizador. Isso causa latência perceptível em arquivos grandes e gera I/O desnecessário.
**Status:** Melhorado com cache por hash de arquivo. EPUBs agora são lidos via `ArrayBuffer` no cliente e não sofrem desse gargalo de extração por capítulo.
**Ação Futura:** Migrar para leitura direta via buffer em memória (stream) para arquivos ZIP/CBZ para eliminar totalmente a dependência do executável externo e I/O de disco temporário.

### 2. Memória em PDFs Extensos (PDF.js)
**Problema:** A renderização vetorial de PDFs grandes diretamente no frontend pode consumir quantidades significativas de RAM em capítulos com muitas páginas complexas caso não haja virtualização.
**Status:** Monitorando. Estabilizações recentes resolveram deadlocks de renderização, mas a virtualização de páginas (descarregar do DOM páginas distantes do scroll) permanece como uma melhoria planejada.

---

## 🐛 Bugs e Instabilidades

### 1. Erro Input file is missing no Sharp (Windows MAX_PATH)
**Problema:** O Windows possui um limite de 260 caracteres para caminhos de arquivo (`MAX_PATH`). Quando o caminho de uma capa extraída ou pasta de capítulo excedia esse limite, a biblioteca `sharp` (via `libvips`) falhava ao ler o arquivo, mesmo que ele existisse fisicamente.
**Status:** **Resolvido**. Implementada a **Virtualização de Caminhos** no `FileManager.ts`, utilizando prefixos curtos (8 caracteres) e hashes (6 caracteres) para nomes físicos de pastas e imagens. Isso garante que os caminhos permaneçam bem abaixo do limite do sistema operacional.

### 2. Erro No Section Found no EpubViewer
**Problema:** Tentativa de carregar uma localização (CFI) inválida ou corrompida causava o crash do leitor de EPUB.
**Status:** **Resolvido**. Implementada validação de CFI e fallback automático para o início do livro em caso de erro, garantindo que o livro abra sempre.

### 3. Imagens não carregam no LAN Sharing (Mobile)
**Status:** **Resolvido**. Corrigido via `encodeURIComponent` no frontend mobile e transformação de URLs `lib-media://` em rotas HTTP no servidor LAN.

### 4. Sincronização de Progresso (CFI)
**Problema:** O progresso de leitura em EPUBs era baseado no índice do arquivo HTML. Se o usuário estivesse no meio de um capítulo longo, retornaria para o topo dele ao reiniciar.
**Status:** **Resolvido** para EPUB com suporte total a CFI (Canonical Fragment Identifier). Mantido no registro para garantir paridade em futuros formatos de texto fluido.

### 5. Download sob Demanda falhando no Mobile
**Problema:** Clicar em capítulos não baixados no mobile resulta em erro silencioso ou travamento, mesmo com a implementação de download On-the-Fly.
**Status:** **Resolvido**. 
- Corrigido o `ReferenceError: mangaManager is not defined` via uso de `this.`.
- Corrigido o `TypeError: this.bookManager.createChapterById is not a function` ao refatorar o `BookManager` para estender `GraphSerie`, garantindo uma interface de download consistente para todos os managers.
