---
layout: post
date: 2014-12-11
title: "Lollipop #1 Android 5.0 APIs Guide"
tags: [Android, Lollipop, post]
---
> [原文链接](https://developer.android.com/about/versions/android-5.0.html) , 翻译 by 2BAB。

API Level: 21

Android 5.0 ( [LOLLIPOP](https://developer.android.com/reference/android/os/Build.VERSION_CODES.html#LOLLIPOP) ) 的到来，给用户和开发者提供了许多新的特性。这篇文档将会把最值得关注的新 API 做一个介绍。

### Start developing

要构建 Android 5.0 的应用，首先得下载 [Android SDK](https://developer.android.com/sdk/index.html)，然后通过SDK Manager下载 Android 5.0 SDK Platform 和 System Images。

为了在真机上测试应用，请将你手头的 Nexus 5 或者 Nexus 7 刷成 [预览版固件](https://developer.android.com/preview/index.html#Start)( 现大部分 Nexus 设备已经支持正式版5.0，固件见此 - 译者注 ) 。   
    
### Update your target API Level

为了在运行 Android 5.0 的设备上优化你的应用，请先将 [targetSdkVersion](https://developer.android.com/guide/topics/manifest/uses-sdk-element.html#target) 设为“21”，并在 Android 5.0 环境下进行测试，然后才是发布这个升级版应用。

你可以使用 Android 5.0 的 API 但也同时兼容老版本，具体来说就是在代码中添加条件判断——在使用不兼容你的 [minSdkVersion](https://developer.android.com/guide/topics/manifest/uses-sdk-element.html#min) 的API前，检查你的system API level。关于维持应用向后兼容的更多信息，请看 [Support Different Platform Versions](https://developer.android.com/training/basics/supporting-devices/platforms.html).

更多关于 API level 工作原理的信息，请看 [What is API Level?](https://developer.android.com/guide/topics/manifest/uses-sdk-element.html#ApiLevels)

<!--more-->

## Important Behavior Changes

如果你在之前发布过 Android 应用，请注意它可能会被 Android 5.0 的改变所影响。

### If you haven't tested your app against the new Android Runtime (ART)...

在4.4发布时我们引入了一个全新的、实验性的 Android runtime，名为ART。但是在4.4时，ART只是一个可选项，而默认的 runtime 依旧是Dalvik。随着 Android 5.0 的发布，ART成为了默认的 runtime。

关于ART的新特性概览，请看 [Introducing ART](https://source.android.com/devices/tech/dalvik/art.html) 。主要的新特性包括：

- 预编译 (AOT)
- 更先进的垃圾回收 (GC)
- 更先进的调试支持 (debugging support)

大多数的 Android 应用不需要任何适配就能在ART下正常运行。然而，有些在Dalvik下使用的技术在ART下却无法工作。关于这个重要问题的更多信息，请看 [Verifying App Behavior on the Android Runtime](https://developer.android.com/guide/practices/verifying-apps-art.html)。特别注意，如果你的应用编写有如下行为：

- 使用了 JNI( Java Native Interface ) 来运行 C / C++ 代码。
- 使用了开发工具生成一些非标准的代码，例如某些混淆器（obfuscators）
- 使用了某些和压缩垃圾回收法 (compacting garbage collection) 不兼容的技术 ( 因为 ART 目前没有实现compacting GC，不过compacting GC 在Android Open Source Project中已处于开发状态 )


### If your app implements notifications...

请确保你的 notifications 考虑了 Android 5.0 的相关改动。关于设计 Android 5.0 或更高版本的 notification，你可以在[这里 ( notifications design guide )](https://developer.android.com/design/patterns/notifications.html) 学习到更多。


#### Material design style

Notification ( 在5.0下的 ) 显示效果为：在白色 ( 或其他亮色 ) 背景上配上黑色文字，十分切合 material design 风格。请确保你所有的 notification 符合新的配色方案，即它看起来不错 ( 和 5.0 够搭 )。如果你的notification看起来有问题，那么请按照如下方式解决：

- 调用 setColor( ) 在 icon 后面的圆里设置一个强调性的颜色。
- 更新或者删除那些会影响配色的资源。因为系统会忽略 action icons 和 main notification icon 里的所有所有非透明的通道，所以你应该假定这些 icon 只能是透明的。系统会将 notification icons 绘制在白色背景上，将 action icons 绘制在深灰色背景上。

### Sound and vibration

如果你已经使用 [Ringtone](https://developer.android.com/reference/android/media/Ringtone.html), [MediaPlayer](https://developer.android.com/reference/android/media/MediaPlayer.html), [Vibrator](https://developer.android.com/reference/android/os/Vibrator.html)等为你的 notification 添加了声音、震动，请移除这些代码——以便系统能以 priority 模式正确地展示 notification。取而代之的是，使用 [Notification.Builder](https://developer.android.com/reference/android/app/Notification.Builder.html) 方法来添加声音和震动。

当你把设备设置为 RINGER_MODE_SILENT ( 静音模式 )，会触发设备进入一个全新的 priority 模式。而当你将设备设置为 RINGER_MODE_NORMAL  (普通模式) 或者 RINGER_MODE_VIBRATE (震动模式) 时，设备将会关闭priority 模式。

在 Android 5.0 之前，Android 使用 STREAM_MUSIC 作为控制平板声音的主要控制流(master stream)。在 Android 5.0，我们使用STREAM_RING 和 STREAM_NOTIFICATION 作为控制流，手机和平板的声音控制得到了统一。

### Lock screen visibility

默认情况下，Android 5.0 的 notification 会在用户的锁屏界面展示。用户可以选择保护敏感的信息不暴露在锁屏上，在这种情况下系统会自动编写提醒文字进行展示，你可以使用 <a href="https://developer.android.com/reference/android/app/Notification.Builder.html#setPublicVersion(android.app.Notification)">setPublicVersion( )</a> 自定义文字提醒。

如果你的 notification 不包含个人信息，或者你想将多媒体控制保留在notification，请调用 <a href="https://developer.android.com/reference/android/app/Notification.Builder.html#setVisibility(int)">setVisibility( )</a> 方法并且将visibility Level 设置为 [VISIBILITY_PUBLIC](https://developer.android.com/reference/android/app/Notification.html#VISIBILITY_PUBLIC)。


### Media playback

如果你将 notification 用来实现多媒体的状态展示或者播放控制栏，请考虑将自定义的 [RemoteViews.RemoteView](https://developer.android.com/reference/android/widget/RemoteViews.RemoteView.html) 对象替换成新的  [Notification.MediaStyle](https://developer.android.com/reference/android/app/Notification.MediaStyle.html) 模板。无论你选择了那种方案，请确保设置 notification 的 visibility 属性为 [VISIBILITY_PUBLIC](https://developer.android.com/reference/android/app/Notification.html#VISIBILITY_PUBLIC)，才能使其在锁屏界面展示。请注意，从 Android 5.0 开始，系统将不再于锁屏界面显示 [RemoteControlClient](https://developer.android.com/reference/android/media/RemoteControlClient.html) 对象，更多相关信息请看 [If your app uses RemoteControlClient](https://developer.android.com/about/versions/android-5.0.html#BehaviorMediaControl)。


### Heads-up notification

在设备处于活动状态时 ( 换句话说就是已解锁并且屏幕亮着 )，Notification 会显示为一个小型浮动窗口 ( 通常我们也叫它 heads-up notification ) 。这些 notification 看起来很像一个个紧凑的表单 ( 除了他们还显示 action button 这点 )，用户可以在不离开当前 app 的情况下操作 heads-up notification 或者让其消失。

下面举一些会触发 heads-up notifications 的情况，包括:

- 用户当前的 activity 处于 fullsrceen mode （ 该 app 使用了 [fullScreenIntent](https://developer.android.com/reference/android/app/Notification.html#fullScreenIntent) ）
- 该 notification 拥有较高的权限以及使用了铃声或者震动

如果你的 app 以上述任意一种方案实现了 notification，请确保 heads-up notification 会正确地显示。


### If your app uses RemoteControlClient...

[RemoteControlClient](https://developer.android.com/reference/android/media/RemoteControlClient.html) 类现已被弃用，请尽快切换到新的 [MediaSession](https://developer.android.com/reference/android/media/session/MediaSession.html) 接口。

在 Android 5.0 中锁屏不会显示由 MediaSession 或 RemoteControlClient 生成的播放控制，取而代之的是你通过 notification 在锁屏上提供媒体播放。带来的好处是，通过显示媒体按钮给了你的 app 更多的控制权，同时提供给用户一个在锁屏和解锁状态下持续不变的用户体验。

Android 5.0 引入一个新的 [Notification.MediaStyle](https://developer.android.com/reference/android/app/Notification.MediaStyle.html) 模板就是为了达到上述的目的。[Notification.MediaStyle](https://developer.android.com/reference/android/app/Notification.MediaStyle.html) 将 notification 的动作( 使用 <a href="https://developer.android.com/reference/android/app/Notification.Builder.html#addAction(int, java.lang.CharSequence, android.app.PendingIntent)">Notification.Builder.addAction( )</a> 添加的紧凑的按钮 )并入你的媒体播放 notification 中。你需要传入你的 session token 到 <a href="https://developer.android.com/reference/android/app/Notification.MediaStyle.html#setMediaSession(android.media.session.MediaSession.Token)">setSession( )</a> 方法中，以此通知系统这个 notification 控制着一个持续的播放会话 ( ongoing media session )。

请确保设置了 notification 的可见属性 ( visibility ) 为 [ VISIBILITY_PUBLIC ](https://developer.android.com/reference/android/app/Notification.html#VISIBILITY_PUBLIC) ，以此标志 notification 可以安全的显示在任何锁屏 (在安全锁屏或者其他锁屏)。想了解更多，请看[ Lock screen notifications ](https://developer.android.com/about/versions/android-5.0.html#LockscreenNotifications)。

如果你的 app 运行在 Android TV 或者 Wear 平台，你需要实现  MediaSession 类才能显示媒体播放控制。当然，如果你的 app 需要接收多媒体控制按钮的事件 ( 任意Android设备上 )，你同样要实现 MediaSession。


### If your app uses getRecentTasks()...

随着一个新的 concurrent documents and activities tasks 特性的引入 ( 资料请看 [ Concurrent documents and activities in the recents screen](https://developer.android.com/about/versions/android-5.0.html#Recents))，<a href="https://developer.android.com/reference/android/app/ActivityManager.html#getRecentTasks(int, int)">ActivityManager.getRecentTasks( )</a> 方法现已被弃用，为的是更好地保护用户的隐私。当然，为了向下兼容，这个方法仍然会返回原本数据中的一小部分，包括唤醒 application 本身的 task 以及可能不敏感的其他 task ( 比如桌面 )。如果你的 app 正在使用这个方法取回自己的 task， 请替换成 <a href="https://developer.android.com/reference/android/app/ActivityManager.html#getAppTasks()">getAppTasks( )</a> 方法。


### If you are using the Android Native Development Kit (NDK)...

Android 5.0 引入了64位系统的支持。首先，64位系统增加了寻址空间，提高了性能，同时还完全兼容32位的 app。其次，64位的引入改善了OpenSSL的加密。最后，这次升级还带来了全新的原生多媒体 NDK API，以及OpenGL ES (GLES) 3.1 的支持。

如果要使用 Android 5.0 的这些64位特性，请到 [Android NDK page](https://developer.android.com/tools/sdk/ndk/index.html) 下载并安装 NDK 修正版 10c。


### If your app binds to a Service

<a href="https://developer.android.com/reference/android/content/Context.html#bindService(android.content.Intent, android.content.ServiceConnection, int)">Context.bindService( )</a> 方法现在要求添加一个显式的 [Intent](https://developer.android.com/reference/android/content/Intent.html)，如果添加的是隐式 intent 就会抛出错误。为了确保 app 的安全，在绑定 [Service](https://developer.android.com/reference/android/app/Service.html) 时请务必使用显式 intent，并且不要给 service 声明 intent filters。




## User Interface


### Material design support

即将到来新版中添加了全新的 material design style。你可以使用material design 创建 app，它会使你的 app 看起来极具动感，充满 UI 元素的过渡变换，其中包括：

- Material 主题
- View 阴影
- [RecyclerView](https://developer.android.com/reference/android/support/v7/widget/RecyclerView.html) 部件
- Drawable animation 和 Styling effects
- Material design 动画 和 activity 过渡动画
- View 属性的动画基于 view 的状态
- 可定制的 UI 部件 以及 可控制颜色调配的 app bars
- 动态和非动态的 drawables 可基于 XML 矢量图

想了解更多关于 “添加 material design 特性到你的 app中”，请看 [Material Design](https://developer.android.com/training/material/index.html)。

### Concurrent documents and activities in the recents screen

在之前的版本中，[多任务栏( recents screen )](https://developer.android.com/guide/components/recents.html) 里每个app只能显示用户最后使用的一个task ( 界面截图 )。而现在，如果你需要多个并发的activity来显示文档，你的 app 就能同时打开多个任务（显示在多任务界面）。与所有app之间切换的体验一样，从多任务中切换的特性，能加快用户切换独立 activity 和文档的速度。更多并发任务的举例：打开多个 tab 的浏览器，打开多个文档的办公&生产 app，打开多个比赛的游戏，打开多个聊天窗口的 SMS。你的 app 可以使用 [ActivityManeger.AppTask](https://developer.android.com/reference/android/app/ActivityManager.AppTask.html) 来管理它的 task。

为了使系统能把你的 activity 当做新的 task，在使用 <a href="https://developer.android.com/reference/android/app/Activity.html#startActivity(android.content.Intent)">startActivity( )</a> 启动 activity 的是时候，请加上 [FLAG_ACTIVITY_NEW_DOCUMENT](https://developer.android.com/reference/android/content/Intent.html#FLAG_ACTIVITY_NEW_DOCUMENT)参数，以此来添加一个逻辑上的划分( logical break )。通过设置 manifest 的[\<activity>](https://developer.android.com/guide/topics/manifest/activity-element.html)标签的"documentLaunchMode"属性为"intoExisting"或者"always"，也可以达到这个目的。

为了避免把多任务界面搅浑，你可以设置你的app最大可显示的task数量。具体来说，设置 [\<application>](https://developer.android.com/guide/topics/manifest/application-element.html) 标签的 [android:maxRecents](https://developer.android.com/reference/android/R.attr.html#maxRecents) 属性。目前可指定的最大标签数量为每个用户50个( 在低内存的设备上为25个 )。

多任务界面里的 task 现在可以设置为重启也保留，通过设置 [android:persistableMode](https://developer.android.com/reference/android/R.attr.html#persistableMode) 属性来控制这一行为。此外，task的视觉属性现在也可以自定义，例如 activity 的颜色，标签，图标等，通过调用 setTaskDescription( )。

### WebView updates

Android 5.0 升级了 [WebView](https://developer.android.com/reference/android/webkit/WebView.html) ，目前基于Chromium M37，带来了安全性和稳定性的提升，同时修复了诸多bug。此外 WebView 的UA 已经升级到合并版的37.0.0.0  ( The default user-agent string for a WebView running on Android 5.0 has been updated to incorporate 37.0.0.0 as the version number )。

Android 5.0 引入了 [PermissionRequest](https://developer.android.com/reference/android/webkit/PermissionRequest.html) ，允许你的 app 授权 WebView 进入被保护资源的权限( 比如相机和麦克风，通过调用诸如 [getUserMedia( )]() 的web API实现 )。请合理地分配上述的资源使用权限给 WebView。

通过调用新的 <a href="https://developer.android.com/reference/android/webkit/WebChromeClient.html#onShowFileChooser(android.webkit.WebView, android.webkit.ValueCallback<android.net.Uri[]> , android.webkit.WebChromeClient.FileChooserParams)">onShowFileChooser( )</a> 方法，你还可以在WebView中使用表单输入，并且可以打开文件选择器进行本地图片和文件的选择。

此外，此次升级还带来了WebAudio，WebGL，WebRTC标准的支持。想了解更多新特性，请看 [WebView for Android](https://developer.chrome.com/multidevice/webview/overview) 。


### Screen capturing and sharing

Android 5.0 提供了调用截屏和屏幕共享的新API [android.media.projection](https://developer.android.com/reference/android/media/projection/package-summary.html)。这是一个相当有用的功能，举个例子，比如你想在视频会议中共享屏幕就可以轻松实现。
 
新的 <a href="https://developer.android.com/reference/android/media/projection/MediaProjection.html#createVirtualDisplay(java.lang.String, int, int, int, int, android.view.Surface, android.hardware.display.VirtualDisplay.Callback, android.os.Handler)">createVirtualDisplay( )</a> 方法允许你的 app 捕捉主屏幕的内容装载到一个 [Surface](https://developer.android.com/reference/android/view/Surface.html) 对象，这意味着你可以在稍后通过网络发送它。该API只允许捕捉没有安全限制的屏幕内容，以及非系统的声音。想要开启屏幕捕捉，你需要调用 <a href="https://developer.android.com/reference/android/media/projection/MediaProjectionManager.html#createScreenCaptureIntent()">createScreenCaptureIntent( )</a> 方法获取一个 [Intent](https://developer.android.com/reference/android/content/Intent.html)，然后使用该 Intent 弹出一个允许屏幕捕捉dialog来获得用户的权限。

关于如何使用这些新的API，请参考 ApiDemos project 中的 MediaProjectionDemo 类。


## notifications

### Lock screen notifications

在 Android 5.0 中，锁屏界面允许展示 notification。用户可以通过“系统设置”选择是否允许敏感的 notification 显示在安全的锁屏上。

你的 app 可以控制它的 notification 在安全锁屏界面上具体显示的内容等级。具体操作上，调用 <a href="https://developer.android.com/reference/android/app/Notification.Builder.html#setVisibility(int)">setVisibility( )</a> 方法并且指定它的值：

- [VISIBILITY_PRIVATE](https://developer.android.com/reference/android/app/Notification.html#VISIBILITY_PRIVATE)：显示基础信息，包括 notification 的 icon，但是隐藏 notification 的所有内容。
- [VISIBILITY_PUBLIC](https://developer.android.com/reference/android/app/Notification.html#VISIBILITY_PUBLIC)：显示 notification 的所有信息
- [VISIBILITY_SECRET](https://developer.android.com/reference/android/app/Notification.html#VISIBILITY_SECRET)：不显示任何东西，包括 icon

当显示等级为 [VISIBILITY_PRIVATE](https://developer.android.com/reference/android/app/Notification.html#VISIBILITY_PRIVATE) 时，你还可以提供一个编写好的 notification 内容模板进行显示，而隐藏掉个人的详细信息。举个例子，一个SMS app 可能会显示一条内容为"你有三条新消息" 的 notification ，而隐藏掉信息的内容和发件人。想要提供这样的可替换 notification，首先你需要调用 [Notification.Builder](https://developer.android.com/reference/android/app/Notification.Builder.html) 新建一个替补的 notification，当你在创建 private notification 对象时，调用 <a href="https://developer.android.com/reference/android/app/Notification.Builder.html#setPublicVersion(android.app.Notification)">setPublicVersion( )</a> 方法将替补的 notification 绑定上去。


### Notification metadata

Android 5.0 使用 metadata 与 app 的 notification 进行关联，这使得 notification 的排序更加智能。当你构建 notification 时，可以调用 [Notification.Builder](https://developer.android.com/reference/android/app/Notification.Builder.html) 方法来设置 metadata ：

- <a href="https://developer.android.com/reference/android/app/Notification.Builder.html#setCategory(java.lang.String)">setCategory( )</a>：在设备处于 priority 模式时，告诉系统如何处理你的 app 的 notification ( 例如，一条 notification 展示的是来电，简讯，或者闹钟 )
- <a href="https://developer.android.com/reference/android/app/Notification.Builder.html#setPriority(int)">setPriority( )</a>：标志一条 notification 比普通 notification 重要或不重要。一条设置 priority 属性为 [PRIORITY_MAX](https://developer.android.com/reference/android/app/Notification.html#PRIORITY_MAX) 或者 [PRIORITY_HIGH](https://developer.android.com/reference/android/app/Notification.html#PRIORITY_HIGH) 的 notification 如果还带有声音或者震动，就会显示为一个小型浮动窗口。
- <a href="https://developer.android.com/reference/android/app/Notification.Builder.html#addPerson(java.lang.String)">addPerson( )</a>：你可以添加一个或多个联系人与 notification 进行关联。系统会根据这个标志决定把特殊联系人的 notification 集中起来，或者把重要联系人的 notification 排在前头。


## Graphics

### Support for OpenGL ES 3.1

Android 5.0 添加了 OpenGL ES 3.1 的 Java 接口和原生支持。OpenGL ES 3.1 提供的主要新功能包括：

- 计算着色器 ( Compute shaders )
- 分离阴影对象 (Separate shader objects)
- 间接呼叫指令 (Indirect draw commands )
- 多重采样和模板纹理 ( Multisample and stencil textures )
- 着色语言改进 ( Shading language improvements )
- 丰富的扩展，包括高级混合模式，和更好的 debug ( Extensions for advanced blend modes and debugging )
- 向下兼容 OpenGL ES 2.0/3.0 ( Backward compatibility with OpenGL ES 2.0 and 3.0 )

在 Android 5.0 中，[GLES31](https://developer.android.com/reference/android/opengl/GLES31.html) 类提供了 OpenGL ES 3.1 的 Java 接口。在使用OpenGL ES 3.1 时，请确认你在你的 manifest 中使用 [<uses-feature>](https://developer.android.com/guide/topics/manifest/uses-feature-element.html) 标签 和 android:glEsVersion 属性对它进行声明

``` xml
<manifest>
    <uses-feature android:glEsVersion="0x00030001"/>
    ...
</manifest>
```

关于“使用 OpenGL ES”的更多信息，包括如何在运行时动态监测设备对 OpenGL ES 版本的支持，请看 [OpenGL ES API guide](https://developer.android.com/guide/topics/graphics/opengl.html)。


### Android Extension Pack

作为 OpenGL ES 3.1 的补充，针对高级的图像功能，Android 5.0 提供了一个 java 接口和本地支持的扩展包。这些扩展被当做一个 Android 提供的独立包存在。( 如果 ANDROID_extension_pack_es3la 扩展包已经存在，那么你的 app 可以声明包里所有已经存在的扩展，并且可以使用简单的  #extension 声明实现着色语言特性 )

这些扩展包支持：

- 对着色缓存器，图片，粒子等片段着色支持的保证 ( 片段着色支持在OpenGL ES 3.1 中为可选项 )( Guaranteed fragment shader support for shader storage buffers, images, and atomics (Fragment shader support is optional in OpenGL ES 3.1.))
- 平面填充(密铺)和几何着色 (Tessellation and geometry shaders 
)
- 自适应可伸缩纹理压缩格式（ ASTC (LDR) texture compression format ）
- 单样本插入与着色 ( Per-sample interpolation and shading )
- 帧缓存上每个颜色附加的不同混合模式 ( Different blend modes for each color attachment in a frame buffer )

GLES3lExt 是扩展包提供的 Java 接口。在你的 manifest 中，可以声明你的 app 必须安装再支持扩展包的设备上。如下：

``` xml
<manifest>
    <uses-feature android:name="android.hardware.opengles.aep"
                  android:required="true" />
</manifest>
```

## Media

### Camera API for advanced camera capabilities

Android 5.0 引入了新的 [android.hardware.camera2](https://developer.android.com/reference/android/hardware/camera2/package-summary.html) 的API，使拍摄精细的照片以及图像的处理都变得容易。现在开发者们可以通过系统提供的接口从软件层面接入相机设备，具体来说，先调用 <a href="https://developer.android.com/reference/android/hardware/camera2/CameraManager.html#getCameraIdList()">getCameraIdList( )</a> 获取可用的相机设备，然后选取具体的一个设备调用 <a href="https://developer.android.com/reference/android/hardware/camera2/CameraManager.html#openCamera(java.lang.String, android.hardware.camera2.CameraDevice.StateCallback, android.os.Handler)">openCamera( )</a> 方法进行连接。要拍摄一张照片，首先要创建一个 [CameraCaptureSession](https://developer.android.com/reference/android/hardware/camera2/CameraCaptureSession.html) 并且指定 [Surface](https://developer.android.com/reference/android/view/Surface.html) 对象来传递拍摄到的照片。 [CameraCaptureSession](https://developer.android.com/reference/android/hardware/camera2/CameraCaptureSession.html) 既可以配置为只拍摄一张照片，也允许设置为连拍。

如何在拍摄照片后进行通知回调？实现一个 [CameraCaptureSession.CaptureCallback](https://developer.android.com/reference/android/hardware/camera2/CameraCaptureSession.CaptureCallback.html) 监听器，然后在你的 capture 请求中设置它。当系统完成照片拍摄请求后，你的 [CameraCaptureSession.CaptureCallback](https://developer.android.com/reference/android/hardware/camera2/CameraCaptureSession.CaptureCallback.html) 监听器就会在 <a href="https://developer.android.com/reference/android/hardware/camera2/CameraCaptureSession.CaptureCallback.html#onCaptureCompleted(android.hardware.camera2.CameraCaptureSession, android.hardware.camera2.CaptureRequest, android.hardware.camera2.TotalCaptureResult)">onCaptureCompleted( )</a> 接收到回调信息，并提供 [CaptureResult](https://developer.android.com/reference/android/hardware/camera2/CaptureResult.html) 类型的照片元数据给你。

[CameraCharateristics](https://developer.android.com/reference/android/hardware/camera2/CameraCharacteristics.html) 类可以让你的app检测所在设备的相机具备的功能。其中它的 [INFO_SUPPORTED_HARDWARE_LEVEL](https://developer.android.com/reference/android/hardware/camera2/CameraCharacteristics.html#INFO_SUPPORTED_HARDWARE_LEVEL) 属性显示了相机的功能级别。

- 所有的设备都至少达到 [INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY](https://developer.android.com/reference/android/hardware/camera2/CameraMetadata.html#INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY) 的硬件级别，意味着其兼容性大致等同于被弃用的 [Camera](https://developer.android.com/reference/android/hardware/Camera.html) API 级别。
- 而支持 [INFO_SUPPORTED_HARDWARE_LEVEL_FULL](https://developer.android.com/reference/android/hardware/camera2/CameraMetadata.html#INFO_SUPPORTED_HARDWARE_LEVEL_FULL) 硬件级别的设备，意味着可以手动控制拍照和后期处理，以及在高帧率下拍摄高分辨率的照片。

查看更多关于“如何使用升级后的 [Camera](https://developer.android.com/reference/android/hardware/camera2/package-summary.html) API”，参考 Android 5.0 的 Camera2Basic 和 CameraVideo 的 samples。


### Audio playback

这次的 [AudioTrack](https://developer.android.com/reference/android/media/AudioTrack.html) 更新包括：

- 你的 app 现在可以提供浮点格式( [ENCODING_PCM_FLOAT](https://developer.android.com/reference/android/media/AudioFormat.html#ENCODING_PCM_FLOAT) )的音频数据。这项许可增大了动态的范围，更一致的精确度，以及更大的动态余量。浮点算法在中间计算的时候特别有效。播放器端使用整数格式的音频数据，和较低的位深度。( 在 Android 5.0 中，部分内部传递途径也还不是浮点格式 )

- 你的 app 现在可以提供 [ByteBuffer](https://developer.android.com/reference/java/nio/ByteBuffer.html) 格式的音频数据，与 [MediaCodec](https://developer.android.com/reference/android/media/MediaCodec.html) 所提供的格式相同。

- [WRITE_NON_BLOCKING](https://developer.android.com/reference/android/media/AudioTrack.html#WRITE_NON_BLOCKING) 选项可以简化某些 app 的缓冲和多线程。


### Media playback control

请使用新的 notification 和 media API 以确保系统 UI 知道你的多媒体播放器并且提取和展示专辑封面。调用全新的 [MediaSession](https://developer.android.com/reference/android/media/session/MediaSession.html) 以及 [MediaController](https://developer.android.com/reference/android/media/session/MediaController.html)，会使得通过 UI 和 service 控制多媒体播放变得更加容易。

全新的 [MediaSession](https://developer.android.com/reference/android/media/session/MediaSession.html) 类取代了被弃用的 [RemoteControlClient](https://developer.android.com/reference/android/media/RemoteControlClient.html) 类，并且提供了一套回调方法来处理控制的传递以及多媒体按钮( transport controls and media buttons )。如果你的 app 提供媒体播放并且运行在 Android [TV](https://developer.android.com/tv/index.html) 或者[手表](https://developer.android.com/wear/index.html)平台，请使用 [MediaSession](https://developer.android.com/reference/android/media/session/MediaSession.html) 类使用同样的回调方法来处理控制传递。

现在，你可以使用 [MediaController](https://developer.android.com/reference/android/media/session/MediaController.html) 来构建自己的 media controller app，这个类提供了一个线程安全的方法，可以在 app 的UI 程序中来观察和控制媒体播放。在构建一个控制器( controller )时，指定一个 [MediaSession.Token](https://developer.android.com/reference/android/media/session/MediaSession.Token.html) 对象，以便于 app 与 [MediaSession](https://developer.android.com/reference/android/media/session/MediaSession.html) 进行交互。调用 [MediaController.TransportControls](https://developer.android.com/reference/android/media/session/MediaController.TransportControls.html) 方法，你可以发送诸如 <a href="https://developer.android.com/reference/android/media/session/MediaController.TransportControls.html#play()">play( )</a>，<a href="https://developer.android.com/reference/android/media/session/MediaController.TransportControls.html#stop()">stop( )</a>，<a href="https://developer.android.com/reference/android/media/session/MediaController.TransportControls.html#skipToNext()">skipToNext( )</a> 以及 <a href="https://developer.android.com/reference/android/media/session/MediaController.TransportControls.html#setRating(android.media.Rating)">setRating( )</a> 等命令，以控制在 session 中的媒体播放。你可以给 controller 注册一个 [MediaController.Callback](https://developer.android.com/reference/android/media/session/MediaController.Callback.html) 对象，用来监听 session 中元数据和状态的改变。

此外，你还可以构建一个丰富的 notification —— 通过 [Notification.MediaStyle](https://developer.android.com/reference/android/app/Notification.MediaStyle.html) 类使播放控制绑定到 media session。

### Media browsing

在 Android 5.0，新的 [android.media.browse](https://developer.android.com/reference/android/media/browse/package-summary.html) API 可以使一个 app 浏览其他 app 媒体内容库。要想在你的 app 中显示媒体内容，请继承 [MediaBrowserService](https://developer.android.com/reference/android/service/media/MediaBrowserService.html) 类。在你实现的 [MediaBrowserService](https://developer.android.com/reference/android/service/media/MediaBrowserService.html) 中请提供一个 [MediaSeesion.Token](https://developer.android.com/reference/android/media/session/MediaSession.Token.html) 的使用权，以便于让你的 app 可以使用你的 service 来播放多媒体内容。

我们使用 [MediaBrowser](https://developer.android.com/reference/android/media/browse/MediaBrowser.html) 类来与 media browser service 进行交互。当你在创建一个  [MediaBrowser](https://developer.android.com/reference/android/media/browse/MediaBrowser.html) 实例时，请为 [MediaSession](https://developer.android.com/reference/android/media/session/MediaSession.html) 指定一个组件名，你的 app 可以在之后连接这个关联的 service 并且获得一个 [MediaSesson.Token](https://developer.android.com/reference/android/media/session/MediaSession.Token.html) 对象，以便通过 service 播放那些外部的内容。



## Storage

### Directory selection

Android 5.0 继承了 [Storage Access Framework](https://developer.android.com/guide/topics/providers/document-provider.html)，这让用户可以在整个文件树中进行选择，并且给予 app 无需用户同意就能读写文件树中包含的每个条目的权限。

想要选择一个目录树，需构建并发送一个 [OPEN_DOCUMENT_TREE](https://developer.android.com/reference/android/content/Intent.html#ACTION_OPEN_DOCUMENT_TREE) 的 intent。系统会显示所有提供子目录选择的 [DocumentProvider](https://developer.android.com/reference/android/provider/DocumentsProvider.html) 实例，用户可以浏览并选择一个文件。返回的 URI 代表了选择的子目录的路径。你可以使用<a href="https://developer.android.com/reference/android/provider/DocumentsContract.html#buildChildDocumentsUriUsingTree(android.net.Uri, java.lang.String)">buildChildDocumentsUriUsingTree( )</a>  、 <a href="https://developer.android.com/reference/android/provider/DocumentsContract.html#buildDocumentUriUsingTree(android.net.Uri, java.lang.String)">buildDocumentUriUsingTree</a> 以及 <a href="https://developer.android.com/reference/android/content/ContentResolver.html#query(android.net.Uri, java.lang.String[], java.lang.String, java.lang.String[], java.lang.String)">query( )</a> 来浏览该目录。

新的 <a href="https://developer.android.com/reference/android/provider/DocumentsContract.html#createDocument(android.content.ContentResolver, android.net.Uri, java.lang.String, java.lang.String)">createDocument( )</a> 方法让你可以在任何子目录下创建新的文件或者文件夹。要管理已经存在的文件夹，调用 <a href="https://developer.android.com/reference/android/provider/DocumentsContract.html#renameDocument(android.content.ContentResolver, android.net.Uri, java.lang.String)">renameDocument( )</a> 和 <a href="https://developer.android.com/reference/android/provider/DocumentsProvider.html#deleteDocument(java.lang.String)">deleteDocument( )</a> 方法。请在调用之前检查 COLUMN_FLAGS 以验证提供者的支持程度，防止出现问题。

如果你实现了一个 [DocumentProvider](https://developer.android.com/reference/android/provider/DocumentsProvider.html) 并且想支持子目录选择，需实现 <a href="https://developer.android.com/reference/android/provider/DocumentsProvider.html#isChildDocument(java.lang.String, java.lang.String)">isChildDocument( )</a> 并且在你的 [COLUMN_FLAGS](https://developer.android.com/reference/android/provider/DocumentsContract.Root.html#COLUMN_FLAGS) 中包含 [FLAG_SUPPORTS_IS_CHILD](https://developer.android.com/reference/android/provider/DocumentsContract.Root.html#FLAG_SUPPORTS_IS_CHILD)。

Android 5.0 在 shared storage ( 你的app可以存储多媒体文件并包含在 [MediaStore](https://developer.android.com/reference/android/provider/MediaStore.html) 的地方 ) 中引入了新的包名所在文件夹规范。新的 [getExternalMediaDirs( )](https://developer.android.com/reference/android/content/Context.html#getExternalMediaDirs() 返回了所有在 shared storage 这些文件夹的路径。同样对于 <a href="https://developer.android.com/reference/android/content/Context.html#getExternalFilesDir(java.lang.String)">getExternalFilesDir( )</a>，你的 app 不需要任何额外的权限就能调用和返回路径。平台周期性地在这些文件夹里扫描新的多媒体文件，不过你也可以使用 [MediaScannerConnection](https://developer.android.com/reference/android/media/MediaScannerConnection.html) 主动地(明确地)扫描新内容。


## Wireless&Connectivity
***

### Multiple network connections

Android 5.0 提供了多种网络 API，你的 app 可以在指定网络特征( 指网络所提供的能力 )前提下，动态地扫描可用的网络，并且与它们建立连接。当你的 app 需要一个特殊的网络时，这个特性是相当有用的，比如 SUPL，MMS，计费网络，以及你想要通过特殊的传输协议发送数据。

想要在你的 app 中动态的选择和链接一个网络，按照一下这些步骤：

1. 构建一个 [ConnectivityManager](https://developer.android.com/reference/android/net/ConnectivityManager.html)。
2. 使用 [NetWorkRequest.Builder](https://developer.android.com/reference/android/net/NetworkRequest.Builder.html) 类来构建一个 [NetworkRequest](https://developer.android.com/reference/android/net/NetworkRequest.html) 对象，并指定网络的特性以及 app 需要的( interested in )传输的协议。
3. 要扫描一个适合的网络，调用 [requestNetwork( )](https://developer.android.com/reference/android/net/ConnectivityManager.html#requestNetwork(android.net.NetworkRequest, android.net.ConnectivityManager.NetworkCallback) 或者 [registerNetworkCallback( )](https://developer.android.com/reference/android/net/ConnectivityManager.html#registerNetworkCallback(android.net.NetworkRequest, android.net.ConnectivityManager.NetworkCallback)，并传入一个 [NetworkRequest](https://developer.android.com/reference/android/net/NetworkRequest.html) 对象以及实现一个 [ConnectivityManager.NetworkCallback](https://developer.android.com/reference/android/net/ConnectivityManager.NetworkCallback.html)。在一个合适的网络被检测到时，如果你想主动地切换过去，调用 [requestNetwork( )](https://developer.android.com/reference/android/net/ConnectivityManager.html#requestNetwork(android.net.NetworkRequest, android.net.ConnectivityManager.NetworkCallback) 方法；而如果你只想接收到扫描结果的通知而不是主动去切换，请使用 [registerNetworkCallback( )](https://developer.android.com/reference/android/net/ConnectivityManager.html#registerNetworkCallback(android.net.NetworkRequest, android.net.ConnectivityManager.NetworkCallback) 方法替换它。

当系统检测到合适的网络，它会连接到网络并且唤起 [onAvailable( )](https://developer.android.com/reference/android/net/ConnectivityManager.NetworkCallback.html#onAvailable(android.net.Network) 的回调。你可以在回调的使用 [Network](https://developer.android.com/reference/android/net/Network.html) 的对象获取关于该网络的信息，或者直接访问去使用该网络。


### Bluetooth Low Energy

Android 4.3 在核心区域的引入了平台级支持的 [Bluetooth Low Energy](https://developer.android.com/guide/topics/connectivity/bluetooth-le.html) ( Bluetooth LE ) 。在 Android 5.0 中，一个 Android 设备能够与一个 Bluetooth LE 的外围设备进行交互。App 可以使用这个能力让周围的设备发现他们。举个例子，你可以构建一个 app ，它允许一个设备作为一个计步器或者健康检测器来使用，并且将它的数据与另外一个 Bluetooth LE 设备进行交互。

新的 [android.bluetooth.le](https://developer.android.com/reference/android/bluetooth/le/package-summary.html) API 允许你的 app 广播通告( broadcast advertisements )，检索回应，以及与周围的 Bluetooth LE 设备建立连接。要使用新的通告和检索特性，需在你的 mainifest 文件中添加 [BLUETOOTH_ADMIN](https://developer.android.com/reference/android/Manifest.permission.html#BLUETOOTH_ADMIN) 权限。当用户从 Play Store 升级或者下载了你的 app，它们会询问是否授权以下的权限给你的app：“Bluetooth connection information:Allows the app to control Bluetooth, including broadcasting to or getting information about nearby Bluetooth devices.”(蓝牙连接信息：允许此应用控制蓝牙包括向周围蓝夜设备发送广播和从周围设备获得信息)

为了让 Bluetooth LE 开始通知 ( advertising )，以便其他设别能发现你的 app，请调用 [starrtAdvertising( )](https://developer.android.com/reference/android/bluetooth/le/BluetoothLeAdvertiser.html#startAdvertising(android.bluetooth.le.AdvertiseSettings, android.bluetooth.le.AdvertiseData, android.bluetooth.le.AdvertiseCallback) 并且传入 [AdvertiseCallback](https://developer.android.com/reference/android/bluetooth/le/AdvertiseCallback.html) 类的实现。回调对象会接收一个 advertising 操作成功或失败的报告。

Android 5.0 引入了 [ScanFilter](https://developer.android.com/reference/android/bluetooth/le/ScanFilter.html) 类，以便于你的 app 可以只检索它需要的( interested in )指定类型设备。为了检索 Bluetooth LE 设备，调用 <a href="https://developer.android.com/reference/android/bluetooth/le/BluetoothLeScanner.html#startScan(android.bluetooth.le.ScanCallback)">startScan( )</a> 方法并且传入一个过滤的列表( a list of filters )。在调用该方法时，你还必须提供一个 [ScanCallback](https://developer.android.com/reference/android/bluetooth/le/ScanCallback.html) 的实现，在 Bluetooth LE 的 advertisement 被发现时进行报告。


### NFC enhancements

Android 5.0 为 NFC 做了一些改进，使得它运用得更广泛更灵活。

- Android Beam 现在可以在“分享”菜单( share menu )中使用
- 你的 app 可以使用 [invokeBeam( )](https://developer.android.com/reference/android/nfc/NfcAdapter.html#invokeBeam(android.app.Activity) 唤醒 ( invoke ) Android Beam 在用户的设备间进行数据的分享。这个功能避免了用户必须手动轻触其他 NFC 设备才能完成数据的传输。
- 你可以使用新的 [createTextRecord( )](https://developer.android.com/reference/android/nfc/NdefRecord.html#createTextRecord(java.lang.String, java.lang.String) 方法来构建一个 NDEF record 来容纳 UTF-8 格式的文本数据。
- 如果你在开发一个支付相关的 app，那么现在你可以调用 [registerAidsForService( )](https://developer.android.com/reference/android/nfc/cardemulation/CardEmulation.html#registerAidsForService(android.content.ComponentName, java.lang.String, java.util.List<java.lang.String>)  动态地注册一个 NFC 应用的 ID ( AID )。你可以使用 [setPreferredService( )](https://developer.android.com/reference/android/nfc/cardemulation/CardEmulation.html#setPreferredService(android.app.Activity, android.content.ComponentName) 来设置偏好的卡仿真服务 ( preferred card emulation service [具体参考此处](http://blog.csdn.net/jwzhangjie/article/details/21983131) )，即规定指定的活动在前台发生时被调用的后台服务。



## Project Volta
***

除了这些新特性之外，Android 5.0 还强调了电池续航的改进。你可以使用新的 API 和工具可来理解和改进 app 的电量消耗。


### Scheduling jobs

Android 5.0 提供了新的 [JobScheduler](https://developer.android.com/reference/android/app/job/JobScheduler.html) API，使你可以向系统定义自己的 jobs 是在稍后异步执行抑或在某个指定条件下执行 ( 比如设备充电时 )。Job scheduling 对这些场景特别有效：

- App 有一些你可以推迟的“无用户正在查看的”工作
- App 有一些你想在电源插上时做的工作
- App 有需要网络连接或者 Wi-Fi 连接的任务
- App 有一些定时批量处理的任务

一个工作单元被封装在一个 JobInfo 对象里，这个对象指定了 scheduling 的执行条件。

请使用 JobInfo.Builder 类配置计划任务如何运行。你可以安排任务在符合指定条件的情况下运行，例如：

- 当设备充电时开始
- 当设备连接到不限流量的网络时开始
- 当设备空闲时
- 在一个确切的 deadline 前完成或者有些许推迟

具体的例子，你可以添加这段代码，使你的任务在一个不限流量的网络中执行：

``` java
    JobInfo uploadTask = new JobInfo.Builder(mJobId,
                                         mServiceComponent /* JobService component */)
        .setRequiredNetworkCapabilities(JobInfo.NetworkType.UNMETERED)
        .build();
    JobScheduler jobScheduler =
        (JobScheduler) context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
    jobScheduler.schedule(uploadTask);
```
    
如果你的设备有“稳定的电力”( 意思是，设备已经被插上电源超过2分钟，并且电量保持在一个[健康的等级](https://developer.android.com/reference/android/content/Intent.html#ACTION_BATTERY_OKAY) )，那么系统将会运行所有准备好要执行的计划任务，甚至是还未到 deadline 的任务。

查看如何使用 [JobScheduler](https://developer.android.com/reference/android/app/job/JobScheduler.html)，参考本次放出的实现案例 —— JobSchedulerSample。


### Developer tools for battery usage

新的 dumpsys batterystats 命令，可生成有趣的设备电量使用的统计数据，并且按照唯一用户标识 (UID) 进行分组。这些统计包括：

- 电量相关的历史事件
- 对设备的全局统计
- 每个 UID 和系统组件的大致电量消耗
- 每个 app 移动通信的每个数据包
- 系统 UID 总计
- App UID 总计

使用 --help 选项来了解有关不同选项对输出的定制。举个例子，对于给定的 app 包名，要打印从上次充电结束开始的电池使用统计，请运行这段代码：

``` bash
    $ adb shell dumpsys batterystats --charged <package-name>
```

你可以对 dumpsys 命令的输出 log 里使用 Battery Historian 工具，以生成一个可视化的电量使用相关事件的 HTML 网页。这个信息能让你更加轻松的理解和诊断，是否有电池相关的问题存在。


## Android in the Workplace and in Eudcation
***

### Managed provisioning

Android 5.0 提供了在企业环境下运行app时的新功能。如果用户已经拥有一个私人账户，[设备管理员](https://developer.android.com/guide/topics/admin/device-admin.html)可以启动一个代理配置程序，来添加一个可共处但相对独立的管理账户到设备。和管理账户相关联的 App 会和非管理账户的 app 共同显示在用户的桌面启动器，多任务窗，以及通知里 ( Launcher, recents screen, and notifications )。

要开始代理配置程序，发送带有 [ACTION_PROVISION_MANAGED_PROFILE](https://developer.android.com/reference/android/app/admin/DevicePolicyManager.html#ACTION_PROVISION_MANAGED_PROFILE) 的 [Intent](https://developer.android.com/reference/android/content/Intent.html)。如果发送成功，系统会触发 [onProfileProvisioningComplete( )](https://developer.android.com/reference/android/app/admin/DeviceAdminReceiver.html#onProfileProvisioningComplete(android.content.Context, android.content.Intent) 的回调。你可以在之后调用 [setProfileEnabled( )](https://developer.android.com/reference/android/app/admin/DevicePolicyManager.html#setProfileEnabled(android.content.ComponentName) 激活这个管理账户。

默认情况下，只有小部分的 app 允许在管理账户中运行。你可以调用 [enableSystemApp( )](https://developer.android.com/reference/android/app/admin/DevicePolicyManager.html#enableSystemApp(android.content.ComponentName, android.content.Intent) 在管理账户中安装额外的 app。

如果你正在开发一个启动器 app，对于当前用户和任何相关的管理账户，你可以使用新的 [LauncherApps](https://developer.android.com/reference/android/content/pm/LauncherApps.html) 类来得到一个可启动的 activities 列表。你的启动器可以给管理账户相关的 app 的 icon 追加一个明显的标记。想要检索标记图标，使用 [getUserBadgedIcon( )](https://developer.android.com/reference/android/content/pm/PackageManager.html#getUserBadgedIcon(android.graphics.drawable.Drawable, android.os.UserHandle)。

想要了解如何使用这些新特性，参考 BasicManagedProfile 实现案例。


### Device owner

Android 5.0 引入了部署设备拥有者 app 的特性 ( Android 5.0 introduces the ability to deploy a device owner app)。“设备拥有者” ( device owner ) 指的是一种特殊的[设备管理员](https://developer.android.com/guide/topics/admin/device-admin.html)，它拥有额外的能力去创建和移除次级用户，并且可以配置该设备的全局设置。你的 device owner 可以使用 [DevicePolicyManager](https://developer.android.com/reference/android/app/admin/DevicePolicyManager.html) 类里面的方法，来细致控制管理设备里的配置，安全，以及  app。一台设备在同一时间里只能有唯一一个活跃的 device owner。

想部署和激活一个 device owner，你必须执行一个从 programming app 到该设备的NFC数据传输，并当设备处于一个未配置的状态。这个数据传输和 [Managed provisioning](https://developer.android.com/about/versions/android-5.0.html#ManagedProvisioning) 里描述的 provisioning intent 发送的是相同信息。

### Screen pinning

Android 5.0 引入了一个新的 screen pinning API，可以让你暂时性地限制用户，不能离开你的task或者被通知所打断。应用的案例有：如果你在 Android 上开发一个教育 app 需要高风险的评估要求支持，或者是一个单一用途的应用，抑或是一个公共多媒体服务应用。一旦你的 app 激活 screen pinning，用户便无法看到通知、进入其他 app 、或者返回主界面，直到你的 app 退出该模式。

有两种开启 screen pinning 的方法：

- 手动实现：用户可以在设置 > 安全 > 屏幕固定 中开启这个功能，并且通过在多任务界面触摸绿色的固定图标，选择一个他们想要固定的任务。
- 代码实现：在你的 app 中调用 [startLockTask( )](https://developer.android.com/reference/android/app/Activity.html#startLockTask()，如果发出请求的 app 不是 device owner，用户会及时收到警告。而一个 device owner 的 app 可以调用 [setLockTaskPackages( )](https://developer.android.com/reference/android/app/admin/DevicePolicyManager.html#setLockTaskPackages(android.content.ComponentName, java.lang.String[]) 方法允许 app 可被固定，而不需要用户确认的步骤。

当任务锁定被启动，会有以下一些动作发生：

- 状态栏将会置空，用户的 notification 和状态信息将会被隐藏。
- Honme 键和多任务键无效。
- 其他的 app 不能启动新的 activity。
- 只要该动作不是创建一个新任务，当前的 app 可以启动新的 activity。 
- 如果 screen pinning 是被 device owner 所触发，那么用户保留对你 app 的锁定直到你的 app 调用 stopLockTask( )。
- 如果 screen pinning 是被其他的 app 激活，而不是 device owner 或者用户直接触发的，那么用户可以同时按住 Back 键和 多任务键以退出固定。


## Printing Framework
***
### Render PDF as bitmap

现在你可以把一个 PDF 文件页面渲染为位图，并使用新的 PdfRenderer 类进行打印。在系统写入可打印内容时，你必须指定一个可随机存取的 [ParcelFileDescriptor](https://developer.android.com/reference/android/os/ParcelFileDescriptor.html)。你的 app 可以调用 [openPage( )](https://developer.android.com/reference/android/graphics/pdf/PdfRenderer.html#openPage(int) 来获得一个待渲染的页面，然后调用 [render( )](https://developer.android.com/reference/android/graphics/pdf/PdfRenderer.Page.html#render(android.graphics.Bitmap, android.graphics.Rect, android.graphics.Matrix, int) 将打开的 [PdfRenderer.Page](https://developer.android.com/reference/android/graphics/pdf/PdfRenderer.Page.html) 转化为 bitmap。当然，如果你只是想转换一部分的文档为位图，你可以设置额外的参数来达到目的 ( 例如，实现 [tiled rendering](http://en.wikipedia.org/wiki/Tiled_rendering) 以缩放文档)。

关于如何使用这个新 API 的例子，请看 PdfRendererBasic 。


## System
***

### App usage statistics

现在你可以通过新的 [android.app.usage](https://developer.android.com/reference/android/app/usage/package-summary.html) API 来访问 app 使用情况。这个 API 比已弃用的 <a href="https://developer.android.com/reference/android/app/ActivityManager.html#getRecentTasks(int, int)">getRecentTasks( )</a> 方法提供了更详细数据。要使用这个 API，首先你必须在你的 mainifest 文件声明 "android.permission.PACKAGE_USAGE_STATS" 权限。然后在 *设置 > 安全 > 有权查看使用情况的应用* 里，用户必须允许该 app 的访问。

系统会以每个 app 为基础收集使用数据，并且每隔一天，一周，一月，一年，都会得出统计数据。系统保存的数据的最长持续时间如下：

- 日数据：保留7天
- 周数据：保留4周
- 月数据：保留6个月
- 年数据：保留2年

对于每个 app，系统会记录下列数据：

- app 最后一次被使用的时间
- app 在前台显示的总时长 ( 日，周，月，年 )
- 在一天内，某个控件( 通常用包名或者 activity 名辨别 )转移到前台或者后台的时间戳
- 当设备的配置发生改变时的时间戳 ( 比如设备显示方向因为重力感应被改变 )


## Testing & Accessibility
***

### Testing and accessibility improvements

Android 5.0 添加了如下一些测试和辅助功能的支持：

- 新的 <a href="https://developer.android.com/reference/android/app/UiAutomation.html#getWindowAnimationFrameStats()">getWindowAnimationFrameStats( )</a> 和 <a href="https://developer.android.com/reference/android/app/UiAutomation.html#getWindowContentFrameStats(int)">getWindowContentFrameStats( )</a> 方法可获得窗口动画和内容显示的帧数统计。这些方法可以让你编写测试，评估一个 app 渲染帧数是否达到足够的刷新速率，以提供一个流畅的用户体验。

- 新的 executeShellCommand( ) 方法让你可以从你的 instrumentation test 中执行一段 shell 指令。这个命令的执行和运行 adb shell 把主机和设备连接起来非常相像，它允许你使用 诸如 dumpsys，am，content，以及 pm 等 shell-based 工具。

- 辅助功能和测试工具使用的 accessibility API ( 例如 [UiAutomator](https://developer.android.com/tools/help/uiautomator/index.html) )，现在可以获取用户可交互窗口的属性的具体信息。调用新的 [getWindows( )](https://developer.android.com/reference/android/accessibilityservice/AccessibilityService.html#getWindows() 方法可获得 [AccessibilityWindowInfo](https://developer.android.com/reference/android/view/accessibility/AccessibilityWindowInfo.html) 对象的列表。

- 新的 [AccessibilityNodeInfo.AccessibilityAction](https://developer.android.com/reference/android/view/accessibility/AccessibilityNodeInfo.AccessibilityAction.html) 类让你可定义一个标准或者定制的动作，并显示在一个 [AccessibilityNodeInfo](https://developer.android.com/reference/android/view/accessibility/AccessibilityNodeInfo.html) 中。[AccessibilityNodeInfo.AccessibilityAction](https://developer.android.com/reference/android/view/accessibility/AccessibilityNodeInfo.AccessibilityAction.html) 类替换了之前 [AccessibilityNodeInfo](https://developer.android.com/reference/android/view/accessibility/AccessibilityNodeInfo.html) 里的 actions-related APIs。

- Android 5.0 提供了文本转语音合成 ( TTS synthesis ) 的细致控制。新的 Voice 类允许你的 app 使用指定地区、质量、延迟率 ( latency rating，指基于网络的预计合成延迟 )的声音，以及 TTS 引擎的指定参数。


## IME
***

### Easier switching between input languages

从 Android 5.0 开始，通过平台级的支持，用户可以更轻松的在所有输入法里切换。所有的 [输入法 ( input method editors，IME )](https://developer.android.com/guide/topics/text/creating-input-method.html) 都能执行指定的切换动作循环 (通常是触摸软键盘上的地球图标完成这一动作)，这个行为变化通过 
[shouldOfferSwitchingToNextInputMethod( )](https://developer.android.com/reference/android/view/inputmethod/InputMethodManager.html#shouldOfferSwitchingToNextInputMethod(android.os.IBinder) 方法实现。

此外，framework) 现在会检查下一个输入法是否包含切换机制。一个包含切换机制的输入法不会被切换到一个未包含的输入法。这个行为变化通过 <a href="https://developer.android.com/reference/android/view/inputmethod/InputMethodManager.html#switchToNextInputMethod(android.os.IBinder, boolean)">switchToNextInputMethod( )</a> 方法实现。

想查看“如何使用升级后的 IME-switching APIs”的例子，参考此次放出的 updated soft-keyboard sample。想了解更多关于“如何实现 IME 之间切换”的信息，请看 [Creating an Input Method](https://developer.android.com/guide/topics/text/creating-input-method.html)。


## Manifest Declarations
---

### Declarable reuired features

以下参数值现已加入 <uses-feature> 支持，你可以确保你的 app 仅安装在支持它所需特性的设备上。

- [FEATURE_AUDIO_OUTPUT](https://developer.android.com/reference/android/content/pm/PackageManager.html#FEATURE_AUDIO_OUTPUT)
- [FEATURE_CAMERA_CAPABILITY_MANUAL_POST_PROCESSING](https://developer.android.com/reference/android/content/pm/PackageManager.html#FEATURE_CAMERA_CAPABILITY_MANUAL_POST_PROCESSING)
- [FEATURE_CAMERA_CAPABILITY_MANUAL_SENSOR](https://developer.android.com/reference/android/content/pm/PackageManager.html#FEATURE_CAMERA_CAPABILITY_MANUAL_SENSOR)
- [FEATURE_CAMERA_CAPABILITY_RAW](https://developer.android.com/reference/android/content/pm/PackageManager.html#FEATURE_CAMERA_CAPABILITY_RAW)
- [FEATURE_CAMERA_LEVEL_FULL](https://developer.android.com/reference/android/content/pm/PackageManager.html#FEATURE_CAMERA_LEVEL_FULL)
- [FEATURE_GAMEPAD](https://developer.android.com/reference/android/content/pm/PackageManager.html#FEATURE_GAMEPAD)
- [FEATURE_LIVE_TV](https://developer.android.com/reference/android/content/pm/PackageManager.html#FEATURE_LIVE_TV)
- [FEATURE_MANAGED_USERS](https://developer.android.com/reference/android/content/pm/PackageManager.html#FEATURE_MANAGED_USERS)
- [FEATURE_LEANBACK](https://developer.android.com/reference/android/content/pm/PackageManager.html#FEATURE_LEANBACK)
- [FEATURE_OPENGLES_EXTENSION_PACK](https://developer.android.com/reference/android/content/pm/PackageManager.html#FEATURE_OPENGLES_EXTENSION_PACK)
- [FEATURE_SECURELY_REMOVES_USERS](https://developer.android.com/reference/android/content/pm/PackageManager.html#FEATURE_SECURELY_REMOVES_USERS)
- [FEATURE_SENSOR_AMBIENT_TEMPERATURE](https://developer.android.com/reference/android/content/pm/PackageManager.html#FEATURE_SENSOR_AMBIENT_TEMPERATURE)
- [FEATURE_SENSOR_HEART_RATE_ECG](https://developer.android.com/reference/android/content/pm/PackageManager.html#FEATURE_SENSOR_HEART_RATE_ECG)
- [FEATURE_SENSOR_RELATIVE_HUMIDITY](https://developer.android.com/reference/android/content/pm/PackageManager.html#FEATURE_SENSOR_RELATIVE_HUMIDITY)
- [FEATURE_VERIFIED_BOOT](https://developer.android.com/reference/android/content/pm/PackageManager.html#FEATURE_VERIFIED_BOOT)
- [FEATURE_WEBVIEW](https://developer.android.com/reference/android/content/pm/PackageManager.html#FEATURE_WEBVIEW)


### User permissions

以下权限现已加入 <uses-permission> 支持，请声明你的 app 所需要获取的确切API。

- [BIND_DREAM_SERVICE](https://developer.android.com/reference/android/Manifest.permission.html#BIND_DREAM_SERVICE)：当 target API level 为 21 或更高时，Daydream 服务需要这项权限，以确保只有系统可以与之绑定。

*欢迎关注我的[公众号和微博](/about)。*































