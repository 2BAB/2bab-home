---
layout: post
date: 2021-12-21
title: "构建指北 #12 根据 Variant 决定是否启用插件"
tags: [Android, Gradle, Android Gradle Plugin, 构建 , post]
---

在 Android 开发中使用过第三方 Gradle 插件的同学都应该碰到过这个问题：**我只想在某一些 buildType 或者 flavor 中应用这个插件，但是找不到合适的办法。**

这个问题的根本原因在于 Variant（buildType + flavor) 不是一个 Gradle 概念，而是源于 Android Gralde Plugin（AGP）的多渠道配置。所以从 Gradle 平台的角度很难向上提供便捷的支持：一个工程内的插件引入是全局的、平台性的，不以某一个插件的意志（AGP）而改变下层平台的机制。

OK，但我们的问题还是要解决的，所以便了有下面四种问题的解法（大雾。我们按照无效到高效的顺序一一解释其中的思路。

## 根据 Variant 去 apply 插件（无效 X

``` kotlin
flavorDimensions += "server"
productFlavors {
    ...
    create("production") {
        dimension = "server"
        applicationIdSuffix = ".production"
        versionNameSuffix = "-production"
        versionCode = 2
        apply("xxx") // 无效
    }
}
```

很多 Android 或者 Gradle 的初学者会觉得，我把 `apply(...)` 放在这里不就好了？（当然，你肯定不能用 `plugins { id("xxx") }`）这里的误区在于，**`apply(...)` 方法和当前上下文对象并没有关联**：

