---
name: route-governance
description: 对存量 AI 生成 Web 项目做路由治理（考古扫描→语义意图审查→黄金基准表→ROUTES 常量固化→改写→校验→门禁），消除按钮跳转错乱、语义错配与硬编码 URL。当项目出现跳转错乱、按钮文案与实际跳转不符、需要建立统一路由常量体系时使用。
version: 2.2
user-invocable: true
argument-hint: "[project root] [scope: full|scan|review|rewrite]"
license: MIT
---

# 路由治理 Skill（Route Governance）v2.2

对**已经 AI 生成完毕的 Web 项目**做路由治理：考古扫描存量跳转 → **语义意图审查（理解真实网页每个功能/按键的含义）** → 人工确认黄金基准路由表（含期望目标）→ 常量固化 + 全局改写 → 校验与门禁。适用于按钮 A 跳到 B 页面、按钮文案与实际跳转语义不符、URL 到处硬编码、无现成路由表的项目。

> **v2.2 新增**（2026-08-13）：① 阶段1.5「语义意图审查」——加载真实网页，理解每个功能/按键的业务含义，做"意图-目标"比对（补纯 URL 合法性检查的洞）；② 视觉能力调用——截图 + 视觉模型复核按钮真实呈现与行为；③ 黄金表 schema 扩展 `intent / expected_target / semantic_status`，让"业务期望"进入真理；④ 阶段5 视觉校验基准从"现状 URL"改为"期望目标"；⑤ 阶段1 扫描器扩展至可点击元素全集（button/onclick/toast/SPA 视图切换）。

## 何时使用（触发条件）

- 用户报告页面按钮/入口跳转到错误页面，或**按钮文案与实际跳转语义不符**（如"保存"却跳落地页）；
- 存量项目需要建立统一路由体系（ROUTES 常量）；
- 新项目开发前需要路由门禁；
- 用户明确说"跑路由治理"。

## 顶层理论规则（不可违背）

1. **单一可信源**：内部业务跳转 URL 唯一来源为 routes.js/routes.ts 常量；禁止硬编码。外部链接进 EXTERNAL_ROUTES 白名单。
2. **双向映射**：同时维护 功能名→URL 与 URL→功能名。
3. **考古≠真理**：扫描结果只是现状快照，只有人工确认后的黄金表才是真理。
4. **状态隔离**：全部中间产物落磁盘，不依赖对话上下文；上下文溢出走分片协议。
5. **语义意图原则**（v2.2）：黄金表同时记录「现状 URL」与「业务期望目标」（expected_target）；**语义层以业务期望为准**——现状 URL 合法可达不等于语义正确；每个入口的"文案意图"必须与"跳转目标"比对。

## 状态容器

项目根目录建 `./route_manage/`，所有中间产物落盘，对话内只输出摘要：

```
route_manage/
├─ 01_raw_scan_routes.json        # 阶段1 A路：原始考古扫描（脚本生成 + Agent 补充）
├─ 01-runtime_scan_routes.json    # 阶段1 B路：运行时采集（Playwright/爬虫，或无则降级）
├─ 01-dynamic_route_register.json # 阶段1：全动态路由登记表
├─ 01.5_semantic_review.md        # 阶段1.5：语义意图审查报告（每页每入口：文案意图/实际目标/期望目标/判定）
├─ 02_golden_routes_draft.json    # 阶段2：机器预审计初版（人工确认前）
├─ 02_golden_routes_final.json    # 阶段2：人工确认终版（真理，Agent 只读）
├─ 03_diff_report.md              # 扫描 vs 黄金表差异 + 预审计分组
├─ 04_modify_plan.md              # 改写计划
├─ 05_test_result.md              # 校验报告
├─ 06_audit_log                   # 审计日志（每次改动：文件/前后片段/依据）
└─ 07_acceptance_report.md        # 验收报告
```

## 执行流程（严格按顺序，不可跳阶段）

### 阶段1：考古扫描（两路对账 + 元素全集）

1. **A 路（静态）**：运行辅助脚本（见文末）`node scan-routes.js <项目根>`，输出 `01_raw_scan_routes.json`。脚本只做粗扫（a-href / location / window.open / router / form / iframe / img / fetch 候选 + 动态标记），**语义审计由你完成**：补充 entry_name（入口显示名称）、修正条目、识别漏抓。
2. **B 路（运行时）**：有 Playwright/爬虫则全站遍历采集真实跳转；**无环境则降级**为"人工走查 + 浏览器控制台 Network 抓取"，并在摘要中声明降级原因。降级时零命中抽查改为全量复核。
3. **可点击元素全集**（v2.2）：B 路采集对象不限于 `a[href]`，还包括 `button[onclick]`、任意 `[onclick]`、SPA 视图切换（`go('view')` 类）、toast 占位、表单提交——**这些是语义审查的素材**，漏掉它们就会漏掉"看着像链接点了没反应"和"按钮跳错地方"两类问题。
4. **对账**：A有B无 = 死代码候选；B有A无 = 动态漏抓。取并集。死代码进缺陷清单由人决策删/留，不自动删。
5. **零命中抽查**：列出无跳转的文件清单，抽样复核是真空文件还是漏扫。
6. 摘要输出：扫描文件数、候选数、硬编码数、动态数、可点击元素数。

