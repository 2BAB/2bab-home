---
layout: post
date: 2026-03-15
title: "Teaching AI Coding Agents with Submodules"
tags: [ai, claude, skills, enpost]
---

Coding agents have knowledge cutoff dates — they tend to hallucinate when dealing with new frameworks or newer API versions. Even Context 7's documentation knowledge is roughly a month-old snapshot, which can already be outdated for fast-moving frameworks. So "how to feed AI the correct framework knowledge" is a practical problem.

I recently came across antfu's [skills](https://github.com/antfu/skills) repo. The idea is to process official documentation into AI-consumable skill files and load them into Claude Code as context. It's still at the proof-of-concept stage, but the architecture is worth learning from. I tested a similar approach in a KMP project.


## antfu's Approach

He categorizes skills by source into three types:

**Hand-maintained**: Personal coding preferences — Composition API, TypeScript, pnpm workspace, etc. Pure taste files, no automation involved.

**Generated from official docs**: vue, nuxt, vite, vitest, etc. Official documentation repos are pulled in as submodules, then scripts extract and distill them into SKILL.md files. This is the main focus.

**Vendored from external projects**: Projects like slidev and vueuse maintain their own `skills/` directories, which are synced over directly. This is essentially pushing an ecosystem norm — encouraging framework authors to maintain AI-facing documentation themselves. vueuse has already set up a dedicated `vueuse/skills` repo for this.

The core mechanism is submodules. `.gitmodules` has two categories of references:

```ini
# sources — official doc repos, used to generate skills
[submodule "sources/vue"]
    path = sources/vue
    url = https://github.com/vuejs/docs

# vendor — skills maintained by external projects, synced directly
[submodule "vendor/slidev"]
    path = vendor/slidev
    url = https://github.com/slidevjs/slidev
```

The output directory structure:

```
skills/vue/
├── SKILL.md              # distilled framework knowledge, the main file for AI
├── GENERATION.md         # metadata: source commit SHA, generation date
└── references/           # supplementary details
    ├── advanced-patterns.md
    └── core-new-apis.md
```

Generated skills have `GENERATION.md`, vendored ones have `SYNC.md` — both for version tracking with exact commit SHAs. You can tell at a glance which version of the official docs the current skill corresponds to, and whether it's outdated.


## Putting It into Practice

As an example, I have a project using [Metro](https://github.com/ZacSweers/metro) (a compile-time DI framework for KMP — more details in my [previous post](/en/blog/2026-03-15-metro-di-intro)). AI knows almost nothing about it. Following the approach above, I set up something similar:

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

The submodule is pinned to the tag matching the Metro version declared in `libs.versions.toml`. The skill files are then referenced in `AGENTS.md` (Claude Code's project instruction file), giving the AI correct API references when working with DI code.

Two additional things worth mentioning:

**A Gradle version-check plugin**. A convention plugin that compares the Metro version in `libs.versions.toml` against the submodule's git tag, and warns on mismatch. It's hooked to the debug build's package task, so it naturally triggers during daily development.

**An update script**. `update-skills.sh` reads the version from the toml file, checks out the submodule to the corresponding tag, diffs the documentation changes, and invokes Claude CLI to update the skill files.


## Why This Works Well

**Docs as data source**. Instead of manually copying documentation into prompts, you reference the official repo directly. Submodules ensure you're working with first-party content, no second-hand drift.

**Traceable**. You can verify exactly which version a skill file corresponds to. When it's outdated, run the script to update — no need to manually review changelogs.

**Extensible**. Adding skills for another framework is straightforward: add a submodule, write a few markdown files, reference them in AGENTS.md.


## Limitations

antfu's approach is centered around the frontend ecosystem (Vue/Vite/Nuxt), with skill installation via pnpm — not directly applicable to other tech stacks. My adapted version is simpler — submodule + hand-written skill files + shell script, without the meta.ts and vendor sync machinery. But for the scenario of "a project using two or three frameworks that AI doesn't know well," it gets the job done.

Skill file quality matters a lot. Too long and the AI may not read it all; too short and you miss critical APIs. I currently keep each file under 200 lines, split by topic (core / injection / aggregation / scopes / multiplatform / viewmodels). In practice, Claude Code has been able to find and reference the right files on demand.
