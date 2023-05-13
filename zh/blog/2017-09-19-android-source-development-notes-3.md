---
layout: post
date: 2017-09-19
title: "Android 源码笔记 #3 - Aapt 编译"
tags: [Android, Framework, 源码, post]
---

碰到个问题，需要 debug aapt 里的一些东西，本来以为按照 [Android源码笔记-1-编译&烧录的一些坑](http://2bab.me/2017/03/10/android-source-development-notes-1) 的办法去设置环境再把 `make` 命令目标改一下即可，但是发现还是有些小问题，写下记录一哈。

先来结论，源码准备的步骤不叙，正确的步骤是：

``` shell
$ make clobber
$ source build/envsetup.sh
$ lunch sdk-eng 
$ make -j9 aapt            
```

<!--more-->

1. Google 爸爸的完整教程[在此](https://android.googlesource.com/platform/sdk/+/master/docs/howto_build_SDK.txt)，一开始确实没发现；
2. 注意，lunch、make 的目标和编译 ROM 不同；
3. 由于是要编译一个自己用的 aapt，所以最好是备份一个 aapt，但是直接在源码目录 copy 一份会有报错，正确的姿势[参考这个](http://blog.csdn.net/sbsujjbcy/article/details/51418336)，当然，我偷懒直接拷了一份到非源码目录下的位置；
4. 以 Mac 为例，生成产物的路径是 `/pathToYourAndroidSource/out/host/darwin-x86/bin/aapt`（一开始用的 `/pathToYourAndroidSource/out/target` 里的产物发现会出现 `cannot execute binary file`，正常在 Mac 上使用的 aapt 的格式是 Mach-O 的可执行文件，但是这个 aapt 是 elf-32 的，也就是 32位 的 linux 下执行的，暂时没去了解是编译出其他平台的版本还是中间产物）

*欢迎关注我的[公众号和微博](/about)。*

