import { defineConfig } from '@neon/config/v1'

export default defineConfig({
  auth: true,
  aiGateway: true,
  functions: {
    hello: { name: 'Hello World', source: './hello.js' },
  },
  branch: (branch) => {
    if (branch.isDefault) return {}
    if (!branch.exists) return { ttl: '7d' }
    return {}
  },
})