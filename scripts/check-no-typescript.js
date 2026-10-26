#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const excludedDirectories = new Set(['.git', '.vercel', 'coverage', 'dist', 'node_modules'])
const forbiddenExtensions = new Set(['.ts', '.tsx', '.mts', '.cts'])
const violations = []

function scanDirectory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) {
        scanDirectory(path.join(directory, entry.name))
      }
      continue
    }

    if (entry.isFile() && forbiddenExtensions.has(path.extname(entry.name))) {
      violations.push(path.relative(rootDir, path.join(directory, entry.name)))
    }
  }
}

scanDirectory(rootDir)

if (violations.length > 0) {
  console.error('TypeScript files are not allowed in this project:')
  for (const file of violations) console.error(`- ${file}`)
  process.exitCode = 1
} else {
  console.info('No TypeScript source files found.')
}
