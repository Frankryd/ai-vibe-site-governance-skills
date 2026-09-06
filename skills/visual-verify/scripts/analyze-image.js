#!/usr/bin/env node
// analyze-image.js — 把图片交给「任意 OpenAI 兼容的图像理解 API」，取回文字分析
//
// 用法：
//   node analyze-image.js <本地图片路径> "<问题>"
//   node analyze-image.js --url <图片URL> "<问题>"
//
// 配置（环境变量优先，其次同目录 .env）：
//   VISION_API_KEY    必填   你的 API key
//   VISION_BASE_URL   可选   默认 https://api.openai.com/v1
//                            任何兼容 /chat/completions 的网关都可以
//   VISION_MODEL      可选   默认 gpt-4o，需支持图像输入
//
// 零第三方依赖（Node 18+ 自带 fetch）。不硬编码任何 key 或厂商 endpoint。

const fs = require('fs');
const path = require('path');

// ---------- 轻量 .env 解析（只读，不写） ----------
function loadDotEnv(dir) {
  const file = path.join(dir, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}
loadDotEnv(__dirname);
loadDotEnv(process.cwd());

const KEY = process.env.VISION_API_KEY || '';
const BASE = (process.env.VISION_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const MODEL = process.env.VISION_MODEL || 'gpt-4o';

if (!KEY) {
  console.error('[analyze-image] 缺少 VISION_API_KEY。');
  console.error('  export VISION_API_KEY="your-key-here"    # 或写入本目录 .env')
  console.error('  export VISION_BASE_URL=...   # 可选，任何兼容 /chat/completions 的网关');
  console.error('  export VISION_MODEL=...      # 可选，需支持图像输入');
  process.exit(2);
}

// ---------- 参数 ----------
function usage(code) {
  console.error('用法：');
  console.error('  node analyze-image.js <本地图片> "<问题>"');
  console.error('  node analyze-image.js --url <图片URL> "<问题>"');
  process.exit(code);
}
const argv = process.argv.slice(2);
if (argv.length < 2) usage(1);

let imageURL, sourceName;
if (argv[0] === '--url') {
  if (argv.length < 3) usage(1);
  imageURL = argv[1];
  sourceName = imageURL;
} else {
  const local = argv[0];
  if (!fs.existsSync(local)) {
    console.error(`[analyze-image] 图片不存在: ${local}`);
    process.exit(3);
  }
  const buf = fs.readFileSync(local);
  const ext = (path.extname(local).replace('.', '') || 'png').toLowerCase();
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext === 'jpeg' ? 'jpeg' : ext}`;
  imageURL = `data:${mime};base64,${buf.toString('base64')}`;
  sourceName = local;
}
const question = argv[argv.length - 1];
if (!question) usage(1);

// ---------- 调用 ----------
async function main() {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: question },
            { type: 'image_url', image_url: { url: imageURL } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = (await res.text()).slice(0, 500);
    console.error(`[analyze-image] API 请求失败 HTTP ${res.status}`);
    console.error(body);
    process.exit(4);
  }
  const data = await res.json();
  const text =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.message?.content?.[0]?.text ||
    '';
  if (!text) {
    console.error('[analyze-image] 模型返回空内容（可能是该模型不支持图像输入）');
    process.exit(5);
  }
  console.log(text);
}

main().catch((e) => {
  console.error(`[analyze-image] 请求异常: ${e.message}`);
  process.exit(6);
});
