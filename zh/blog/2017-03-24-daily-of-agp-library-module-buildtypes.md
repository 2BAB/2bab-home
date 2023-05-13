---
layout: post
date: 2017-03-24
title: "构建指北 #1 Library Module BuildTypes"
tags: [Android, Gradle, Android Gradle Plugin, 构建, post]
---

*『构建指北』是探索 Android 构建相关的一系列文章，涵盖了 Gradle、Android Gradle Plugin、Kotlin Script 等工具，以及相关架构上的应用。以发现问题解决问题为出发点，传递新知提高生产效率为落脚点。*

最近工作中换了一个工程，重新配了一遍 Gradle 的环境，然后发现所有的 Library Module 都无法 Debug 或者只能取到某些全局变量（局部变量找不到）。百思不得其解时，突然发现我明明打的是 Debug 包 `assembleDebug`，我的 Library Module 执行的却都是 `transformClassesAndResourcesWithProguardForRelease
`。明明在这些 module 都配置了 `debug` 的 `buildTypes`，但却不生效，反而打了混淆的 release 包。

<!-- more -->

``` gradle
debug {
    debuggable true
    jniDebuggable true
    minifyEnabled false
    zipAlignEnabled false
    signingConfig signingConfigs.debug
    ...
}
release { 
    debuggable false
    jniDebuggable false
    minifyEnabled true
    zipAlignEnabled true
    proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard.cfg'
    signingConfig signingConfigs.release
}
```

这个时候，[@阿咏](https://github.com/lomanyong) 给了我提示：[http://stackoverflow.com/questions/28081846/use-different-build-types-of-library-module-in-android-app-module-in-android-stu](http://stackoverflow.com/questions/28081846/use-different-build-types-of-library-module-in-android-app-module-in-android-stu)。

> Well, Gradle Android plugin simply can't build the debug version of dependent library modules. This is a well-known, old issue and this is not resolved yet.

原来这是有历史原因的，这东西就是这么设计滴（By Design），只能想办法绕一下。例如在这个问题下方的讨论里就提供了一种思路：

``` gradle
android {
    publishNonDefault true
}

dependencies {
    releaseCompile project(path: ':yourLibrary', configuration: 'release')
    debugCompile project(path: ':yourLibrary', configuration: 'debug')

    // This is also possible
    customCompile project(path: ':yourLibrary', configuration: 'custom')
}
```

**不过，这样在有多个 Library Module 依赖的时候，显得不够优雅。这边我提供了一个自己的思路：**

``` gradle
android {

    ...
    
    buildTypes {
        release {
            debuggable isDebug()
            minifyEnabled !isDebug()
            zipAlignEnabled !isDebug()
            proguardFiles getDefaultProguardFile('proguard-android.txt'), '../tools/proguard.cfg'
            signingConfig signingConfigs.release
        }
    }
    
    ...
}

def isDebug() {
    if(gradle.startParameter.getTaskNames().size() == 0) { // for clean etc..
        return true
    }
    return gradle.startParameter.getTaskNames().get(0).contains("Debug")
}
```

**我们就只提供一种 buildType，也就是默认的 release，然后把type 内的配置动态化即可。这种方案适合只有两三种 type 的情况，可以用少量的代码在 Library 内部就解决问题。**

*欢迎关注我的[公众号和微博](/about)。*