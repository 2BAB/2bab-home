---
layout: post
date: 2021-02-14
title: "构建指北 #9 Gradle 脚本调试"
tags: [Android, Gradle, Android Gradle Plugin, 构建, post]
---

*『构建指北』是探索 Android 构建相关的一系列文章，涵盖了 Gradle、Android Gradle Plugin、Kotlin Script 等工具，以及相关架构上的应用。以发现问题解决问题为出发点，传递新知提高生产效率为落脚点。*

本文想讨论下目前 IDEA / Android Studio 对 *.gradle.kts 脚本调试的支持情况。

## 可调试能力

关于可调试能力的定义，举个栗子，我们在常见的 `build.gradle.kts` 添加多种脚本片段，包括但不限于属性声明、文件读取、操作 Gradle 相关 API、操作 AGP 相关 API 等等，然后里打上多个断点，编译时 remote attach 上去，查看**能否在正确的地方挂起，能否获取到当前上下文的信息，能否执行 Expression Evaluate 等操作**。

具体到测试的点：

1. `android { default { ... } }` 闭包内的上下文信息；
2. `dependencies { ... }` 闭包内的上下文信息；
3. `build.gradle.kts` 脚本内的一小段自定义脚本，含属性定义，Gradle API 调用，AGP API 调用，这三个点的上下文信息；
4. `/buildSrc` 内的 `prebuilt.gradle.kts` 脚本内的一小段自定义脚本，同样上包含三个点；
5. `/buildScr` 内的一个自定义插件，运行插件 apply 方法时的上下文信息（作为调试能力完备的一个参照物）。

我前后做了两次实验，半年前用的 Android Studio 4.0 + IDEA 2020.1，第二次是最近用的 Android Studio 4.2.0-beta04 + IDEA 2021.1.EAP，下方的测试结果均使用第二次的 IDE 版本加上：

- Android Gradle Plugin 4.1.1
- Kotlin 1.4.30
- Gradle 6.8.2

这里我们以 Kotlin DSL 为主，Groovy DSL 的情况可参考自行分析。

## 多模块 Android 工程

第一个测试我们用的多模块（并且是多 Application）的一个工程，结果如下：

|序号| 测试项 | IDEA & Android Studio |
|:---:|:---:|:---:|
|1| `android { default { ... } }`  |  Y  |
|2|   `dependencies { ... }`       |  Y  |
|3|  `build.gradle.kts`            |     |
|3.1|                              |  N  |
|3.2|                              |  Y  |
|3.3|                              |  Y  |
|4  |   `prebuilt.gradle.kts`      |     |
|4.1|                              |  N  |
|4.2|                              |  Y  |
|4.3|                              |  Y  |
|5|   plugin                       |  Y  |


![](https://2bab-images.lastmayday.com/blog/Screenshot%202021-02-15%20at%2010.30.01%20AM.png?imageslim)

快速小结：

- 两个 IDE 的结果完全一致（虽然 AS 是社区版但并不意外）；
- 3.1 和 4.1 的断点可以被正确识别但无法获取上下文；
- **在对 `build.gradle.kts` 进行断点调试时，必须手动指定当前的 source 具体为哪一个脚本，如上图的下拉菜单；判断依据是当前 debug 面板的 Variables 里 this 对象提供的上下文信息，比如这里 this 指向了 DefaultConfig，而我们在多个脚本内只对 app module 的 defaultConfig 进行了断点，故选择 `app`**；
- **这个测试中 Gradle 脚本的调试支持还是不够完善。**


## 单模块 Kotlin 工程

接下来我们测试下一个简单的 Kotlin 工程：

|序号| 测试项 | IDEA & Android Studio |
|:---:|:---:|:---:|
|1| `java { ... }`                 |  Y  |
|2|   `dependencies { ... }`       |  Y  |
|3|  `build.gradle.kts`            |     |
|3.1|                              |  N  |
|3.2|                              |  Y  |
|3.3|                              |  N/A  |
|4  |   `prebuilt.gradle.kts`      |     |
|4.1|                              |  N  |
|4.2|                              |  Y  |
|4.3|                              |  N/A  |
|5|   plugin                       |  Y  |

结果和前一个多模块的 Android 工程并无差别。

## 常见调试问题

再列几个常见的问题供大家参考：

### 断点飞线

在遇到的一些简单需求时，例如修改生成的 APK 名称，我们经常直接在 `build.gradle.kts` 中进行脚本编写和调试。**调试过程中虽然你在 AS 或者 IDEA 中看上去断点是打上了，但是执行过程中各种无法匹配源码从而飞线乱跳的情况层出不穷，这时候你需要使用上述小结里的方法手动指定对应的脚本。**

### IDEA 对 Android Plugin 的支持

需要注意的是，一般 IDEA 对新功能的支持会更快一些，但是对 Android Gradle Plugin 的支持会比 Android Studio 慢一拍。例如当前 4.1.1 版本的 Android Studio 发布后，IDEA 才宣布我们将在 2020.3.2 支持 4.1 （但实际测试并不支持 4.1.1，[issue](https://youtrack.jetbrains.com/issue/IDEA-252775) 里写的 2021.1.EAP 才支持）

### 使用 Plugin 包装

早期基于 Groovy DSL + `build.gradle` 的脚本（大概在 AGP 2.x 时期），调试的支持更差。但有一种曲线救国的方法支持上述第三个测试点：把 `build.gradle` 内的自定脚本块封装成一个 Plugin。但目前 AS 4.2.0-beta04 或 IDEA 2021.1.EAP 中测试都不可行的。而 Kotlin DSL 这边虽然 API 介绍中看上去支持，但实际上插件无法被创建导致脚本编译不通过，也就无从谈起 Debug 了，这里给出一个 [issue](https://github.com/gradle/gradle/issues/13667) 参考链接。

![](https://2bab-images.lastmayday.com/blog/Screenshot%202021-02-15%20at%204.54.37%20PM.png?imageslim)

### build.gradle(.kts) 在 IDE 中显示了 Run 按钮

另外，有些同学可能在 `build.gradle` + IDEA 2020.x 的环境看到过如下的一个『运行按钮』和『菜单』，好像运行一个单元测试或者一个 Java main 方法一样：

![](https://2bab-images.lastmayday.com/blog/Screenshot%202020-07-03%20at%203.12.07%20PM.png?imageslim)

不过其原理与手动执行 Gradle Sync / Build 的过程应该是一致的，并且没有改变我们的测试结果。

## 总结

Gradle 脚本（特指 `*.gradle.kts`，不过 `*.gradle` 应该也差不多） 目前调试的支持上比较弱，复杂的逻辑尽量使用 `buildSrc` 内预编译插件/独立插件，其拥有完整调试的能力。

*欢迎关注我的[公众号和微博](/about)。*
