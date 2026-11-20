/// <reference types="vite/client" />

// Tells TypeScript that CSS imports are valid (Vite handles them at build time).
declare module '*.css' {
  const content: string;
  export default content;
}
