// Homepage behaviour: latest-release download links, the ringing receipt, shop tabs, keyboard
// tips, mobile menu and scroll reveal. The page reads fine with none of it.
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
    const ver = document.createElement('span')
    ver.className = 'ver'
    ver.textContent = `v${version} · ${Math.round(asset.size / 1e6)} MB`
    card.append(ver)
    if (card.dataset.asset === mine) {
      card.classList.add('mine')
      document.getElementById('hero-download').href = asset.browser_download_url
      document.getElementById('hero-download-label').textContent = `Download for ${osName}`
    }
  }
  document.getElementById('release-line').textContent =
    `Version ${version}. Every feature free for 14 days; a one-time licence keeps it running.`
}
linkLatestRelease().catch(() => {})

/* --- Hero receipt: rings up line by line, like the till ---------------------------------- */

function ringUp() {
  const receipt = document.querySelector('.receipt')
  if (!receipt || calm) return
  const lines = [...receipt.querySelectorAll('.receipt-lines li')]
  const paid = receipt.querySelector('.receipt-paid')
  const total = document.getElementById('total')
  const keys = {
    scan: document.querySelector('.key-scan'),
    enter: document.querySelector('.key-enter'),
    pay: document.querySelector('.key-pay'),
  }
  const amounts = lines.map((li) => Number(li.querySelector('b').textContent.replace(/,/g, '')))
  const lakh = (n) => n.toLocaleString('en-IN')
  const press = (key, ms = 260) => {
    key.classList.add('on')
    setTimeout(() => key.classList.remove('on'), ms)
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))

  async function play() {
    receipt.classList.add('ringing')
    lines.forEach((li) => li.classList.remove('in'))
    paid.classList.remove('in')
    let sum = 0
    total.textContent = '0'
    await wait(700)
    for (const [i, li] of lines.entries()) {
      press(keys.scan)
      await wait(380)
      press(keys.enter)
      li.classList.add('in')
      sum += amounts[i]
      total.textContent = lakh(sum)
      await wait(650)
    }
    await wait(300)
    press(keys.pay, 500)
    await wait(450)
    paid.classList.add('in')
    await wait(5500)
    play()
  }
  play()
}
ringUp()

/* --- Shop types: ARIA tabs that swap the screen and its points --------------------------- */

const SHOPS = {
  supermart: {
    shot: 'assets/shots/till.jpg',
    alt: 'The till billing groceries',
    points: [
      'Quantity first: <kbd>5</kbd><kbd>*</kbd> then scan adds five',
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
      'Search by generic name; a prescription check for Rx items',
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
      'Add medicines or weighed items any time in Settings',
      'Udhaar, stock and reports included',
    ],
  },
}

const tabs = [...document.querySelectorAll('[role="tab"]')]
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
      shot.src = shop.shot
      shot.alt = shop.alt
      shot.onload = () => shot.classList.remove('swap')
    },
    calm ? 0 : 180,
  )
  if (focus) tab.focus()
}

for (const [i, tab] of tabs.entries()) {
  tab.addEventListener('click', () => selectShop(tab, false))
  tab.addEventListener('keydown', (e) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
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

/* --- Keyboard: each key explains itself ----------------------------------------------------- */

const tip = document.getElementById('tip')
for (const cap of document.querySelectorAll('.cap')) {
  const show = () => {
    document.querySelector('.cap.active')?.classList.remove('active')
    cap.classList.add('active')
    tip.textContent = cap.dataset.tip
  }
  cap.addEventListener('mouseenter', show)
  cap.addEventListener('focus', show)
  cap.addEventListener('click', show)
}
document.querySelector('.cap-pay')?.classList.add('active')

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

/* --- Scroll reveal -------------------------------------------------------------------------- */

const reveals = document.querySelectorAll('.reveal')
if ('IntersectionObserver' in window && !calm) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('in')
        io.unobserve(e.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  )
  reveals.forEach((el) => io.observe(el))
} else {
  reveals.forEach((el) => el.classList.add('in'))
}
