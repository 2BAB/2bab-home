---
layout: post
date: 2026-05-15
title: "A2UI、AG-UI，以及聊天框之外的 GenUI"
tags: [ai, genui, android, post]
---

最近重新看了一圈 Google A2UI 和 AG-UI，感觉比去年第一次看时更明确了：这两个东西有价值，相辅相成，但不应该被简单理解成“动态 UI 协议终于标准化了”。

准确点说，现在 A2UI 和 AG-UI 的重心仍然很明显地落在 **chat-like style** 上：agent 对话、copilot、search/chat、生产力工具里的 assistant panel。当前来说这固然是一个挺大的市场，也解释了为什么这条线上工具和协议都长得很快。但 AI 应用的形态不可能就此固定在聊天框里。曾经已经存在的千千万万 App，尤其是内容、媒体、教育、消费、社区这类应用，仍然有大量空间值得重新观察。

![A2UI component gallery 示例](https://storage.googleapis.com/gweb-developer-goog-blog-assets/images/a2ui-blog-1-component-gallery_2.original.png)

*图源：Google Developers Blog，[Introducing A2UI: An open project for agent-driven interfaces](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/) 中的 component gallery 示例*

## Spec 和 Protocol

[Google 在 2025 年 12 月公开 A2UI](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/)，核心目标是让 agent 不只返回文本，而是返回一段安全的、声明式的 UI 描述，再由宿主应用用自己的组件渲染。到了 [2026 年 4 月的 A2UI v0.9 更新](https://developers.googleblog.com/a2ui-v0-9-generative-ui/)，它的方向更清楚了：用现有设计系统里的 component catalog，让 agent “说 UI”，而不是让 agent 直接吐 HTML/JS 或任意代码。

AG-UI 则站在另一层。它不是 GenUI spec，而是 agent backend 和 user-facing frontend 之间的 interaction protocol。官方文档也把这点说得很直白：[A2UI 是 generative UI specification，AG-UI 是 Agent-User Interaction protocol](https://docs.ag-ui.com/concepts/generative-ui-specs)。这也是为什么 AG-UI 看上去天然偏 chat：它处理的是长连接、streaming、tool call、state sync、human-in-the-loop、cancel/resume 这些“agent 正在和用户共同完成一件事”的运行时问题。

如果只看这两个协议，大概是这样：

- A2UI：agent 要展示什么 UI，用什么 component、什么数据绑定、什么动作。
- AG-UI：agent 和前端怎么持续通信，怎么传文本、状态、工具调用、UI intent 和用户交互。

## 现在谁在用

A2UI 的官方落点主要还是 agentic app：Google Opal、Gemini Enterprise、Flutter GenUI SDK、ADK 示例、AG2 的 A2UIAgent、CopilotKit/AG-UI 集成等。值得注意的是 Flutter GenUI SDK，因为它说明 Google 至少认真考虑过 mobile/native 的渲染体验，而不是只做浏览器里的场景。A2UI 官网的 roadmap 里把 Lit、Angular、React、Flutter 标成稳定，SwiftUI 和 Jetpack Compose 还是 planned。

AG-UI 的生态更像“agent app plumbing”。它和 CopilotKit 绑得很深，同时官方列了 LangGraph、CrewAI、Google ADK、Microsoft Agent Framework、Pydantic AI、Agno 等集成。它强在把各种 agent framework 的事件整理成前端可以消费的 typed events。换句话说，如果你在做一个 web-based copilot、agent chat 或 workspace，可能不错；反之，它就不是第一层答案。

这也是我觉得大有空间的地方，LLM 不是只能把搜索框、聊天框、工作台做得更聪明。**新闻 App 仍然需要阅读页，播客 App 仍然需要单集页介绍，杂志仍然需要专题，儿童故事仍然需要辅助性的阅读和互动**。问题不是“要不要把这些 App 变成聊天机器人”，而是这些原有产品里的内容表面，能不能**开始理解内容本身，并动态地把排版、评论、分享、广告、延伸阅读和行动入口放到更合适的位置**。

## FAQ

我和 Agent 聊了很多这方面的问题，摘录其中的一部分放到这里。

**A2UI 和 AG-UI 的关系？**

A2UI 描述 UI 内容本身，AG-UI 描述 agent 和前端之间的交互过程。A2UI 更像 payload/schema，AG-UI 更像 runtime pipe。两者可搭配食用，但不是一回事。

**A2UI 的 JSONL 是什么？它能逐步解析吗？**

JSONL 就是 JSON Lines，每一行都是一个完整 JSON object，像 SSE streaming 时经常用 JSONL，因为客户端可以按行解析，一边收到 `createSurface`、`updateComponents`、`updateDataModel`，一边更新本地模型。

**为什么 AG-UI 看起来很 chat-like？**

因为 agent app 的交互天然不是一次 request/response。它会流式输出文本，中途调用工具，暂停等用户确认，继续更新状态。AG-UI 正是为这些事件建模，所以它很容易出现在 chat、copilot、agent workspace 里。

**A2UI 官方 Demo 里做 email 营销页、Twitter/X 卡片有意义吗？**

有，但意义主要在“生成和预览阶段”，不是最终投放阶段。Email 最后还是 HTML/MJML，Twitter/X 最后还是图片、metadata 或平台原生卡片。A2UI 可以帮助 admin 侧用统一的 renderer 做 preview、approve、rewrite、schedule；如果只是一次性生成静态结果，A2UI 的价值就会变薄。

## 参考

- [Introducing A2UI: An open project for agent-driven interfaces](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/)
- [A2UI v0.9: The New Standard for Portable, Framework-Agnostic Generative UI](https://developers.googleblog.com/a2ui-v0-9-generative-ui/)
- [Developer's Guide to AI Agent Protocols](https://developers.googleblog.com/en/developers-guide-to-ai-agent-protocols/)
- [A2UI 官方文档](https://a2ui.org/)
- [AG-UI 官方文档](https://docs.ag-ui.com/)
- [AG-UI: Generative UI Specs](https://docs.ag-ui.com/concepts/generative-ui-specs)
