---
name: site-check
description: >-
  Use as the single entry point for any website self-check / audit request — when the
  user says "自检 / 体检 / 看看这页对不对 / 这里不对劲 / 看起来怪 / 给全站检查一下"
  without specifying the exact layer. This skill routes to the right sub-skill:
  visual-verify for rendering/layout issues on a single page, ai-vibe-governance for
  behavioral/systemic issues across the site, or both for a full-site check. It is a
  dispatcher only — it does not re-implement the sub-skills' logic. Not for greenfield
  feature work.
version: 1.0.0
user-invocable: true
argument-hint: "[page url|file | full-site | what feels off]"
license: MIT
allowed-tools:
  - Read(skills/visual-verify/SKILL.md)
  - Read(skills/ai-vibe-governance/SKILL.md)
---

# Site Check · 网站自检总入口

单一入口的**调度器**：判断该用哪个子 skill，编排顺序。不复制、不替代子 skill 的逻辑，只做分发。

## 路由表

根据用户的诉求，决定调用哪个子 skill：

| 用户诉求 | 路由到 | 为什么 |
|----------|--------|--------|
| "这页看起来怪 / 颜色不对 / 重叠了 / 效果不对" | **visual-verify** | 视觉层问题，单点渲染检查 |
| "哪里不对劲 / 点了没反应 / 结果丢了 / 结论打架 / 报错" | **ai-vibe-governance** | 行为/逻辑层问题，用 6 维度 SOP 拆解 |
| "给全站做次体检 / 自检一下 / 检查整个站点" | **两者组合**（见下方流程） | 完整自检闭环 |
| "PDF / 图表 / 卡片渲染得对不对" | **visual-verify** | 特定可见产物的渲染验证 |
| "代码是不是有问题 / 有没有雷 / 想加固" | **ai-vibe-governance** | 代码层系统排查 |
| "按钮跳错页面 / 文案和跳转不符" | **route-governance** | 路由层治理，需统一路由常量 |

## 组合流程（全站体检时）

当用户要求全站自检，编排如下：

```
1. ai-vibe-governance · 四阶段
   ├─ 阶段1 体检：三视角扫描 → 问题清单
   ├─ 阶段2 分级：红线/优化，交用户确认优先级
   ├─ 阶段3 分批修复：方案→用户确认→修复→独立回归
   └─ 阶段4 回归：全站冒烟 0 报错
2. visual-verify · 视觉收尾
   ├─ 对关键页面截图（桌面/全页/移动）
   └─ vision 检查渲染符合预期
```

即：**先查行为（跑不跑得通）→ 再确认渲染（长得好不好）**，两条轨互补。

## 明确不做

- **不重新实现** visual-verify 或 ai-vibe-governance 的检查逻辑——它们各自是权威
- **不绕过用户确认**：涉及写/改/删操作，仍按子 skill 的分批确认制执行
- **不把单页视觉问题升级成全站治理**（成本浪费），反之亦然

## 判定原则

- 诉求含糊 → 先问一句：是"看单页渲染"还是"全站体检"？不要让用户猜
- 提到具体页面 + 视觉词（颜色/布局/重叠）→ 单点视觉
- 提到行为词（没反应/丢了/报错/打架）→ 行为排查
- 提到"全站/体检/整体"→ 组合

## 参考

- 视觉验证子 skill：`skills/visual-verify/SKILL.md`
- 治理子 skill：`skills/ai-vibe-governance/SKILL.md`
- 路由治理子 skill：`skills/route-governance/SKILL.md`

## 路径说明

frontmatter 的 `allowed-tools` 与参考链接使用**相对仓库根目录**的路径。如果你的宿主工具不支持相对路径解析，把前缀替换成你实际的仓库绝对路径（一次性修改，只影响本文件的工具白名单声明）。
