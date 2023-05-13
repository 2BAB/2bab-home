---
layout: post
date: 2017-03-10
title: "Android 源码笔记 #1 编译&烧录"
tags: [Android, Framework, 源码, post]
---

由于最近工作需要 + 自己也挺感兴趣，折腾起 Android 的下层开发。

## 环境描述：
- macOS 10.12 Sierra
- Xcode 8（安装各种环境会用到，然而正式编译时没用这个）
- android-5.1.1_r14，LMY48M，Nexus 7（flo）

<!--more-->

## 素材准备
上 Google 爸爸的 [Android Source](http://source.android.com/source/initializing.html) ，按 `Establishing a Build Environment` 和 `Downloading the Source` 做完即可，只有小坑如下：

- `Creating a case-sensitive disk image` 时，不要用 Disk Utility 的 GUI 界面创建，大概因为版本更新了，找不到创建稀疏磁盘的选项，并且大小写那项我选了两回都没生效（？？？），**请按它后续的提示直接用 shell 操作**；
- `Reverting from make 3.82` 这段，看清楚其实只有在 4.0.x 及以下系统才需要做，现在一般不会去编这个版本了**可以忽略**；
- `Initializing a Repo client` 就是下源码啦，可以使用[清华大学的 AOSP 镜像](https://mirrors.tuna.tsinghua.edu.cn/help/AOSP/)，比较不会碰到下载的各种问题（不过我是公司网，直连速度喜人 4M/s）。

## 编译
按着 Android Source 的步骤，现在终于要 `Preparing to Build` 啦，注意到其实还有个页面可能没看仔细——[Requirements](https://source.android.com/source/requirements.html)，这里有坑的：

> **Mac OS (Intel/x86)**
> 
> - Android 6.0 (Marshmallow) - AOSP master: Mac OS v10.10 (Yosemite) or later with Xcode 4.5.2 and Command Line Tools
> - Android 5.x (Lollipop): Mac OS v10.8 (Mountain Lion) with Xcode 4.5.2 and Command Line Tools
> 
> - Android 4.1.x-4.3.x (Jelly Bean) - Android 4.4.x (KitKat): Mac OS v10.6 (Snow Leopard) or Mac OS X v10.7 (Lion) and Xcode 4.2 (Apple's Developer Tools)
> 
> - Android 1.5 (Cupcake) - Android 4.0.x (Ice Cream Sandwich): Mac OS v10.5 (Leopard) or Mac OS X v10.6 (Snow Leopard) and the Mac OS X v10.5 SDK

按这个表，Google 其实推荐 5.x 6.0 使用 4.5.2 的 Xcode 及其 SDK 来编译，然而现代 macOS 早已不支持这些老东西了：

- StackOverflow 上各种教你拷贝 10.8 的 Xcode SDK、改 `build/core/combo/mac_version.mk` ，我试了一早上各种版本，没成
- 有些民间教程表示自己啥也没改，10.10 10.11 SDK 完美运行没有问题，我也是没成
- **重点来了**，[这个答案](http://stackoverflow.com/questions/31589866/running-aosp-build-on-mac-yosemite-and-later/36709862#36709862) 有理有据，他直接用旧版本的 Xcode，具体操作是下个旧版的 DMG（链接可能无效，自己上苹果的开发者页面找一下即可） 然后挂载上来，路径是 /Volumes/Xcode/（懒得安装到本地），最后在 shell 中选择这个作为当前 Xcode 的版本 `sudo xcode-select -s /Volumes/Xcode/Xcode.app/Contents/Developer`

目测一切奇怪的环境问题都可以用这个终极办法修复。

最后的最后，终于是编译啦：

``` shell
$ make clobber
$ source build/envsetup.sh
$ lunch aosp_arm-eng              
$ make -j4                               
```

需要注意的是：

- `lunch` 要选对应机型和权限类型，比如我要编 Nexus 7（flo）的 debug，就是 `lunch aosp_flo-userdebug`
- 如果选的不是 ARM 虚拟机类型的编译版本，则需要加入对应机型的特定驱动一起编译，具体可以参考 [Google’s Nexus driver page](https://developers.google.com/android/drivers) 以及这篇文章的[驱动部分说明](http://www.jianshu.com/p/1c3d47b2031f)
- `make -j` 跟的数字有些讲究，其实根据线程池的最高效算法，CPU 密集型的线程池应该是 n + 1 的 pool 大小，由于现在的 Intel CPU 都是超线程的，例如我用的 15 寸 Mac 是 4 核 8 线程，所以就是 `make -j9`

## 烧录

`Running Build` 这章没多少内容，也就一个命令有点坑：`fastboot flashall -w`。直接运行会抛错：`error: neither -p product specified nor ANDROID_PRODUCT_OUT set`。需要设置一下 img 的目录，按照提示 `export ANDROID_BUILD_OUT="path/to/your/img/folder"` 设置即可 （-p 参数用了没成功...大概姿势有问题）

OK，终于 Run 起来了。后续可以做进一步的调试了。

## 参考链接
1. [Downloading and Building - Android Source](http://source.android.com/source/)
2. [Build and Run Android from AOSP Source Code to a Nexus 7](https://stanfy.com/blog/build-and-run-android-from-aosp-source-code-to-a-nexus-7/)


*欢迎关注我的[公众号和微博](/about)。*