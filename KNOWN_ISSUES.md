# KNOWN_ISSUES.md

## 🚀 Performance e Otimização

### 1. Latência no Protocolo 'archive' (7-Zip CLI)
**Problema:** Atualmente, o host `archive` do `MediaServer` utiliza o executável do 7-Zip para extrair arquivos.
**Status:** Melhorado com cache por hash de arquivo, mas extração inicial de grandes arquivos CBR/CBZ ou PDF via archive ainda pode causar delay. (Nota: EPUBS agora são lidos via `ArrayBuffer` no cliente e não sofrem desse gargalo de extração por capítulo).

## 🐛 Bugs e Instabilidades

### 1. Imagens não carregam no LAN Sharing (Mobile)
**Problema:** A versão mobile do LAN Sharing consegue listar a biblioteca, mas as imagens das capas não são renderizadas (permanecem em branco ou erro de carregamento).
**Status:** Em investigação. Tentativas de correção via codificação Unicode e alteração de rotas para Query String foram realizadas, mas o problema persiste.

### 2. MediaServer LAN com Auth Básica
**Problema:** Implementado sistema de Simple Token Auth, mas ainda requer validação de robustez em diferentes navegadores mobile.
**Status:** Funcional, mas em fase de testes.
