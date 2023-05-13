---
layout: post
date: 2015-02-10
title: "Android 5.0 以上 Chrome AppBar 颜色定制"
tags: [Android, Chrome, post]
---
放假在家用回了 Nexus 4，在 Lollipop 作为日常系统使用一段时间后，发现了一个有意思的东西。如下图，正常情况下使用 Chrome 浏览网站时，多任务的预览界面上，Chrome 的 App bar 是灰色一片。而其背后的知乎、Gmail因为设定了 colorPrimary 而极具辨识度。

![未开启“合并标签页和应用”的界面，开启后的界面，Overview界面。](https://ww1.sinaimg.cn/large/005YhI8igy1fvhj8eowjjj31kw0vp7az)
<div style="text-align:center;"><i>未开启“合并标签页和应用”的界面 / 开启后的界面 / Overview</i></div>

<!--more-->

但是在浏览 V2EX 时发现，Chrome的 App bar 竟然不是之前的灰色,类似的情况出现在 Android Police 和 但大的博客。

![V2EX / @但丁不淡定 的博客 / Overview](https://ww1.sinaimg.cn/large/005YhI8igy1fvhj8v269oj31kw0vp7a6)
<div style="text-align:center;"><i>V2EX / @但丁不淡定 的博客 / Overview</i></div>


查了一发 Chrome 的更新历史，发现只要满足以下条件，即可定义 Overview App Bar 颜色，同时也影响了 Chrome 内的 toolbar / statusbar 颜色。

> 1. 系统要求 Android 5.0 以上
> 2. 未开启“合并标签页和应用” 的 Chrome 39 以上
> 3. 在网站``<head>``中添加自定义主题颜色``<meta name="theme-color" content="#262a30">``

![本站的效果](http://engineering-blog-2bab.qiniudn.com/theme-color-2bab.jpg)
<div style="text-align:center;"><i>本站使用的颜色及效果</i></div>

随着 Lollipop 的普及以及默认 Chrome 浏览器的支持，相信这个特性会得到越来越多的网站支持，带来原生应用般辨识度的同时也增添了网站的个性。

*欢迎关注我的[公众号和微博](/about)。*