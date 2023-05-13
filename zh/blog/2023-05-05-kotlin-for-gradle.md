---
layout: post
date: 2023-05-05
title: "Kotlin 成为 Gradle 默认语言！如何快速上手？KOGE 小册来帮忙！"
tags: [Gradle, Kotlin, Android Gradle Plugin, post]
---

自 4 月中 Kotlin Conf 上宣布了这条消息：“Kotlin DSL 现在成为新 Gradle 构建的默认设置”，不少 Android 技术群就热烈地在转发/讨论相关消息。

- “Compose 只用 Kotlin，现在连 Gradle 也默认用 Kotlin 了！”
- “Kotlin DSL 是什么？我 Groovy 已经学不过来了，原来写个构建脚本还可以用 Kotlin 吗？”
- ...

![](https://2bab-images.lastmayday.com/kotlin-is-the%20-default-lang-of-gradle-banner.png?imageslim)

**（能让三家公司一起发新闻稿，说明这事...真的稳！！！）**

没错，Kotlin 其实在 2016 就被引入了 Gradle 的构建工具中。并且，历经多年的集成和调优，终于在今年成为所有开发者的默认选项。只要你打开最新版的 Android Studio/IntelliJ IDEA，选择新建项目即可看到如下的提示：

![](https://2bab-images.lastmayday.com/20230505191241.png?imageslim)

IDE 将为开发者默认创建 `Kotlin DSL (buidl.gradle.kts)` 的相关脚本。

Gradle Kotlin DSL 带来的好处有：

1. 编译时检查。
2. 更好的 IDE 体验，包括自动补全，源代码导航，重构等。
3. 简化的声明式插件语法。
4. 丰富的 Kotlin 社区支持。

尤其第二点，“自动补全”是过去使用 Groovy DSL 编写 Gradle 脚本的一大痛点，现在 Kotlin 为我们解决了这个问题。而作为 Android 开发者的我，也十分享受一门语言带来的统一体验（App 主体开发和构建工具开发）。

不过，虽然 Kotlin 和 Gradle 大家都不陌生，但是二者的结合却对很多 Android 开发者有些新奇。**如何能快速上手 Gradle Kotlin DSL？甚至借这次千载难逢的机会，补足以前难以上手 Gradle 的遗憾？有请 [KOGE](https://koge.2bab.me/#/zh-cn/) 小册！（点击链接即可阅读，开源项目）**

![](https://2bab-images.lastmayday.com/koge-book-cover.png?imageslim)

**KOGE 是 Kotlin-oriented Gradle Essentials 的缩写，顾名思义是面向 Kotlin 的 Gradle 基础手册**。我们按照合理的先后顺序，列出新手最困惑的概念，再从一些互联网上已有的问题、源码、示例项目中去学习。它不是 “Awesome Gradle” 的项目收藏夹，**而是一份大纲，一本简练的自学手册。** 手册选择了 **Kotlin** 作为介绍 DSL 脚本和插件开发的语言，链接和用例以 **Android** 构建场景为主。

另外，“基础”的定义范围十分明确，它覆盖了下方第 1 点和部分第 2 点中的内容（源自我之前的一个[问卷调查](https://mp.weixin.qq.com/s/TmHYKMU1KYOTdN_ytZNWZA)）。重点解决**理解脚本、编写脚本，和常见 Gradle 工程化实践。**

> 1. “仅基础使用”（初级）：我能读懂、修改 build.gradle(.kts)，对 Gradle、AGP 有基础的认知，例如了解 Gradle 的任务机制，但碰到非 App 源码的编译错误有点不知所措；
> 2. “实现高效自动化、工程化”（中级）：我对工程化、自动化有一定的认知、追求，可以通过构建脚本拆分、自定义 Task 来实现日常事务的优化，例如使用 buildSrc 模块抽取并统一管理依赖、使用自定义 Task 组合 CICD 的流程，运用一些最佳实践来提高编译构建效率；
> 3. “编译构建增强”（高级）：我可以通过查阅 Gradle 文档、Debug AGP、编译期的 Profiler 日志，来自定义 Annotation Processor、Gradle Plugin 等解决一个项目碰到实际问题，抽象成一套可复用的工具；
> 
> ...
   
每个基础内容点都大致按如下四个步骤组织：

1. 它是什么？
2. 它能用来做什么？
3. 它的自学要点？
4. 主体内容，重点文档/文章链接、摘要、代码、运行结果等。

![](https://2bab-images.lastmayday.com/20230505193725.png?imageslim)

手册目前涵盖了 2 大部分，共 10 个章节，涉及了新手上路的方方面面。虽然有不少链接内容是英文，但详细的知识点阐述、代码实战其实都在这些链接的文章、文档中，有困难的朋友也可借助一些翻译工具进行学习。

！！！再放一次在线阅读地址：[KOGE](https://koge.2bab.me/#/zh-cn/) ！！！

想参与手册编辑，请访问 KOGE 的 [Github 仓库](https://github.com/2BAB/KOGE)。觉得这个项目好的朋友也欢迎点个 Github Star，并分享给你的同事朋友。

*欢迎关注我的[ Github / 公众号 / 播客 / 微博 / Twitter](/about)。*


