# KNOWN_ISSUES.md

## 🚀 Performance e Otimização

### 1. Latência no Protocolo 'archive' (7-Zip CLI)
**Problema:** Atualmente, o host `archive` do `MediaServer` utiliza o executável do 7-Zip para extrair arquivos para uma pasta de cache. Embora funcione com links relativos agora, gera I/O no disco.
**Ação Necessária:** Migrar para leitura via buffer em memória (stream) para eliminar arquivos temporários.

### 2. Memória em PDFs Extensos
**Problema:** A renderização vetorial pode pesar em arquivos com centenas de páginas caso não haja virtualização.
**Status:** Monitorando.

---

## 📖 E-Reader (Livros)

### 3. Falta de Customização de Texto (EPUB)
**Problema:** O `BookViewer` ainda não permite trocar fontes ou cores de fundo dinamicamente.
**Status:** Planejado para a próxima fase.

### 4. Navegação por Ancoragem (EPUB)
**Problema:** O progresso é salvo por arquivo de capítulo. Se o capítulo for muito longo, o usuário volta para o topo dele ao reiniciar.
**Ação Necessária:** Implementar salvamento via CFI (Canonical Fragment Identifier).

---

## 🌐 Segurança

### 5. MediaServer LAN sem Auth
**Problema:** Endpoints de rede local estão abertos.
**Status:** Necessário implementar Simple Token Auth.
