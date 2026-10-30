#!/usr/bin/env node
// Adds the "Game facts" fields to Directus products, for the product page's Details panel.
//
// What it does (each step is skipped when already done, so it is safe to run again):
//   1. Backs up the products collection's fields and the public permissions to JSON first
//      (--backup-dir, default ./directus-backup-<time>).
//   2. Products get a "Game facts" heading and five optional fields: Publisher, Developer,
//      Release date, Languages (tags) and Age rating (PEGI 3 / 7 / 12 / 16 / 18).
//   3. Public read access for the new fields (the storefront reads them without signing in).
//
// Run (Node 18+), as a Directus admin, from any folder:
//   DIRECTUS_EMAIL=admin@... DIRECTUS_PASSWORD=... node scripts/directus/product-game-facts.mjs
// or with a static token: DIRECTUS_TOKEN=... node scripts/directus/product-game-facts.mjs
// Options: --dry-run (show the plan, change nothing), --yes (don't ask before applying),
//          --url https://cms.increddy.com, --backup-dir <folder>.

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import readline from 'node:readline/promises'

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const option = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const BASE = option('--url', process.env.DIRECTUS_URL || 'https://cms.increddy.com').replace(/\/+$/, '')
const DRY_RUN = flag('--dry-run')
const BACKUP_DIR = option('--backup-dir', `directus-backup-${new Date().toISOString().replace(/[:.]/g, '-')}`)
// Cloudflare in front of the CMS refuses requests without a browser-like user agent (error 1010).
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'

const COLLECTION = 'products'

const FIELDS = [
  {
    field: 'game_facts',
    type: 'alias',
    meta: {
      special: ['alias', 'no-data'],
      interface: 'presentation-divider',
      options: { title: 'Game facts', icon: 'info', inlineTitle: true },
      note: 'Shown in the Details panel on the product page. Leave a field empty to hide its row.',
    },
  },
  {
    field: 'publisher',
    type: 'string',
    schema: {},
    meta: { interface: 'input', width: 'half', options: { placeholder: 'CD Projekt RED', trim: true }, note: 'e.g. CD Projekt RED' },
  },
  {
    field: 'developer',
    type: 'string',
    schema: {},
    meta: { interface: 'input', width: 'half', options: { placeholder: 'CD Projekt RED', trim: true }, note: 'e.g. CD Projekt RED' },
  },
  {
    field: 'release_date',
    type: 'date',
    schema: {},
    meta: { interface: 'datetime', display: 'datetime', width: 'half', note: 'The game\'s release date, shown as "10 Dec 2020".' },
  },
  {
    field: 'age_rating',
    type: 'string',
    schema: {},
    meta: {
      interface: 'select-dropdown',
      width: 'half',
      options: {
        allowNone: true,
        choices: ['3', '7', '12', '16', '18'].map((value) => ({ text: `PEGI ${value}`, value })),
      },
      display: 'labels',
      note: 'Shown as the PEGI label (the coloured age icon).',
    },
  },
  {
    field: 'languages',
    type: 'json',
    schema: {},
    meta: {
      interface: 'tags',
      special: ['cast-json'],
      width: 'full',
      options: {
        placeholder: 'Type a language and press Enter',
        presets: ['English', 'French', 'German', 'Spanish', 'Italian', 'Portuguese', 'Russian', 'Polish', 'Japanese', 'Korean', 'Chinese (Simplified)', 'Arabic', 'Turkish'],
        alphabetize: false,
      },
      note: 'In the order to show them. The first four show on the page, the rest behind "+N".',
    },
  },
]

const READ_FIELDS = FIELDS.filter((f) => f.type !== 'alias').map((f) => f.field)

let token = process.env.DIRECTUS_TOKEN || ''

async function api(method, url, body) {
  const response = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  const json = text ? JSON.parse(text) : {}
  if (!response.ok) {
    const message = json?.errors?.map((e) => e.message).join('; ') || text.slice(0, 300)
    const error = new Error(`${method} ${url} -> ${response.status}: ${message}`)
    error.status = response.status
    throw error
  }
  return json.data
}

const get = (url) => api('GET', url)
const tryGet = (url) => get(url).catch((error) => (error.status === 403 || error.status === 404 ? null : Promise.reject(error)))

