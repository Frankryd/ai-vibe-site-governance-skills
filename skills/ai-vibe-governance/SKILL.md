---
name: ai-vibe-governance
description: Use when a site/project was built by AI multi-round iteration (vibe-coded) and needs a systematic audit + remediation — when the user reports things "feel off / 不对劲" but can't describe technical details, or wants to harden an AI-generated codebase against its characteristic failure modes (fragmented code, duplicated logic, schema drift, dead code, silent errors, state loss, security vectors). Provides the full governance workflow: scan (code/interaction/automation), triage (red-line vs. polish), batched fixes with human confirmation, and regression. Pair with the visual-verify skill for the visual acceptance step. Not for greenfield feature work or non-AI-generated codebases.
version: 1.0.0
user-invocable: true
argument-hint: "[project path] [scope: full|code|interaction|automation]"
license: MIT
allowed-tools:
  - Bash(node skills/ai-vibe-governance/scripts/smoke-template.js *)
---

# AI-Vibe 站点治理

对 AI 多轮迭代生成的站点做**系统性体检与修复**。核心信念：这类站点的问题不是零散的 bug，而是系统性的、跨文件的——必须先建判据再动手，否则是东一榔头西一棒。

## 何时用

- AI 生成/多轮拼接的站点，用户说"感觉不对劲/这里怪"但说不出技术细节
- 需要给 AI 生成代码做一次系统性加固（正确性/链路/安全/状态/清理）
- 想沉淀问题清单给非专业用户 review

**不用于**：全新功能开发、非 AI 生成的常规代码库。

## 核心原则

1. **标准先行**：先建判据（红线/优化分级）再扫描，标准未成型不动代码
2. **双轨验证**：功能（Playwright 断言）与视觉（visual-verify skill）分离，互补不替代
3. **分批确认制**：每批修复先提方案 → 人类确认/驳回 → 修复 → 独立回归 → 通过才进下一批
4. **责任边界**：人类只描述感受 + 确认优先级/方案；Agent 负责拆解/定位/分析/修复/回归
5. **不擅自操作**：所有写/改/删动作先经人类确认，禁止直接发起

## 四阶段主流程

### 阶段1 · 体检（扫描）
三视角并行，独立产出：
- **代码层**（静态）：死代码、重复实现、schema 漂移、安全向量、空 catch、过时注释 → 见 `reference/scan-checklist.md`
- **交互层**（6维度）：跳转/返回/状态/边界/一致性/刷新 → 见 `reference/sop-6dimensions.md`
- **自动化层**（运行）：Playwright 探测异常（点击报错、状态不同步、动态内容）→ 用 `scripts/smoke-template.js` 起手

产出《问题清单》：按 `reference/report-template.md`，每项含 **现象(人话)/影响等级/位置(文件:行)/复现步骤**。

### 阶段2 · 分级（人类只做优先级）
- **红线必查**（P0）：影响正确性/可用性/安全，必须全过
- **优化提升**（P1/P2）：整洁度，允许 **修/删/留** 三选一

把清单交给人类确认优先级，人类不拆解技术。

### 阶段3 · 分批修复（每批独立回归）
按主题分批（每批 4-7 项），流程：
1. 提出该批方案（改哪些文件、为什么、风险）
2. 人类确认/驳回（只确认，不描述技术细节）
3. 修复
4. 该批 Playwright 回归 + 全站冒烟
5. 通过才进下一批

### 阶段4 · 回归校验
- 全站冒烟（`scripts/smoke-template.js`）0 pageerror / 0 console.error
- 视觉收尾：调用 `visual-verify` skill 截图 + 视觉检查，确认渲染符合预期
- 确认红线清零、无新引入

## 技术修复模式速查

8 个 AI-vibe 高频坑的通用解法 → 详见 `reference/fix-patterns.md`：

| 坑 | 解法 |
|----|------|
| 同一算法多份实现、口径不一 | 抽单一出口（公共函数），删自写副本 |
| localStorage schema 漂移 | 写前归一化 + 读时兜底，单出口 |
| 残留函数地雷（ReferenceError） | 共享脚本提供全局安全垫片，永不抛错 |
| 内存渲染结果即失 | localStorage 持久化，刷新/回退恢复 |
| toast/反馈静默失效 | 反馈函数自动创建节点 |
| 用户输入拼 innerHTML | 一律 escapeHtml |
| 校验写在业务之后 | 校验前置到函数最前 |
| 状态逐页硬编码 | 数据驱动，按路由自动计算 |

## 参考

- 扫描清单：`reference/scan-checklist.md`
- 6维度SOP：`reference/sop-6dimensions.md`
- 修复模式：`reference/fix-patterns.md`
- 报告模板：`reference/report-template.md`
- 冒烟脚本模板：`scripts/smoke-template.js`
- 视觉验证：`skills/visual-verify/SKILL.md`

## 路径说明

frontmatter 的 `allowed-tools` 与示例使用**相对仓库根目录**的路径。如果你的宿主工具不支持相对路径解析，把前缀替换成你实际的仓库绝对路径（只影响本文件的工具白名单声明，脚本内部不依赖它）。
