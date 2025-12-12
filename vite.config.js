import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// Custom plugin to stub out Solana dependencies we don't use
const stubSolanaPlugin = () => {
  const stubCode = `
    export default {};
    export const getTransferSolInstruction = () => {};
    export const getAssociatedTokenAddressSync = () => {};
    export const createTransferInstruction = () => {};
    export const Connection = class {};
    export const PublicKey = class {};
    export const Transaction = class {};
    export const SystemProgram = {};
    export const LAMPORTS_PER_SOL = 1000000000;
  `
  
  return {
    name: 'stub-solana',
    resolveId(id) {
      // Intercept any @solana imports and mark them for stubbing
      if (id.includes('@solana') || id.includes('solana-program')) {
        return '\0' + id // Virtual module prefix
      }
    },
    load(id) {
      // Provide empty stub for virtual Solana modules
      if (id.startsWith('\0') && (id.includes('@solana') || id.includes('solana-program'))) {
        return stubCode
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    stubSolanaPlugin(), // Add our custom plugin
    nodePolyfills({
      // Enable polyfills for specific Node.js globals and modules
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Polyfills for Node.js built-in modules
      protocolImports: true,
    }),
  ],
  server: {
    proxy: {
      // Proxy API requests to development API server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        // Manual chunks to isolate Solana code from Privy that we don't use
        manualChunks(id) {
          // Isolate Privy's Solana-related code into separate chunk
          if (id.includes('FundSolWallet') || id.includes('Solana')) {
            return 'solana-unused'
          }
        }
      },
      onwarn(warning, warn) {
        // Suppress warnings about PURE annotations and Solana modules
        if (warning.code === 'PLUGIN_WARNING' && warning.message.includes('/*#__PURE__*/')) {
          return
        }
        // Suppress module resolution warnings for optional Solana deps
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.message.includes('@solana')) {
          return  
        }
        warn(warning)
      }
    }
  },
  optimizeDeps: {
    exclude: [
      '@solana/web3.js',
      '@solana/kit',
      '@solana-program/system',
      '@solana-program/token',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
})

