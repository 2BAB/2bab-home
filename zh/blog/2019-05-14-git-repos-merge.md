---
layout: post
date: 2019-05-14
title: "合并两个 Git Repo"
tags: [Git, post]
---

手头的项目之前是拆分成两个 repo 进行维护的，这里称之为 A 和 B 好了。B 是一个公共的基础代码库，设计之初被多个项目进行引用。随着几个项目的共同迭代，可共享的代码块越来越少，B 的维护从一个分支变成了每个项目一个分支。接手这个项目后觉得这个维护模式太复杂了，于是连同其他项目把 B 上自己的分支迁移走，彻底废弃 B repo。

<!--more-->

如果不考虑 commit history，把代码从 B 的项目分支直接拷贝过来 A 即可，这边我们考虑的是迁移带历史记录的整个分支。我尝试了两种办法：

- 添加新的 remote，拉取对应分支，`merge` 两个分支
- 添加新的 remote，拉取对应分支，`rebase` 两个分支

对于 `merge`，由于两个分支没有任何的 commit tree 关联，会出现 `unrelated-histories` 的错误，所以一开始放弃了这个办法。

对于 `rebase`，由于记录较多，且两个项目有部分代码分别在两边出现过（包名类名都相同），所以 `rebase` 的过程中不断有冲突要解决，时间成本巨大，且不知道大量的冲突调整后会不会有问题，所以也只能作罢。

最后回头来看 `merge` 的错误，发现其实有一个 `--allow-unrelated-histories` 的参数可以绕过检查，然后问题就迎刃而解了。

``` bash
// Add Core repo as a remote source of this repo
$ git remote add core YOUR_GIT_REPO

// Fetch the branch we need to local: 
$ git fetch core development-a:a-core

// Clean up the folder, only remains Core module that we need 
// Merge with the flag --allow-unrelated-histories (or it will throw unrelated-histories error)
$ git merge a-core --allow-unrelated-histories 

// Modify build script to match the new structure
...
```

事实上，这个问题的根本在我们拥有了一个超级大的 `common` 模块。这也是很多 App 在迭代发展变大的过程中必经的一个问题，解决的办法也不难，就是在一个公共的功能成熟的时候（比如从 0.1 到 1.0 了）就把它独立出来，其他项目独立引用这个单独的小模块，或者如果在一开始就确定了它可以作为一个独立的模块（比如独立存储），那就不要把代码和其他公共模块混在一起。具体操作上通常有两种：

- 要么把这个 `common` repo 变成一个 `monorepo` 的结构，上层的业务项目虽然需要 pull 这个 repo，但是引用时是完全按照细分的每个模块进行引用
- 要么把 `common` repo 完全拆分开成独立模块，独立进行维护，上层不同的业务项目只引用具体需要的二进制版本

国内例如淘系的 App 比较倾向于第二种，而国外的公司比如 Google 更多会采用第一种，各有优劣吧。


*欢迎关注我的[公众号和微博](/about)。*