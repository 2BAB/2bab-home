---
layout: post
date: 2021-09-30
title: "AB 的工程效率小集 #2 九月刊"
tags: [Android, Gradle, Android Gradle Plugin, 构建, 工程效率小集, post]
---

关于为什么要做一份 Android 的工程效率小集，详见[小集第一期]()。如果你想加入或者投稿一些有意思的内容，欢迎通过[这些方式](/about)联系我。

本期开始我们加入了 "News(N)" 新知的内容。OK，那我们进入第二期的正文。**2021 年 8 月工程效率小集：**

## 构建：Gradle/AGP/CI/...

### N1：一个转换 Gradle 到 Bazel 的工具，并支持融合编译，可渐进式迁移。

https://github.com/grab/Grazel

### N2：

## Q1:
is it possible to use Kotlin DSL functions, in a plugin, without applying the kotlin-dsl plugin? The functions make writing plugins in Kotlin much nicer in many ways, but I don't see why they should be coupled to the Kotlin DSL per se.
In other words, are those functions in a separate jar I could declare as a normal dependency?

The gradleKotlinDsl() dependency notation (available only in Kotlin scripts) should give you the required libraries.

## Q2:

how can I kill all gradle daemon’s, regardless of version?

You need to use the task manager, search for java processes that are daemons and kill them
Or loop through Gradle versions and use --stop for all of them

``` bash
#!/bin/sh
jps | awk '$2=="GradleWorkerMain"|| $2=="GradleDaemon"{print $1}' | xargs kill
```

## Kotlin 周边：Koin/Ktor/Coil/...


*欢迎关注我的[ Github / 公众号 / 播客 / 微博 / Twitter](/about)。*