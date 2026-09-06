---
name: visual-verify
description: Use when a UI/visual change needs to be verified against expected rendering — after editing pages, components, PDFs, charts, cards, or responsive layouts; or when the user reports something "looks off / 不对劲 / 效果不对" but cannot describe the technical detail. Provides the visual-verification workflow: capture screenshots (desktop/mobile/full-page) with Playwright, then inspect them with a vision-capable model against a written "expected effect" baseline. Pair with functional verification (DOM assertions) — visual checks confirm how it renders, not just that it runs. Not for backend-only or pure-logic changes that have no visible surface.
version: 1.0.0
user-invocable: true
argument-hint: "[target url|file] [expected effect]"
license: MIT
allowed-tools:
  - Bash(node skills/visual-verify/scripts/analyze-image.js *)
---

# Visual Verify 视觉验证

验证"页面/组件**渲染出来长什么样**"是否符合预期。功能正确性（跑不跑得通）交给 Playwright DOM 断言；**视觉正确性（长得好不好、对不对）交给本 skill**。

## 何时用

- 修改了任何有可见表面的东西（页面、卡片、图表、PDF、响应式布局、hover/动画）
- 用户说"这里不对劲 / 看起来怪 / 效果不对"，但说不出技术细节 → 用本 skill 自动拆解视觉维度
- 功能验证（DOM 断言）通过，但还没确认"渲染得对不对"

**不用于**：纯逻辑/后端改动（无可见输出）。

## 核心原则

1. **预期效果前置**：验证前先写清楚"应该长什么样"（1-2 句对照基准），否则就是"做完才想对不对"
2. **双轨分离**：功能验证（Playwright 断言）→ 视觉验证（截图 + 视觉模型），两者互补不替代
3. **检查项具体到功能**：不是笼统"看看有没有问题"，而是"五行条是否有 5 条、当前月份是否有高亮框、移动端是否溢出"
4. **视觉模型可插拔**：脚本只负责把图片交给"任意支持图像输入的 LLM API"，不绑定特定厂商。你用自己的 key、自己的 endpoint。

## 工作流

### Step 1 · 明确预期效果（必做）
向用户确认或在改动记录中读取该功能的**预期渲染**。写不下就退回一句："该卡片应显示 X，布局为 Y，颜色为 Z"。

### Step 2 · 功能验证（Playwright DOM，可选但推荐）
走真实交互，断言关键元素存在、无 JS 错误。确认"功能跑通"后，才进入视觉层。

### Step 3 · 截图（Playwright）
对目标页面截图，按需三种：
- 首屏 `*-desktop.png`（1440×900）
- 全页 `*-full.png`（fullPage:true）
- 移动端 `*-mobile.png`（390×844，需移动适配时）

存到项目的 `audit/screenshots/`（无则建）。

### Step 4 · 视觉检验（视觉模型）
```
node skills/visual-verify/scripts/analyze-image.js <截图路径> "<具体检查项>"
```
检查项模板（按需组合，务必具体）：
- **布局**：元素是否重叠/错位/溢出/横向滚动、间距对齐、空白合理
- **图形**：canvas/SVG 是否绘制、颜色区分、标签清晰、图例可读
- **文字**：清晰、无截断、无乱码、对比度足够
- **移动端**：触目标足够大、正确堆叠、无水平溢出
- **状态**：hover/active/disabled 态是否有视觉反馈

### Step 5 · 判定与修复
- 对照预期效果逐项确认（Pass/Fail）
- 发现问题 → 定位到具体元素 → 修复 → 重新截图 → 复验（最多两轮，不要无限 polish）
- 记录结果

### Step 6 · 记录
- 更新对应改动清单的状态
- 在 `audit/vision-notes.md`（或验收清单）简记：项 + 结论 + 截图路径

## 视觉检验脚本说明

- 脚本位置：`skills/visual-verify/scripts/analyze-image.js`（相对仓库根目录）
- 引擎：**任意 OpenAI 兼容的图像理解 API**——通过环境变量配置，不绑定厂商
  - `VISION_API_KEY`（必填）：你的 API key
  - `VISION_BASE_URL`（可选，默认 `https://api.openai.com/v1`）：任何兼容 `/chat/completions` 的网关
  - `VISION_MODEL`（可选，默认 `gpt-4o`）：需支持图像输入的模型名
  - 同目录 `.env` 也可写这三项（脚本内置轻量解析，优先读环境变量）
- 依赖：零第三方模块，`node` 直接运行（Node 18+ 自带 fetch）
- 用法变体：
  - `node skills/visual-verify/scripts/analyze-image.js <本地图片> "<问题>"`
  - `node skills/visual-verify/scripts/analyze-image.js --url <图片URL> "<问题>"`
- 未配置 key 时输出友好提示并以非零码退出，不崩溃、不泄露

## 视觉检查清单（速查）

| 类别 | 检查点 |
|------|--------|
| 布局 | 重叠 / 错位 / 溢出 / 横向滚动 / 间距 / 对齐 / 空白 |
| 图形 | canvas/SVG 绘制 / 颜色区分 / 标签 / 图例 |
| 文字 | 清晰 / 截断 / 乱码 / 对比度 |
| 响应式 | 390px 堆叠 / 触目标 / 无溢出 |
| 状态 | hover / active / disabled / loading / empty |

## 参考

- 项目既有的验收流程模板：`skills/ai-vibe-governance/reference/workflow.md`
- 治理与视觉的双轨分离是本套件的核心约定：先证明"能跑"，再证明"好看"

## 路径说明

frontmatter 的 `allowed-tools` 与脚本示例使用**相对仓库根目录**的路径。如果你的宿主工具不支持相对路径解析，把前缀替换成你实际的仓库绝对路径（只影响本文件的工具白名单声明，脚本内部不依赖它）。
