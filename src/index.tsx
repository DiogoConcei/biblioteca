import { createRoot } from "react-dom/client";

import App from "./app";

// Polyfill para URL.parse (ES2024), necessário para algumas versões do Electron/Chromium
// e bibliotecas como pdfjs-dist v5+.
if (typeof URL.parse !== 'function') {
  (URL as unknown as { parse: (url: string, base?: string) => URL | null }).parse = (url: string, base?: string) => {
    try {
      return new URL(url, base);
    } catch {
      return null;
    }
  };
}

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  console.error("Elemento com id 'root' não encontrado.");
}
