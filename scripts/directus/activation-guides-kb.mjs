#!/usr/bin/env node
// Sets up Directus for the activation guides knowledge base (/activation-guides), once.
//
// What it does (each step is skipped when already done, so it is safe to run again):
//   1. Backs up everything it touches to JSON files first (--backup-dir, default ./directus-backup-<time>).
//   2. New collection "Guide categories" (name, URL slug, status, drag-and-drop order), with
//      Steam, Xbox, PlayStation, Nintendo, PC launchers, Gift cards.
//   3. Guides get a "Category" dropdown; the image becomes optional; guides can be dragged into order.
//   4. The Activation guides page (singleton) gets optional Subtitle and help box texts; its old
//      manual "Guides" list is hidden (every published guide is listed now).
//   5. Public read access for the new fields and categories (published only).
//   6. Puts the three existing guides in a category (only when they have none).
//   7. Help Centre article "Have you checked your Driffle game" -> "Have you checked My Library?".
//
// Run (Node 18+), as a Directus admin, from any folder:
//   DIRECTUS_EMAIL=admin@... DIRECTUS_PASSWORD=... node scripts/directus/activation-guides-kb.mjs
// or with a static token: DIRECTUS_TOKEN=... node scripts/directus/activation-guides-kb.mjs
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

const CATEGORIES = [
  { name: 'Steam', slug: 'steam' },
  { name: 'Xbox', slug: 'xbox' },
  { name: 'PlayStation', slug: 'playstation' },
  { name: 'Nintendo', slug: 'nintendo' },
  { name: 'PC launchers', slug: 'pc-launchers' },
  { name: 'Gift cards', slug: 'gift-cards' },
]

// Categories for the guides that exist today (by slug).
const GUIDE_CATEGORIES = {
  'how-to-activate-steam-keys': 'steam',
  'how-to-activate-rockstar-social-club-key': 'pc-launchers',
  'how-to-redeem-a-roblox-gift-card': 'gift-cards',
}

const DRIFFLE_ARTICLE_TITLE = 'Have you checked your Driffle game'
const DRIFFLE_ARTICLE_NEW_TITLE = 'Have you checked My Library?'

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

