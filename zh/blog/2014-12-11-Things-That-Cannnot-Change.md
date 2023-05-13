---
layout: post
date: 2014-12-11
title: "Android 里不能改变的东西 [译]"
tags: [Android, post]
---

[原文链接](http://android-developers.blogspot.com/2011/06/things-that-cannot-change.html) , 翻译 by 2BAB。

[本文作者 Dianne Hackborn, 一位足迹遍布所有安卓应用框架的工程师 - Tim Bray]

有时，一位开发者会对他的应用做一些改变(然后发布新版本)。当新版本的应用覆盖旧版的安装时，发生了一些意想不到的结果——快捷方式失效，桌面小部件(锁屏小部件)消失，甚至是应用根本无法覆盖安装。这是因为，一个应用里的某些部分在应用发布后就不可改变。通过深入理解它们，你可以避免这些“意外”。

## **Your package name and certificate ( 包名和签名 )** ##

首先，最显而易见的是“manifest里的包名”，即你在app的AndoridManifest.xml里定义独特的包名。它遵循Java的包命名规则，使用你的个人(或公司)域名，避免命名冲突。举个例子，自从谷歌拥有了“google.com”这个域名，谷歌的所有app就开始使用“com.google.xxx”作为它的mainfest包名。对开发者来说，遵循这个命名规则极其重要，它有助于避免命名冲突。

一旦你发布了你的应用，它manifest 里的包名就是你应用永远独一无二的身份证明。如果包名进行了变更，新的app将无法覆盖旧app(因为它被识别为一个全新的app)。

<!-- more -->

和包名同样重要的还有app的签名。签名代表着app的作者，如果你改变一个app已经存在的签名，该app就会因为“作者”改变而被认为是与原来完全不同的app。这个新的app发布到市场时不能作为原来app的升级版本，同理也不能在一台Android设备上覆盖安装。

当用户安装一个被上述两种改动之一改变过的app时，用户看到的实际情况是不一样的: 

- 若包名被更改，新app将会和旧app共存
- 若签名被更改，试图安装新app时将会提示安装失败，除非你能删除该app的旧版本。


如果你改变了app的签名，你应该同时改变其包名，避免它安装失败。换句话说，app的不同作者使其识别为不同的应用，所以它的包名应进行合理地更改从而反应出这一情况。(当然，实验性的项目使用相同的包名以及测试签名是ok的，因为它们并不会被发布。)

## **Your AndroidManifest.xml is a public API ( AndroidManifest文件是公共的接口 )** ##

事实上不只是你的包名是不可变的。[AndroidManifest.xml](http://developer.android.com/guide/topics/manifest/manifest-intro.html) 的一个主要功能是声明app的public API，并提供给使用它的其他app和安卓系统。在Manifest里声明的每一个组件，都应被当做一个public API而不是private(即意味着它的 [android:exported](http://developer.android.com/guide/topics/manifest/activity-element.html#exported) 状态是ture，能被其他程序调用)。同时它们不应被改变，否则在某种程度上就是破坏兼容性。

可能构成兼容性破坏的一个微小却重要的部分就是 [android:name](http://developer.android.com/guide/topics/manifest/activity-element.html#nm) 属性，一般存在于activity，service，receiver等组件。这可能会令人惊讶，因为我们总觉得 android:name 是指向我们实现app接口的私有属性( as pointing to the private code implementing our application )。但是它同样是这个组件的官方唯一public name ，作为 [ComponenName](http://developer.android.com/reference/android/content/ComponentName.html) 类的具现。

改变app内部组件的命名将会对你的用户带来一些负面影响，如以下例子：


- 若app主 activity name 被改变，用户创建的快捷方式将无效。一个快捷方式就是直指它所要运行的组件名的Intent。
- 若实现了 Live Wallpaper 的 service name 被改变，使用你的 Live Wallpaper 的用户的壁纸会恢复到系统默认壁纸。同理，一些Input Methods，Accessibility Services，Honeycomb的新Widgets 等也会失效。
- 若实现了Device Admin的receiver name 被更改，同上的Live Wallpaper例子， device admin将会失效。这结果同样适用于其他receiver，比如app widget。

这些动作(即那些被做出的改变)是Android如何运用 **Intent** 系统的结果。有两种主要的Intent：

- 隐式Intent：只指定他们应该匹配“什么”，做出什么行动，分类，数据，MIME的类型等等。而他们真正要寻找的组件只在运行时去找，针对当前的app通过Package Manager匹配。
- 显式Intent：单一而明确指定它们通过组件名匹配“谁”。不管是什么东西在Intent，它只和“准确的清单包名”以及“组件名给予的类名”相关联。

两种Intent类型在Android与你的app交互时都发挥了重要的的作用。一个典型的例子就是用户是如何浏览和选择动态壁纸。

为了让用户能选择一张动态壁纸，Android要做的第一件事就是显示一个可用的动态壁纸服务列表给用户。它为动态壁纸创建一个隐式的Intent(包含一些适当的操作)，然后向Package Manager请求所有能支持该Intent的services。而结果就是live wallpaper的列表展现给了用户。

当用户真的选择了他们想要用的动态壁纸，此时Android却需要创建一个显式的Intent用来标识这张特别的动态壁纸，这就能告诉壁纸管理器该显式那张壁纸。

这就是为什么改变manifest组件名会导致壁纸消失的原因：因为组件名的引用已不存在，故预先存储的显式Intent现在也无效了。而我们没有任何可用信息预测新的组件名是什么(比如，假设你的app有两个不同的动态壁纸服务可供用户选择)。所以，Android必须把那些动态壁纸当做已被卸载了，而后回到默认的壁纸。

这就是input methods, device administrators, account managers, app widgets, 以及application shortcuts 如何工作的原理。所以组件名是你在manifest里声明的公共且唯一的名字，并且在对其他app可见的情况下他们不允许更改。

总结：你的App里有些部分是不可更改的，请务必小心。



*欢迎关注我的[公众号和微博](/about)。*