import { createRoot } from "react-dom/client";

import App from "./app";

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  console.error("Elemento com id 'root' não encontrado.");
}
