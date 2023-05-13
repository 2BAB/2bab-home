---
layout: post
date: 2017-08-16
title: "构建指北 #6 JDK 内的某个包失踪了"
tags: [Android, Gradle, Android Gradle Plugin, 构建, post]
---

*『构建指北』是探索 Android 构建相关的一系列文章，涵盖了 Gradle、Android Gradle Plugin、Kotlin Script 等工具，以及相关架构上的应用。以发现问题解决问题为出发点，传递新知提高生产效率为落脚点。*

最近在改一个之前的 Annotation Processor，想要实现一个这样的需求：对一个 Class 所 implement 的 interface 做判断——这些 interface 是否 extends 自一个统一的父 Interface。于是 Debug + Evaluate Expression 挖一下 `TypeElement` 的实例里都有些啥，看看有没好使的 API。

<!--more-->

1. `typeElement.getInterfaces()` 可以拿到当前元素的 List<TypeMirror>，这个一目了然；
2. List 里的 typeMirror，其实质是 `com.sun.tools.javac.code.Type$ClassType` 类型；
3. 进一步，在 Evaluate Expression 里瞎蒙会发现 `((Type.ClassType)mirror).interfaces_field` 我们可以拿到上层具体的 Interface 信息，嗯，基本达到我们的目的了；

有了刚刚的实验，就快速写出一个测试代码。接着编译打包——竟然报错（请无视它是个中文错误 =。=）：

> 错误：程序包 com.sun.tools.javac.code 不存在
> 错误：找不到符号
> 符号：类 Type

明明 IDE （Android Studio）识别了，这个类也是个 JDK 自带的工具类，为何不存在？唯一能想到的原因就是编译时 JDK 的所有包并不是都已加入到 classpath 里。在 Google 的过程中，也发现过[类似的问题](https://stackoverflow.com/questions/10314904/no-com-sun-tools-javac-in-jdk7)，但是仔细检查了 IDE 的 Boot JDK 配置，Gradle 的 JAVA_HOME 配置，都没有错。好吧，可能这是个不为人知的某种默认操作...

Google 没有明确的答案，问了很多师兄也只说碰到过类似的问题，最后还是靠自己引包解决（如果有了解内情的同学欢迎给我发邮件讨论！）。这边先给出一个我的解法：

``` gradle
// 手动加入 tools.jar 到 compile
// 使用 Gradle 提供的环境变量，避免自己写大量兼容性代码
compile files(org.gradle.internal.jvm.Jvm.current().toolsJar)

// 类似的环境变量 Gradle 还提供了一些
// import org.gradle.internal.jvm.Jvm
// println Jvm.current().javaHome
// println Jvm.current().javacExecutable
// println Jvm.current().javadocExecutable
...
```

咳咳，话说回来，即便解决了包的问题，上面那个找上层 Interface的办法也是有问题的，因为`((Type.ClassType)mirror).interfaces_field`  找出来的 interface type 是无法再向上查找 interfaces_field 的，找到的会是空值（没兴趣去看为什么了...）解决办法也是有的：

``` java
TypeElement typeElement = elementUtils.getTypeElement(interfaceCanonicalName);
List<? extends TypeMirror> interfaces = typeElement.getInterfaces();
...
```

循环用 `elementUtils.getTypeElement(interfaceCanonicalName)` 一路往上取 Interface 即可（还是靠自己之前的积累才蒙到..orz）。



*欢迎关注我的[公众号和微博](/about)。*