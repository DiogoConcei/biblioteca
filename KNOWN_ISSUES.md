# KNOWN_ISSUES.md

## 🚀 Performance e Otimização

### 1. Latência no Protocolo 'archive' (7-Zip CLI)
**Problema:** Atualmente, o host `archive` do `MediaServer` utiliza o executável do 7-Zip para extrair arquivos.
**Status:** Melhorado com cache por hash de arquivo, mas extração inicial de EPUBs grandes ainda causa delay.

## 🐛 Bugs e Instabilidades

### 1. MediaServer LAN sem Auth
**Problema:** Endpoints de rede local estão abertos.
**Status:** Necessário implementar Simple Token Auth.

### 2. Sincronização de Progresso (CFI)
**Problema:** EPUBs salvam apenas a página do iframe, não a posição exata no texto.
**Status:** Planejado para a Fase 3 do E-Reader.
