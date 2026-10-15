#!/usr/bin/env node
/**
 * check_bundle_size.js — Valida tamanho do build antes de publicar na CrazyGames
 * Aviso se > 20MB (mobile homepage threshold)
 * Erro se > 50MB (limite absoluto CrazyGames)
 */
import { readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const WARN_LIMIT_MB = 20
const ERROR_LIMIT_MB = 50
const DIST_DIR = new URL('../dist', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')

function getAllFiles(dir, files = []) {
  try {
    for (const f of readdirSync(dir)) {
      const full = join(dir, f)
      if (statSync(full).isDirectory()) {
        getAllFiles(full, files)
      } else {
        files.push(full)
      }
    }
  } catch (_) {}
  return files
}

const files = getAllFiles(DIST_DIR)
let totalBytes = 0

console.log('\n📦 ShiftCore3D — Bundle Size Check\n')

for (const f of files) {
  const size = statSync(f).size
  totalBytes += size
  const rel = relative(DIST_DIR, f)
  const sizeMB = (size / 1024 / 1024).toFixed(2)
  const flag = size > 5 * 1024 * 1024 ? ' ⚠️' : ''
  console.log(`  ${rel.padEnd(50)} ${sizeMB} MB${flag}`)
}

const totalMB = totalBytes / 1024 / 1024
console.log(`\n  ${'TOTAL'.padEnd(50)} ${totalMB.toFixed(2)} MB`)

if (totalMB > ERROR_LIMIT_MB) {
  console.error(`\n❌ ERRO: Bundle (${totalMB.toFixed(1)}MB) excede o limite de ${ERROR_LIMIT_MB}MB da CrazyGames!`)
  process.exit(1)
} else if (totalMB > WARN_LIMIT_MB) {
  console.warn(`\n⚠️  AVISO: Bundle (${totalMB.toFixed(1)}MB) excede ${WARN_LIMIT_MB}MB — inelegível para mobile homepage.`)
} else {
  console.log(`\n✅ Bundle OK (${totalMB.toFixed(1)}MB) — dentro dos limites CrazyGames.`)
}
