---
layout: post
date: 2021-06-17
title: "继往开来：Google I/O 21 Android Gradle Plugin 更新总结"
tags: [Android, Gradle, Android Gradle Plugin, 构建, post]
---

距离 Google I/O 2021 已经过去了将近一个月，最近几天捋了捋关于 Android Gradle Plugin（AGP）方面的东西，主要集中在 “What’s new in Android Gradle plugin” 这个 session。不过由于 2020 年没有 Google I/O，线下的活动也因为疫情全部暂停，所以这个 session 短短 11 分钟，信息量却相当大，几乎可当作是这两年更新的重点浓缩（前后看了三遍）。也因此，这篇文章里我会放出很多额外的参考资料，挖了下最近一两年大家可能忽略了的 talks/posts/repos。文章整体脉络仍按这个 session 的 agenda 来。

## 性能提升

### Configuration Cache

Gradle 的生命周期分为大的三个部分：初始化阶段（Initialization Phase)，配置阶段（Configuration Phase），执行阶段（Execution Phase）。其中任务执行的部分只要处理恰当，已经能够很好的进行缓存和重用——重用已有的缓存是加快编译速度十分关键的一环，如果把这个机制运用到其他阶段当然也能带来一些收益。仅次于执行阶段耗时的一般是配置阶段，而今年 AGP 给我们带来的 Gradle [Configuration Cache](https://docs.gradle.org/current/userguide/configuration_cache.html#config_cache:requirements) 的支持，一项自 [Gradle 6.6](https://blog.gradle.org/introducing-configuration-caching) 起开始孵化的新功能。它使得配置阶段的主要产出物——Task Graph 可以被重用，在示例的项目中这个优化可以带来 8s 左右的不必要等待（如果 Gradle 脚本配置并没有改变）。

![](https://2bab-images.lastmayday.com/blog/20210617155730.png?imageslim)

想体验这项优化只需要在执行 Gradle 命令时加入 `--configuration-cache`，例如 `./gradlew --configuration-cache help`。由于 Configuration Cache 现在还未完全稳定，如果你想一直开启（包括享受 IDE Sync 时的优化），需要使用如下 properties：

``` properties
org.gradle.unsafe.configuration-cache=true
```

第一次使用时会看到计算 Task Graph 的提示：

> Calculating task graph as no configuration cache is available for tasks: :test-app:assembleDebug

成功后会在 Build 结束时提示：

> Configuration cache entry stored.

之后 Cache 就可以被下一次构建复用（如果没有构建脚本修改）：

> Reusing configuration cache.
> 
> ...
> 
> 51 actionable tasks: 2 executed, 49 up-to-date
> 
> Configuration cache entry reused.


作为插件使用者，发现常用插件出现不支持的情况，可先搜索是否有相同的问题已经出现，例如下面这个 Kotlin 1.4.32 插件和 Gradle 7.0 配合时出现的问题：

![](https://2bab-images.lastmayday.com/blog/io-2021-agp-config-cache-kotlin-plugin.png?imageslim)

在这个 YouTrack [issue](https://youtrack.jetbrains.com/issue/KT-43605) 下我们可以简单看到通过升级 Kotlin 插件版本至 1.5.0 以上即可解决。

事实上 AGP/Kotlin/Gradle 核心的几个插件（主要是背后的 Tasks）在最近的版本都已经支持 Configuration Cache，通过这几篇文档/issue 可以了解大概：

- [Help community Gradle plugins adopt the configuration cache #13490 - Gradle Github Issues](https://github.com/gradle/gradle/issues/13490)
- [Gradle Properties Change - Android Gradle Plugin 4.2 Release Note](https://developer.android.com/studio/releases/gradle-plugin#4.2-gradle-properties)
- [Gradle Configuration Cache Support - Kotlin Doc](https://kotlinlang.org/docs/gradle.html#gradle-configuration-cache-support)

而作为插件开发者，则还要关心 Configuration Cache 的适配工作。其重点在于：Task 的参数和内部实现需要避开直接传入/使用 Gradle 的几个 Context 及一些无法序列化的类。以我维护的 [Seal](https://github.com/2BAB/Seal) 插件为例，它是一个解决 `AndroidManifest.xml` 冲突的小插件，我们执行 `/gradlew --configuration-cache :test-app:assembleDebug` 会发现有两个问题待修复：

![](https://2bab-images.lastmayday.com/blog/io-2021-agp-config-cache-seal-plugin.png?imageslim)

通过构建结束时输出的 Configuration Cache HTML Report 我们可以查看到详细的堆栈：

![](https://2bab-images.lastmayday.com/blog/io-2021-agp-config-cache-error-html.png?imageslim)

针对这个错误，其实仅仅需要把 `project.logger` 改成 `this.logger` 的引用即可：

![](https://2bab-images.lastmayday.com/blog/io-2021-agp-config-cache-git-change.png?imageslim)

对于更复杂的规则和用例，可以参考 Gradle 的文档以及 AGP 兼容 Configuration Cache 的心路历程（修复了 400 多个 issues）：

- [Configuration Cache](https://docs.gradle.org/current/userguide/configuration_cache.html#config_cache:requirements)
- [Configuration caching deep dive - Android Developers](https://medium.com/androiddevelopers/configuration-caching-deep-dive-bcb304698070)

最后，有个 Gradle 官方维护的 [android-cache-fix-gradle-plugin](https://github.com/gradle/android-cache-fix-gradle-plugin) ，一些 AGP build cache、configuration cache 的特殊问题，可以在此处查阅下，说不定正好是你项目碰到的。

### Non-transitive R-classes

事实上 R 文件的这类特性已经发展了很多年，可以参考这篇按时间顺序整理的[文章](https://www.mobileit.cz/Blog/Pages/r-class.aspx)。但是最新的 `nonTransitiveAppRClass` 特性需要 AGP 7.0 及以上，目前资料较少，在 Android Studio Arctic Fox 版本发布说明中有部分提及：

> 非传递性 R 类重构：在 Android Gradle 插件中使用非传递性 (non-transitive) R 类，可以为具有多个模块的应用带来更快的构建速度。它通过确保每个模块只包含对其自身资源的引用，而不从依赖关系中提取引用来防止资源的重复。您可以通过重构 (Refactor) > 迁移到非传递性 R 类 (Migrate to Non-transitive R Classes) 来使用此功能。

开启方式如下：

![](https://2bab-images.lastmayday.com/blog/io-2021-agp-non-transitive-r-as-refactor2.png?imageslim)

这个操作帮助你自动添加两行特性开启的代码到 `gradle.properties`，并重新 build project：

![](https://2bab-images.lastmayday.com/blog/io-2021-agp-non-transitive-r-properties.png?imageslim)

### Cacheable Lint Task

Lint 的运行一直是耗时大户，在 AGP 7.0 后（最早计划于是 3.5，见这篇[文档](https://docs.gradle.org/current/userguide/caching_android_projects.html#lint)），终于正式成为可缓存的 Task。

### 其他

另外 AS + AGP 自 4.x 以来还有一些提升的点：

- Gradle Kotlin DSL 体验和性能提升，可以看到 [Google I/O Android App](https://github.com/google/iosched) 项目已经全部改成 `*.gradle.kts` 脚本；
- AAPT2 的性能提升；
- JDK 11 引入的性能提升；
- ...

可以在 AGP/AS 的 Release Notes 里找到这些信息。

![](https://2bab-images.lastmayday.com/blog/io-2021-new-as-bumblebee.png?imageslim)

## 新的 DSL

### DSL Doc 迁移至 android.com

旧的 AGP DSL [文档](https://google.github.io/android-gradle-dsl/) 从 3.4 之后就不再更新了。新的文档迁移至 [android.com](https://developer.android.com/reference/tools/gradle-api)，更加统一。依旧可按版本查看：

- 当前版本（Current Release）：即稳定版本 4.2；
- 预览版本（Preview Releases）：即 beta 7.0 和 alpha 7.1 测试版；
- 之前的版本（Past Releases）：即之前所有的老版本，但由于中间的更迭/切换，所以其实 3.5 -> 4.0 版本的文档都没有；

![](https://2bab-images.lastmayday.com/blog/io-2021-dsl-doc.png?imageslim)

这个变化也反映在了 [google source](https://android.googlesource.com/platform/manifest/+refs) 的 tag 上，对于 AGP 源码来说 `gradle-x.y.z` 的 tag 自 3.4.0 之后就没有了，目前你可以使用 `studio-x.y.z` 例如 `studio-4.2.0` 来反向定位 AGP 的版本。

### Android Studio 提供的 AGP 升级助手

为了让开发者便捷流畅地升级 AGP，AGP 配合 AS 的推出了升级助手功能。这个新特性已经迭代了几个版本，目前对 Gradle Groovy DSL 脚本的升级十分有用，当你看到升级提示时（一般发生在刚打开一个工程时）：

![](https://2bab-images.lastmayday.com/blog/io-2021-agp-upgrade-assistant.png?imageslim)

点击 `Upgrade` 还会有预览功能（截图自 session 的 slide）：

![](https://2bab-images.lastmayday.com/blog/io-2021-agp-upgrade-assistant-2.png?imageslim)

不过对于 Gradle Kotlin DSL 的支持还有待补齐，例如基础的 `compileSdkVersion` 等废弃 DSL 的迁移也未支持：

![](https://2bab-images.lastmayday.com/blog/io-2021-agp-upgrade-assistant-3.png?imageslim)

当然，复杂的对象引用也无法帮你直接修改，例如 `classpath(Deps.agp)`，这已经超过该工具能做的范围。你可以把其当成类似 `Java` 转 `Kotlin` 的辅助工具，先用它快速升级和整理基础的 DSL，然后再手动对照 DSL 文档修改出错的小部分。

## 新的 Variant API

Variant API 是这两年 Android 与插件开发相关的最重要更新，如果之前没有针对 AGP 生态开发过协同插件的朋友可以通过下面这张图“了解什么是 Variant”？

![](https://2bab-images.lastmayday.com/blog/io-2021-variant-api-definition-2.png?imageslim)

Variant API 的更新可以概括：为了使协同插件的开发者依赖于更稳定的 API，将原来的 `com.android.tools.build:gradle` 包拆分成 `gradle` 和 `gradle-api` 两个包，做到接口和实现的隔离。实战角度来看我们可以关注两部分：Variant 遍历入口变更和部分自定义 Task 的简化。


### Variant 遍历入口变更

大部分 AGP 生态的协同插件都需要注册 Variant aware 的 Task，即遍历 Variant 注册与其对应的自定义 Task，例如上面提到的 Seal 插件的 `postUpdateDebugManifest` `postUpdateReleaseManifest`。你一定看到过这样的代码（Groovy）：

``` groovy
def android = project.extensions.android
android.applicationVariants.all { variant ->
    def variantName = variant.name.capitalize()
    createTask(project, variantName)
}
```

或者 Kotlin 的版本：

``` kotlin
val androidExtension = project.extensions.findByType(AppExtension::class.java)!!
androidExtension.applicationVariants.all { variant ->
    val variantName = variant.name.capitalize()
    createTask(project, variantName)
}
```

如果是适用于 library 的插件则需要 `LibraryExtension` 和 `libraryVariants`。

这类 API 现在改成了 `gradle-api` 内的新 API 调用：

``` kotlin
val androidExtension = project.extensions.getByType<ApplicationAndroidComponentsExtension>()
androidExtension.onVariants { variant ->
    ...
}
```

这里获取到的 Variant 是 [com.android.build.api.variant.ApplicationVariant](https://developer.android.com/reference/tools/gradle-api/7.1/com/android/build/api/variant/ApplicationVariant)，Extension 则来自于 [com.android.build.api.extension.ApplicationAndroidComponentsExtension](https://developer.android.com/reference/tools/gradle-api/4.2/com/android/build/api/extension/ApplicationAndroidComponentsExtension)。另外一个可能会用到的接口是 `beforeVariants(...)`，用来控制 Variant 的构建，例如全局修改一些 Variant 的属性等。从这段 Snippet 我们可能看不出来 Variant 具体的变化，但这变化背后包含了规范的 Variant 状态流转，公开的 API 等。

### 部分自定义 Task 的简化

这类简化指 Task 插入点和 Task 参数获取（注入）的简化，提供这类特性的 API 也称之为 Artifact APIs。在比较经典的模式里：对于插入点，一般我们会手动找到 Task 的前后依赖关系，使用 Gradle API 进行依赖关系重新梳理（甚至可能要自定义一些新的生命周期锚点 Task 辅助）；对于 Task 的参数，就使出各种奇技淫巧，从已有 Task 里的参数/中间产物/私有对象等找到我们需要的数据，再注入到自定义的 Task 中。而现在 Artifact APIs 规范了一套标准操作，使得我们可以简易地和已有的数据、中间产物进行交互，实战角度来看我们可以分为两种模式：

复杂的 Transform/Append/Create 操作：插入 Task 到特定节点和 Task 参数注入一条龙服务，一般适用于需要定义某个具体的插入点；

``` kotlin
androidComponents {
    val gitVersionProvider = tasks.register<GitVersionTask>("gitVersionProvider") {
        gitVersionOutputFile.set(
            File(project.buildDir, "intermediates/gitVersionProvider/output"))
        outputs.upToDateWhen { false }
    }
    onVariants { variant ->
        val manifestProducer = tasks.register<ManifestProducerTask>("${variant.name}ManifestProducer") {
            gitInfoFile.set(gitVersionProvider.flatMap(GitVersionTask::gitVersionOutputFile))
        }
        variant.artifacts.use(manifestProducer)
            .wiredWith(ManifestProducerTask::outputManifest)
            .toCreate(SingleArtifact.MERGED_MANIFEST)
    }
}
```

纯粹的 Get：主动获取 intermediates，一般适用于较为独立的 Task，没有严苛的插入位置要求（但是藉由 Provider 的传递会有隐式的 Task 依赖），没有需要替换等操作：

``` kotlin
androidComponents {
    onVariants { variant ->
        project.tasks.register<DisplayApksTask>("${variant.name}DisplayApks") {
            apkFolder.set(variant.artifacts.get(SingleArtifact.APK))
            builtArtifactsLoader.set(variant.artifacts.getBuiltArtifactsLoader())
        }
    }
}
```

### 更多

从实用的角度来说，新的 Variant 接口、Extension 接口公开的 API 比之前少了，但更加规范。Artifacts 作为手动获取 Task input/output 的补充，目前的公开 API 也还比较少，希望插件开发者们在遇到合理的需要公开的 API 但目前还没有时，给 AGP team 多提点 issue :)。

另外，限于篇幅我无法在这里介绍全部的 Variant API 更新，包括新的 `Provider<T>` API 引入（Lazy Configuration），Variant 状态流转，更多种的 Artifacts API 的使用，如何借鉴它的设计来自己动手解决那些还没有被封装、公开的接口等等。你可以从下面几份资料中获得更多的灵感：

- [From Gradle properties to AGP APIs - Android Dev Summit '19](https://www.youtube.com/watch?v=OTANozHzgPc)：讲解了 Variant API 的基石—— `Provider<T>` API 及其衍生的多个子类，Variant 状态流转及其 API 的多种使用姿势等；
- [New APIs in the Android Gradle Plugin - Android Developers Blog](https://medium.com/androiddevelopers/new-apis-in-the-android-gradle-plugin-f5325742e614)：介绍了 Variant API 想法设计的由来，新 API 的使用；
- [android/gradle-recipes](https://github.com/android/gradle-recipes/tree/agp-7.1)：分别提供了 Groovy/Kotlin DSL 下 Variant API 常用的示例代码；
- [Android Gradle Plugin DSL/API migration timeline](https://developer.android.com/studio/releases/gradle-plugin-roadmap)：未来三年 New DSL 和 Variant API 相关的 milestone；
- [Lazy Configuration](https://docs.gradle.org/current/userguide/lazy_configuration.html)：Task 配置延迟获取，`Provider<T>` 及其各种子类，Task 隐式依赖等。

## 新的 ASM API

![](https://2bab-images.lastmayday.com/blog/io-2021-asm-api.png?imageslim)

ASM API 是之前 Transform API 的替代品，旨在更低成本地提供一个 Class -> Dex 之间的插入点用以修改字节码。它没有了之前 Transform API 的灵活性，比如目前看起来它和 ASM 字节码工具是绑定的，不支持 Javassist 或者 Aspect 等。但同时，它拥有更好的性能，更低的使用成本（指实现 transform 本身，因为 ASM 实际上是相对 Javasssist Aspect 更底层的 API，更灵活、学习成本也更高），以及更容易适配 Gradle 的新特性。目前刚刚开始孵化，从 API Doc 来看还不推荐开发者使用它来构建一个生产环境的插件。

``` kotlin
abstract class ExamplePlugin : Plugin<Project> {

    override fun apply(project: Project) {

        val androidComponents = project.extensions.getByType(AndroidComponentsExtension::class.java)

        androidComponents.onVariants { variant ->
            variant.transformClassesWith(ExampleClassVisitorFactory::class.java,
                                 InstrumentationScope.ALL) {
                it.writeToStdout.set(true)
            }
            variant.setAsmFramesComputationMode(FramesComputationMode.COPY_FRAMES)
        }
    }

    interface ExampleParams : InstrumentationParameters {
        @get:Input
        val writeToStdout: Property<Boolean>
    }

    abstract class ExampleClassVisitorFactory :
        AsmClassVisitorFactory<ExampleParams> {

        override fun createClassVisitor(
            classContext: ClassContext,
            nextClassVisitor: ClassVisitor
        ): ClassVisitor {
            return if (parameters.get().writeToStdout.get()) {
                TraceClassVisitor(nextClassVisitor, PrintWriter(System.out))
            } else {
                TraceClassVisitor(nextClassVisitor, PrintWriter(File("trace_out")))
            }
        }

        override fun isInstrumentable(classData: ClassData): Boolean {
            return classData.className.startsWith("com.example")
        }
    }
}
```

上面代码用到的 API 可以参考如下说明：

- [Component#transformClassesWith(...)](https://developer.android.com/reference/tools/gradle-api/7.1/com/android/build/api/component/Component.html#transformClassesWith(java.lang.Class,%20com.android.build.api.instrumentation.InstrumentationScope,%20kotlin.Function1))
- [InstrumentationParameters](https://developer.android.com/reference/tools/gradle-api/7.1/com/android/build/api/instrumentation/InstrumentationParameters)

对经典的 Transform 不熟悉的朋友可以看下几个知名的 Transform 库封装（挺巧都是中国公司的开源项目）：

- [ByteX](https://github.com/bytedance/ByteX)（活跃）
- [Booster](https://github.com/didi/booster)（活跃，部分功能使用）
- [Lancet](https://github.com/eleme/lancet)（不活跃）

## 总结

从开发者的角度来看，Android 工具团队在 AGP & AS 上更加注重 Engineering Experience 的东西了。在解决了很多历史遗留问题的同时，这次的 Session 还透露出对 AGP 周边生态的建设的长远计划，希望明年可以看到这些东西真的被更多 Android 开发者接受，到时候我也一定再写一篇 22 年版的总结和前瞻。

*欢迎关注我的[ Github / 公众号 / 微博 / Twitter](/about)。*