### 阶段1.5：语义意图审查（v2.2 核心新增）

**目标**：理解真实网页里每个功能/按键的业务含义，做"意图-目标"比对——解决纯 URL 合法性检查发现的洞（URL 合法但语义错配，如「保存收藏」跳到落地页）。

1. **加载真实网页**：启动本地服务器（项目自带 serve 脚本优先），遍历全部页面（主页面全覆盖 + 代表性子页）。
2. **逐元素语义理解**：对每个可点击元素，结合页面上下文理解其业务含义，要素包括：文案全文（中英文）、所在区块（导航/工具页/页脚/卡片）、前后元素、按钮层级（同组按钮的共性目标）、页面标题与目标页内容。
3. **视觉复核（调用视觉能力）**：
   - 用浏览器工具（browser/tab.screenshot）对关键页面截图；
   - 用视觉模型分析截图（宿主工具的图像分析能力，或本仓库 `skills/visual-verify/scripts/analyze-image.js`）：确认按钮视觉呈现（是否像可点链接）、点击后的真实反馈（跳转/toast/无反应）、同页视图切换与整页跳转的差异；视觉能力不可用时声明降级，靠代码上下文完成；
   - 视觉用于**复核与补充**，不能替代代码层语义理解；视觉不可用时声明降级，靠代码上下文完成。
4. **意图-目标比对**：每个入口判定为四类之一：
   - ✅ **一致**：文案意图与跳转目标相符；
   - ✗ **错配**：跳转目标存在但语义不对（如「BACK 回中枢」→ 落地页而非仪表盘视图）；
   - ⚠ **占位**：目标未实现（toast('Placeholder')、`#` 死路、联盟占位）；
   - ⚠ **死路**：点了无任何反应或报错。
5. **输出** `01.5_semantic_review.md`：按页列出每个入口的「文案意图 / 实际目标 / 期望目标（expected_target）/ 判定 / 说明」，格式参照语义观察报告（人一眼能看出该去哪）。

### 阶段2：黄金基准表（人工确认，机器预检）

1. 基于扫描 + 语义审查做预审计，分三组：①高置信【建议采纳】②待确认【人工必核】③异常错误【人工干预】。
2. **机器预检**：初版黄金表自检——双向映射无冲突、URL 合法、无重复映射（多语言项目按语言维度拆分校验，同一功能多语言 URL 不算冲突）；语义字段完整性（v2.2）：每个业务入口必须有 intent + expected_target + semantic_status，缺失即阻断。
3. 输出 `03_diff_report.md`（分组展示）；高置信组抽样 10% 复核，待确认/异常组 100% 人工核。
4. **黄金表 schema（v2.2）**，每条记录：
   ```json
   {
     "entry_name": "功能/按钮显示名称",
     "intent": "业务意图（这个按钮应该做什么）",
     "path": "现状 URL（可能为空：SPA 视图/toast/死路）",
     "expected_target": "期望目标（/hub#hub、/report、空=应为死路但需人确认）",
     "group": "nav|page|content|special|semantic",
     "confidence": "high|confirm",
     "semantic_status": "ok|mismatch|placeholder|dead",
     "notes": "语义审查说明"
   }
   ```
5. 输出 `02_golden_routes_draft.json`，等人工反馈后生成 `02_golden_routes_final.json`；输出 draft/final diff，**人确认 diff 后才生效**。全动态路由不进入黄金表，登记到 `01-dynamic_route_register.json`。**人工确认清单 = 意图-目标对照表**（像 01.5_semantic_review.md 那样带期望目标），不是裸 URL 清单——这是让人能发现语义错配的关键。

### 阶段3：常量固化

1. 由黄金表生成 `src/routes.js` / `src/routes.ts`：`ROUTES`（正向）+ `ROUTE_NAME_BY_PATH`（反向）；外部链接进 `EXTERNAL_ROUTES`。
2. 半动态路由用函数式常量 `ROUTES.userDetail(id)`（参数逻辑保留，不擅自改）。
3. 语义错配项（semantic_status != ok）**不进入常量固化**，先交人决策修复（改 expected_target、删入口、或登记占位）。
4. 写 `04_modify_plan.md`，**暂不改源码**。

### 阶段4：代码全局改写（分批 + 构建门禁）

