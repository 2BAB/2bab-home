---
layout: post
date: 2024-05-31
title: "KotlinConf 2024 参会体验"
tags: [社区的力量, post]
---

一年一度的 Kotlin 盛会又来了，我在去年的《[KotlinConf 2023 参会体验](https://2bab.me/zh/blog/2023-04-15-kotlin-conf-23-exp/)》中提到“明年，再相见”也兑现了。这次我第一时间在中国大陆的一些 Android 群组发布了开票信息，自己也自然是订到了超级早鸟票。这篇文章同样是手机上的速记，所以简化或省略一些专业术语解释，以及排版等的问题还望见谅。  

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-1.jpg?imageslim)
  
今年的会场位于丹麦哥本哈根的 Bella Center，整体规模比去年宏大（2000 人 vs 1000 人）。虽然去年的餐点菜式花哨、会场建筑又特别有历史感，搞得今年稍显逊色，但会务水平依旧很高。  

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-2.jpg?imageslim)
  
![](https://2bab-images.lastmayday.com/kotlin-conf-2024-3.jpg?imageslim)  
  
![](https://2bab-images.lastmayday.com/kotlin-conf-2024-4.jpg?imageslim)  

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-5.jpg?imageslim)
  
![](https://2bab-images.lastmayday.com/kotlin-conf-2024-6.jpg?imageslim)

这一部分建议大家关注 Kotlin 官方布道师圣佑和我们几个朋友一起录制的现场速览视频（预计过两三天就会放出），以及 Kotlin 炉边漫谈 下一期的现场特辑。  

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-7.png?imageslim)

（图为 JetBrains 中国的 B 站账号去年发布的现场实录）  


篇幅所限，本文的内容将会以个人视角为主。  

## 核心议程  
  
今年的核心表面上是 Kotlin 2.0 和 K2，实际上更偏 KMP。KT2 在去年公布后就官方一直公开分享着各种进度。所以功能其实在这次大会之前已经都发布，包括二进制包。大会更重要的部分是宣布 KT2 正式版本的到来，标志着 Kotlin 真正成熟了（原 Kotlin 语言设计师 Roman 表示），更多团队和项目适配的开始。语言本身的部分，则已经在讲 2.1 和 2.2 会 beta 的一些东西了，展望未来。  

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-8.jpg?imageslim)

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-9.jpg?imageslim)
  
但不得不说，大家等待 KT2 久已。不管是 Compiler 的性能大幅提升，还是一些早就得有的语法糖，都能影响实际开发体验。对于 KCP、KSP 等等的设计改动，也是更便利于我们这些插件开发者。  
  
而 KMP 这边，直接拿下了 20+ 场相关的主题分享，既有 JetBrains 和 Google 的一些官方 sessions，也有来自社区的最佳实。Google 这边去年稍微提及了 WorkSpace 套件迁移到 KMP，今年拿出来当成重点案例分享，也对应了今年 IO 上宣布的对 KMP 的大力支持。此外，Jetpack 里的其他工具，特别是 Room，今年也有详细的迁移分享。不管是不是 Room 的用户，从他们做库迁移的这块经验里都能发现一些有用的信息，包括如何同时支持 KMP 和 Android 上的 Java 生态，如何更新和解决测试的问题，如何在 iOS 平台上桥接底层 native 库（sqlite）等等。KMP 的开源库已经达到了几千个（具体的可以看下 John Orelly 的那场 KMP Libraries 分享回放），增长速度不亚于其他跨平台工具的早期情况。  
  
Compose 这边除了一些常规的性能优化和常见的多平台实践分享，最有趣的可能是 Jake 分享的 Compose 到嵌入式系统 UI 的使用（我还没看，几个朋友强推）。  
  
当然，Gradle 方面的内容我是肯定去听了。今年核心的宣传点是 Gradle Declarative DSL，其思路是以大部分开发者的诉求出发，去剥离构建的配置部分（只支持配置一些基础数据类型）与逻辑部分（复杂的构建自定义，插件为载体任务为单位）。目前只有 EAP 放出，需要配合一堆 nightly 版本食用，会不断改进相关功能和工具在今年底进 beta。  

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-10.jpg?imageslim)
  
