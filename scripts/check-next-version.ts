import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const MIN_MAJOR = 16

try {
  const pkgPath = resolve('apps/web/node_modules/next/package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  const version = pkg.version as string
  const major = parseInt(version.split('.')[0], 10)

  if (major < MIN_MAJOR) {
    console.error(
      `\n❌ Next.js ${version} detected — this project requires Next.js ${MIN_MAJOR}+.\n` +
        `   Run: pnpm --filter @repo/web add next@canary\n`,
    )
    process.exit(1)
  }

  console.log(`✓ Next.js ${version} — OK`)
} catch {
  // apps/web might not be installed yet — skip check
  console.log('⏭ Next.js version check skipped (not installed yet)')
}
