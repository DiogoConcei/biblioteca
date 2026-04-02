# KNOWN_ISSUES.md

## 🚀 Performance e Otimização

### 1. Latência no Protocolo 'archive' (7-Zip CLI)
**Problema:** Atualmente, o host `archive` do `MediaServer` utiliza o executável do 7-Zip para extrair arquivos individuais (HTML, imagens) para uma pasta de cache no disco antes de servi-los ao visualizador. Isso causa latência perceptível em arquivos grandes e gera I/O desnecessário.
**Ação Necessária:** Implementar leitura direta via buffer em memória (stream) para arquivos ZIP/EPUB/CBZ, eliminando a dependência do executável externo para leitura de arquivos pequenos.

### 2. Memória do E-Reader (PDF.js)
**Problema:** A renderização vetorial de PDFs grandes diretamente no frontend pode consumir quantidades significativas de RAM em capítulos com muitas páginas complexas.
**Status:** Monitorando. Caso necessário, implementaremos um sistema de "virtualização de páginas" que descarrega do DOM as páginas que estão longe do scroll do usuário.

---

## 📖 Experiência de Leitura (E-Reader)

### 3. Customização de EPUB
**Problema:** O `BookViewer` atual utiliza injeção de CSS estático para livros. O usuário ainda não consegue alterar o tamanho da fonte, o espaçamento entre linhas ou alternar entre temas (Ex: Modo Noite, Sépia, Alto Contraste) em tempo real.
**Ação Necessária:** Criar um menu de configurações de tipografia específico para o `BookViewer`.

### 4. Navegação por CFI (EPUB)
**Problema:** O progresso de leitura em EPUBs é baseado no índice do arquivo HTML. Se o usuário estiver no meio de um capítulo longo e fechar o app, ele retornará para o início do capítulo, não para a frase exata onde parou.
**Ação Necessária:** Implementar suporte a **CFI (Canonical Fragment Identifier)** para salvar a posição exata de leitura dentro do HTML.

---

## 🌐 Conectividade e Segurança

### 5. Segurança do MediaServer (LAN)
**Problema:** O servidor de mídia para compartilhamento em rede local não possui autenticação ou token de sessão.
**Ação Necessária:** Implementar um Handshake inicial com Token efêmero para garantir que apenas dispositivos autorizados acessem os arquivos da biblioteca.
