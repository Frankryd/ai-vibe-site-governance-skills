// 全站冒烟脚本模板 —— ai-vibe-governance skill 配套
//
// 用法：
//   node smoke-template.js --base http://localhost:3000 --pages index.html,about.html
//   BASE=http://localhost:3000 node smoke-template.js --pages-file pages.txt
//
// 目的：逐页加载，断言 0 pageerror / 0 console.error / 关键资源 0 失败。
// 说明：这是模板，页面清单与本地地址需按你的项目替换。
// 依赖：Playwright（npm i -D playwright），脚本会从 node_modules 自动解析。

const path = require('path');
const fs = require('fs');

// 从「当前脚本所在仓库」向上查找 playwright，找不到则退回全局解析
function loadPlaywright() {
  const here = __dirname;
  for (const dir of [here, path.join(here, '..', '..'), process.cwd()]) {
    try {
      return require(path.join(dir, 'node_modules', 'playwright'));
    } catch (_) { /* 继续向上找 */ }
  }
  return require('playwright'); // 依赖 Node 解析链
}
const { chromium } = loadPlaywright();

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

// 本地服务器地址：--base > 环境变量 BASE > 兜底
const BASE = (argValue('--base') || process.env.BASE || 'http://localhost:3000').replace(/\/+$/, '');

// 页面清单：--pages（逗号分隔）或 --pages-file（每行一个）或环境变量 PAGES
let pages = [];
if (argValue('--pages')) pages = argValue('--pages').split(',').map(s => s.trim()).filter(Boolean);
else if (argValue('--pages-file')) pages = fs.readFileSync(argValue('--pages-file'), 'utf8').split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#'));
else if (process.env.PAGES) pages = process.env.PAGES.split(',').map(s => s.trim()).filter(Boolean);

if (!pages.length) {
  console.error('[smoke] 未提供页面清单。');
  console.error('  node smoke-template.js --base http://localhost:3000 --pages index.html,about.html');
  console.error('  或 --pages-file pages.txt（每行一个路径）');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', r => {
    // 过滤外部字体/第三方 CDN，聚焦关键资源
    if (!/fonts\.googleapis|gstatic/i.test(r.url())) {
      errors.push('REQFAIL: ' + r.url());
    }
  });

  const fail = [];
  for (const p of pages) {
    errors.length = 0;
    try {
      await page.goto(BASE + '/' + p, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400); // 给动态内容一点时间（也可改 waitForFunction）
      if (errors.length) {
        fail.push({ p, errs: errors.slice() });
        console.log('[JSERR] ' + p + ': ' + errors.slice(0, 3).join(' | '));
      } else {
        console.log('[OK]    ' + p);
      }
    } catch (e) {
      fail.push({ p, errs: ['NAVEXC: ' + e.message] });
      console.log('[NAVFAIL] ' + p + ': ' + e.message);
    }
  }
  console.log('\n=== SMOKE SUMMARY ===');
  console.log('base: ' + BASE);
  console.log('tested: ' + pages.length + ', failed: ' + fail.length);
  fail.forEach(f => console.log('  - ' + f.p + ': ' + f.errs.join(' | ')));
  await browser.close();
  process.exit(fail.length ? 1 : 0);
})();
