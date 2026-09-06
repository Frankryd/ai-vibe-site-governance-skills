# ai-vibe-skills

面向「AI 多轮迭代生成的网站」的一套治理与自检方法论技能包。四个 skill、三种分工，一条主线：

> **先证明跑得通，再证明长得好，最后证明跳得对。**

## 核心理念

1. **标准先行** —— 先建判据（红线/优化分级）再动手，标准未成型不动代码
2. **双轨验证** —— 功能验证（Playwright DOM 断言）与视觉验证（截图 + 视觉模型）分离，互补不替代
3. **分批确认制** —— 每批修复先提方案 → 人类确认 → 修复 → 独立回归 → 通过才进下一批
4. **责任边界** —— 人类只描述感受 + 确认优先级；Agent 负责拆解/定位/分析/修复/回归

## Skill 一览

| Skill | 角色 | 适用场景 |
|---|---|---|
| `site-check` | **总入口调度器** | 只说"自检一下/不对劲"但没说清层面 → 自动路由到下面几个 |
| `ai-vibe-governance` | 行为层治理 | 系统性体检与修复（四阶段：体检→分级→分批修复→回归） |
| `visual-verify` | 视觉层验证 | 单页/单组件"渲染出来长什么样"是否符合预期 |
| `route-governance` | 路由层治理 | 按钮跳错页面、文案与实际跳转语义不符、URL 硬编码 |

## 安装
```bash
git clone https://github.com/Frankryd/ai-vibe-skills && cd ai-vibe-skills
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
export VISION_API_KEY=***
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

## 目录结构

```
skills/
├─ site-check/SKILL.md
├─ ai-vibe-governance/
│  ├─ SKILL.md
│  ├─ reference/           # 扫描清单、6维度SOP、修复模式、报告模板、工作流
│  └─ scripts/smoke-template.js
├─ visual-verify/
│  ├─ SKILL.md
│  └─ scripts/analyze-image.js
└─ route-governance/SKILL.md
```

## 使用约定（重要）

- **不擅自操作**：所有写/改/删动作先经人类确认
- **不越权升级**：单页视觉问题不升级成全站治理，反之亦然
- **路由治理的黄金基准表由人工确认**，脚本产物只是现状快照，不等于真理

## 许可

MIT。见 [LICENSE](LICENSE)。