只看上面这两句解释其实还有点抽象，实际上这背后工作挺复杂。他们基于 Kotlin 的语法，抽了一套 KTS 的子集，基本上可以理解为只支持现在的 Gradle Extension 配置。这个新的配置文件名是 "build.gradle.dcl"， dcl 即 declarative 的缩写。带来的好处是可以自定义 parser 去解析和处理这个文件，而不是标准的复杂的 kotlin 编译器，Configuration 阶段性能上得到巨大提升（大约是 KTS 1/6 的耗时）。在现场和 Slack 的人聊天时，提到了 Configuration Cache 对于大项目不够快的问题，即便一个 module 0.3s，一千个 module 的时间（300s）也有点太长了的问题。相信在这个新配置文件支持后，也会有明显改善。  
  
此外今年我还关注了一下更偏软技能的一些 Talks，包括第一天下午的 "Tools&Techniques for Java to Kotlin Migration"，以及第二天早上的 "The best programmer I know"。第一个对于很多想去大公司的朋友会很有借鉴意义，可以听到几百万行代码的各种工程都是如何一步一步做这种技术迁移的。这内部所需要的资金和资源支持如何去争取，一些推不动的人和组怎么去沟通，为什么要定期收集内部开发者的反馈，如何找到新技术的价值等等。第二个我个人认为更像独立开发者的 Golden Rules，如果没有读过这一类的博客或者生产模式介绍，那会挺有借鉴意义。  

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-11.jpg?imageslim)

所有剪辑后的视频会在一两周后放出，目前你可以通过这个回放列表观看之前的直播回放：https://www.reddit.com/r/Kotlin/comments/1d08rv8/is_it_possible_to_watch_the_recordings_of_the/  

## 深度交流  
  
今年花了更多时间在深度交流上，少了一些新朋友寒暄。一方面去年加过很多人，大家再次见面总是有更多内容聊，另外一方面那两天喉咙发炎了 sad，有限的声音就留给一些深度话题了。下面，我会摘几段比较有意思的内容。  
  
![](https://2bab-images.lastmayday.com/kotlin-conf-2024-12.jpg?imageslim)  
第一段是和 Google 的语言和开发者工具领头人之一 Jeffery 的对话，我重点问了这次 IO 以后的博客文章里为什么 Google 没有提到 Compose Multiplatform，而是用 "共享逻辑走 KMP，既共享 UI 也共享逻辑用 Flutter"来总结 Google 目前在端侧的一些跨平台支持。他的回答很有意思，总结一下主要两点：1. Compose 还有很多发展空间，现阶段我们还在下功夫对 Android 提供更好的支持以及各种性能的提升，现在没有提不代表以后，等更成熟的时候再看 2. Flutter 在做一些统一性强（unified）的项目时很方便，而 KMP 也有自己特色，包括和 Native 更无缝的互调（例如 uikit 的 bindings），CMP 在此基础上能实现的其实很多。  
  
我认为他说的很中肯，包括对 kmp 和 cmp 现在几种模式的集成其实是有很多想象的。比如你可以像早期的 KMP 一样就只集成逻辑部分包括，用来开发 data repository 和 infra，包括一些 sdk。再例如 cashapp 家的 redwood 并没有用 cmp 的 ui 组件，只是用了底层 composition 构建虚拟结构的部分，实际渲染是映射到 Native，甚至支持 kt/js 的热部署。KMP 的迁移吸引力其实很明显：native 的性能，渐进式的集成。往前你可以集成 CMP（部分功能或者页面，部分包层级，当然也可全部都上），后退一步时你可以保留把它当 native sdk 用，其他部分走某个未来的新技术。它很难出现例如一个创业公司上了 Flutter 后，想支持更好的性能和高级需求时决定重写大部分功能甚至整个 app 的情况。  
  
![](https://2bab-images.lastmayday.com/kotlin-conf-2024-13.png?imageslim)  

第二段是和 Gradle 的 Principle Engineer，Paul 的对话。我们聊了社区对 Gradle "很难学"这个普遍情况的看法。其实在 Android 这边问题不仅是 Gradle，主要还有 AGP 以及一票打包编译工具包括 aapt2，r8，ksp 等等，他们也没多少公开文档和详细用户指南。而 Gradle 本身的问题我去年写过说文档需要改进，这点其实他们有在努力，包括新的组织形式，更多的课程分享，以及和 Android 那边一起推 recipes，互相的链接引用。Gradle 开源的构建工具这边核心团队只有 18 人，我们从公开渠道可以看到新入职员工多数投入到 enterprise 项目（develocity）了，对于新需求的支持其实是压力不小的。臭美一下：他主动说这两天要在 booth 工作太忙了，过段时间读一遍我的书给我一些反馈。  
  
此外我还和他以及 Sterling 聊了下 Declarative DSL 的工具支持，他们在现场演示的那个 Compose Desktop 工具超赞，可以支持查看一个 dcl 下相关 Software Type 的所有配置。而这个工具还只是 demo，我建议他们可以合并到 IDE 插件里（毕竟 compose 也是 idea 的插件支持技术）。该工具并且未来会和更多其他的源码跳转支持进行整合，既可以点击看文档和声明，也可以链接到后面的插件源码。  
  
第三段是和 Slack 的 Boon 多次加起来长达一个多小时的聊天。Boon 来自新加坡，目前在西雅图的 Slack 负责 Android 的一些业务架构。Slack Android 有上千的模块，Kotlin 和 Compose 的使用已经多年。有趣的是它们的基础架构和开发者体验组（更偏工具感觉）是分开的，公司被 SF 收购后也仍有不少开源项目的支持。而近年痛点有对 Compose 性能部分的，也有编译构建执行时间的。比较感慨并且观察一致的是新加坡因为和美国有 h1b1 的协定，很多人才去了美国，新加坡本土的技术氛围其实较为薄弱。他常年跑技术大会，IO DroidCon KotlinConf 都会去，帮忙认出了不少在现场的牛人，像 DroidCon 的 ceo、Kotlin 语言前任和现任设计师、Uber 的 Ty Smith 等。包括后来我去和 cashapp 的一桌人聊天也是因为他早早提示我 paparazzi 的维护者 John 也在现场。  

题外话，后面还去了 CashApp 那桌和 John、Ty、Mohit 等人聊了半小时，发现 John 和 Jake 还在现场工作，合并 PR，真丶社区大佬。  

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-14.jpg?imageslim)

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-15.jpg?imageslim)
  