1. 对照完整跳转来源清单（a 标签、onclick、window.open、location.href/assign/replace、表单 action、iframe、图片链接、菜单配置、组件配置项），逐类处理，禁止"顺手改"。
2. 机械替换用 codemod 脚本（AST 替换），你只审 diff；禁止全局字符串替换。
3. 待改文件 > 20 分批；**每批改完必须 build 构建 + 首页冒烟，通过才进下一批；失败立即回滚该批**（git 分支/快照）。
4. 熔断：遇到黄金表没有的跳转 → 不编造路由，标记"未定义路由"进缺陷报告，交人决策（补黄金表 / 删除入口 / 改外链）。
5. 每次改动写 `06_audit_log`。

### 阶段5：三级校验

1. 代码语义校验（必跑）：全项目检索内部业务 URL 硬编码清零；常量引用全部可在黄金表找到；无未定义常量引用。
2. **语义复验（v2.2）**：对语义错配项的修复结果逐条复核——按钮文案意图与最终跳转一致；占位/死路项已按人工决策处理。
3. 视觉点击校验（可开关，兜底）：本地预览 + 遍历黄金表入口模拟点击，**以 expected_target（期望目标）为基准**比对实际跳转——不是拿现状 URL 当基准；区分真 bug 与环境假异常。路由量大可关闭。
4. 构建测试：build 不报错。
5. 缺陷只报告，不擅自修复。

### 阶段6：长效门禁

1. 门禁规则写进项目 AGENTS.md（红线：内部跳转只允许引用 ROUTES 常量）+ 交付前强制自检硬编码扫描。
2. 新功能流程：先更新 routes 常量，再写业务代码。
3. 可选：git pre-commit hook 扫硬编码 URL。

## 熔断规则

任何阶段遇到严重冲突（一功能多 URL、超阈值未定义路由、常量冲突）→ **停止修改源码，输出报告，等人工决策**。黄金表 Agent 只读，绝不擅自改动真理去迁就代码。语义错配项未人工决策前，禁止自动"顺手修复"。

## 验收指标（全部达标才算治理完成）

| 指标 | 标准 |
|---|---|
| 扫描覆盖率 | 100%（已扫描 ÷ 全部业务源码文件） |
| 静态硬编码业务 URL | 0（白名单外链除外） |
| 黄金表机器自检 | 冲突、重复映射 = 0；语义字段（intent/expected_target/semantic_status）完整 |
| 语义错配率（v2.2） | 0——所有 mismatch 项已修复或人工决策；placeholder/dead 项全部登记并有人工决策记录 |
| 路由点击通过率 | ≥ 98%（以期望目标为基准；登录受限页面豁免须登记理由；豁免率 > 20% 降级为人工走查验收） |
| 动态路由登记率 | 100%，无未分类路由 |
| 门禁复发率 | 新代码抽 10 次，硬编码复发 = 0 |

## 辅助脚本（内嵌，阶段1 A 路）

将下方代码写入临时文件（如 `/tmp/scan-routes.js`），运行：

```
node scan-routes.js <项目根目录> [--out <输出json路径>]
```

- 默认输出 `<项目根>/route_manage/01_raw_scan_routes.json`，stdout 打印汇总；
- 扫描 .html/.js/.jsx/.ts/.tsx/.vue/.svelte/.astro/.php，自动排除 node_modules/.git/dist/build 等；
- 输出字段：entry_type、source_file、line、code_snippet、raw_target_url、is_hardcode_url、dynamic、external、remark；
- 局限：粗扫候选（URL 字符串层），语义判断与漏抓补充由阶段1.5 语义意图审查完成；`entry_name` 需人工/Agent 补填。

