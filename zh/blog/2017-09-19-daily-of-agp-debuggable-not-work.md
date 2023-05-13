---
layout: post
date: 2017-09-19
title: "构建指北 #7 debuggable 属性无效"
tags: [Android, Gradle, Android Gradle Plugin, 构建, post]
---

*『构建指北』是探索 Android 构建相关的一系列文章，涵盖了 Gradle、Android Gradle Plugin、Kotlin Script 等工具，以及相关架构上的应用。以发现问题解决问题为出发点，传递新知提高生产效率为落脚点。*

### 问题回顾

不久前，在接手手头上这个老工程时，发现 `build.gradle` 中设置 `debuggable` 属性是无效的，只能手动在 `AndroidManifest.xml` 的 `application` 节点写死该属性（之前团队里就这样默默干了两年，发版前去掉这个属性，发版后再加上...），最近得空花了两三个周末研究了下缘由。

默认看此文章的人已经知道这点：

> Android 系统判断一个 App 是否可 Debug 的标准是，AndroidManifest.xml 中的  application 节点是否存在 debuggable 属性，并且其值为 true。（可参考[官方文档](https://developer.android.com/guide/topics/manifest/application-element.html#android:debuggable)）

<!--more-->

### 问题分析 & 源码重现

#### 0x01

从 `buildType` 的 `debuggable` 属性开始分析追踪，既然我们知道 `debuggable` 其实会作用于 Manifest 的属性，那就找找跟 Manifest 相关的流程。先后看了 Android Gradle Plugin 中 `process{variant}Manifest`、`process{variant}Resources
`、`package{variant}` 等 task 的流程，没有发现什么异常（此处不一一展开）。不过倒是对他们的中间生成产物有了些了解：

- `process{variant}Manifest` 的 `AndroidManifest.xml` 中间产物位于  ./app/build/intermediates/manifests 中，分为 instant-run 和 其他 variant （debug、release、etc.）等各种文件夹；
- `process{variant}Resources` 的 `AndroidManifest.xml` 位于 ./app/build/intermediates/res/resources-debug.ap_ 的压缩包中（事实上一开始没有看这个 task，是在看其他 task 的中间产物时发现这个 task 其实有 `AndroidManifest.xml` 的产物）；
- `package{variant}` 的 `AndroidManifest.xml` 其实就是最后 apk 包中的文件了；

除此之外，没看到有直接对 `AndroidManifest.xml` 中写入 `debuggable` 的操作（merge 除外）。

#### 0x02

 拿一个新建的工程和问题工程作比对发现：
 
- 新建工程：`process{variant}Manifest` 的产物中没有  `debuggable` 的属性，却在 `process{variant}Resources` 的产物中出现了该属性（debug 状态下为 true），说明内部操作发生在这一步；
- 问题工程：在所有 task 的  `AndroidManifest.xml` 产物中，均未出现 `debuggable` 的值；

看来还得再翻翻 `process{variant}Resources`，这其中主要是调用 aapt 相关的操作，仔细查看发现如下关键代码：

``` java

// AaptV1.java 

@Override
@NonNull
protected ProcessInfoBuilder makePackageProcessBuilder(@NonNull AaptPackageConfig config)
        throws AaptException {
    ProcessInfoBuilder builder = new ProcessInfoBuilder();

    /*
     * AaptPackageProcessBuilder had this code below, but nothing was ever added to
     * mEnvironment.
     */
    //builder.addEnvironments(mEnvironment);

    builder.setExecutable(getAaptExecutablePath());
    builder.addArgs("package");

    ...(省略无关紧要的一部分代码)
    
    // 在此处注入了 buildType 的 debuggable 属性
    if (config.isDebuggable()) {
        builder.addArgs("--debug-mode");
    }

    ...

    return builder;
}
```

可以看到，在处理 aapt 的输入参数时带上了 debug 参数，随即便是调用 aapt 的外部过程，不在 Android Gradle Plugin 的控制范围内。


#### 0x03
 
找出 Android SDK 源码，编译一个自己的 aapt（具体可以参考[这里](http://2bab.me/2017/09/19/android-source-development-notes-3/)），别忘了在关键地方加上一些 log：

- 先是入口文件，找到对应读取 `--debug-mode` 的地方，会暂存于一个 bundle 中，并且参数获取正确，为 true，[Main.cpp]:
  
``` cpp
if (strcmp(cp, "-debug-mode") == 0) {
    fprintf(stderr, "AAPTDEBUG: set debug == true");
    bundle.setDebugMode(true);
}
```

- 再者，找到 `bundle->getDebugMode()` 的地方，发现这里就是核心部分了，真正把 `debuggable` 的结果写入到 `AndroidManifest.xml` 中；但是这里出现错误了—— **application 节点获取不到，为 null**，[Resource.cpp]：

``` cpp
status_t massageManifest(Bundle* bundle, sp<XMLNode> root)
    {
    root = root->searchElement(String16(), String16("manifest"));
    if (root == NULL) {
        fprintf(stderr, "No <manifest> tag.\n");
        return UNKNOWN_ERROR;
    }
    
    // ...
    
    fprintf(stderr, "AAPTDEBUG: bundle->getDebugMode()");
    if (bundle->getDebugMode()) {
        fprintf(stderr, "AAPTDEBUG: bundle->getDebugMode() - true");
        sp<XMLNode> application = root->getChildElement(String16(), String16("application"));
        if (application == NULL) {
            fprintf(stderr, "AAPTDEBUG: application == NULL"); // 问题出处，打印出了这行 log
        }
        if (application != NULL) {
            fprintf(stderr, "AAPTDEBUG: application != NULL");
            if (!addTagAttribute(application, RESOURCES_ANDROID_NAMESPACE, "debuggable", "true",
                        errorOnFailedInsert)) {
                    fprintf(stderr, "AAPTDEBUG: error on insert");
                return UNKNOWN_ERROR;
            }
        }
    }
    
    // ...
}
```

- 看看 `getChildElement()` 的实现，发现上面的代码只会从 root 节点（也就是 manifest 节点）出发去找一级子节点，没有深入地递归查找，如果 application 不是 manifest 的一级子节点，则找不到，[XMLNode.cpp]：

``` cpp
sp<XMLNode> XMLNode::getChildElement(const String16& tagNamespace, const String16& tagName)
    {
    printf("AAPTDEBUG: root -> %s\n", String8(mElementName).string());
    for (size_t i=0; i<mChildren.size(); i++) {
        sp<XMLNode> child = mChildren.itemAt(i);
        if (child->getType() == XMLNode::TYPE_ELEMENT) {
            printf("AAPTDEBUG: getChildElement-> %s\n", String8(child->mElementName).string());
        }
    
        if (child->getType() == XMLNode::TYPE_ELEMENT
                && child->mNamespaceUri == tagNamespace
                && child->mElementName == tagName) {
            return child;
        }
    }
    
    return NULL;
}
```

![](http://2bab-images.lastmayday.com/blog/2017-09-19-gradle-daily-crash-debuggable-not-work-2.jpg?imageslim)

- 那最后的问题就只有，为什么 application 节点不是 manifest 的一级子节点，查一下编译出来的二进制 Manifest（./app/build/intermediates/res/resources-debug.ap_ ，为避免敏感信息，这里用 [DebuggableTest](https://github.com/2BAB/DebuggableTest) 工程做示例）：
   
![](http://2bab-images.lastmayday.com/blog/2017-09-19-gradle-daily-crash-debuggable-not-work-1.jpg?imageslim)

- 真相大白，application 的直接父节点是 namespace！
 
#### 0x04

查看各类依赖库的 Manifest（build-cache/exploded-aar），查看 Manifest 的合并日志（app/build/outputs/logs/manifest-merger-{variant}-report），结合之前写的一个 Manifest Precheck 插件 [Seal](https://github.com/2BAB/Seal)，发现会碰到这个问题，有两种可能：

1. 依赖库本身对 namespace 的声明不只在 manifest 节点，例如在 application 节点声明了 android 的 namespace，可以参考我 pub 的这个  [DebuggableTest](https://github.com/2BAB/DebuggableTest) 工程；
2. 对 Manifest 合并前（即执行 `process{variant}Manifest` 前），如果有例如 [Seal](https://github.com/2BAB/Seal) 这种对依赖库的 Manifest 做清洗工作，**并且很巧你也用了 `groovy.util` 下的 XML 类库做 XML 解析和输出，那么恭喜你，这个库有几率会导致你的各种节点出现重复的 namespace，比如 uses-sdk 、application**，不过我还没认真去排查到底什么情况下会出现这样的问题，目前实验中也只有少量的样本会这样，暂时没发现他们的共通点。

### 解决方案

- 使用自定义的 aapt，改一行代码即可解决此类问题：将搜索 application 节点的方法从 `sp<XMLNode> XMLNode::getChildElement(const String16& tagNamespace, const String16& tagName)` 改为另外一个内建的方法 `sp<XMLNode> XMLNode::searchElement(const String16& tagNamespace, const String16& tagName)`，原因是 searchElement 的实现是会 for 循环查找所有深度子节点：

   ``` cpp
   // Resource.cpp

    status_t massageManifest(Bundle* bundle, sp<XMLNode> root)
    {
        root = root->searchElement(String16(), String16("manifest"));
        if (root == NULL) {
            fprintf(stderr, "No <manifest> tag.\n");
            return UNKNOWN_ERROR;
        }
    
        ...
    
        fprintf(stderr, "AAPTDEBUG: bundle->getDebugMode()");
        if (bundle->getDebugMode()) {
            fprintf(stderr, "AAPTDEBUG: bundle->getDebugMode() - true");
            // 改掉查找方法！
            sp<XMLNode> application = root->searchElement(String16(), String16("application")); 
            ...
        }
        ...
   }
   
   // XMLNode.cpp

    sp<XMLNode> XMLNode::searchElement(const String16& tagNamespace, const String16& tagName)
    {
    
        if (getType() == XMLNode::TYPE_ELEMENT
                && mNamespaceUri == tagNamespace
                && mElementName == tagName) {
            return this;
        }
        // 递归实现避免上述问题
        for (size_t i=0; i<mChildren.size(); i++) {
            sp<XMLNode> found = mChildren.itemAt(i)->searchElement(tagNamespace, tagName);
            if (found != NULL) {
                return found;
            }
        }
    
        return NULL;
    }
   ```

- 或者使用新版的 [Seal](https://github.com/2BAB/Seal) 插件 v1.1.0 ，增加了一个配置项 `xmlnsSweep`，会在执行 `process{variant}Manifest` 之后，对其产物进行 xmlns 的清洗，避免在 manifest 节点外出现不必要的 namespace 声明，详细使用说明请参考 [Seal](https://github.com/2BAB/Seal) 仓库的 README（注意，目前使用 Seal 请一定要开启并配置 `xmlnsSweep`，因为不能保证所有的依赖库都不会在 Precheck 中出问题）

### 结论

这大概是我今年研究过的最麻烦的问题了，链路长，大坑小坑不断，有 Google 挖的，有 Groovy 挖的，目前正在去给他们提 issue 的路上...

铛！更新 issue 地址： [https://issuetracker.google.com/issues/66074488](https://issuetracker.google.com/issues/66074488) ！



*欢迎关注我的[公众号和微博](/about)。*