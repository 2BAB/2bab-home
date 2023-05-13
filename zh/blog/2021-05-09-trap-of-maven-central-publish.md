---
layout: post
date: 2021-05-09
title: "MavenCentral 发布集成的几个坑"
tags: [Android, Gradle, post]
---

由于 [JCenter 即将关停](https://jfrog.com/blog/into-the-sunset-bintray-jcenter-gocenter-and-chartcenter/)，前段时间把几个活跃开源项目的发布流程迁移到了 [MavenCentral](https://search.maven.org) 上去。参考的两篇文章在各个步骤细节上已经讲解的比较详细了：

- [Publishing your Kotlin Multiplatform library to Maven Central](https://dev.to/kotlin/how-to-build-and-publish-a-kotlin-multiplatform-library-going-public-4a8k)
- [Publishing Android libraries to MavenCentral in 2021](https://proandroiddev.com/publishing-android-libraries-to-mavencentral-in-2021-8ac9975c3e52)

然而这个过程我还是踩了些坑，以及有一些摸不着头脑的操作，让我决定写篇文章分享下。

## 不要为单一 Artifact 做申请

在申请 OSSRH Ticket 时，其实我们在申请的是 **Group ID**，关键的参数是 Group Id，标题其实都不需要提及具体的 Artifact。

![group-id](https://2bab-images.lastmayday.com/blog/20210509204352.png?imageslim)

一般 Group ID 即域名倒置，会要求验证域名所有权、Github 仓库所有权、JCenter Group 所有权等，根据对应的回复提示操作即可。一次申请，后续所有的新包发布都不需要再申请，例如：我申请了 `me.2bab` 的 group，那么未来所有 `me.2bab.*` 的发布都将支持。

## Signing Plugin 隐式的配置

为了校验上传的合法性，我们会对待上传的包做 GPG 签名，用的 Gradle 官方的 [The Signing Plugin](https://docs.gradle.org/current/userguide/signing_plugin.html)。刚开始集成时，我按照上述两篇教程的步骤做完，总感觉不对：因为并没有发现我把 signing plugin 所需要的密钥信息传入插件中。

``` kotlin
// 插件 DSL 配置最基本的情况就只要这一行
signing {
    sign(publishing.publications)
}
```

简单浏览下文档，然后你就会发现他竟然约定了一些 Keys，插件配置时直接从 Project 的 Properties 读取了。

``` kotlin
// 所以你可以看到参考教程的写法都是如下
ext["signing.keyId"] = ...
ext["signing.password"] = ...
ext["signing.secretKeyRingFile"] = ...
```

以及这个我以前一直不知道能这样干的约定，参考 [Build Environment](https://docs.gradle.org/current/userguide/build_environment.html#sec:project_properties)：

```
//. Using the following setup, you can pass the secret key (in ascii-
// armored format) and the password using the 
// ORG_GRADLE_PROJECT_signingKey and ORG_GRADLE_PROJECT_signingPassword 
// environment variables, respectively:
signing {
    val signingKey: String? by project
    val signingPassword: String? by project
    useInMemoryPgpKeys(signingKey, signingPassword)
    sign(tasks["stuffZip"])
}
```

我挺不喜欢这种过于“隐式”的规定，不仔细看文档根本不能知道我到底写了啥。好在它还有提供显示配置的办法：

``` kotlin
signing {
    val signingKeyId: String? by project // 放在哪里是可选项，不一定要用 Project Properties
    val signingKey: String? by project
    val signingPassword: String? by project
    useInMemoryPgpKeys(signingKeyId, signingKey, signingPassword) // 这行才是关键
    sign(tasks["stuffZip"])
}
```

类似做法的还有 Android Gradle Plugin 的一些 experimental config，那个由于存在和运用的广泛度太高，可能也懒得吐槽了（不过大部分的开关还是可以从 DSL 里直接配置）。如果你看到这不觉得它有问题，那么可以考虑这样的场景：

- 显而易见 DSL 可以提供有**约束的配置**，优秀的 DSL 你可以直接通过 **IDE 补全**就可以了解自己有哪些 API 可用，怎么交互等；
- 如果所有的插件都用这样的隐式配置，失去了 DSL 的优势，和直接写个 JSON 配置没啥区别，**太松散、易出错、难上手**，你可能不知道哪个配置文件对应哪个模块，不知道这个 Key 写对了没有等等；

下次更新插件的时候我就打算改成 `useInMemoryPgpKeys(...)`，不然过一年又不记得这个坑，或者任何接手你项目而不了解 Signing 插件的人都会再迷惑一回。

## Signing Plugin 的密钥路径指定

如果采用了 `signing.secretKeyRingFile` 配置，那么就得考虑本地和 CI 环境下的不同配置：

- 本地：`../local/secret.gpg`，建议放项目根目录或建立一个 `local` 文件夹并整个文件夹加入 gitignore，原因是一台机器上可能用不止一份的 secret.gpg，密钥随项目走其实比较好找，对其他合作者来说 setup 也方便；
- CI：`/secret.gpg`，直接放虚拟环境根目录，方便配合 RingFile 生成脚本；

## Batch Upload + 控制面板操作

前不久在掘金看到有人写的 MavenCentral 发布教程，提到不要多个包上传后再一起 Close。事实上这是支持并且推荐的，同一 Group ID 的 Package 会放到一个 staging repo，然后就可以一起 close & release。如果引用了自动处理 close & release 流程的插件，聚合上传（batch upload）反倒能提升后续操作的成功率（SonaType 的 API 和网页都不太稳定）。比如我的这个[项目](https://github.com/2BAB/Polyfill)有六个模块，其实就使用了 Batch Upload 策略。

*欢迎关注我的[公众号和微博](/about)。*