```js
#!/usr/bin/env node
// scan-routes.js — 路由治理阶段1 A路：静态粗扫候选跳转
// 用法: node scan-routes.js <项目根目录> [--out <输出json路径>]
// 输出: 默认写 <项目根>/route_manage/01_raw_scan_routes.json；stdout 打印汇总
const fs = require("fs");
const path = require("path");

const EXCLUDE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", ".next", ".nuxt",
  "route_manage", ".project-truth", "coverage", ".cache", "public/vendor",
]);
const EXCLUDE_EXT = new Set([".png",".jpg",".jpeg",".gif",".svg",".webp",".ico",
  ".woff",".woff2",".ttf",".eot",".map",".pdf",".zip"]);
const SCAN_EXT = new Set([".html",".htm",".js",".jsx",".ts",".tsx",".vue",".svelte",".astro",".php"]);

// 跳转模式（尽力而为的粗扫；语义判断由执行 Agent 完成）
const PATTERNS = [
  { type: "a-href",       re: /\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/g },
  { type: "location-href",re: /(?:location\.href|window\.location(?:\.href)?)\s*=\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/g },
  { type: "location-api", re: /(?:location|window\.location)\.(?:assign|replace)\(\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/g },
  { type: "window-open",  re: /window\.open\(\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/g },
  { type: "router-push",  re: /(?:router|\$router)\.(?:push|replace|navigate)\(\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/g },
  { type: "use-navigate", re: /navigate\(\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/g },
  { type: "link-to",      re: /<Link\s+[^>]*\bto\s*=\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/g },
  { type: "form-action",  re: /<form\s+[^>]*\baction\s*=\s*(?:"([^"]+)"|'([^']+)')/g },
  { type: "iframe-src",   re: /<iframe\s+[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/g },
  { type: "img-src",      re: /<img\s+[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/g },
  { type: "fetch-api",    re: /fetch\(\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/g },
  { type: "window-location", re: /window\.location\s*=\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/g },
];

function classify(url) {
  const u = (url || "").trim();
  if (!u) return { kind: "empty", external: false, dynamic: false };
  if (u.startsWith("#") || u.startsWith("javascript:") || u.startsWith("mailto:") || u.startsWith("tel:"))
    return { kind: "special", external: false, dynamic: false };
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(u) || u.startsWith("//"))
    return { kind: "external", external: true, dynamic: false };
  const dynamic = u.includes("${") || u.includes("+");
  return { kind: "internal", external: false, dynamic };
}

function lineOf(content, index) {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) if (content.charCodeAt(i) === 10) line++;
  return line;
}

function walk(dir, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (EXCLUDE_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.isFile() && SCAN_EXT.has(path.extname(e.name).toLowerCase()) && !EXCLUDE_EXT.has(path.extname(e.name).toLowerCase()))
      out.push(full);
  }
}

// 调用型模式：参数可能为拼接表达式，需要检查整个参数
const CALL_TYPES = new Set(["window-open", "location-api", "router-push", "use-navigate", "fetch-api"]);

function scanFile(file, root, results) {
  let content;
  try { content = fs.readFileSync(file, "utf8"); } catch { return; }
  const rel = path.relative(root, file).split(path.sep).join("/");
  for (const { type, re } of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content)) !== null) {
      let raw = (m[1] || m[2] || m[3] || "").trim();
      let dynamic = false;
      let remarkExtra = "";
      if (CALL_TYPES.has(type)) {
        // 抓整个调用参数，识别拼接表达式（'/' + slug、模板字符串等）
        const after = content.slice(m.index + m[0].length, m.index + m[0].length + 200);
        const paramEnd = after.search(/[);,]/);
        const params = (paramEnd >= 0 ? after.slice(0, paramEnd) : after).trim();
        if (params.includes("+") || params.includes("${") || params.includes("`")) {
          dynamic = true;
          raw = params.slice(0, 300);
          remarkExtra = "拼接表达式候选";
        }
      }
      if (!raw) continue;
      const cls = classify(raw);
      const isDynamic = cls.dynamic || dynamic;
      const snippet = content.slice(Math.max(0, m.index - 40), m.index + m[0].length + 60).replace(/\s+/g, " ").trim();
      results.push({
        entry_name: null,
        source_file: rel,
        line: lineOf(content, m.index),
        code_snippet: snippet.slice(0, 200),
        raw_target_url: raw.slice(0, 300),
        entry_type: type,
        is_hardcode_url: !isDynamic && cls.kind === "internal",
        dynamic: isDynamic,
        external: cls.external,
        kind: cls.kind,
        remark: remarkExtra || (isDynamic ? "动态拼接候选" : cls.kind === "internal" ? "静态候选" : cls.kind),
      });
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const root = path.resolve(args[0] || ".");
  const outIdx = args.indexOf("--out");
  const outPath = outIdx >= 0 ? path.resolve(args[outIdx + 1]) : path.join(root, "route_manage", "01_raw_scan_routes.json");

  const files = [];
  walk(root, files);
  const results = [];
  for (const f of files) scanFile(f, root, results);

  const byType = {};
  let hard = 0, dyn = 0, ext = 0, internal = 0;
  for (const r of results) {
    byType[r.entry_type] = (byType[r.entry_type] || 0) + 1;
    if (r.is_hardcode_url) hard++;
    if (r.dynamic) dyn++;
    if (r.external) ext++;
    if (!r.external && r.kind !== "special" && r.kind !== "empty") internal++;
  }

  const summary = {
    scanned_files: files.length,
    total_candidates: results.length,
    by_type: byType,
    hardcoded_internal: hard,
    dynamic_candidates: dyn,
    external_links: ext,
    internal_candidates: internal,
    scan_time: new Date().toISOString(),
    note: "粗扫候选清单：机器提取，语义审计由 Agent 完成；硬编码内部URL需人工复核确认",
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ summary, routes: results }, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  console.log("OUTPUT:", outPath);
}

main();
```