const STATUS_CHOICES = [
  { text: 'Published', value: 'published', foreground: '#FFFFFF', background: 'var(--theme--primary)' },
  { text: 'Draft', value: 'draft', foreground: '#18222F', background: '#D3DAE4' },
  { text: 'Archived', value: 'archived', foreground: '#FFFFFF', background: 'var(--theme--warning)' },
]

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
  const publicOwner = policies ? { policy: publicPolicy } : { role: null }

  // 1. Backup.
  const backup = {
    'collections-guides.json': await get('/collections/guides'),
    'collections-activation_guide.json': await get('/collections/activation_guide'),
    'fields-guides.json': await get('/fields/guides'),
    'fields-activation_guide.json': await get('/fields/activation_guide'),
    'relations-guides.json': await get('/relations/guides'),
    'collections-guide_categories.json': await tryGet('/collections/guide_categories'),
    'permissions-public.json': await get(`/permissions?${publicFilter}&limit=-1`),
    'items-guides.json': await get('/items/guides?fields=*&limit=-1'),
    'items-activation_guide.json': await get('/items/activation_guide?fields=*'),
    'items-help_articles.json': await get('/items/help_articles?fields=*&limit=-1'),
  }

  const guideFields = backup['fields-guides.json']
  const pageFields = backup['fields-activation_guide.json']
  const hasField = (fields, name) => fields.some((f) => f.field === name)
  const field = (fields, name) => fields.find((f) => f.field === name)
  const categoriesExist = Boolean(backup['collections-guide_categories.json'])
  const guidesGroup = backup['collections-guides.json']?.meta?.group ?? null

  // 2. Categories collection.
  if (!categoriesExist) {
    step('Create collection "Guide categories" (guide_categories)', () =>
      api('POST', '/collections', {
        collection: 'guide_categories',
        meta: {
          icon: 'category',
          note: 'Groups on the Activation guides page. Drag rows to reorder: the site shows them in this order.',
          display_template: '{{name}}',
          sort_field: 'sort',
          archive_field: 'status',
          archive_value: 'archived',
          unarchive_value: 'draft',
          group: guidesGroup,
          translations: [{ language: 'en-US', translation: 'Guide categories', singular: 'Guide category', plural: 'Guide categories' }],
        },
        schema: {},
        fields: [
          { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true, readonly: true } },
          {
            field: 'status',
            type: 'string',
            schema: { default_value: 'published', is_nullable: false },
            meta: {
              interface: 'select-dropdown',
              options: { choices: STATUS_CHOICES.map(({ text, value }) => ({ text, value })) },
              display: 'labels',
              display_options: { showAsDot: true, choices: STATUS_CHOICES },
              width: 'half',
              note: 'Draft hides the category and its chip. Its guides then show under "Other".',
            },
          },
          { field: 'sort', type: 'integer', schema: {}, meta: { hidden: true, interface: 'input' } },
          {
            field: 'name',
            type: 'string',
            schema: { is_nullable: false },
            meta: { interface: 'input', required: true, width: 'half', note: 'Shown as the section heading and the filter chip, e.g. "Steam".', options: { placeholder: 'Steam' } },
          },
          {
            field: 'slug',
            type: 'string',
            schema: { is_nullable: false, is_unique: true },
            meta: {
              interface: 'input',
              required: true,
              width: 'half',
              options: { slug: true, trim: true, placeholder: 'steam' },
              note: 'Used in the link /activation-guides?category=steam. Lower case, dashes instead of spaces. Avoid changing it once live.',
            },
          },
        ],
      }),
    )
  }

  const existingCategories = categoriesExist ? await get('/items/guide_categories?fields=id,slug&limit=-1') : []
  const missingCategories = CATEGORIES.filter((c) => !existingCategories.some((e) => e.slug === c.slug))
  if (missingCategories.length) {
    step(`Add categories: ${missingCategories.map((c) => c.name).join(', ')}`, () =>
      api(
        'POST',
        '/items/guide_categories',
        missingCategories.map((c) => ({ ...c, status: 'published', sort: CATEGORIES.indexOf(c) + 1 })),
      ),
    )
  }

  // 3. Guides: category, optional image, editor's order.
  if (!hasField(guideFields, 'category')) {
    step('Add "Category" dropdown to guides', async () => {
      await api('POST', '/fields/guides', {
        field: 'category',
        type: 'integer',
        schema: { is_nullable: true },
        meta: {
          interface: 'select-dropdown-m2o',
          options: { template: '{{name}}', enableCreate: false },
          display: 'related-values',
          display_options: { template: '{{name}}' },
          width: 'half',
          note: 'Where this guide is listed on the Activation guides page. Leave empty to list it under "Other".',
        },
      })
      await api('POST', '/relations', {
        collection: 'guides',
        field: 'category',
        related_collection: 'guide_categories',
        schema: { on_delete: 'SET NULL' },
        meta: { sort_field: null },
      })
    })
  }

  const image = field(guideFields, 'image')
  if (image && (image.meta?.required || image.schema?.is_nullable === false)) {
    step('Make the guide image optional', () =>
      api('PATCH', '/fields/guides/image', {
        meta: { required: false, note: 'Optional. Shown small in the list and at the top of the guide.' },
        ...(image.schema?.is_nullable === false && { schema: { is_nullable: true } }),
      }),
    )
  } else if (image && !image.meta?.note) {
    step('Explain the guide image field', () =>
      api('PATCH', '/fields/guides/image', { meta: { note: 'Optional. Shown small in the list and at the top of the guide.' } }),
    )
  }

  const guidesMeta = backup['collections-guides.json']?.meta
  if (hasField(guideFields, 'sort') && guidesMeta?.sort_field !== 'sort') {
    step('Let editors drag guides into order (sort field)', () =>
      api('PATCH', '/collections/guides', { meta: { sort_field: 'sort' } }),
    )
  }

  const notes = {
    status: 'Only Published guides appear on the site, under their category.',
    description: 'Optional. One or two sentences under the title in the list and on the guide.',
    author_name: 'Optional. Shown as "By <name>" on the guide when set.',
    related_guides: 'Optional. Shown first under "Other guides"; the rest come from the same category.',
  }
  for (const [name, note] of Object.entries(notes)) {
    const current = field(guideFields, name)
    if (current && current.meta?.note !== note) {
      step(`Add a help note to guides.${name}`, () => api('PATCH', `/fields/guides/${name}`, { meta: { note } }))
    }
  }

  // 4. The list page's own texts.
  const pageTextFields = [
    { field: 'subtitle', type: 'text', placeholder: 'Step-by-step help to redeem your key or code on each platform.', note: 'Optional. The line under the page title.' },
    { field: 'help_box_title', type: 'string', placeholder: 'Key still not working?', note: 'Optional. Title of the "Create a ticket" box beside the guides.' },
    { field: 'help_box_text', type: 'text', placeholder: "Tell us within 72 hours and we'll sort it out.", note: 'Optional. Text of that box.' },
  ]
  for (const f of pageTextFields) {
    if (!hasField(pageFields, f.field)) {
      step(`Add "${f.field}" to the Activation guides page`, () =>
        api('POST', '/fields/activation_guide', {
          field: f.field,
          type: f.type,
          schema: { is_nullable: true },
          meta: {
            interface: f.type === 'text' ? 'input-multiline' : 'input',
            options: { placeholder: f.placeholder },
            note: `${f.note} Leave empty to use the text shown in grey.`,
            width: 'full',
          },
        }),
      )
    }
  }
  const pageGuides = field(pageFields, 'guides')
  if (pageGuides && !pageGuides.meta?.hidden) {
    step('Hide the old manual "Guides" list on the Activation guides page (no longer used)', () =>
      api('PATCH', '/fields/activation_guide/guides', {
        meta: { hidden: true, note: 'No longer used: every published guide is listed automatically.' },
      }),
    )
  }

  // 5. Public read access.
  const permissions = backup['permissions-public.json']
  const readPermission = (collection) => permissions.find((p) => p.collection === collection && p.action === 'read')
  const addFields = (collection, names) => {
    const permission = readPermission(collection)
    if (!permission) {
      console.warn(`! No public read permission on ${collection}: the site can't read it. Check Settings > Access Policies > Public.`)
      return
    }
    const fields = permission.fields ?? []
    if (fields.includes('*')) return
    const missing = names.filter((n) => !fields.includes(n))
    if (missing.length) {
      step(`Public may read ${collection}.${missing.join(', ')}`, () =>
        api('PATCH', `/permissions/${permission.id}`, { fields: [...fields, ...missing] }),
      )
    }
  }
  addFields('guides', ['category', 'status', 'sort'])
  addFields('activation_guide', ['subtitle', 'help_box_title', 'help_box_text'])
  if (!readPermission('guide_categories')) {
    step('Public may read published guide categories', () =>
      api('POST', '/permissions', {
        ...publicOwner,
        collection: 'guide_categories',
        action: 'read',
        fields: ['id', 'name', 'slug', 'sort', 'status'],
        permissions: { status: { _eq: 'published' } },
        validation: null,
      }),
    )
  }

  // 6. The current guides' categories.
  const guides = backup['items-guides.json']
  const toCategorise = guides.filter((g) => GUIDE_CATEGORIES[g.slug] && !g.category)
  if (toCategorise.length) {
    step(`Put ${toCategorise.map((g) => `"${g.title}"`).join(', ')} in their categories`, async () => {
      const categories = await get('/items/guide_categories?fields=id,slug&limit=-1')
      for (const guide of toCategorise) {
        const category = categories.find((c) => c.slug === GUIDE_CATEGORIES[guide.slug])
        if (category) await api('PATCH', `/items/guides/${guide.id}`, { category: category.id })
      }
    })
  }

  // 7. Copied competitor text in the Help Centre.
  const driffle = backup['items-help_articles.json'].find((a) => a.title?.trim() === DRIFFLE_ARTICLE_TITLE)
  if (driffle) {
    step(`Help Centre article: "${DRIFFLE_ARTICLE_TITLE}" -> "${DRIFFLE_ARTICLE_NEW_TITLE}"`, () =>
      api('PATCH', `/items/help_articles/${driffle.id}`, { title: DRIFFLE_ARTICLE_NEW_TITLE }),
    )
  }
  const otherMentions = backup['items-help_articles.json'].filter(
    (a) => a !== driffle && /driffle|instant gaming|eneba|g2a|kinguin/i.test(`${a.title} ${a.body}`),
  )
  for (const a of otherMentions) console.warn(`! Help article ${a.id} "${a.title}" mentions another store; check it by hand.`)

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
  console.log('\nAll set. The site shows the changes right away; translated pages can take up to an hour.')
}

main().catch((error) => {
  console.error(`\nStopped: ${error.message}`)
  process.exit(1)
})
