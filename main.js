// Homepage behaviour: latest-release download links, shop and install tabs, the mobile menu.
// The page reads fine with none of it.
const REPO = 'AhsanRao/tijara-pos-releases'
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches

document.getElementById('year').textContent = String(new Date().getFullYear())

/* --- Downloads: newest published release, this visitor's OS first ------------------------- */

function visitorAsset() {
  const ua = navigator.userAgent
  if (/Windows/i.test(ua)) return ['win-x64.exe', 'Windows']
  if (/Mac OS X|Macintosh/i.test(ua)) return ['mac-arm64.dmg', 'Mac']
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return ['linux-amd64.deb', 'Linux']
  return [null, null]
}

function showInstallOnDownload(link, assetName) {
  link.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const os = assetName.startsWith('win-') ? 'win' : assetName.startsWith('mac-') ? 'mac' : 'linux'
    const tab = osTabs.find((t) => t.dataset.os === os)
    if (tab) selectOs(tab, false)
    document.getElementById('install').scrollIntoView({ behavior: calm ? 'instant' : 'smooth', block: 'start' })
  })
}

async function linkLatestRelease() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
  if (!res.ok) return
  const release = await res.json()
  const version = release.tag_name.replace(/^v/, '')
  const [mine, osName] = visitorAsset()
  for (const card of document.querySelectorAll('.os[data-asset]')) {
    const asset = release.assets.find((a) => a.name.endsWith(card.dataset.asset))
    if (!asset) continue
    card.href = asset.browser_download_url
    showInstallOnDownload(card, card.dataset.asset)
    const ver = document.createElement('span')
    ver.className = 'ver'
    ver.textContent = `v${version} · ${Math.round(asset.size / 1e6)} MB`
    card.append(ver)
    if (card.dataset.asset === mine) {
      card.classList.add('mine')
      document.getElementById('hero-download').href = asset.browser_download_url
      showInstallOnDownload(document.getElementById('hero-download'), card.dataset.asset)
      document.getElementById('hero-download-label').textContent = `Download for ${osName}`
    }
  }
  document.getElementById('release-line').textContent =
    `Version ${version}. Every feature free for 14 days, no card needed. A one-time licence keeps it running after.`
}
linkLatestRelease().catch(() => {})

/* --- Shop types: ARIA tabs that swap the screen and its points --------------------------- */

const SHOPS = {
  supermart: {
    shot: 'assets/shots/till.jpg',
    alt: 'The till billing groceries',
    points: [
      'Quantity first: <kbd>5</kbd> <kbd>*</kbd> then scan adds five',
      'Rice, sugar and daal from label scales add their own weight',
      'Shelf and product labels with barcodes',
    ],
  },
  pharmacy: {
    shot: 'assets/shots/expiry.jpg',
    alt: 'Medicine batches expiring soon, with stock, value and rack',
    points: [
      'Batches and expiry: the earliest expiry sells first',
      'Expired stock is never sold; write it off in one click',
      'Search by generic name, with a prescription check for Rx items',
    ],
  },
  clothing: {
    shot: 'assets/shots/article.jpg',
    alt: 'A lawn kurta in four sizes and three colours with stock in each',
    points: [
      'One article in many sizes and colours',
      'Stock grid: size × colour at a glance',
      'A barcode label for every piece',
    ],
  },
  general: {
    shot: 'assets/shots/products.jpg',
    alt: 'Product list with stock, prices and categories',
    points: [
      'Everything a counter needs, nothing extra',
      'Turn on medicines or weighed items any time in Settings',
      'Udhaar, stock and reports included',
    ],
  },
}

const tabs = [...document.querySelectorAll('#shops [role="tab"]')]
const panel = document.getElementById('panel-shop')
const shot = document.getElementById('shop-shot')
const points = document.getElementById('shop-points')

function selectShop(tab, focus) {
  for (const t of tabs) {
    const on = t === tab
    t.setAttribute('aria-selected', String(on))
    t.tabIndex = on ? 0 : -1
  }
  panel.setAttribute('aria-labelledby', tab.id)
  const shop = SHOPS[tab.dataset.shop]
  points.innerHTML = shop.points.map((p) => `<li>${p}</li>`).join('')
  shot.classList.add('swap')
  setTimeout(
    () => {
      shot.onload = () => shot.classList.remove('swap')
      shot.src = shop.shot
      shot.alt = shop.alt
      if (shot.complete) shot.classList.remove('swap')
    },
    calm ? 0 : 160,
  )
  if (focus) tab.focus()
}

for (const [i, tab] of tabs.entries()) {
  tab.addEventListener('click', () => selectShop(tab, false))
  tab.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    if (step) {
      e.preventDefault()
      selectShop(tabs[(i + step + tabs.length) % tabs.length], true)
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      selectShop(tabs[e.key === 'Home' ? 0 : tabs.length - 1], true)
    }
  })
}
// Preload the other screens so switching is instant.
for (const { shot: src } of Object.values(SHOPS)) new Image().src = src

/* --- Install steps: one tab per OS, opening on the visitor's own ----------------------------- */

const osTabs = [...document.querySelectorAll('#install [role="tab"]')]

function selectOs(tab, focus) {
  for (const t of osTabs) {
    const on = t === tab
    t.setAttribute('aria-selected', String(on))
    t.tabIndex = on ? 0 : -1
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on
  }
  if (focus) tab.focus()
}

for (const [i, tab] of osTabs.entries()) {
  tab.addEventListener('click', () => selectOs(tab, false))
  tab.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    if (step) {
      e.preventDefault()
      selectOs(osTabs[(i + step + osTabs.length) % osTabs.length], true)
    }
  })
}
{
  const os = { Windows: 'win', Mac: 'mac', Linux: 'linux' }[visitorAsset()[1]]
  const mine = osTabs.find((t) => t.dataset.os === os)
  if (mine) selectOs(mine, false)
}

/* --- Theme toggle: OS setting by default, visitor's pick remembered ------------------------ */

const root = document.documentElement
const themeBtn = document.querySelector('.theme')
const osDark = matchMedia('(prefers-color-scheme: dark)')
const currentTheme = () => root.dataset.theme || (osDark.matches ? 'dark' : 'light')

function labelThemeBtn() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark'
  themeBtn.setAttribute('aria-label', `Switch to ${next} theme`)
}

themeBtn.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark'
  root.dataset.theme = next
  try {
    localStorage.setItem('theme', next)
  } catch {}
  labelThemeBtn()
})
osDark.addEventListener('change', labelThemeBtn)
labelThemeBtn()

/* --- Mobile menu ---------------------------------------------------------------------------- */

const menu = document.querySelector('.menu')
const nav = document.getElementById('nav')
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true'
  menu.setAttribute('aria-expanded', String(open))
  nav.classList.toggle('open', open)
})
nav.addEventListener('click', (e) => {
  if (e.target instanceof HTMLAnchorElement) {
    menu.setAttribute('aria-expanded', 'false')
    nav.classList.remove('open')
  }
})
