import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const VALID_ENVIRONMENTS = new Set(['preview', 'production'])

function parseArgs(argv) {
  const parsed = {
    environment: undefined,
    envOnly: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--environment') {
      parsed.environment = argv[index + 1]
      index += 1
      continue
    }

    if (arg.startsWith('--environment=')) {
      parsed.environment = arg.slice('--environment='.length)
      continue
    }

    if (arg === '--env-only') {
      parsed.envOnly = true
    }
  }

  return parsed
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}

  const env = {}
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) continue

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    env[key] = value
  }

  return env
}

function loadFileEnv(cwd) {
  return {
    ...parseEnvFile(path.join(cwd, '.env')),
    ...parseEnvFile(path.join(cwd, '.env.local')),
  }
}

function getRequiredEnv(environment, deployTarget, convexHosting) {
  const required = ['VITE_CONVEX_URL', 'VITE_CONVEX_SITE_URL']

  if (deployTarget === 'cloudflare') {
    required.push('CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID')
  }

  if (deployTarget === 'vercel') {
    required.push('VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID')
  }

  if (deployTarget === 'netlify') {
    required.push('NETLIFY_AUTH_TOKEN', 'NETLIFY_SITE_ID')
  }

  if (convexHosting === 'cloud') {
    required.push('CONVEX_DEPLOY_KEY')
  }

  if (convexHosting === 'self-hosted' && environment === 'preview') {
    required.push('CONVEX_URL', 'CONVEX_ADMIN_KEY')
  }

  if (convexHosting === 'self-hosted' && environment === 'production') {
    required.push('CONVEX_URL_PROD', 'CONVEX_ADMIN_KEY_PROD')
  }

  return required
}

function runCommand(command, env) {
  console.log(`\n> ${command}`)
  execSync(command, {
    stdio: 'inherit',
    env,
  })
}

const cwd = process.cwd()
const args = parseArgs(process.argv.slice(2))
const fileEnv = loadFileEnv(cwd)
const mergedEnv = { ...fileEnv, ...process.env }
const environment = args.environment || mergedEnv.VITE_APP_ENV || 'preview'

if (!VALID_ENVIRONMENTS.has(environment)) {
  console.error(`Unsupported environment: ${environment}`)
  process.exit(1)
}

const deployTarget = mergedEnv.DEPLOY_TARGET || 'cloudflare'
const convexHosting = mergedEnv.CONVEX_HOSTING || 'cloud'
const requiredEnv = getRequiredEnv(environment, deployTarget, convexHosting)
const missingEnv = requiredEnv.filter((name) => !mergedEnv[name])

if (missingEnv.length > 0) {
  console.error(`Release preflight failed for ${environment}. Missing environment variables:`)
  for (const name of missingEnv) {
    console.error(`- ${name}`)
  }
  process.exit(1)
}

if (environment === 'production' && !mergedEnv.VITE_SENTRY_DSN) {
  console.warn('Warning: VITE_SENTRY_DSN is not set. Production errors will not be reported to Sentry.')
}

console.log(`Release preflight env check passed for ${environment}.`)

if (args.envOnly) {
  process.exit(0)
}

const commandEnv = {
  ...process.env,
  ...fileEnv,
  ...mergedEnv,
  VITE_APP_ENV: environment,
  DEPLOY_TARGET: deployTarget,
  CONVEX_HOSTING: convexHosting,
}

runCommand('npm run lint', commandEnv)
runCommand('npm run typecheck', commandEnv)
runCommand('npm run test', commandEnv)
runCommand(environment === 'production' ? 'npm run build:prod' : 'npm run build:preview', commandEnv)

console.log(`\nRelease preflight passed for ${environment}.`)