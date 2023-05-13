---
layout: post
date: 2017-06-21
title: "构建指北 #5 含 buildscript 的脚本执行顺序"
tags: [Android, Gradle, Android Gradle Plugin, 构建, post]
---

*『构建指北』是探索 Android 构建相关的一系列文章，涵盖了 Gradle、Android Gradle Plugin、Kotlin Script 等工具，以及相关架构上的应用。以发现问题解决问题为出发点，传递新知提高生产效率为落脚点。*

最近在改一个裹脚布项目，对打包脚本升级的要求是「循序渐进」（工期紧，稳定为主）——Debug 下用新版的 Gradle Plugin，Release 用旧版的。嗯，很自然会想到改动 root project 下的 `build.gradle`，加一段判断：

``` gradle
// apply isDebug() method from utils.gradle
apply from: project.getRootProject().rootDir.absolutePath + '/scripts/utils.gradle'
def gradlePluginVersion = isDebug() ? '2.3.3' : '2.0.0'

buildscript {

    repositories {
        jcenter()
        mavenLocal()
        mavenCentral()
    }

    dependencies {
        // use outer variable
        classpath "com.android.tools.build:gradle:$gradlePluginVersion"
        classpath ...
    }

}

...
```
<!--more-->

但是运行报错：

> Could not get unknown property 'gradlePluginVersion' for object of type  org.gradle.api.internal.artifacts.dsl.dependencies.DefaultDependencyHandler.

竟然找不到这个变量，不太合理呃，之前在各种脚本里定义依赖的时候也这样干过，没问题呀？

## 神秘的 buildscript block
Google 翻一下，发现还是有一些[类似的问题](https://discuss.gradle.org/t/inherit-inject-buildscript-dependencies-into-custom-script-within-subproject/7175/9)，但多数是在研究怎么让 buildscript 引入的 deps 可以被一些自定义的脚本找到的[问题](https://stackoverflow.com/questions/37058780/access-classpath-dependencies-defined-in-buildscript-block-in-applied-external-s)。

读读[官方文档](https://docs.gradle.org/3.3/userguide/organizing_build_logic.html#sec:build_script_external_dependencies)，我们知道 buildscript() 是创建了 ScriptHandler 实例：

> The closure passed to the buildscript() method configures a ScriptHandler instance. You declare the build script classpath by adding dependencies to the classpath configuration. This is the same way you declare, for example, the Java compilation classpath. You can use any of the dependency types described in Section 25.4, “How to declare your dependencies”, except project dependencies.

> Having declared the build script classpath, you can use the classes in your build script as you would any other classes on the classpath. 

而 ScriptHandler 的源码注释写的是：

> To declare the script classpath, you use the DependencyHandler provided by getDependencies() to attach dependencies to the "classpath" configuration. **These dependencies are resolved just prior to script compilation, and assembled into the classpath for the script.**

也就是说，buildscript block 的执行是优于其他脚本的（但我猜应该有一个例外是 init script，后面有空再写一篇）。其实很好理解，因为这货定义的是 **classpath** 依赖，我们编译用到的的 `Android Gradle Plugin` 等等都是从这里引入的，如果 buildscript 不是优于其他脚本执行，那才会有问题嘞！

## 撸个测试代码

``` gradle
println 'Hello First Line'

buildscript {

    println 'Hello Second Line'

    repositories {
        ...
    }

    dependencies {
        ...
    }

}

afterEvaluate { project ->
    println 'Hello Third Line'
}
```

加 `--info` 执行这个脚本构建，可以看到如下输出：

``` shell
Starting Build
Settings evaluated using settings file '/Path/To/Your/Project/settings.gradle'.
Projects loaded. Root project using build file '/Path/To/Your/Project/build.gradle'.
Included projects: [root project 'Your-Project', project ':app']
Evaluating root project 'Your-Project' using build file '/Path/To/Your/Project/build.gradle'.
Hello Second Line
/Path/To/Your/Project
Creating new cache for metadata-2.23/module-metadata, path /Users/2bab/.gradle/caches/modules-2/metadata-2.23/module-metadata.bin, access org.gradle.cache.internal.DefaultCacheAccess@24473bd5
Creating new cache for metadata-2.23/artifact-at-repository, path /Users/2bab/.gradle/caches/modules-2/metadata-2.23/artifact-at-repository.bin, access org.gradle.cache.internal.DefaultCacheAccess@24473bd5
Hello First Line
Hello Third Line
Evaluating project ':app' using build file '/Path/To/Your/Project/app/build.gradle'.
```

**可以看到执行顺序是 2->1->3，即先执行 Evaluate build.gradle，然后发生 2 的执行（也就是先执行 buildscript block），然后再顺序执行该脚本的其他代码 1（以及后续的代码如果有的话），Evaluate 结束执行 3。**

断点 Gradle 源码：

1.DefaultScriptRunnerFactory.ScriptRunnerImpl.run() ->

``` java
@Override
public void run(Object target, ServiceRegistry scriptServices) throws GradleScriptException {
    if (!compiledScript.getRunDoesSomething()) {
        return;
    }
    
    ClassLoader originalLoader = Thread.currentThread().getContextClassLoader();
    T script = getScript();
    script.init(target, scriptServices);
    Thread.currentThread().setContextClassLoader(script.getContextClassloader());
    script.getStandardOutputCapture().start();
    try {
        script.run();
    } catch (Throwable e) {
        throw new GradleScriptException(String.format("A problem occurred evaluating %s.", script), e);
    } finally {
        script.getStandardOutputCapture().stop();
        Thread.currentThread().setContextClassLoader(originalLoader);
    }
}
```

2.ProjectScript.buildscript() ->

``` java
public void buildscript(Closure configureClosure) {
    getScriptTarget().buildscript(configureClosure);
}
```


遗憾的是 `script.run()` 的过程暂时还没找到对应的实现，猜测和 Java 找 main 方法思路类似吧。但是通过比对 **调用 `ProjectScript.buildscript()` 该方法的时机** 和 **测试代码打印的 log**，会发现：**断到该方法调用时，还没有任何的 log 输出（也就是 buildscript 确实是优先执行的），如果在 buildscript 闭包开始做任何操作，比如 apply 一个脚本，那么会立马走到对应的 apply 方法中。**

## 解法

有了上面的测试，知道了 buildscript block 的优先执行，所以问题也就简单解决了——把 buildscript 相关逻辑的脚本放到 block 内；此外，如果 block 内的东西还需要暴露给其他脚本，依旧是可以用 `ext` 来做 export 的：

``` gradle
buildscript {

    apply from: project.getRootProject().rootDir.absolutePath + '/scripts/utils.gradle'
    def gradlePluginVersion = isDebug() ? '2.3.3' : '2.0.0'
    ext.gradlePluginVersion = gradlePluginVersion
    
    repositories {
        jcenter()
        mavenLocal()
        mavenCentral()
    }

    dependencies {
        classpath "com.android.tools.build:gradle:$gradlePluginVersion"
        ...
    }

}
```




*欢迎关注我的[公众号和微博](/about)。*