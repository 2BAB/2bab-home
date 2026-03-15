---
layout: post
date: 2026-03-15
title: "用 Submodule 给 AI 编码助手补课"
tags: [ai, claude, skills, post]
---

Coding Agent 有知识截止日期，碰到新框架或者框架的新版本 API 就容易瞎编。即便是 Context 7 的文档知识，也大概是一个月前的快照，对于迭代快的框架来说已经可能过时了。所以"怎么给 AI 喂正确的框架知识"是个比较实际问题。

最近看到 antfu 搞了个 [skills](https://github.com/antfu/skills) 仓库，思路是把官方文档加工成 AI 能直接消费的 skill 文件，挂到 Claude Code 里当上下文。目前还是 proof-of-concept 阶段，但架构设计本身挺值得借鉴的，我在一个 KMP 项目里测试了类似的做法。


## antfu 的做法

他把 skill 按来源分成三类：

**手写的**：个人编码偏好，比如用 Composition API、TypeScript、pnpm workspace。纯口味文件，没什么自动化。

**从官方文档生成的**：vue、nuxt、vite、vitest 这些。把官方文档仓库作为 submodule 拉下来，用脚本提取精炼成 SKILL.md。这类是重点。

**外部项目自带的**：slidev、vueuse 这些项目自己在 repo 里维护了 `skills/` 目录，直接同步过来用。这其实是在推动一种生态 —— 让框架作者自己维护给 AI 看的文档。vueuse 已经单独建了个 `vueuse/skills` 仓库来做这事了。

核心机制是 submodule，`.gitmodules` 里分两类引用：

```ini
# sources —— 官方文档仓库，用来生成 skill
[submodule "sources/vue"]
    path = sources/vue
    url = https://github.com/vuejs/docs

# vendor —— 外部项目自带的 skill，直接搬过来
[submodule "vendor/slidev"]
    path = vendor/slidev
    url = https://github.com/slidevjs/slidev
```

产出的目录结构：

```
skills/vue/
├── SKILL.md              # 精炼后的框架知识，给 AI 看的主文件
├── GENERATION.md         # 记录：来源 commit SHA，生成日期
└── references/           # 补充细节
    ├── advanced-patterns.md
    └── core-new-apis.md
```

generated 的有 `GENERATION.md`，vendored 的有 `SYNC.md`，都是追踪版本用的，里面有精确的 commit SHA。当前 skill 对应官方文档的哪个版本，过期了没有，一目了然。


## 项目实践

举个例子，我这有个项目用了 [Metro](https://github.com/ZacSweers/metro)（一个 KMP 的编译期 DI 框架，详见[上一篇](/zh/blog/2026-03-15-metro-di-intro)），AI 对它基本不了解。参考上面的思路，做了类似的事情：

```
skills/
├── sources/
│   └── metro/                   # git submodule → ZacSweers/metro
├── metro/
│   ├── metro-core.md            # @DependencyGraph, @Provides, createGraph...
│   ├── metro-injection.md       # @Inject, @AssistedInject...
│   ├── metro-aggregation.md     # @ContributesTo, @ContributesBinding...
│   ├── metro-scopes.md          # @Scope, @SingleIn, AppScope...
│   ├── metro-multiplatform.md   # KMP graph patterns...
│   └── metro-viewmodels.md      # ViewModelKey, MetroViewModelFactory...
├── update-skills.sh
└── README.md
```

submodule 钉在 `libs.versions.toml` 里声明的 Metro 版本对应的 tag 上，然后在 `AGENTS.md`（Claude Code 的项目指令文件）里引用这些 skill 文件。AI 处理 DI 相关代码时，就有了正确的 API 参考。

额外做了两件事情：

**版本检查的 Gradle 插件**。一个 convention plugin，比较 `libs.versions.toml` 里的 Metro 版本和 submodule 的 git tag，不一致就 warn。挂在 debug 构建的 package task 后面，日常开发自然会触发提醒。

**更新脚本**。`update-skills.sh` 读取 toml 里的版本号，checkout submodule 到对应 tag，diff 出文档变化，然后调用 Claude CLI 来更新 skill 文件。


## 这个模式的几个优点

**文档即数据源**。不是手动摘抄文档写到 prompt 里，而是直接引用官方仓库。submodule 保证拿到的就是官方内容，没有二手信息的偏差。

**可追溯**。skill 文件对应哪个版本有据可查，过期了跑一下脚本就能更新，不用人肉翻 changelog。

**可扩展**。要给另一个框架加 skill，加个 submodule、写几个 md、在 AGENTS.md 里引用就完事了。


## 局限

antfu 的方案围绕前端生态（Vue/Vite/Nuxt），skill 的安装走的是 pnpm，对其他技术栈不直接适用。而这个改版方案简单点 —— submodule + 手写 skill 文件 + shell 脚本，没有那套 meta.ts 和 vendor 同步机制。不过对于"项目里用了两三个 AI 不熟的框架"这个场景，够用了。

另外 skill 文件的质量很关键。太长 AI 不一定全读，太短覆盖不了关键 API。目前每个文件控制在 200 行以内，按主题拆分（core / injection / aggregation / scopes / multiplatform / viewmodels），实测下来还不错。
