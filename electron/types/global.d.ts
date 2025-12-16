// types/global.d.ts

export {}; // garante que este arquivo seja tratado como módulo

declare global {
  var storageFolder: string;
}

// src/types/pdfjs-dist.d.ts
declare module 'pdfjs-dist/legacy/build/pdf' {
  import * as pdfjs from 'pdfjs-dist';
  export = pdfjs;
}
