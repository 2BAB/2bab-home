---
layout: post
date: 2021-08-07
title: "构建指北 #10 Android 开发工具兼容性"
tags: [Android, Gradle, Android Gradle Plugin, 构建, post]
---

*『构建指北』是探索 Android 构建相关的一系列文章，涵盖了 Gradle、Android Gradle Plugin、Kotlin Script 等工具，以及相关架构上的应用。发现问题，解决问题，传递新知，提高效率。*

由于几个月前电脑 CPU 烧了，被迫换了 M1 的 Mac Mini，所以整个开发环境重新搭建了一遍。趁这个机会，我想整理几个基础工具的版本搭配策略、兼容性、以及在 M1 芯片上的表现。对于版本搭配和兼容性的一些讨论不局限于当前使用的版本和平台。

下方提及的版本分别是：

- Zulu JDK: 11.0.11
- Kotlin: 1.5.21
- Gradle: 7.1.1
- Android Gradle Plugin（AGP）: 7.0 & 7.1
- Android Studio: Arctic Fox 2020.3.1 & BumbleBee 2021.1.1 Canary 6

## JDK

**自 AGP 7.0 起，JDK 11 便是最低要求**。JDK 11 成为 LTS（Long-term Support) 版本已经有将近 3 年历史（Sep 2018），自身经历了 12 个小版本（11.0.12）的迭代目前相对成熟了。作为对比，上一个 LTS 的 JDK 8 2014 年发布，已经陪着我们走过了 7 年时光和 300 个小版本迭代。事实上作为 Android 开发者，即便目前项目是 Java 为主的情况，一般 Language Level 也仅 target to 1.8（一些 9-12 的特性 D8、R8 有支持，Android 11 12 也有融入）。Android 官方虽然说不会放弃 Java，但实际上对 Kotlin 的支持确实更给力。

从这个角度来看，JDK 11 带来给我们的更多是：

- Kotlin Compiler、Gradle、IDE 层面上性能的升级；
- JDK 8 将停止维护的情况下（3 年后），安全层面的持续保障；
- 适应新的发布机制，每半年一个小版本，三年一个 LTS 大版本，减少历史包袱跑得更快；

而 JDK 的升级策略我认为是：

- **保守派：如果不在意新语言特性，可以等每年 AGP 升级的情况来决定 JDK 的版本，因为 IDE 一般 bundle 了一个 JDK，Kotlin 编译器、Gradle 一直追着最新 JDK 并有不错的向下兼容——所以根据木桶原理等 AGP 升级了再升即可，目前看来 AGP 可能也只跟进比较稳定的 LTS 版本；**
- **激进派：Gradle 支持后即可测试；**

