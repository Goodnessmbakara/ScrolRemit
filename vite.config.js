import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      // Externalize Solana dependencies during build
      external: (id) => {
        return id.includes('@solana') || id.includes('solana-program')
      },
      output: {
        // Provide globals for externalized modules
        globals: {
          '@solana-program/system': 'SolanaSystem',
          '@solana/web3.js': 'SolanaWeb3',
        },
        // Manual chunks to isolate problematic code
        manualChunks(id) {
          // Isolate Privy's Solana-related code into separate chunk that won't be loaded
          if (id.includes('FundSolWallet') || id.includes('Solana')) {
            return 'solana-unused'
          }
        }
      },
      onwarn(warning, warn) {
        // Suppress warnings about externalized modules and PURE annotations
        if (warning.code === 'UNRESOLVED_IMPORT' && 
            (warning.message.includes('@solana') || warning.message.includes('solana-program'))) {
          return
        }
        if (warning.code === 'PLUGIN_WARNING' && warning.message.includes('/*#__PURE__*/')) {
          return
        }
        warn(warning)
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
})