async function login() {
  if (token) return
  let email = process.env.DIRECTUS_EMAIL
  let password = process.env.DIRECTUS_PASSWORD
  if ((!email || !password) && process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    email ||= await rl.question('Directus admin email: ')
    password ||= await rl.question('Password (shown as you type): ')
    rl.close()
  }
  if (!email || !password) throw new Error('Set DIRECTUS_TOKEN, or DIRECTUS_EMAIL and DIRECTUS_PASSWORD.')
  const data = await api('POST', '/auth/login', { email, password })
  token = data.access_token
}

const plan = []
const step = (description, run) => plan.push({ description, run })

async function main() {
  await login()
  const me = await get('/users/me?fields=email,role.name')
  console.log(`Signed in to ${BASE} as ${me.email} (${me.role?.name ?? 'no role'})`)

  // Directus 11 keeps permissions on policies; 10 on roles. Find the public one either way.
  const policies = await tryGet('/policies?fields=id,name&limit=-1')
  let publicPolicy = null
  if (policies) {
    const access = await get('/access?filter[role][_null]=true&filter[user][_null]=true&fields=policy&limit=-1')
    publicPolicy = access?.[0]?.policy ?? null
    if (!publicPolicy) throw new Error('Could not find the public policy (Settings > Access Policies > Public).')
  }
  const publicFilter = policies ? `filter[policy][_eq]=${publicPolicy}` : 'filter[role][_null]=true'

  // 1. Backup.
  const backup = {
    'fields-products.json': await get(`/fields/${COLLECTION}`),
    'permissions-public.json': await get(`/permissions?${publicFilter}&limit=-1`),
  }
  const existing = new Set(backup['fields-products.json'].map((f) => f.field))

  // 2. Fields, in order after the existing ones.
  const lastSort = Math.max(0, ...backup['fields-products.json'].map((f) => f.meta?.sort ?? 0))
  FIELDS.forEach((f, i) => {
    if (existing.has(f.field)) return
    step(`Add products.${f.field}`, () =>
      api('POST', `/fields/${COLLECTION}`, { ...f, meta: { ...f.meta, sort: lastSort + i + 1 } }),
    )
  })

  // 3. Public read.
  const read = backup['permissions-public.json'].find((p) => p.collection === COLLECTION && p.action === 'read')
  if (!read) throw new Error('The public policy cannot read products at all; the storefront depends on it. Check by hand.')
  const fields = read.fields ?? []
  if (!fields.includes('*')) {
    const missing = READ_FIELDS.filter((f) => !fields.includes(f))
    if (missing.length) {
      step(`Public may read products.${missing.join(', ')}`, () =>
        api('PATCH', `/permissions/${read.id}`, { fields: [...fields, ...missing] }),
      )
    }
  }

  if (!plan.length) {
    console.log('Nothing to do: Directus is already set up.')
    return
  }
  console.log(`\nPlan (${plan.length} steps):`)
  plan.forEach((s, i) => console.log(`  ${i + 1}. ${s.description}`))
  if (DRY_RUN) {
    console.log('\n--dry-run: nothing changed, no backup written.')
    return
  }
  if (!flag('--yes')) {
    if (!process.stdin.isTTY) throw new Error('Add --yes to apply without a prompt.')
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const answer = await rl.question('\nApply these changes to the live Directus? (y/N) ')
    rl.close()
    if (answer.trim().toLowerCase() !== 'y') return console.log('Cancelled.')
  }

  await mkdir(BACKUP_DIR, { recursive: true })
  for (const [name, data] of Object.entries(backup)) {
    await writeFile(path.join(BACKUP_DIR, name), JSON.stringify(data, null, 2))
  }
  console.log(`Backup written to ${path.resolve(BACKUP_DIR)}`)

  for (const [i, s] of plan.entries()) {
    process.stdout.write(`  ${i + 1}/${plan.length} ${s.description} ... `)
    await s.run()
    console.log('done')
  }
  console.log('\nAll set. Fill the Game facts on a product in Directus; the product page shows them within a minute.')
}

main().catch((error) => {
  console.error(`\nStopped: ${error.message}`)
  process.exit(1)
})