在 M1 Mac 上，由于 Oracle 还未有的 ARM64 版本，所以目前主流的做法是安装 [Azul](https://www.azul.com/downloads/?package=jdk) 维护的 `Zulu JDK11`。

![](https://2bab-images.lastmayday.com/blog/20210805160844.png?imageslim)

需要注意的是，常用的 JDK 管理工具 `SDKMAN!` 在我的测试中依旧跑在 `Rosetta 2` 的转译环境中。这会造成即便你是安装的 `Zulu JDK11`，通过 `SDKMAN!` 的脚本启动依然会显示 Gradle `java` 的进程跑在 Intel ABI 下。故目前建议从官网下载安装，等后续配套工具支持后再考虑切换。

![](https://2bab-images.lastmayday.com/blog/20210805162529.png?imageslim)

## Kotlin

Kotlin 的版本搭配限制相对不多，一般我考虑三个点：

- 有没有特别吸引人的新功能，比如刚放出稳定版的 Coroutine、Flow，或者新版本 Kotlin Multiplatform Mobile 的更好支持等；
- 用不用大迭代的第一个版本，例如观察刚发布时的 `1.4.0`，`1.5.0`，这条其实广泛适用于各类 Library；
- Gradle 目前 bundle/test 的 Kotlin 的版本，例如最新的 7.1.1 stable 依旧是用的 `1.4.31` 的 Kotlin（7.2 RC 则跳到 `1.5.21` 了）；

关于最后一点，如果使用的 Kotlin 版本和 Gradle bundle 的不一致，会出现如下 Warning：

>
>w: Runtime JAR files in the classpath should have the same version. >These files were found in the classpath:
>  ...
>    /Users/2bab/.gradle/caches/modules-2/files-2.1/org.jetbrains.kotlin/kotlin-stdlib-jdk7/1.4.31/84ce8e85f6e84270b2b501d44e9f0ba6ff64fa71/kotlin-stdlib-jdk7-1.4.31.jar (version 1.4)
>    /Users/2bab/.gradle/caches/modules-2/files-2.1/org.jetbrains.kotlin/kotlin-stdlib/1.5.21/2f537cad7e9eeb9da73738c8812e1e4cf9b62e4e/kotlin-stdlib-1.5.21.jar (version 1.5)
>    /Users/2bab/.gradle/caches/modules-2/files-2.1/org.jetbrains.kotlin/kotlin-stdlib-common/1.5.21/cc8bf3586fd2ebcf234058b9440bb406e62dfacb/kotlin-stdlib-common-1.5.21.jar (version 1.5)
> w: Consider providing an explicit dependency on kotlin-reflect 1.5 to prevent strange errors
> w: Some runtime JAR files in the classpath have an incompatible version. Consider removing them from the

用一个简单的例子看下问题是怎么发生的：

``` kotlin
plugins {
    id("com.android.application")
    // 没有指定版本，用的就是 Gradle bundle 的版本，
    // Gradle 7.1.1 对应的就是 Kotlin 1.4.31 的各种类库和编译工具
    kotlin("android") 
}

dependencies {
    // 而这里我们却用了 1.5.21 的最新版 Kotlin，就会出现如上问题
    implementation("org.jetbrains.kotlin:kotlin-stdlib:1.5.21")
}
```

解决起来也很简单：

``` kotlin
plugins {
    id("com.android.application")
    // 手动指定版本
    kotlin("android") version "1.5.21"
}
```

Kotlin [官方的文档](https://kotlinlang.org/docs/gradle.html)直接就演示了加版本号的写法。**但是，这个版本是 Kotlin 基于 Gradle 测试通过，而 Gradle 自身还没有基于它[测试](https://docs.gradle.org/7.1.1/userguide/compatibility.html)过并打包进去（见 Gradle 部分的配图），若出现了问题可能难以解决**：

所以我推荐的升级策略是：

- **保守派：等 Gradle 升级的时候再升级，例如 1.5.0 到 1.5.21 中间仅隔了两个月，Gradle 就跟进了；**
- **激进派：有实用的新功能或者大版本迭代后的第一个补丁版本就升。**

## Gradle

前面提到 Kotlin 的官方文档解释了各类和 Gradle 配合兼容的情况，反过来 Gradle 这边也有一个标明了 Java、Kotlin、Android 等各语言和平台的[支持文档](https://docs.gradle.org/7.1.1/userguide/compatibility.html)。

![](https://2bab-images.lastmayday.com/blog/20210805214442.png?imageslim)

像前面提到的 Java 版本支持，Kotlin 版本支持在这里便一目了然。除了 Kotlin 的支持会稍落后一两个月，其他工具的最新版本兼容都不成问题。而 Gradle 自身的向下兼容我觉得还不错，我基本上每个版本都升级。而上层的 AGP DSL，特别是老版本，则挺经常有大改动（好在 7.0 后终于强多了）。

所以我推荐的升级策略是：

- **保守派：根据 AGP 的[文档](https://developer.android.com/studio/releases/gradle-plugin)按最低版本进行升级（详见下图），例如 AGP 4.2.0+ 对应 Gradle 6.7.1+；**
- **激进派：每个补丁版本(x.y.1/2/3)或者每个版本都升（Gradle 没有 -betaX 的版本习惯，一般就是 Nightly 和 RC）。**


![](https://2bab-images.lastmayday.com/blog/20210806211434.png?imageslim)


另外，Gradle 7.0 后的版本原生支持了 M1，我个人的使用体验还不错。

## Android Gradle Plugin

AGP 的版本搭配限制我们在前面基本都介绍完了，以 7.0 为例，我们来看官方 Release Note 的兼容说明：

![](https://2bab-images.lastmayday.com/blog/20210806214019.png?imageslim)

额外补充一点：从 AGP 7.0 起，其版本会[同步 Gradle 的 major 版本](https://android-developers.googleblog.com/2020/12/announcing-android-gradle-plugin.html)，严格遵守 Semantic Versioning 体系（之前同步的是 AS 的版本）。也即 AGP 7.x 会适配 Gradle 7.x 的版本。不过 AGP 的发布时间依旧是随着 AS 一起发布，并且目前来看其 alpha/beta 的数字是跟随 AS 的，所以其实可以当成三者形成了某种默契的同步机制。

所以我推荐的升级策略是：

- **保守派：随 AS 正式版升级（或适当跳过第一个大版本更迭）；**
- **激进派：每个版本都升，或从 alpha/beta 开始升级，例如要做 Gradle 插件适配。**

## Android Studio

AS 基本上没有什么搭配限制，只要你用的之前正式版的 AGP，AS 就可以向下兼容。我推荐的升级策略是：

- **保守派：适当跳过第一个大版本更迭；**
- **激进派：每个版本都升，或从 alpha/beta 开始升级，例如要做 IDE 插件适配或者对 Compose、调试工具新功能等有需求的。**

另外，由于 AS 基于的 IDEA 社区版二次开发，整体稳定性、新特性支持的速度都不如 IDEA Ultimate，例如 Gradle 的 nesting Composite Build 目前就不在 AS 支持范围，见该 [issue](https://issuetracker.google.com/issues/189366120)。

最后，自 Arctic Fox 2020.3.1 起，AS 原生支持了 M1，但如果想有更流畅的体验，我认为 BumbleBee 2021.1.1 Canary 效果更好一些。

## IDEA

IDEA 的主要搭配限制来自于 Android Plugin（Android IDE 插件）的版本适配。一般来说，在 AS 新的正式版本发布之后，下一个 IDEA 的正式版本就会带上该新版插件，从而对Android 开发包括 AGP 做支持。

![](https://2bab-images.lastmayday.com/blog/20210807154410.png?imageslim)

偶尔也有等比较久的时候，比如今年 AS&AGP 4.2 在 4 月发布，而直到 7 月 IDEA 2021.2 [发布](https://www.jetbrains.com/idea/whatsnew/#Other)时，才更新了 Android Plugin，官方的说法是 Google 放出 AGP 4.2 的源码时间晚了些，导致没赶上 2021.1 的版本。

我推荐的升级策略是：

- **保守派：仅升级正式版本；**
- **激进派：从 EAP 或 RC 开始升级，例如会获得比较好的 Kotlin 支持、更早的 AGP 支持，以及 M1 平台的优化等。**

最后，2021.2 也是让我在 M1 感觉终于不再有什么卡顿的版本了。

## 总结

我自己由于使用 M1 的平台 + 适配一些 [Gradle Plugin](https://github.com/2BAB)，经常会使用 beta 甚至 alpha 的 AGP（作为 Runtime 的 library），配合最新的 IDEA Ultimate 开发起来还是挺顺手。

而公司项目，现阶段 x86 平台我觉得可以使用如下配置，ARM M1 则根据上文调整对应的工具版本：

- JDK 11（由于 AGP 升了迟早要升级）
- Gradle 7.1.1（7.2 支持 1.5.21 后可以升级）
- Kotlin 1.4.31
- AGP 4.2.2（7.0 稳定了新版的 Variant API，马上 7.1 也稳定新版的 DSL，不需要 Compose 的话可以观望观望）
- AS 4.2.2（不需要 Compose 的话可以观望观望）
- IDEA 2021.2

*欢迎关注我的[ Github / 公众号 / 播客 / 微博 / Twitter](/about)。*