// types/global.d.ts

// 1) Diga ao TS que este arquivo declara módulos do Node
declare namespace NodeJS {
  // 2) Estenda a interface Global
  interface Global {
    storageFolder: string;
  }
}

// (Opcional) Se você quiser também expor como uma variável global normal:
declare var global: NodeJS.Global;
