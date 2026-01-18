---
layout: post
date: 2025-04-10
title: "Automated AI Workflow - We Localized Popular Documentation for the Community"
tags: [kotlin, koin, sqldelight, ktor, coil, doc, ai, translation, enpost]
---

Recently, together with community partners, I built a site called [Open AIDoc](https://openaidoc.org). It's a **public welfare** project powered by Gemini, aimed at **tracking and translating popular open-source library documentation into Simplified/Traditional Chinese, Japanese, Korean, and multiple other languages**. In today's v0.1.0 release, we've provided synchronized translations of the latest **Kotlin** and **Koin** documentation. Plans already include expanding to **SqlDelight**, **Ktor**, and other libraries we're familiar with, and continuously adding documentation translation sync services for **different domains** in the future.

![](https://2bab-images.lastmayday.com/202504101349493.png?imageslim)

The story began when I was helping [Koin](https://insert-koin.io/) build a Chinese community recently, and found that some new members' first question was "Is there Chinese documentation?" This piqued my interest, and soon I found similar questions in some Kotlin community groups. I tried to understand the demand for localized documentation in the AI era, because I know quite a few browser plugins can already achieve high-quality translation. But digging deeper, I found this might still be a widespread problem, especially for novice engineers in East Asia. On one hand, East Asia overall has relatively strong language systems of their own. Although English learning has been added to compulsory education in most regions, there are numerous native language materials in the programming field, and many developers still prefer native language materials. On the other hand, just because browser plugins exist doesn't mean everyone uses them. AI development is still in its early stages. Documentation is a webpage that gets **repeatedly viewed**, and having to **wait a few seconds for translation** each time, plus **repeatedly spending credits** for this, is indeed not a great scenario.

Since this is the case, why not solve the several documentation problems I've encountered around me at once using AI? The generated content is stored on a site for repeated reading, which is very **eco-friendly** :) So I found a like-minded partner, zhuoxuan, to start pushing forward. Of course, we soon discovered things were a bit more troublesome than expected — we needed to add some sync update and format conversion steps. So we built a workflow that roughly looks like:

![](https://2bab-images.lastmayday.com/202504101142559.png?imageslim)


The biggest advantage of choosing Gemini 2.0 Flash is that it's **fast and affordable**. Even with room for prompt optimization, it already shows good translation results. Following the principle of "talk about completion before perfection," we **went live** with the v0.1.0 you see now in about a week.

![](https://2bab-images.lastmayday.com/202504101351461.png?imageslim)

![](https://2bab-images.lastmayday.com/202504101351378.png?imageslim)


Although it still has some issues, such as:

- A small number of very long files have the very last bit truncated, limited by gemini 2.0 flash --> will switch to 2.5 pro later
- A small number of custom formats are difficult to make compatible with the docusaurus engine using regex replacement, currently manually fixed a few --> will switch to vitepress/next.js which is more flexible and tolerant later
- All heading links (with # signs) are broken because names don't match at all after translation --> still looking for solutions
- Regex replacement scripts can't guarantee that all parts work properly after replacement --> need to optimize scripts or use other libraries to assist (via AST or similar)

But overall we've achieved the goal we wanted from the start: first solve the problems around us, then slowly upgrade and iterate. At the same time, we're also collecting community feedback:

1. Which documentation is English-only, or has outdated Chinese versions — we'll prioritize the high-demand ones;
2. Which Prompts aren't well-written — organize contribution guidelines for everyone to submit PRs to help fix together;

Additionally: Gemini costs are currently paid personally. Thanks here to the [Google Developer Program Premium Membership](https://developers.google.com/program) (including GCP Credits) gifted by the Google Developer Expert program. It's natural to give back these Credits to the community. After the Credits expire, we'll consider other methods. Website deployment costs including domain, servers, and traffic will be sponsored by my personal consulting and solutions company [BinaryTape](https://binarytape.com).

Since it's a public welfare project, we can't guarantee time to do too much documentation adaptation. We hope more like-minded partners will join to build together. Everyone is also welcome to **share, like, and forward** more, so more developers can **enjoy the latest localized documentation services** and get updates on documentation changes.

Website: [openaidoc.org](https://openaidoc.org)
