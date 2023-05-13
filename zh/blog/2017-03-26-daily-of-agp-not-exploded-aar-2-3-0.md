---
layout: post
date: 2017-03-26
title: "构建指北 #2 AGP 2.3.0 再无 exploded-aar"
tags: [Android, Gradle, Android Gradle Plugin, 构建, post]
---

*『构建指北』是探索 Android 构建相关的一系列文章，涵盖了 Gradle、Android Gradle Plugin、Kotlin Script 等工具，以及相关架构上的应用。以发现问题解决问题为出发点，传递新知提高生产效率为落脚点。*

升级 Android Gradle  Plugin 至 2.3.0 后，会发现 exploded-aar 这个 build 目录下的文件夹大部分情况下不存在了（但是仍然有时候会出现一两个 aar 的解压包，有些诡异）。这个改动最相关的原因是 2.3.0 默认开启了 Build Cache，具体在[这里](http://tools.android.com/tech-docs/build-cache)有说明。

<!-- more -->

而我们之前有一个需求就是从 app module 的 exploded-aar 的 assets 中收集其他 module 的一些信息，现在也无法进行了。Google 一下会发现也有人[怨声载道](https://code.google.com/p/android/issues/detail?id=228404)，并且有人给的[解法](http://likfe.com/2017/03/15/android-studio-exploded-aar/)是关掉 Build Cache。这显然是不满足我们提高生产力的需求滴，于是我研究了一下相关的源码。

搜索 BuildCache 字样不难发现，Library 相关的 Task 中有这样一段代码：

[->PrepareLibraryTask.java]

``` java
/**
 * Returns {@code true} if the build cache should be used for the prepare-library task, and
 * {@code false} otherwise.
 */
public static boolean shouldUseBuildCache(
            boolean buildCacheEnabled, @NonNull MavenCoordinates mavenCoordinates) {
    // We use the build cache only when it is enabled *and* the Maven artifact is not a snapshot
    // version (to address http://b.android.com/228623)
    return buildCacheEnabled && !mavenCoordinates.getVersion().endsWith("-SNAPSHOT");
}
```

所以第一个问题就解了，有用户提出 Cache 应该考虑到 Maven 仓库的发版习惯，对于 SNAPSHOT 这种经常会同版本多发版的情况需要忽略，采用降级方案（使用原来的 exploded-aar）。

那指望从这里去解决问题是没救了，但是既然之前是从 assets 里做的数据收集，那从 raw 做是不是也可以？毕竟这是两个极其相似的文件夹，但是在打包过程中的处理却有些迥异。

我们可以看到 raw 的 merge 结果其实是在 `./build/intermediates/res/merged/release/raw`，并不走 exploded-aar，**故这是一个兼容各个版本的一个取巧解决方案**：如果你也需要在每个 library module 写入一些信息，并从 app module 做收集，那么 merged raw 是目前比较好使的一个暂存方案，就不要指望 exploded-aar 啦（除非你全部都发的是 SNAPSHOT）。



*欢迎关注我的[公众号和微博](/about)。*



