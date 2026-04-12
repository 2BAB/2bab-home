---
layout: post
date: 2021-07-11
title: "AB 的工程效率小集 #1 七月刊"
tags: [Android, Gradle, Android Gradle Plugin, 构建, 工程效率小集, post]
---

约是年初开始，我持续不断地在一些较有讨论氛围的社区、社群，参与我感兴趣的技术话题互动。经过半年的体验，这类持续输入输出对我个人有不少的收获。一方面我能从这些社区社群看到不少新东西，例如第一时间看到世界各地的技术访谈、博客、新闻、活动；另外一方面我的知识体系在反哺社区和讨论的过程中逐步完善。

可惜，不少的社区社群并不能被搜索引擎记录，例如 Slack、星球、以及各种普通 IM 工具内的群组。在第八期[“二分电台”](https://binary.2bab.me/episodes/008-enlightenment-n-self-innovation)讨论”持续学习“话题时，Randy 和我聊到了[《Learn in Public》](https://www.swyx.io/learn-in-public/)这篇文章——是的，**固然加入了某个 Slack 社区后可以在里面搜索历史记录，但是它依然不是搜索引擎可见的**。特别像 Gradle 这类大家“熟悉的陌生人”，我们每天都在用，但真碰到一个什么奇怪的问题想赶紧知道（不一定是 bug，可能只是一个用法、一个 API 的理解等），目前最好的办法还是去他们的 Slack 社区互动，纵然他们有论坛和 StackOverflow 的 tag。**这些“封闭”的内容无法有效地被更广泛的人群接受，新手很难从外部获取到最新的资讯、讨论；以至于我有时候甚至觉得技术分享的视频如果不把 timeline 和关键字标注出来，也会流失大量本来可以点击进入的观众。**

所以，我一直有这个想法：做一个月度或者半月的小集合，把我参与过、具有通用价值的一些东西记录下来、公开出去。

- 这类问答式的内容，如果单独写成一篇，可能有些 overkill 了，所以定位在一个月度的小集的形式；
- 目前以我参与过的内容为主，在所有的内容确保是无版权、或者我拥有版本的情况下，再整理、记录、沉淀，后面也会考虑加入一些 Slack 或其他群组上我看到的精彩内容；
- 至于分发形式，我斟酌的结论是：先在我的博客记录，公众号/掘金等二次分发，如果有其他朋友参与一起做且方向比较统一在工程效率和开发体验这块的话，可以尝试 Substack 这种邮件订阅的形式做订阅。但目标是不变的，需要在公开的互联网领域留下这些有参考价值的内容。

OK，那我们进入第一期的正文。**2021 年 7 月工程效率小集：**

## 构建：Gradle/AGP/CI/...

**[Q1](https://gradle-community.slack.com/archives/CA7UM03V3/p1624871227328200): To pass a bunch of File which come from different dirs, should I use `SetProperty<File>` or `SetProperty<RegularFile>` ?**

A1: 

- @vierbergenlars: I think a FileCollection is better suited for that.
It also gives you some nice additional methods to add files and to manage them.
- @wolfs: I agree, ConfigurableFileCollection is the analog to RegularFile/DirectoryProperty for multiple files.

这则问答来自于 Gradle Slack 社区，起因是我在写一个 demo 时发现有一个场景是需要收集一些来自不同文件夹的文件，并传入到某个 Task。对于这类场景，不管是多个文件、文件夹，或者混合的场景，使用 `FileCollection` 都是比较好的选项，因为它的 API 在面对这类场景时比较友好，比如 `from(varags Object)`。如果想保持一致性都使用 `Provider`，可以使用 `FileCollection.getElements()` API 转换。对这些类不了解的朋友可以参考 [Working with Files](https://docs.gradle.org/current/userguide/working_with_files.html#working_with_files) 和 [Lazy Configurations](https://docs.gradle.org/current/userguide/lazy_configuration.html)。

**[Q2](https://gradle-community.slack.com/archives/CA7UM03V3/p1624759837322700): Gradle 7.1 + zulu arm64 JDK11 do not run natively on my M1 Mac mini.**

A2: 这则问题我后来自己发现了问题（小黄鸭调试法），因为我使用 SDKMAN! 安装的 zulu 的sdk，但是 SDKMAN! 本身是通过 Rosetta2 转译运行的，加上它在命令行 `bash_profile` / `zshrc` 添加了一些东西（没细看了...大概是为了支持 Java 版本的切换等），导致 Gradle 起 java 进程时也都通过 Rosetta2 去跑。删掉重装后即可。

![](https://2bab-images.lastmayday.com/blog/20210712213206.png?imageslim)

**[Q3](https://gradle-community.slack.com/archives/CA83B1VLL/p1622211648007000)：From the performance perspective, is buildSrc still a bit worse than composite build?**

A3:

- @Vampire: This should still be true, but depending on your test project you might or might not be hit by a performance hit compared to composite builds. If your test project is too simple you will for example not see any difference. The point is, that `buildSrc` is automatically added to the class path of all build scripts in the main build and due to that the runtime class path of all tasks changed and thus all tasks in all projects are out of date if anything in `buildSrc` changes. If you use composite builds instead, only the dependencies you actually use by applying a plugin or adding it to the `buildscript` dependencies block are added to the class path of that specific build script, so all other build scripts / projects stay unaffected. If you apply all plugins you have to all projects you have, then there sill probabaly be no performance difference, as then still all tasks are going to be out of date when something is changed.I personally only use composite builds nowadays, also because I can then easily use composite build within (though there is a "work-around" now) and I can also move and rename it, for example to `<root project>/gradle/build-logic` instead of `<root project>/buildSrc`.

- @CristianGM: And...I should add another small difference, buildSrc runs its tests when it compiles, while composite build doesn't

这则问题讨论了在哪些情况下 composite-build 优于 buildSrc，主要的性能问题集中在是否把这个额外的编译脚本模块 apply 到所有的主代码模块中。


**[Q4](https://t.me/AndroidDevCn/195956): 我执行 gradlew bundle 命令的时候，为什么每个 product flavor 里面的配置都会被执行一次？如何给渠道设置版本名称？**

``` kotlin
producatFlavors { 
    india { 
        setProperty("archivesBaseName", "urbanic-${versioNameIndia}-${currentVersionCode}" 
    }
    
    india { 
        setProperty("archivesBaseName", "urbanic-${versioNameOther}-${currentVersionCode}" 
    }
}
```

A4: 

- Gradle 配置阶段的脚本是全部都会执行的，不然没法得到配置好的 Extension，也没办法得到 Task Graph；
- 就这段脚本而言它是执行 Flavor 的配置，像 `dimension` `applicationIdSuffix` `buildConfigField` 都是作用于 flavor 的（隐藏的 this 是 ProdcutFlavor)，`setProperty` 是作用于 project 的，所以会被覆盖；
- `archivesBaseName` 的配置看了下是从 Gradle API 来的，并不是 AGP 的（AGP 有挺多地方用了不过，但是没法搞 variant aware 的策略），如果你真想 hack 一下，那就根据你输入的命令 hardcode 对应的 property：`if(gradle.startParameter.getTaskNames().get(0).contains("India")) { setProperty(...) }`
- 现在应该用这个了 Artifacts API：https://github.com/android/gradle-recipes/blob/agp-4.2/Kotlin/getApksTest/app/build.gradle.kts （可以切分支查看不同版本 AGP 的 API，7.0 后稳定了），添加一个 Task 获取对应渠道 APK 后再修改名称。

**Q5: 对于想在 assembleDebug 后对 APK 执行一些操作的情况，可以用 `finalizeBy()`。**

A5: 

我也经常忍不住用😂，但是这个 API 有几个问题：

1. 如果一个 task 有多个 finalizer，它们是按 finalizer 的名字排序（相当于乱序；
2. Finalizer 可不管前一个任务执行成功没(见附图)，只要前一个任务执行了，它就总是会接着执行；

上面两点其实是 by design 的，所以官方文档的用例是用来做 task 的资源清理工作。我一直觉得自己有点滥用，不过有需要没办法的时候也只能用。

就这个 case 可能的几个别的解法是：

1. 用 `doLast()`，但是只接受 `Action` 而不是 `Task`；
2. 反向 `dependsOn()`, 让 `apkRenameDebug.dependsOn(resguardDebug)`，然后执行终端执行 `apkRenameDebug`；
3. 加一个类似 lifecycle task 的锚点 task 作为最后运行的 task，然后把前面那些 task 往他上面 `dependsOn()`，算是 2 的优化版（比较好看干净）；
4. 用 `buildFinish()` 生命周期监听器，所有任务跑完后取 apk 做处理可以不需要依赖 AGP；
5. 用新的 Artifacts API （见 A4 的链接）。

![](https://2bab-images.lastmayday.com/blog/lu2nXbi7yEZ1p0eoD3eKMSCjsKYy.jpeg?imageslim)

## Kotlin 周边：Koin/Ktor/Coil/...

**[Q1](https://kotlinlang.slack.com/archives/C0A974TJ9/p1623070601174400): Is it possible a feature/plugin depends on another?I need to transform the type with my feature before JsonFeature get it. The problem is JsonFeature should be able to parse SomeError or User, so I have to unwrap it from my Either before, if not, JsonFeature will try it with the Either class and it will fail.**

A1: For ktor client's plugin I used/created, I don't think there's a direct approach to implement this. But if u look into their implementations, can see the interceptor pipelines - base on the lifecycle of those pipeline, u can define the running sequence and thus make dependent relationship indirectly. In this case, probably u can use HttpResponsePipeline.Receive in your custom plugin to unwrap before JsonFeature works.

``` kotlin
scope.responsePipeline.intercept(HttpResponsePipeline.Receive) { (info, body) ->
    if (body !is ByteReadChannel) { return @intercept}
    // Do something you want and get the final result in String (others types I did not try)
    val result: String = decrypt(body.readRemaining().readText())
    proceedWith(HttpResponseContainer(info, ByteReadChannel(result)))
}
```

**Q2: Coil 加载时报错 `Software rendering doesn't support hardware bitmaps`**

A2：

1. [Recipes - Coil](https://coil-kt.github.io/coil/recipes/#shared-element-transitions)，你大概率是碰到了：Shared element transitions are incompatible with hardware bitmaps；
2. 除了上面那个，还有一些机型原生不支持，以及 OS 版本原生不支持的，库本身应该是处理好了：[https://github.com/coil-kt/coil/blob/main/coil-base/src/main/java/coil/memory/HardwareBitmapService.kt](https://github.com/coil-kt/coil/blob/main/coil-base/src/main/java/coil/memory/HardwareBitmapService.kt)
3. 查看所有相关 issue，没有看到超出上述范围的讨论，所以我觉得应该就是这样啦。


*欢迎关注我的[ Github / 公众号 / 播客 / 微博 / Twitter](/about)。*