![](https://2bab-images.lastmayday.com/20211221205845.png?imageslim)

![](https://2bab-images.lastmayday.com/20211221210042.png?imageslim)

- `create("..."){}` 的闭包上下文是 `this:ApplicationProductFlavor`。
- `apply(...)` 则为挂载于 PluginAware 的一个扩展方法（以 `build.gradle.kts`），作用于整个 Project，这样一来你的插件还是会被全局引入。

同样的经典误区：

``` kotlin
create("production") {
    dimension = "server"
    applicationIdSuffix = ".production"
    versionNameSuffix = "-production"
    versionCode = 2
    packagingOptions {
        jniLibs {
            excludes.add("...")
        }
    }
}
```

![](https://2bab-images.lastmayday.com/20211221212514.png?imageslim)
你可能觉得这样可以为这个 flavor 设置单独的 `packageingOptions`，但实际上这个方法是 `CommonExtension` 接口的一个方法，并不属于 `ApplicationProductFlavor`。也即它是为整个 Android Gradle Plugin 进行设置，而不是单一 flavor，如果你在每个 flavor 中都进行不同的设置，最后一次的设置会覆盖前面所有的。针对这个问题的解决方法，可参考我之前 [GDG 分享](https://www.bilibili.com/video/BV1WP4y1G71h)中的“二次配置”部分。


## 根据命令去 apply 插件（部分有效 X

我们本次讨论的问题在一些 StackOverflow 问答中也能查到，其中有大量的答案是关于“解析键入的命令”来进行判断。

``` kotlin
if (gradle.startParameter.taskRequests.toString().contains("production")) {
    apply(...)
}
```

这种做法能够解决你输入的命令为 `./gradlew clean assembleProductionRelease` 等等的情况，因为这类命令中仅包含了一个 Variant 的信息（也就是 Production + Release）。然而如果输入的命令是 `./gradlew clean assembleRelease`，它同时打包 `Staging` 和 `Production` 两个 flavors，这时上面的 `if(...)` 条件就完全不成立，你的构建也会因此遭到破坏。

多数情况 `taskRequests` 下对第三方 Android 构建插件的开发者都是不应去获取和使用的，和第一条误区一样它是 Gradle 平台自身的 API，没有为上层 AGP 的 Variant 概念做优化。

## 禁用对应 Variant 的插件 Task（有效 Y

当然，SO 上也有人提到了正确、有效、且通用的做法——**不要动态禁用（或开启）插件，而是去禁用插件内的 Task。**

``` kotlin
plugins { id("com.example.ua") }
// or apply("com.example.ua")
...
tasks.whenTaskAdded {
    if (name.contains("production", true)
            && name.contains("release", true)
            && name.contains("UploadArchive", true)) {
        enabled = false
    }
}
```

假设有一个上传构建结果的插件叫做 `com.example.ua`，我们不管什么情况，都在`build.gradle.kts` 内引用它。但是往下看，我们基于 `whenTaskAdded {...}` 做了类似上一条误区的 `if(...)` 判断，然后符合条件的 task 的 `enabled` 属性设置为 `false`。为什么上一个方法不行，而这个可以？

我们要复习下这条 Gradle 脚本和 `android{}` DSL 规则：不管你 shell 键入的命令是什么，你键入的是 `clean` 也好 `help` 也好，这份脚本都是会完整地被执行，所有 Variant 的 Task 都会被注册（当然现在通常都是惰性注册了 `register(...)` 而不用 `create()`）。**而 `whenTaskAdded{...}` 是 Gradle 平台的 API，它才不管你上层注册的 Task 分不分 Variant，它只管把所有注册后且确定会添加进运行图（是个有向无环图 DAG）的 Task 在这里提供一个回调的时机给开发者。与此同时，几乎所有的 Android 生态协同插件都会基于 Variant 的名字去给自己 Task 命名（如果它需要是一个 VariantAware Task 的话），例如 “UploadArchiveWithLogForProductionRelease”。这个不成文的规则给了我们字符串匹配的机会，也即你看到的上述代码。**

对于插件怎么找到对应的所有 Task，目前没有自动化的办法，也没有 API（但是最近的一个 AGP Team Q&A 上，他们提到在和 Gradle 推进这个功能）。你可以做的就是：**引入插件前打印下 Task List，引入后再打印一遍，找二者的 Diff。** 当然对于一些比较简单的插件，直接看下文档或者源码，整理下有哪几个 Task 也行。

所以这个方案小结下就一句话：总是引用插件，但禁用掉不需要的 Task。

## 在 Task 注册时拦截（高效 Y

我在上一篇[《构建指北 #11 BundleTool Gradle Plugin》](https://2bab.me/2021/12/19/bundle-tool-plugin]中提到：

> bundle-tool-gradle-plugin 支持按不同 variant 渠道去开启插件的几个功能特性。

这光听起来就和上一个方案就有点神似了，难不成就是把 `enabled = false` 藏 Plugin 里，再吐个 DSL 的开关配置出来给用户选择？其实不然，解决思路上已经大差不差了。但稍微思考下还有两个可以改进的空间：

1. 既然我们想要在插件内部控制开关，何必使用 `task.enabled = false`，**直接把注册流程跳过就好了**（当然，这个做法不适用于所有情况，有时候还是需要动态禁用的）。
2. 对于大部分的 Android 生态协同插件，其 DSL 一般都是 Variant 无关的静态配置，如果要设计一个 Variant 有关的配置，可能只能传入一堆自定义 rules（如下代码）：

``` kotlin
// 静态的 DSL 配置
bundletool {
    enableByVariantRules {
        create("debugStaging") {
            enabledFeature1 = true
            enabledFeature2 = true
            enabledFeature3 = false
        }
        create("debugProduction") {
            ...
        }
    }
} 
```

这种 rules 的复杂度比较难控制，在上述代码里它是一个 2 * 2 * 3 的笛卡尔积，配置起来十分不变。解决的方法也很容易想到，**如果它能做成传入一个 Kotlin Lambda（或者 Groovy Closure），不就很方便了？就像我们做二次配置时使用的 `onVariants(...) {...}` 方法一样，我们需要一些“动态”的东西，用户可以与之互动的东西，减少配置的复杂度。**

``` kotlin
// “动态”的 DSL 配置，基于 Kotlin Lambda 和 Groovy Closure 
bundleTool {
    enableByVariant { variant, feature ->
        !(variant.name.contains("debug", true) && feature == BundleToolFeature.GET_SIZE)
    }
    ...
} 
```

其中 `variant` 参数是 `com.android.build.api.variant.Variant`，即我们平时使用的 Variant API v2 的 Variant 对象；`feature` 参数是一个自定义的 enum 类，方便每个插件定制。然后我们看下实现：

``` kotlin
/**
 * Extract `enableByVariant(...)` function, can be reused in other plugins.
 * Currently the Lambda and Closure are defined by raw types, they can be encapsulated
 * by [Property] as well to fulfill "lazily produced/consumed" purpose.
 */
abstract class EnableByFeatureExtension<T> {

    var kotlinEnableByVariant: EnableByVariant<T>? = null

    var groovyEnableByVariant: Closure<Boolean>? = null

    // For Gradle Kotlin DSL
    fun enableByVariant(selector: EnableByVariant<T>) {
        kotlinEnableByVariant = selector
    }

    // For Gradle Groovy DSL
    fun enableByVariant(selector: Closure<Boolean>) {
        groovyEnableByVariant = selector.dehydrate()
    }

    internal fun isFeatureEnabled(variant: Variant, t: T): Boolean = when {
        kotlinEnableByVariant != null -> {
            kotlinEnableByVariant!!.invoke(variant, t)
        }
        groovyEnableByVariant != null -> {
            groovyEnableByVariant!!.call(variant, t)
        }
        else -> false
    }

}

internal typealias EnableByVariant<T> = (variant: Variant, t: T) -> Boolean

abstract class BundleToolExtension: EnableByFeatureExtension<BundleToolFeature>() {

    abstract val buildApks: NamedDomainObjectContainer<BuildApksRule>

    abstract val getSize: NamedDomainObjectContainer<GetSizeRule>

}

enum class BundleToolFeature {

    // It's currently a predecessor for GET_SIZE,
    // and the first job that plugin does,
    // disable it will cause the task registry got removed.
    // The work action that transforms .aab to .apks using `build-apks` command.
    BUILD_APKS,

    // The work action that gets the transformed .apks file size using `get-size total` command.
    GET_SIZE

}
```

这里我们分别定义了针对 Groovy 和 Kotlin 两种 Gradle DSL 的 Closure/Lambda，它们接受 `Variant` 和自定义的一个泛型参数，返回一个 Boolean 值表示是否开启对应功能。接着我们定义了 `isFeatureEnabled(..,): Boolean` 方法对两个语言分支进行整合，方便插件内部的调用。当实际使用该 `EnableByFeatureExtension` 时，实际上我们会让插件的 `BundleToolExtension` 继承于它，从而隔离出插件本体功能和通用的开关特性，任意其他的插件可以方便地拷走这个类加入到自己的 Extension 中。

``` kotlin
androidExtension.onVariants { variant ->
    if (!config.isFeatureEnabled(variant, BundleToolFeature.BUILD_APKS)) {
        return@onVariants
    }
    val featureGetSize = config.isFeatureEnabled(variant, BundleToolFeature.GET_SIZE)
    ...
    val buildApksTaskProvider = project.tasks.register<BundleToolTask>(
        "TransformApksFromBundleFor${variantName}"
    ) {
        enableGetSizeFeature = featureGetSize
        ...
    }
}

abstract class BundleToolTask : DefaultTask() {

    @get:Input
    var enableGetSizeFeature: Boolean = false
    ...
    
    @TaskAction
    fun transform() {
        ...
        if (!enableGetSizeFeature) return
    }
}
```

最后，我们展示了在两个地方使用这个开关的例子：

1. 如果某个 Feature 影响的是整个 Task，我们可以使用开关跳过它的注册。
2. 如果某个 Feature 只影响了一个 Task 内的部分功能，我们将开关的值传入 Task 内部再进行判断。

上述的流程并非完全不可变，这个思路可以结合其他的开关方式进行调整。目前我已经在 [bundle-tool-gradle-plugin](https://github.com/2BAB/bundle-tool-gradle-plugin) 和 [ScratchPaper](https://github.com/2BAB/ScratchPaper) 使用了这个方案，让插件功能的引入更加灵活。

**当然，你可能也已经发现，这个方案其实是从插件开发的角度入手，除非所有的插件开发者都使用了类似的方案进行优化，否则方案 3 仍然是从用户角度出发的目前唯一的通用办法。但是这个方案的优势在于控制粒度更精细、也更方便，开发者可以任意定制。**

## 总结

本文主要讨论了插件功能根据不同 Variant 渠道进行开启的解决方案，可能也是全网第一次有如此详细和完整的多种方案对比讨论。文章的思考和方案其实还可以被运用到其他的一些 Gradle 场景中，大家可以自行发挥想象。那 2021 年的最后一篇技术文章就到这边啦，咱们明年再见。


*欢迎关注我的[ Github / 公众号 / 播客 / 微博 / Twitter](/about)。*