## Extending Android Builds (EAB)  
  
EAB 是[《Android 构建与架构实战》](https://2bab.me/zh/book/)一书的英文版，上个月刚刚出版。去年我在 KotlinConf 大会现场有些青涩地找人帮忙看 'Extending Android Builds' 的目录和书稿，得亏了那次大会才使得本书内容更完善。今年则是自信多了，直接带着刚发售的纸书和海报去的。  

![](https://2bab-images.lastmayday.com/Screenshot%202024-04-02%20at%209.09.51%E2%80%AFAM.png?imageslim)
  
第一天早上 8 点刚到会场，我就去了 Gradle 的展台。上个月 Gradle 官方 [Newsletter 刚刚推荐过我的新书](https://newsletter.gradle.org/2024/04)，这次一来就现场送书给 Gradle 团队，算是还愿了吧。我们聊了特别多东西，当他们问我要试读内容的二维码时，正好把海报给了他们。  

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-16.png?imageslim)
  
然后，他们真的**把海报放在了 Gradle 的展台，帮忙宣传了两天，大家路过围观时他们还会介绍下这本书**！而 Gradle 团队的热情还不止于此，我还被邀去**参加了 Gradle 的采访**，聊聊书的创作过程，给新人的建议，对 Gradle 未来的展望等等。视频之后会在他们的 YouTube 频道放出。  

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-17.jpg?imageslim)
  
而到了 Google 的展台，我一眼认出 AGP 团队的 Chris Willington，没听错的话他说他现在是 AGP 团队在伦敦的 Manager 了。我表示自己看过很多遍他之前在 ADS 上的分享视频，真是相见恨晚。去年遇到 Ivan 给了我很多帮助，今年 Chris 同样给了我很多信心，对本书的覆盖范围给予了肯定。可惜 Google 的展台没有放书 or 海报的机会哈哈哈，把书送给他后，他还分享给了其他同事看。  
  
![](https://2bab-images.lastmayday.com/kotlin-conf-2024-18.jpg?imageslim)  

除此之外，Google 的 Jeffrey 和 Uber 的 Ty 也翻看了本书，给到了一些建议，对于第二版的更新很有启发。特别感谢各位大佬的帮助，以及一定要珍惜线下为数不多的聊天机会。
  
## 总结  
  
最后，今年比去年更开心的是中文开发者小分队的人数又增加了。除了我和圣佑，还有 Android GDE 兼 KUG 上海组织者的禹昂，KMP 专家 Yinlong，以及在瑞典的高中生 Zhuoxuan 和在伦敦的 SiaoJie。  
  
![](https://2bab-images.lastmayday.com/kotlin-conf-2024-19.jpg?imageslim)

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-20.jpg?imageslim)

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-21.jpg?imageslim)

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-22.jpg?imageslim)


希望明年 KotlinConf 再相聚！  

See you soon!