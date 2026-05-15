---
layout: post
date: 2026-05-15
title: "A2UI, AG-UI, and GenUI Beyond the Chat Box"
tags: [ai, genui, android, enpost]
---

I recently took another look at Google's A2UI and AG-UI. Compared with my first pass last year, my view is clearer now: both are valuable, and they complement each other, but they should not be simplified into "dynamic UI protocols are finally standardized."

More precisely, A2UI and AG-UI are still clearly centered around a **chat-like style** today: agent conversations, copilots, search/chat, and assistant panels inside productivity tools. This is a large market, of course, and it explains why tools and protocols in this direction are moving so fast. But AI application forms cannot be fixed inside the chat box. The many existing apps, especially in content, media, education, consumer products, and communities, still leave a lot of space worth watching.

![A2UI component gallery example](https://storage.googleapis.com/gweb-developer-goog-blog-assets/images/a2ui-blog-1-component-gallery_2.original.png)

*Image source: Google Developers Blog, component gallery example from [Introducing A2UI: An open project for agent-driven interfaces](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/)*

## Spec and Protocol

[Google introduced A2UI in December 2025](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/). The core idea is to let an agent return not just text, but a safe, declarative UI description, which the host application then renders with its own components. By the [A2UI v0.9 update in April 2026](https://developers.googleblog.com/a2ui-v0-9-generative-ui/), the direction became clearer: use the existing component catalog from a design system, let the agent "speak UI," and avoid having the agent directly emit HTML/JS or arbitrary code.

AG-UI sits on another layer. It is not a GenUI spec, but an interaction protocol between an agent backend and a user-facing frontend. The official docs state this directly: [A2UI is a generative UI specification, while AG-UI is an Agent-User Interaction protocol](https://docs.ag-ui.com/concepts/generative-ui-specs). This is also why AG-UI naturally feels chat-oriented: it deals with long-lived connections, streaming, tool calls, state sync, human-in-the-loop flows, cancel/resume, and the runtime reality of "an agent and a user are working through something together."

If we only look at these two protocols:

- A2UI describes what UI the agent wants to show, which components to use, what data is bound, and what actions exist.
- AG-UI describes how the agent and frontend keep talking, passing text, state, tool calls, UI intent, and user interactions.

## Who Is Using This Now

A2UI's official landing zone is still mostly agentic apps: Google Opal, Gemini Enterprise, Flutter GenUI SDK, ADK examples, AG2's A2UIAgent, and CopilotKit/AG-UI integration. The Flutter GenUI SDK is worth paying attention to because it shows Google has at least seriously considered mobile/native rendering, instead of only building browser scenarios. On the A2UI roadmap, Lit, Angular, React, and Flutter are marked stable, while SwiftUI and Jetpack Compose are still planned.

AG-UI feels more like "agent app plumbing." It is closely tied to CopilotKit, and the official docs list integrations with LangGraph, CrewAI, Google ADK, Microsoft Agent Framework, Pydantic AI, Agno, and others. Its strength is turning events from different agent frameworks into typed events that a frontend can consume. In other words, if you are building a web-based copilot, agent chat, or workspace, it may be useful. Otherwise, it is probably not the first layer of the answer.

This is where I think there is still a lot of space. LLMs are NOT only here to make search boxes, chat boxes, and workspaces smarter. **News apps still need reading pages, podcast apps still need show notes, magazines still need features, and children's stories still need supportive reading and interaction.** The question is not "should these apps become chatbots?" The question is whether the content surfaces inside existing products can begin to understand the content itself, **and dynamically place layout, comments, sharing, ads, related reading, and action entry points where they make more sense.**

## FAQ

I talked with agents about this topic quite a bit. Here are a few of the questions.

**What is the relationship between A2UI and AG-UI?**

A2UI describes the UI payload itself. AG-UI describes the interaction process between the agent and the frontend. A2UI is closer to a payload/schema, while AG-UI is closer to a runtime pipe. They can be used together, but they are not the same thing.

**What is A2UI's JSONL? Can it be parsed incrementally?**

JSONL means JSON Lines: each line is a complete JSON object. It is often used with SSE streaming because the client can parse line by line, receiving `createSurface`, `updateComponents`, and `updateDataModel` while updating the local model.

**Why does AG-UI feel so chat-like?**

Because agent app interaction is rarely a single request/response. The agent streams text, calls tools in the middle, pauses for user confirmation, and continues updating state. AG-UI models these events, so it naturally appears in chat, copilot, and agent workspace products.

**Do A2UI demos for marketing emails or Twitter/X cards make sense?**

Yes, but mainly during generation and preview, not at the final delivery layer. Email ultimately becomes HTML/MJML. Twitter/X ultimately becomes an image, metadata, or a platform-native card. A2UI can help the admin side preview, approve, rewrite, and schedule through a unified renderer. If the output is only a one-off static artifact, the value of A2UI becomes much thinner.

## References

- [Introducing A2UI: An open project for agent-driven interfaces](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/)
- [A2UI v0.9: The New Standard for Portable, Framework-Agnostic Generative UI](https://developers.googleblog.com/a2ui-v0-9-generative-ui/)
- [Developer's Guide to AI Agent Protocols](https://developers.googleblog.com/en/developers-guide-to-ai-agent-protocols/)
- [A2UI official docs](https://a2ui.org/)
- [AG-UI official docs](https://docs.ag-ui.com/)
- [AG-UI: Generative UI Specs](https://docs.ag-ui.com/concepts/generative-ui-specs)
