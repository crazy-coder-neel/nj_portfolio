import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Start `npm start -- --port 3002` first. Requires Chrome and Node.js 22.
const base = process.env.CHECK_URL || 'http://localhost:3002'
const directory = await mkdtemp(join(tmpdir(), 'portfolio-check-'))
const response = await fetch(base)
assert.equal(response.status, 200)
for (const [header, expected] of Object.entries({ 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'referrer-policy': 'strict-origin-when-cross-origin' })) assert.equal(response.headers.get(header), expected)
assert.ok(response.headers.get('content-security-policy')?.includes("object-src 'none'"))
assert.equal(response.headers.get('x-powered-by'), null)
for (const scene of ['hero', 'about', 'skills', 'work', 'experience', 'achievements', 'contact']) {
  const asset = await fetch(`${base}/scenes/${scene}.webp`)
  assert.equal(asset.status, 200, scene)
  assert.ok(asset.headers.get('content-type')?.includes('image/webp'))
}
assert.equal((await fetch(`${base}/neelay-joshi-resume.pdf`)).status, 200)
assert.equal((await fetch(`${base}/nonexistent-page`)).status, 404)
for (const path of ['/.env', '/package.json', '/.git/config']) assert.equal((await fetch(`${base}${path}`)).status, 404, `private path ${path}`)
for (const path of ['/favicon.ico', '/nj-icon-32.png', '/nj-icon-192.png', '/nj-icon-180.png']) assert.equal((await fetch(`${base}${path}`)).status, 200, path)
const publicFiles = await readdir('public', { recursive: true, withFileTypes: true })
for (const file of publicFiles.filter(entry => entry.isFile())) {
  const directory = file.parentPath ?? file.path
  const path = join(directory, file.name).replace(/^public\//, '')
  assert.equal((await fetch(`${base}/${path.split('/').map(encodeURIComponent).join('/')}`, { method: 'HEAD' })).status, 200, `public asset ${path}`)
}

const browser = spawn(process.env.CHROME_PATH || 'google-chrome', ['--headless', '--no-sandbox', '--disable-gpu', '--disable-extensions', '--remote-debugging-port=9341', `--user-data-dir=${directory}`, 'about:blank'], { stdio: 'ignore' })
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
let socket
try {
  let tabs
  for (let i = 0; i < 40; i++) {
    try { tabs = await (await fetch('http://localhost:9341/json')).json(); break } catch { await sleep(250) }
  }
  assert.ok(tabs?.some(tab => tab.type === 'page'), 'Chrome page available')
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
  let id = 0
  const pending = new Map(), errors = []
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id) }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails)
    if (message.method === 'Log.entryAdded' && message.params.entry.source === 'security' && message.params.entry.level === 'error') errors.push(message.params.entry)
  })
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id
    const timeout = setTimeout(() => { pending.delete(key); reject(new Error(`CDP timeout: ${method}`)) }, 15000)
    pending.set(key, message => { clearTimeout(timeout); message.error ? reject(message.error) : resolve(message.result) })
    socket.send(JSON.stringify({ id: key, method, params }))
  })
  const evaluate = async expression => {
    const result = await cdp('Runtime.evaluate', { expression, returnByValue: true })
    assert.equal(result.exceptionDetails, undefined, expression)
    return result.result.value
  }
  const size = async (width, height = 844) => { await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 701 }); await sleep(600) }
  const count = () => evaluate(`document.querySelectorAll('#project-list .project-card-track').length`)
  const click = async selector => { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await sleep(700) }
  const scroll = async progress => { await evaluate(`(()=>{const el=document.querySelector('#journey');window.scrollTo({top:el.getBoundingClientRect().top+scrollY+(el.offsetHeight-innerHeight)*${progress},behavior:'instant'})})()`); await sleep(1400) }
  const capture = async name => { const result = await cdp('Page.captureScreenshot', { format: 'png' }); await writeFile(join(directory, `${name}.png`), Buffer.from(result.data, 'base64')) }
  await cdp('Runtime.enable'); await cdp('Log.enable'); await cdp('Page.enable')
  await size(390)
  await cdp('Page.navigate', { url: `${base}/#work` }); await sleep(3500)
  assert.equal(await count(), 5, 'mobile defaults to five')
  await capture('mobile-projects')
  await click('.mobile-projects-more button')
  assert.ok(await count() > 5, 'view more expands')
  assert.equal(await evaluate(`document.querySelector('.mobile-projects-more button').getAttribute('aria-expanded')`), 'true')
  await click('.project-filter-btn:nth-child(2)')
  assert.equal(await count(), 5, 'category change collapses')
  await click('.mobile-projects-more button')
  await click('.mobile-projects-more button')
  assert.equal(await count(), 5, 'show fewer collapses')
  await click('.project-filter-btn:first-child')
  await size(1440, 1000)
  assert.ok(await count() > 5, 'desktop shows all')
  assert.ok(await evaluate(`!!document.querySelector('link[rel="icon"][href="/nj-icon-32.png"]')`), 'custom favicon metadata')
  for (const section of ['about', 'skills', 'work', 'experience', 'achievements', 'contact']) {
    await evaluate(`document.getElementById('${section}').parentElement.scrollIntoView({behavior:'instant'})`)
    await sleep(1400)
    assert.equal(await evaluate(`document.getElementById('${section}').parentElement.className`), 'scene-track')
    assert.ok(Number(await evaluate(`getComputedStyle(document.querySelector('#${section} .scene-content')).opacity`)) > .9, `${section} readable`)
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, `${section} overflow`)
    if (section === 'about') await capture('about-scene')
  }
  await evaluate(`document.getElementById('achievements').scrollIntoView({behavior:'instant'})`)
  await click('.vault-folder')
  await click('.vault-file-card')
  assert.equal(await evaluate(`document.querySelector('.file-preview-overlay').parentElement===document.body`), true, 'preview escapes section transforms')
  assert.equal(await evaluate(`document.querySelector('.portfolio').inert`), true)
  assert.equal(await evaluate(`document.activeElement.className`), 'preview-close')
  assert.equal(await evaluate(`Math.round(document.querySelector('.file-preview-overlay').getBoundingClientRect().height)===innerHeight`), true)
  await capture('achievement-preview')
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await sleep(600)
  assert.equal(await evaluate(`document.querySelector('.file-preview-overlay')===null && !document.querySelector('.portfolio').inert`), true, 'escape restores page')
  for (const [progress, active] of [[0, 0], [.5, 1], [1, 2], [0, 0]]) {
    await scroll(progress)
    const opacity = await evaluate(`getComputedStyle(document.querySelectorAll('.passage-detail')[${active}]).opacity`)
    assert.ok(Number(opacity) > .95, `card ${active + 1} content visible at ${progress}`)
    await capture(`desktop-card-${active}`)
  }
  await size(390, 667); await scroll(.5); await capture('mobile-card')
  assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, 'mobile no overflow')
  assert.equal(await evaluate(`(()=>{const c=document.querySelectorAll('.passage-card')[1].getBoundingClientRect(),p=document.querySelectorAll('.passage-detail')[1].getBoundingClientRect();return p.bottom>c.bottom||p.right>c.right})()`), false, 'card content fits mobile')
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }); await sleep(800)
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.passage-stage')).position`), 'relative')
  assert.equal(await evaluate(`[...document.querySelectorAll('.passage-detail')].every(el=>getComputedStyle(el).opacity==='1')`), true)
  await evaluate(`document.getElementById('gallery').scrollIntoView({behavior:'instant'})`)
  await sleep(500)
  const galleryBefore = await evaluate(`document.querySelector('.gallery-controls span').textContent`)
  await click('[aria-label="Next gallery slide"]')
  assert.notEqual(await evaluate(`document.querySelector('.gallery-controls span').textContent`), galleryBefore, 'gallery next')
  await click('[aria-label="Previous gallery slide"]')
  assert.equal(await evaluate(`document.querySelector('.gallery-controls span').textContent`), galleryBefore, 'gallery previous')
  await click('.menu-toggle')
  assert.equal(await evaluate(`document.querySelector('.nav-links').classList.contains('open')`), true, 'mobile menu opens')
  await click('.nav-links button:last-child')
  assert.equal(await evaluate(`document.querySelector('.nav-links').classList.contains('open')`), false, 'navigation closes menu')
  assert.deepEqual(errors, [], 'no runtime errors or CSP violations')
  console.log('PASS: security headers, assets, mobile 5/expand/collapse/filter, desktop projects, card content forward/backward, reduced motion, no browser errors.')
  console.log(`Screenshots: ${directory}`)
} finally {
  socket?.close()
  browser.kill()
}
