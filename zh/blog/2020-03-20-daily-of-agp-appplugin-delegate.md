---
layout: post
date: 2020-03-20
title: "构建指北 #8 AppPlugin 加了代理？"
tags: [Android, Gradle, Android Gradle Plugin, 构建, post]
---

*『构建指北』是探索 Android 构建相关的一系列文章，涵盖了 Gradle、Android Gradle Plugin、Kotlin Script 等工具，以及相关架构上的应用。以发现问题解决问题为出发点，传递新知提高生产效率为落脚点。*

### 问题回顾

这两天在维护 [ScratchPaper](https://github.com/2BAB/ScratchPaper) ，更新依赖的 AGP（Android Gradle Plugin）版本到 `3.6.1`。升级的过程中发现，原本项目使用到的对 `AppPlugin` 的 Hook 点失效：

> 回顾下，大约是在 3.3.x-3.5.x 的版本迭代里，启用了对 `BuildToolInfo` 类的反射获取，其目的是为了获取到 Aapt2 可执行文件的所在路径，从而支持自定义重新生成 App Icon 对应的二进制文件图标。

``` kotlin
package me.xx2bab.scratchpaper.utils

import com.android.build.gradle.AppPlugin
import com.android.build.gradle.BasePlugin
import com.android.build.gradle.internal.scope.GlobalScope
import com.android.sdklib.BuildToolInfo
import org.gradle.api.Project

class AndroidPluginUtils(val project: Project) {

    @Throws(Exception::class)
    fun buildToolInfo(): BuildToolInfo {
        val basePlugin = project.plugins.findPlugin(AppPlugin::class.java) as BasePlugin<*>
        val scope = getField(BasePlugin::class.java, basePlugin,
                "globalScope") as GlobalScope
        return scope.sdkComponents.buildToolInfoProvider.get()
    }

    fun <T> getField(clazz: Class<T>, instance: T, fieldName: String): Any {
        val field = clazz.declaredFields.filter { it.name == fieldName }[0]
        field.isAccessible = true
        return field.get(instance) as Any
    }

}
```

让我们把项目依赖的 AGP 版本升级到 `3.6.1`，解决掉升级带来的常见编译错误后，跑个 Demo 试试：

> FAILURE: Build failed with an exception.
>
> \* What went wrong:
> 
> Execution failed for task ':app:processDemoDebugResources'.
> 
> Index: 0, Size: 0
> 
> ...
> 
> Caused by: java.lang.IndexOutOfBoundsException: Index: 0, Size: 0
> 
>   at me.xx2bab.scratchpaper.utils.AndroidPluginUtils.getField(AndroidPluginUtils.kt:21)
> 
>   at me.xx2bab.scratchpaper.utils.AndroidPluginUtils.buildToolInfo(AndroidPluginUtils.kt:15)
> 
>   at me.xx2bab.scratchpaper.utils.Aapt2Utils.compileResDir(Aapt2Utils.kt:13)

**奇了怪了，为什么 `globalScope` 字段反射失败了？**

### 问题分析 & 源码重现

第一时间，当然是查看 `AppPlugin` 和 `BasePlugin` 的源码，看看该字段是否已被移除或改名了。然而惊讶的发现，`BasePlugin` 和 `AppPlugin` 下竟然空空荡荡：

``` kotlin
package com.android.build.gradle

import org.gradle.api.Project

/**
 * The plugin applied with `com.android.application'
 */
class AppPlugin: BasePlugin() {
    override fun apply(project: Project) {
        super.apply(project)

        project.apply(INTERNAL_PLUGIN_ID)
    }
}

private val INTERNAL_PLUGIN_ID = mapOf("plugin" to "com.android.internal.application")
```

真正有作用的代码只是一行内部插件的引入，插件名是 `com.android.internal.application`。顺藤摸瓜，去 `META-INF` 的插件注册目录看看，

``` xml
// com.android.internal.application.properties
implementation-class=com.android.build.gradle.internal.plugins.AppPlugin
```

竟然出现了另外一个 `AppPlugin`，查看对应的源码，发现之前版本的 `AppPlugin` `BasePlugin` 等等类多数被移动到 `com.android.build.gradle.internal.plugins` 包下，而现在 `com.android.build.gradle` 包下的各类 Plugin 很多只是代理了内部的各类插件。

之后，我想去找找有没有对这块改变的说明，毕竟目前的注释过于简单，没有对代理的意义做过多的说明。上 [GoogleSource](https://android.googlesource.com/platform/tools/base/+/ecdfaee5fbdfa69e82bb9266b6742d9c3db27880) 翻到了这块相关的 commit 信息：

> New public plugin and move existing to internal.
>
> All current plugin classes are considered public API
because of how Gradle allows finding plugins. Therefore
we need these classes to not change.
>
> However, we also want to have plugin authors target gradle-api
instead of the 'gradle' artifact. This change forks the current
plugin classes into a new set of public class (name unchanged)
and the actual implementations as private, internal classes.
> 
> The new public plugins delegate to the internal plugins
by applying them as separate "internal" plugins. For now
the public plugins stay in gradle-core but we'll move them
to gradle-api at some point. This is currently limited by
the presence of getExtension on BasePlugin, both of which are
now deprecated.
> 
> Because our classes have no other public API this should not
break anything.

简单来说，他们想把 `gradle-core` 和 `gradle-api` 进行区分，并让插件作者们依赖于 `com.android.tools.build:gradle-api` 而不是 `com.android.tools.build:gradle`。这个代理目前只是为了维持原有的逻辑不变，同时占个桩表示我们要开始干活了。有趣的是，原本的插件代码多使用 Java 编写，现在的这些代理类均使用 Kotlin，这也同样印证了 AGP 一轮改革的开始。

### 解决方案

由于原有的逻辑都还存在于 internal 的 plugin 中，我们只要简单地替换 import 的路径即可：

``` kotlin
import com.android.build.gradle.internal.plugins.AppPlugin
import com.android.build.gradle.internal.plugins.BasePlugin
```

通过 `findPlugin` 即可找到老版本的 AppPlugin 等插件。具体的修改信息可以参考这次迭代的 [commit message](https://github.com/2BAB/ScratchPaper/commit/17f3e83615ca95104b735f6c541ac65df8e4962c)。

### 结论

不确定之后基于 AGP 的 Hook 是否还像之前一样可操作，目前看来版本迭代的类变化更加的频繁，我自己维护的基于 AGP 的 Plugins 可能也会增加维护成本。之前考虑过的开发一个第三方的 AGP 的 Polyfill 也必须得操作起来了，分离关注点，减少插件开发和维护成本，在插件上集中注意力实现一个点的目标。

*欢迎关注我的[公众号和微博](/about)。*

