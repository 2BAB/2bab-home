---
layout: post
date: 2021-09-14
title: "Android App 编译构建知识的小调查"
tags: [Android, Gradle, Android Gradle Plugin, 构建，调研, post]
---

不久前写了篇文章[《Google I/O 21 Android Gradle Plugin 更新总结》](https://2bab.me/2021/06/17/google-io-21-agp-recap)，今天被 Google 的 “Android 开发者” 转载了。但收到了一些反馈是：能不能也写一些更基础的文章。确实我接触过的绝大多数 Android 开发者都对 Android 构建方面的知识有种敬畏感，Gradle + Android Gradle Plugin（AGP）的组合复杂度不低，而互联网上能找到的系统性资料稀少（英文都不多，中文就更少啦）。

> 底层技术：Gradle、AGP、Annotation Processor（AP）、AAPT、D8&R8、ByteCode modification、Dex modification、Kotlin Compiler、ZIP&APK&AAR&AAB、IDE Plugin、etc.

> 架构应用：依赖注入、组件化、插件化、多渠道包、SDK 按需接入、白牌应用、多维度测试（单元、集成、功能测试）、安全防护（混淆、加壳、native 加密...），Jetpack Compose、CICD 以及更多其他的自动化流程；

编译构建的知识不仅是单独的加快构建速度，也，还作用于运行期。才疏学浅，下方的选项仅基于个人的理解来编写，有不足之处欢迎私信我提建议~

1. ”仅基础使用“（初级）：我能读懂、修改 `build.gradle(.kts)`，对 Gradle、AGP 有基础的认知，例如了解 Gradle 的任务机制，但碰到非 App 源码的编译错误有点不知所措；
2. ”实现高效自动化、工程化“（中级）：我对工程化、自动化有一定的认知、追求，可以通过构建脚本拆分、自定义 Task 来实现日常事务的优化，例如使用 `buildSrc` 模块抽取并统一管理依赖、使用自定义 Task 组合 CICD 的流程，运用一些最佳实践来提高编译构建效率；
3. ”编译构建增强“（高级）：我可以通过查阅 Gradle 文档、Debug AGP、编译期的 Profiler 日志，来自定义 Annotation Processor、Gradle Plugin 等解决一个项目碰到实际问题，抽象成一套可复用的工具；
4. ”对编译构建有较为全面的理解“（资深）：我了解编译构建的主要环节实现，常见架构应用的原理，实践过多个编译构建增强工具，对项目的基础架构梳理得井井有条；
5. ”深度参与“：我了解 Android App 编译构建的前沿发展，积极参与社区 Discussion、Proposal、PR、Review，灵活运用、修改各类工具，对于不同类型的问题、需求能给出优解、多解。

![](https://2bab-images.lastmayday.com/blog/20210924115821.png?imageslim)

（为方便统计，参与调研请关注公众号“Android高效开发”进行填写）

*欢迎关注我的[ Github / 公众号 / 播客 / 微博 / Twitter](/about)。*