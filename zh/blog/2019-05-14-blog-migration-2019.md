---
layout: post
date: 2019-05-14
title: "博客迁移 #2019"
tags: [Hello World, post]
---

Hmmm 有很长一段时间没有更新博客了，一方面是确实懒，只有私底下还持续在写的一些 Gradle 的文章，但打算做成一个完整的知识图谱所以还没发出来；另一方面老的博客系统确实有点麻烦，有时候不在自己的电脑上就没办法写东西了。所以能不能我用个浏览器就能写文章，就成为了此次的目标啦。

<!--more-->

列一下新的博客系统在用的一些服务和组件，以及选择的原因：

- **Hugo**，从 Hexo 迁移过来的
    - Hexo 的版本改动兼容性比较垃圾 =。=
    - Hexo 打包要超久
- **CloudFlare**，从 DNSPod 迁移过来的
    - 不想使用国内的服务，比如新的控制台需要注册腾讯云绑定微信
    - DNSPod 在新加坡打不开，用阿里云跳板机翻回去也几乎不可用，可能是因为被腾讯收购了所以只去维护新的控制台了吧
- **Github**，从 Coding 迁移过来的
    - 不想使用国内的服务，比如 Coding 并没有 Travis 这种免费的 CI，而新系统使用 Travis 自动 Generate 静态站点
    - Github Pages 会成为我的备选博客托管服务器
- **CodingPages**，维持不变
    - 虽然是一个国内的服务，但是 Coding Pages 的服务器多半是香港新加坡美国的机器，也不需要备案，基于维持国内外访问的速度考虑目前还在使用
- **Qiniu**，维持不变
    - 其实 18 年的时候由于七牛测试域名回收的原因，我把图床改成过 Sina，但是鉴于 Sina 从 19 年  4 月起禁用外链了，所以又迁移回 lastmayday 的免费域名仓库下
    - 不过出于上述相同的原因，其实我本来是打算购入 AWS 香港新节点的 S3，但是需要手写一个 PicGo 插件以及没有好用的 Web 控制台的原因，所以暂时搁浅了…

So，目前写文章的新流程是：

- 本地操作，Clone Github 仓库的 source 分支，写文章 + PicGo 传图，commit & push，Travis CI 自动部署到 Github Pages 和 CodingPages
- 在线操作，直接上 Github 新建个文件就可以写了，用七牛的 Web 控制台传图，Travis CI 自动部署到 Github Pages 和 CodingPages

嗯，舒服！后续还缺的操作嘛：

- 看需不需要 edns-client-subnet 分流国内外访问的服务器
- 如果 Coding Pages 速度不再有优势，那就切到 Github Pages 上
- 如果七牛不再有免费流量或者对域名和区域有限制，就切到 AWS-S3 的香港服务


*欢迎关注我的[公众号和微博](/about)。*