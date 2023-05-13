---
layout: post
date: 2017-05-23
title: "构建指北 #4 aar 和 tools:replace 冲突"
tags: [Android, Gradle, Android Gradle Plugin, 构建, post]
---

*『构建指北』是探索 Android 构建相关的一系列文章，涵盖了 Gradle、Android Gradle Plugin、Kotlin Script 等工具，以及相关架构上的应用。以发现问题解决问题为出发点，传递新知提高生产效率为落脚点。*

最近做一些 SDK 升级时，有些包引入后会有诸如此类的报错：

> AndroidManifest.xml:22:9-40 Error:
    Attribute application@theme value=(@style/AppTheme) from AndroidManifest.xml:22:9-40
    is also present at [some:libraries:version] AndroidManifest.xml:9:18-62 value=(@style/AnotherTheme).
    Suggestion: add 'tools:replace="android:theme"' to <application> element at AndroidManifest.xml:18:5-65:19 to override.

这是一个很常见的错误了，照着提示做 `replace` 就 OK 了。**但是当我加上** `replace` **的代码后，发现依旧报错：**

> Multiple entries with same key: @android:theme=REPLACE and android:theme=REPLACE.

**百思不得其解，查看了一下依赖库的** `AndroidManifest.xml` **源码，发现它也设置了**`tools:replace="android:theme"`**，而 Manifest Merger 把这个视为冲突抛了出来。**

<!--more-->

## 思考

如果只是跟着 [官方的 Manifest Merge](https://developer.android.com/studio/build/manifest-merge.html)，这个问题恐怕无解。[StackOverflow](http://stackoverflow.com/questions/35131182/manifest-merge-in-android-studio) 上也有人问过这个问题，但是没有更多的解法回复。

为什么依赖库会想不开去设置 `replace` 属性呢？很大的一个可能是：他也碰到了他的依赖库和他的 Manifest 有冲突的情况。那么我们能做什么？我们始终还是想要把他的某些属性给替换掉的（theme/allowBackup/...），不管他是出于什么样的目的，都不能阻止我想打出包的心！

## 解法

通过简单的观察和源码查看，我们发现 merge 是发生在 `process${variant}Manifest` 这个 Task。那么就得想办法在执行这个任务之前 Precheck 一下所有依赖的 `AndroidManifest.xml`。

[Seal - A gradle plugin to do precheck of Android Manifest.](https://github.com/2BAB/Seal)

我写了一个简易的插件来做这件事，目前支持两个功能：

1. 删除 Application 节点的某些属性，如 `debuggable`、`theme`、`allowBackup`；
2. 删除 Application 节点中 `tools:replace` 属性的某些值，如 `android:icon`、`android:theme`、`android:allowBackup`；

这个插件不仅能解决上述提到的问题，还能顺带修复诸如下面这种 Warning：

> Warning: AndroidManifest.xml already defines debuggable (in http://schemas.android.com/apk/res/android); using existing value in manifest.

而我们所需要做的，仅仅是指定我们不需要 libraries 的那些属性：

``` gradle
def projectRoot = project.getRootProject().rootDir.absolutePath

// 依赖库的 Manifest 文件搜索路径
// 1. Gradle plugin 2.3.0 或者更高版本，会默认开启 build-cache 功能，Release 版本的库会解压到这里
// 2. 但是我们同样需要对 SNAPSHOT 的库做预检查，所以还需要加入 exploded-aar 的目录
// 3. 有更多自定义的目录或者 module，请自行添加
def manifestPath = [
        // for AAR of Release
        // see note below
        projectRoot + '/build-cache', 
        // for AAR of SNAPSHOT
        projectRoot + '/app/build/intermediates/exploded-aar'
]

def removeAttrs = [
        'android:debuggable'
]

def replaceValues = [
        'android:allowBackup'
]

seal {
    enabled = true
    manifests = manifestPath

    appAttrs {
        enabled = true
        attrsShouldRemove = removeAttrs
    }

    appReplaceValues {
        enabled = true
        valuesShouldRemove = replaceValues
    }
}
```

需要注意的是，如果开启了 `build-cache`, Seal 建议你把 build-cache  的文件夹放在工程目录内（就是上面配置里的 build-cache 位置）。
 
```
//gradle.properties
android.buildCacheDir=./build-cache
...
```

更多信息，请参考 Github 仓库内的说明，欢迎大家提 PR 和 ISSUE。


*欢迎关注我的[公众号和微博](/about)。*