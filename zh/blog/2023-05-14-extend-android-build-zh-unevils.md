---
layout: post
date: 2023-05-14
title: "新书上架！《Android 构建与架构实战》系统学习 Gradle 与 AGP。"
tags: [Gradle, Kotlin, Android Gradle Plugin, EAB, post]
---

![](https://2bab-images.lastmayday.com/Android%E6%9E%84%E5%BB%BA%E4%B8%8E%E6%9E%B6%E6%9E%84%E5%AE%9E%E6%88%98-%E7%94%B5%E5%AD%90%E7%89%88%E5%B0%81%E9%9D%A2-%E7%AB%8B%E4%BD%93.png?imageslim)

Android 开发经过十多年的技术演进，如今 Gradle 对于开发者，已是必备工具。**一个企业级的 Android 项目，仅使用 Android Studio 项目里的默认配置，不通过 Gradle 定制编译测试流程、不与 Android Gradle Plugin（下文简称 AGP）深度交互，几乎是不可能的**。常见的基础应用场景，例如多渠道打包分发、自动化多语言包下载，APK、AAR、AAB 上传与发布等等，是不少团队会面临的问题。

Gradle 作为一个平台型工具，背后关联的知识体系复杂、学习曲线陡峭。在实际工程中，**这类问题多数是由公司的个别高级工程师或基础架构团队负责，因此网上的讨论度并不高，一些有价值的场景和话题也就难以大面积暴露。**

实际上，Android 开发者掌握 Gradle 及关联技术对于工作的帮助是多方面的。**通过系统性地学习 Gradle 与 AGP 的高级应用，你将筑起厚实的技术壁垒，包括 Gradle 技术与 Android 构建的理解已能超过大多数的 Android 开发者。**

## 本书特色

本书采用 **Kotlin** 编写，基于最新的 **Gradle 7 和 AGP 7**（含部分 AGP 8 前瞻）。它不局限于 build.gradle(.kts) 的脚本配置，** 而是引入大量 Gradle 的进阶内容为铺垫，超过 40 个自定义的生态协同插件为载体，带你探讨新版 AGP 的接口与原理**，思考如何在 AGP 相对闭环的容器中定制项目所需的构建流程。

后期我们还设定了一系列的**架构实践章节**，涵盖资源任务扩展、Kotlin 源码任务扩展、JVM 字节码任务扩展、构建优化技巧等多个部分，巩固对 Android App 构建与架构的认知。

## 本书目录

按照传统 A5 大小的纸书估算，本书有近 700 页的容量，是市面上一般技术图书的 2 倍。本书所配套的材料，包括示例源码、参考资料均以开源至我的 Github [仓库](https://github.com/2BAB/Extend-Android-Builds-zh)。

（篇幅所限此处仅展示了 2 级目录，完整的 3 级目录参见[资料仓库](https://github.com/2BAB/Extend-Android-Builds-zh/blob/main/TOC.md)）。

#### 第一章  环境与概念

* 1.1  开篇介绍
* 1.2  Android App 构建与架构
* 1.3  构建工具发展历史
* 1.4  手动构建一个 App
* 1.5  Run 按钮背后

#### 第二章  快速上手

* 2.1  Gradle 项目的工程结构
* 2.2  Gradle 生命周期基础梳理
* 2.3  Kotlin 和 Gradle Kotlin DSL
* 2.4  第一个插件：发送构建通知到 Slack
* 2.5  Gradle 插件分类
* 2.6  Gradle 任务基础梳理
* 2.7  源码与调试

#### 第三章 扩展 Android 构建流程

* 3.1  变体（Variant）
* 3.2  Variant & Artifact API v1
* 3.3  Variant & Artifact API v2
* 3.4  溯源 AGP 入口流程
* 3.5  溯源 Artifact API
* 3.6  创建自己的 Artifact 集合 - Polyfill 工具库

#### 第四章  深入 Gradle 原生 API

* 4.1  生命周期的钩子（Hook）
* 4.2  插件扩展的属性/任务的属性
* 4.3  DSL 嵌套
* 4.4  任务编排
* 4.5  缓存与增量机制
* 4.6  插件测试

#### 第五章  资源构建扩展

* 5.1  AGP 资源交互 API 的进阶使用
* 5.2  深入资源编译与打包
* 5.3  架构应用：为启动图标加上蒙层 - ScratchPaper 插件
* 5.4  架构应用：自动化 BundleTool 转换流程 - BundleTool 插件

#### 第六章  代码构建扩展之 Kotlin 源码

* 6.1  AGP 源码交互 API 进阶使用
* 6.2  Kotlin Symbol Processing (KSP)
* 6.3  架构应用：源码阶段的路由表生成 - Koncat 插件

#### 第七章  代码构建扩展之 JVM 字节码

* 7.1  字节码简介
* 7.2  AGP 7.0 之前的字节码修改 API：Transform API
* 7.3  AGP 7.0（含）之后的字节码修改 API：Artifacts API
* 7.4  AGP 7.0（含）之后的字节码修改 API：Instrumentation API
* 7.5  架构应用：敏感 API 调用的监控与代理 - Caliper 插件

#### 第八章  提升构建体验

* 8.1  构建分析
* 8.2  构建提速技巧
* 8.3  根据 Variant 决定是否启用插件


## 如何购买

本书目前已上架 [EAB 官网](https://eab.2bab.com/)：定价 ¥499。进入后请点击“专栏”阅读（推荐使用网页版获得最佳阅读体验）。

![](https://2bab-images.lastmayday.com/Android%E6%9E%84%E5%BB%BA%E4%B8%8E%E6%9E%B6%E6%9E%84%E5%AE%9E%E6%88%98-%E7%94%B5%E5%AD%90%E7%89%88%E5%B0%81%E9%9D%A2-%E7%AB%8B%E4%BD%93.png?imageslim)

## 关于作者

我是 AB，常用 ID 为 *2BAB*。Android 开发者、开源贡献者、技术书籍[《KOGE》](https://2bab.me/zh/blog/2023-05-05-kotlin-for-gradle/)和《Android 构建与架构实战》作者，以及《二分电台》播客主理人。

同时，我是 [Android GDE](https://developers.google.com/community/experts/directory/profile/profile-el-zhang-2bab)（Google 开发者专家）之一。

你可以在我的博客主页找到全部的作品。https://2bab.me/zh/

*欢迎关注我的[ Github / 公众号 / 播客 / Twitter](/zh)。*
