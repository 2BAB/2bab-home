---
layout: post
date: 2017-04-14
title: "构建指北 #3 再谈 AAR 与混淆"
tags: [Android, Gradle, Android Gradle Plugin, 构建, post]
---

*『构建指北』是探索 Android 构建相关的一系列文章，涵盖了 Gradle、Android Gradle Plugin、Kotlin Script 等工具，以及相关架构上的应用。以发现问题解决问题为出发点，传递新知提高生产效率为落脚点。*

之前写了篇[文章](http://2bab.me/2017/03/24/gradle-daily-crash-library-module-buildtypes/)讲到了由于 `buildTypes` 默认设置的原因导致  library module 无法 debug 的情况。事实上，当时只解决了打 Debug 包的情况，而忽略了打 Release 包时还埋了一个隐藏的问题。

问题还原：我们在做全局的 `rebuild` 或者 `assembleRelease` 时，会出现有些类找不到的情况，而 `assembleDebug` 不会。仔细观察会发现，这些报错的类都是被外部 module 引用的部分，例如 module A 有类 Clazz，被 module B 引用，则 Clazz 报错。

<!--more-->

既然推断是互相引用时才会出问题，那基本可以判断 proguard 出问题了。把 module release 时的 proguard 关掉试试，果然不报错了！回想一下 Android 的打包顺序，应该是这样的：

1. 分别打包各个的 library module（module 混淆）
2. 整合解压所有的依赖，包括本地的依赖和远程的依赖，和 application module 一起打整包（整体混淆）

**那么，面对不同的情况，应该要有不同的混淆策略：**

- 如果是本地的 library module：可以选择不在 library 做混淆，而只做全局的混淆，这样就不会出现上文的 module 相互引用找不到类的情况，并且只需要维护一份配置文件；

- 如果是输出到外部的 SDK，一般又分两种：

    - 闭源的：例如高德 SDK，友盟 SDK 等，一般会做 AAR 的混淆，但是会隔离出一个包或者一个类专门提供 API（也就是说明文档里的 API），这个包/类会 keep 住，但是大量的具体的实现会实施混淆，并且尽量把一些敏感内容、算法用 JNI 等方式去做调用。

    - 开源的：例如 Github 上的各类开源库，一般不做 AAR 的混淆，但是会提供一个 consumerProguardFiles 的配置项，用以保证库代码的关键部分不被混淆，如下（参考官方[用户指南](https://developer.android.com/studio/projects/android-library.html?hl=zh-cn)）
    
       ``` gradle
       android {
            defaultConfig {
                consumerProguardFiles 'lib-proguard-rules.txt'
            }
            ...
        }
       ```

*欢迎关注我的[公众号和微博](/about)。*