# KNOWN_ISSUES.md

## 🚀 Performance e Otimização

### 1. Latência no Protocolo 'archive' (7-Zip CLI)
**Problema:** Atualmente, o host `archive` do `MediaServer` utiliza o executável do 7-Zip para extrair arquivos.
**Status:** Melhorado com cache por hash de arquivo, mas extração inicial de grandes arquivos CBR/CBZ ou PDF via archive ainda pode causar delay. (Nota: EPUBS agora são lidos via `ArrayBuffer` no cliente e não sofrem desse gargalo de extração por capítulo).

## 🐛 Bugs e Instabilidades

### 1. MediaServer LAN sem Auth
**Problema:** Endpoints de rede local estão abertos.
**Status:** Necessário implementar Simple Token Auth.
