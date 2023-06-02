---
layout: post
date: 2023-05-17
title: "《Android 构建与架构实战》FAQ"
tags: [Gradle, Kotlin, Android Gradle Plugin, EAB, post]
---

- [本书介绍](https://2bab.me/zh/blog/2023-05-14-extend-android-build-zh-unevils/)
- [资料仓库](https://github.com/2BAB/Extend-Android-Builds-zh)

### 1. 在知识星球购买后，我需要每年续费吗？不续费还看得到吗？

知识星球到期后**可以继续阅读**的，和其他地方购买在线电子书的体验一致。只是不再获得后续的更新或参与星球讨论。

请参考知识星球的[常见问题](https://help.zsxq.com/howto/faq/user#xing-qiu-dao-qi-hou-hai-neng-bu-neng-cha-kan-zhi-qian-de-nei-rong)说明，只要不出现违法行为被平台踢出或主动点击退出/删除，均可**永久获得你所购买时间内该星球的内容**。


### 2. 本书会有纸质版吗？

因为出版社对小众选题很谨慎（一般首印最低 3000 本），今年形式不好他们表达了很多担忧。所以我目前没有拿到出版合同。


### 3. 后续还会更新吗？

对于《Android 构建与架构实战》主体内容，采用的是跳级更新的形式，例如当前版本为 AGP 7 为主 + 部分 8 的内容前瞻（即 Alpha/Beta 版本）。下次大版本更新为 AGP 9 为主 + 部分 10 的前瞻。因此，中间仅会出现极少的小版本断档。

采用这个模式的原因是 AGP 的更新较为谨慎，在改成跟进 Gradle 的版本更新（即从 4.2 跳 7.0）之后，一般不会出现突然连续两个大版本有大量 Breaking Changes。例如 AGP 7 在 2022 年预告了 8 会有很多 API 被删除，而 8 目前**没有**预告 9 会有很多 API 被删除。**这个模式的更新可以系统性回顾过去、给出一点未来的开发方向预测，让读者更全面的了解变更背后的原因，而不是一味追新不知所以，是应对 AGP API 变化的一个有效策略**。

对于日常的 Gradle 和 AGP 新功能，将采用星球的常规内容发布作为更新渠道，并打上对应的标签（新知预告 或 Gradle&AGP），方便大家系统性阅读更新。

最后对于错误的订正包括文字说明不清楚、代码有 bug 等问题，会及时修复更新。


### 4. 到底是卖书还是卖星球？

本 FAQ 写于 2023 年，此时媒介发展的多元性已经超出我们的想象，就如同未来我们与 app 交互可能是 AI 对话框一样——我目前只能说这是一个混合模式。如果按照内容重点划分，70% 是电子书，15% 是新知预告，15% 是问答和会员播客。

知识星球对素人申请很友好，支持内容的长期动态更新，是我选择的原因之一。


### 5. 是否有试读？

知识星球目前不支持相关功能，但本书的小部分内容曾以演讲、文章的形式公开分享过，下面精选了几个近期的分享，你可以将其当作“另一种试读”：

- [Kotlin Symbol Processor 应用与技巧 - @JetBrains Kotlin 中文开发者大会 / 2022-11](https://www.bilibili.com/video/BV1n3411o7bM/?share_source=copy_web&vd_source=9d2424d15cc388ad6e0a79bae33ceb9f)
- [构建指北 #12 根据 Variant 决定是否启用插件](https://2bab.me/zh/blog/2021-12-21-enable-feature-by-variant/)
- [为 Android App Bundle 打包加点料 - @Google 中国“社区说 - AGP 编译构建”专场 / 2023-05](https://www.bilibili.com/video/BV1eM4y1i7xP)
- [扩展 Android 构建流程 - 基于新版 Variant/Artifact APIs - @Google 中国“社区说”活动 / 2021-12](https://www.bilibili.com/video/BV1WP4y1G71h/?vd_source=7d02d0c6cd783fe64a99f3c7464fb242)

我的[个人网站](https://2bab.me/zh/)中还有更多分享的内容。


### 6. 和《KOGE》小册的关系？

很多人应该看到了最近 Kotlin 官方和 Gradle 官方在转发我的另外一本开源小册 [《KOGE》](https://2bab.me/zh/blog/2023-05-05-kotlin-for-gradle/)和《Android 构建与架构实战》又有哪些不同？

![](https://2bab-images.lastmayday.com/Screenshot%202023-05-15%20at%209.51.49%20AM.png?imageslim)

- 《KOGE》小册是一道开胃小菜，它**面向 Android 和 Gradle 的新手**，搞懂脚本的配置与简单的自定义任务，大多数内容均为互联网上的公开文章和资料——而遍数全网，Gradle 与 AGP 的内容多数能找到仅为入门的内容。
- 《Android 构建与架构实战》是一桌宴席，它面向**想要成为高级工程师甚至架构工程师的人**，不再局限于一般的脚本配置与小修小补，而是真枪实弹地编写 Gradle 插件（大小共 40+ 个案例），实战编译构建方向的架构设计，结合 Android 领域的特定场景去理解 AGP 的最佳实践等。

同样是使用 Kotlin 作为 Gradle 脚本/插件的编写语言，**《KOGE》完美地成为了本书的前置课程**——事实上《KOGE》便是本书在写作过程中产生的想法：如果能把基础概念都归纳到一本小册子，《Android 构建与架构实战》就能更流畅地专注在插件编写、AGP、架构、最佳实践等进阶命题。

倘若成为该领域的专家需要 10 分的知识储备，《KOGE》能做到 2 分，而完整消化本书能帮你提升至 7-8 分。

### 哪里可以购买？找不到阅读入口？

本书目前上架了[电子版](https://t.zsxq.com/0eF9jWLpY)：定价 ¥499，点击链接或扫描下面二维码购买，进入后请点击“专栏”阅读（推荐使用网页版获得最佳阅读体验，我也提了功能改进建议，希望他们可以在电子专栏页面加入更方便的阅读模式）。

![](https://2bab-images.lastmayday.com/51112188854524T3.JPG?imageslim)

*欢迎关注我的[ Github / 公众号 / 播客 / Twitter](/zh)。*


