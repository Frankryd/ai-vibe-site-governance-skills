# AI-Vibe Site Governance Skills

> AI-vibe 站点治理技能包
>
> **中文** · [English](README.en.md)

面向「AI 多轮迭代生成的网站」的一套治理与自检方法论技能包。四个 skill、三层分工，一条主线：

> **先证明跑得通，再证明长得好，最后证明跳得对。**

## 30 秒上手 SOP

人和 Agent 的分工是写死的：**人只负责描述感受、确认优先级和方案**；拆解、定位、分析、修复、回归全部是 Agent 的活。

**1. 装进宿主工具**

```bash
git clone https://github.com/Frankryd/ai-vibe-site-governance-skills
```

把 `skills/` 目录复制到宿主工具的 skill 目录（位置见[安装](#安装)）。

**2. 配置视觉 API（可选）**

只有要用 `visual-verify` 做截图核验才需要。任意支持图像输入的 LLM API 都可以，不限厂商：

```bash
export VISION_API_KEY="your-key-here"
```

**3. 提诉求，让它自己路由**

不用记四个 skill 的名字。说一句「帮我给这个站点自检一下」，`site-check` 会按你的措辞自动路由：

| 你的说法 | 路由到 |
|---|---|
| 「看起来怪 / 颜色不对 / 重叠了」 | `visual-verify` 视觉层 |
| 「点了没反应 / 结果丢了 / 结论打架」 | `ai-vibe-governance` 行为层 |
| 「按钮跳错页面 / 文案和跳转不符」 | `route-governance` 路由层 |
| 「给全站做次体检」 | 行为层 + 视觉层组合 |

**4. 分批确认，逐批回归**

每批 4-7 项：提方案 → **你确认**（只确认，不用懂技术）→ 修复 → 该批回归 + 全站冒烟 → 通过才进下一批。冒烟跑出来长这样：

![冒烟脚本真实输出](docs/smoke-output.png)

图里的 `formatDelta is not defined` 是脚本真抓到的残留函数地雷，不是演示数据。退出码 `1` 表示有失败项。

## 它产出什么

`route-governance` 的语义意图审查：同一个按钮，URL 合法可达，但语义是错的。左边是治理前，右边换成 `ROUTES` 常量之后。

![语义意图审查报告](docs/semantic-review.png)

**考古不等于真理。** 脚本只出候选清单，黄金基准表必须由人工确认后才生效。

## 核心理念

1. **标准先行** —— 先建判据（红线/优化分级）再动手，标准未成型不动代码
2. **双轨验证** —— 功能验证（Playwright DOM 断言）与视觉验证（截图 + 视觉模型）分离，互补不替代
3. **分批确认制** —— 每批修复先提方案 → 人类确认 → 修复 → 独立回归 → 通过才进下一批
4. **责任边界** —— 人类只描述感受 + 确认优先级；Agent 负责拆解/定位/分析/修复/回归

## Skill 一览

| Skill | 层 | 适用场景 |
|---|---|---|
| `site-check` | 入口 | 只说"自检一下/不对劲"但没说清层面 → 自动路由到下面几个 |
| `ai-vibe-governance` | 行为层 | 系统性体检与修复（四阶段：体检→分级→分批修复→回归） |
| `visual-verify` | 视觉层 | 单页/单组件"渲染出来长什么样"是否符合预期 |
| `route-governance` | 路由层 | 按钮跳错页面、文案与实际跳转语义不符、URL 硬编码 |

## 安装

```bash
git clone https://github.com/Frankryd/ai-vibe-site-governance-skills && cd ai-vibe-site-governance-skills
```

按宿主工具把 `skills/` 目录放到对应位置：

| 宿主 | 位置 |
|---|---|
| OpenCode | `<项目>/.opencode/skills/` |
| omp（managed-skills） | `~/.omp/agent/managed-skills/` |
| 其他 | 让工具能读到 `SKILL.md` 的 frontmatter 即可 |

每个 skill 的 `SKILL.md` frontmatter 里 `allowed-tools` 用的是**相对仓库根目录**的路径；如果你的宿主不支持相对路径解析，把前缀替换成仓库的绝对路径（只改工具白名单声明，脚本内部不依赖它）。

## 配置

`visual-verify` 依赖任意**支持图像输入的 LLM API**（OpenAI 兼容 `/chat/completions` 即可，不限厂商）：

```bash
export VISION_API_KEY="your-key-here"
export VISION_BASE_URL=https://api.openai.com/v1   # 可选，任何兼容网关
export VISION_MODEL=gpt-4o                          # 可选，需支持图像输入
```

也可写入 `skills/visual-verify/scripts/.env`（脚本内置轻量解析，环境变量优先）。模板见 `.env.example`。

`ai-vibe-governance` 的冒烟脚本需要 Playwright：`npm i -D playwright`。

## 用法示例

```bash
# 全站冒烟（0 pageerror / 0 console.error）
node skills/ai-vibe-governance/scripts/smoke-template.js \
  --base http://localhost:3000 --pages index.html,about.html,pricing.html

# 视觉检验（截图 → 视觉模型）
node skills/visual-verify/scripts/analyze-image.js \
  audit/screenshots/dashboard-desktop.png \
  "五行条是否有 5 条？当前月份是否有高亮框？移动端是否溢出？"
```

```bash
# 路由考古扫描（阶段1 A 路）
node /tmp/scan-routes.js <项目根目录> [--out <输出json路径>]
```

`scan-routes.js` 内嵌在 `skills/route-governance/SKILL.md` 文末，复制出来即可运行。

## 目录结构

```
skills/
├─ site-check/SKILL.md (+ SKILL.en.md)
├─ ai-vibe-governance/
│  ├─ SKILL.md (+ SKILL.en.md)
│  ├─ reference/           # 扫描清单、6维度SOP、修复模式、报告模板、工作流
│  └─ scripts/smoke-template.js
├─ visual-verify/
│  ├─ SKILL.md (+ SKILL.en.md)
│  └─ scripts/analyze-image.js
└─ route-governance/SKILL.md (+ SKILL.en.md)

docs/
├─ smoke-output.png       # README 配图：冒烟脚本真实输出
└─ semantic-review.png    # README 配图：语义意图审查报告
```

## 语言说明（Bilingual）

README 有两个版本，点上方链接切换：

- `README.md` —— 中文版（本文件）
- `README.en.md` —— 英文版

每个 skill 也有**两份文件**：

- `SKILL.md` —— **中文版，是权威加载入口**。工具读取的是它。修改 skill 时改这个文件。
- `SKILL.en.md` —— 英文版，供英文读者阅读与传播。frontmatter 与中文版保持一致（name / version / license / argument-hint / allowed-tools），正文章节一一对应。

正文独立维护，不自动同步。更新 skill 时记得两份都改，否则中英会漂移。

> `route-governance` 里内嵌的 `scan-routes.js` 脚本在两份文件中**完全相同**（含中文注释），因为那是可执行代码，翻译会破坏它。

## 限定skill使用约定（重要）

- **不擅自操作**：所有写/改/删动作先经用户人工确认
- **不越权升级**：单页视觉问题不升级成全站治理，反之亦然
- **路由治理的黄金基准表由用户人工确认**，脚本产物只是现状快照，不等于真理

## 许可

MIT。见 [LICENSE](LICENSE)。
