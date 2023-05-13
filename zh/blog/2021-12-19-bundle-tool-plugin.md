---
layout: post
date: 2021-12-19
title: "构建指北 #11 BundleTool Gradle Plugin"
tags: [Android, Gradle, Android Gradle Plugin, 构建, post]
---

App Bundle（.aab) 作为 Android 官方力推的新交付格式已经存在了一段时间，而今年 PlayStore 的政策强制“所有新应用必须使用 .aab”进行提交也成为了大家转换过去的一大动力。兼容和打包 .aab 文件格式其实并不复杂，简单添加对应的 DSL 配置并替换掉执行的打包命令为 `bundle${VariantName}` 即可。但是，打包后得到的 .aab 并不能直接在本地直接使用 adb 安装到调试设备，需要借助 [bundletool](https://github.com/google/bundletool) 转换到 .apks 后再调用其安装命令进行安装。

## 常见场景

[BundleTool 官方文档](https://developer.android.com/studio/command-line/bundletool#build_app_bundle) 列举了 CLI 命令的各类用途；放到更复杂的环境中，你可能碰到过 BundleTool 的这些场景：

1. 本地测试时，需要使用 BundleTool 的 CLI 手动运行转换和安装命令；
2. CI 环境下，需要配置 BundleTool CLI 工具，再编写一些 Shell 脚本进行打包后的转换流程控制；
3. 真机实验室的测试、真机云平台的测试，需要集成 BundleTool 到相对应的测试中，方便生成对应机型的 apks 包。

这些场景常常伴随着下列的一些问题：

1. 一些内部测试包发布渠道不支持 aab 和 apks，我们需要在这些非 GP 非真机实验平台做快速的功能测试，universal apk 才是这类场景的最好选择（但是从头再打一个 apk 显然是浪费资源）；
2. 在 aab 包上传至 GP 的 Console 后，可以清晰得看到所有支持机型的预计下载大小，但是这个数据指标不方便在 CI 上直接用 Shell 脚本来做收集和量化（硬上或者用 Python 大概也可以）；
3. AGP 其实集成了，BundleTool 包，每次又要单独配置 BundleTool 的 CLI 其实显得有些多余。

不禁思考，AGP 有 BundleTool 的依赖，没有这些 BundleTool 后续转换的 Task 吗？使用 Gradle 来做这些后续的操作其实更适合？

## 深入 AGP & BundleTool

如果我们打开 IDE 的 Gradle Task 列表，查询 “Bundle“ 关键词，很容易就会发现 `makeApkFromBundleForXxxx` 等任务，它们的实现是 `com.android.build.gradle.internal.tasks.BundleToApkTask` 这个类。

![Task 列表和 BundleToApkTask 截图](https://2bab-images.lastmayday.com/20211219_bundle_tool_bundle_to_apk_task.png?imageslim)

在源码中查看该类的关联使用，你会发现除了注册没有任何地方有该类的使用痕迹。而这个任务自身的具体作用其实只是：

- 依赖 `PackageXxxBundle`，等它打出一个未签名的 Bundle；
- 输入上一步的 Bundle，执行 BundleTool 包里的 `BuildApksCommand` 命令打出一个 .apks 包。
- 从它的输入参数可以看出，用户需要的**配置**它其实只暴露了一个 `enableLocalTesting`，其余的都使用 BundleTool `build-apks` 命令的**默认值**；
- 从它的输出结果（见下方）可以发现，它竟然只是一个“**中间产物**”（位于 `/intermediates` 文件夹中），而非最终产物。

![](https://2bab-images.lastmayday.com/20211219_bundle_tool_tasks_1.png?imageslim)

这就有点食之无味、弃之可惜了：有现成的 Task 但使用范围十分局限。不如...咱借助 BundleTool 库自己封装一个 Gradle Plugin？


## bundle-tool-gradle-plugin 怎么封装？

简单分析下 BundleTool 的几个命令，我们发现它们的依赖关系如下：

![](https://2bab-images.lastmayday.com/20211219_bundle_tool_commands.png?imageslim)

其中：

- 从顺序来看 `build-apks` 是其他几个命令的必选前置任务（实线），`get-device-sepc` 是几个命令的可选前置任务（虚线）。
- 从交互来看，`build-apks` 和 `get-size`（斜体部分）和构建流程关系紧密，不需要测试设备参与；其余命令需要测试设备参与。
- `get-device-spec` 导出 json 文件是一次性的任务，我们可以假设这部分已经完成；

如此，我们**涉及的领域**也清楚了：`build-apks` 和 `get-size` 等和最终产物直接相关的命令。`install-apks` 和 `extract-apks` 在本地测试可以根据当前设备使用 CLI 完成，在 CI 或者云真机测试平台等一般有专用的脚本去结合 BundleTool 处理。

然后我们考虑获取**如何获取最终输出的 Bundle 并修改**。新版 Variant API 其实已经提供了方便修改和获取最终 Bundle 的方法，整个流程可以参考如下的运行截图。可以看到对比之前的中间产物模式，Variant API 的产物都已经输出到 `/outputs` 文件夹了。由于我们不需要中间 aab，所以我们只要简单调用 `variants.get(SingleArtifact.BUNDLE)`，把获取的 .aab 文件传入自定义 Task，之后再借鉴 AGP 的代码包装下各类命令即可：

![](https://2bab-images.lastmayday.com/20211219_bundle_tool_tasks_2.png?imageslim)

``` kotlin
// 一个验证想法的简单 Task，完整插件的实现比这个复杂一些，请直接参考文末的仓库链接
abstract class ConsumeBundleFileTask : DefaultTask() {

    @get:InputFiles
    abstract val finalBundleProperty: RegularFileProperty

    @get:Internal
    abstract val buildToolInfo: Property<BuildToolInfo>

    @get:Nested
    lateinit var signingConfigData: SigningConfigDataProvider

    @get:OutputFile
    abstract val apksFileProperty: RegularFileProperty

    @TaskAction
    fun taskAction() {
        val aapt2Path = buildToolInfo.get().getPath(BuildToolInfo.PathId.AAPT2)
        println(".get(SingleArtifact.BUNDLE)")
        println("[ConsumeBundleFileTask][input]:" + finalBundleProperty.asFile.get().absolutePath)
        println("[ConsumeBundleFileTask][output]:" + apksFileProperty.asFile.get().absolutePath)
        val signingConfigData = signingConfigData.resolve()!!
        val command = BuildApksCommand.builder()
            .setBundlePath(finalBundleProperty.asFile.get().toPath())
            .setOutputFile(apksFileProperty.asFile.get().toPath())
            .setAapt2Command(
                Aapt2Command.createFromExecutablePath(
                    File(aapt2Path).toPath()
                )
            )
            .setSigningConfiguration2(
                keystoreFile = signingConfigData.storeFile,
                keystorePassword = signingConfigData.storePassword,
                keyAlias = signingConfigData.keyAlias,
                keyPassword = signingConfigData.keyPassword
            ).setLocalTestingMode(false)
        command.build().execute()
    }
    ...
}
```

不了解**新版 Variant API** 的朋友可以参考我这个月在 GDG 社区的分享《扩展 Android 构建流程 - 基于新版 Variant/Artifact APIs》（[回放地址](https://www.bilibili.com/video/BV1WP4y1G71h?share_source=copy_web)）。

最后我们简单看下 BundleTool 的 BuildApksCommand.Builder，这个 Builder 的 setXxx 相关的 **API** 过去一年也就两个小改动，其中还有一个是新增方法，不太影响原有的兼容性，相比 AGP 来说整体**相对稳定**了。

至此，整个插件的理论构建成本和维护成本都在可接受范围内。

## 使用插件

插件的开发和我之前写过的几个并无差别，我们直接来看插件的使用。

**0x01. Add the plugin to classpath:**

``` kotlin
buildscript {
    repositories {
        ...
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:7.0.4")
        classpath("me.2bab:bundle-tool-plugin:1.1.0")
    }
}
```

**0x02. Apply Plugin:**

``` kotlin
// For your application module
plugins {
    id("me.2bab.bundletool")
}
```

**0x03. Advanced Configurations**

``` kotlin
import me.xx2bab.bundletool.*

bundleTool {
    // 这里是一个很有趣的配置项，它可以按不同 variant 渠道去
    // 开启插件的几个功能特性，例如这里我们把 debug + Get_SIZE 功能的组合禁掉了。
    // 你可以根据项目实际的 buildtype 和 flavor 去调整和开启需要的功能。
    enableByVariant { variant, feature ->
        !(variant.name.contains("debug", true) && feature == BundleToolFeature.GET_SIZE)
    }
    
    // 每个配置项会对应到一个 `build-apks` 命令的执行
    buildApks {
        create("universal") {
            buildMode.set(ApkBuildMode.UNIVERSAL.name)
        }
        create("pixel4a") {
            deviceSpec.set(file("./pixel4a.json"))
        }
    }

    // 每个配置项都会依次计算上面 `buildApks` 所有输出的 apks 的大小，
    // 按当前的配置会输出 2 * 1 = 2 份 csv 文件
    getSize {
        create("all") {
            dimensions.addAll(
                GetSizeDimension.SDK.name,
                GetSizeDimension.ABI.name,
                GetSizeDimension.SCREEN_DENSITY.name,
                GetSizeDimension.LANGUAGE.name)
        }
    }
}
```

**0x04. Build your App and Enjoy!**

```shell
# 确保执行命令里的 Variant 是 `enableByVariant` 中允许的
./gradlew TransformApksFromBundleForProductionRelease
```

最后可以在 `/app/outputs/bundle/${variantName}/bundletool` 中找到输出的结果。

![](https://2bab-images.lastmayday.com/20211219_bundle_tool_outputs2.png?imageslim)


## 总结

希望这个小工具可以帮助大家在集成新的 Android Bundle 时提供一些帮助，插件已经开源到我 Github：[bundle-tool-gradle-plugin](https://github.com/2BAB/bundle-tool-gradle-plugin)。关于按 Variant 开关插件功能的思路，请参考下一篇构建指北#12。

*欢迎关注我的[ Github / 公众号 / 播客 / 微博 / Twitter](/about)。*