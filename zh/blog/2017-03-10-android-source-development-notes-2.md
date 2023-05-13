---
layout: post
date: 2017-03-10
title: "Android 源码笔记 #2 源码及 Framework 结构"
tags: [Android, Framework, 源码, post]
---

## 源码结构

### 框架图
图片来自 [Android Source Overview](http://source.android.com/source/)

![](http://2bab-images.lastmayday.com/blog/2017-03-10-android-source-development-notes-2-2.jpeg)

<!--more-->

### 包说明

下述说明引用自 [Cloud Chou's Tech Blog](http://www.cloudchou.com/android/post-136.html)：

-  abi # 应用二进制接口，不同的操作系统，应用二进制接口不同，因此linux上的二进制可执行文件在windows上无法执行
-  android # 存放了一些xml文件，用于描述工程路径及其对应的远程仓库地址，repo工具将使用这些信息同步代码
-  bionic # bionic C库,Android没有使用标准的 glibc 库，而是自己重新实现了一套 C/C++库，包括 libc libdl libm libstdc++ libthread_db
-  bootable # 包含两个工程，recovery 和 diskinstaller，刷机或者系统升级都是由 Recovery完成的
- build # Android编译系统核心代码都存放在该目录，我们也将对该目录下的文件做详细分析
- cts # Android 兼容性测试套件标准
- dalvik # dalvik Java 虚拟机，Android 用的 Java 虚拟机和 PC 上用的 JVM 不一样
- development # 应用程序开发工具 有 eclipse 开发用的formatter配置
- device # 设备相关配置文件，存放规则 device/\$vendor/\$product
- docs # 网站文档
- external # 用到的第三方库 象 busybox bash openssl 等工具都存放在该目录
- filelist # 使用 godir 命令生成的索引文件
- frameworks # 核心框架 —— Java 及 C++ 语言，可生成 framework.jar
- gdk # glass 开发 sdk
- hardware # 部分厂家开源的硬件适配层 HAL 代码
- kernel # 内核源码目录 存放规则 kernel/\$vendor/\$product
- libcore # 一些有用的库 像 xml Jason luni
- libnativehelper # Support functions for Android's class libraries
- Makefile # 在顶层目录编译，利用的默认Makefile，它只是简单包含了 build/core/main.mk
- ndk # ndk开发工具
- packages # Android apk程序所在目录,象 settings，g- allery 等程序
- pdk # Platform Development Kit The goal of the PDK release is to help chipset vendors and OEMs to migrate to a new relelase
- prebuilt # x86和arm架构下预编译的一些资源
- prebuilts # 有clang eclipse gcc misc ndk qemu-kernel sdk tools 等子目录，交叉编译工具链所在目录
- sdk # sdk及模拟器
- system # 核心代码，包含了最小化可启动的环境，还有底层调试及检查工具，adbd 也在 system/core 目录
- tools # 有子目录 build 和 motodev，可能跟摩托罗拉有关
- vendor # 设备制造商专用的配置存放目录，存放规则 vendor/\$vendor/\$product

### 着重关心的
如果不是像小米这样的有自己硬件的厂商，其实一般关心的层面在 `Android Framework` 和 `Applications`。映射到具体包就是 `frameworks` 和 `packages`。应用程序没啥好看的，每个版本也不尽相同，主要看看 `frameworks`，下面内容摘自 [Git_Android 的 Android核心服务解析篇(二)——Android源码结构分析](http://blog.csdn.net/liyuanjinglyj/article/details/48056579)：

应用程序框架是Android系统中的核心部分，也就是SDK部分，它会提供接口给应用程序使用，同时应用程序框架又会与系统服务，系统程序库，硬件抽象层的关联，所以其作用十分重大，应用程序框架的实现代码大部分都在/frameworks/base和/frameworks/av目录下。

frameworks/base的目录结构如下所示：
**frameworks/base**

- api //全是XML文件，定义了API
- cmds //Android中的重要命令（am，app_proce等）
- core //核心库
- data //声音字体等数据文件
- docs //文档
- drm //数字版权管理
- graphics  //图形图像
- icu4j //用于解决国际化问题
- include //头文件
- keystore  //数字签名证书相关
- libs //库
- location  //地理位置
- media //多媒体
- native //本地库
- nfc-extras  //NFC相关
- obex //蓝牙传输
- opengl //OpenGL相关
- packages  //设置，TTS,VPN程序
- policy //锁屏界面相关
- sax //XML解析器
- services  //Android服务
- telephony  //电话相关
- test-runner  //测试相关
- tests //测试相关
- tools //工具
- voip //可视通话
- wifi //无线网络


Android应用程序框架层的大部分实现代码被保存在/frameworks/base目录下，其实在这个目录中还有一个名为service的目录，里面的代码用于实现Android系统服务，其目录结构如下所示：

**frameworks/base/services**

- common_time  //日期时间相关的服务
- input //输入系统服务
- Java //其他重要服务的Java层
- jni //其他重要服务的JNI层
- tests //测试相关

其中java和jni两个目录分别是一些其他的服务的Java层和JNI层实现，java目录下的目录结构以及其他Android系统服务的相关说明如下所示：

**frameworks/base/services/core/java/com/android/server**

- accessibility
- am
- connectivity
- display
- dreams
- drm
- input
- location
- net
- pm
- power
- updates
- usb

\——wm

- AlarmManagerService.java//闹钟服务
- AppWidgetService.java//应用程序小工具服务
- AppWidgetServiceImpl.java
- AttributeCache.java

\——BackupManagerService.java//备份服务

- BatteryService.java//电池相关服务
- BluetoothManagerService.java//蓝牙
- BootReceiver.java
- BrickReceiver.java
- CertBlacklister.java
- ClipboardService.java
- CommonTimeManagementService.java//时间管理服务
- ConnectivityService.java
- CountryDetectorService.java
- DevicePolicyManagerService.java
- DeviceStorageMonitorService.java//设备存储器监听服务
- DiskStatsService.java//磁盘状态服务
- DockObserver.java//底座监视服务
- DropBoxManagerService.java
- EntropyMixer.java
- EventLogTags.logtags
- INativeDaemonConnectorCallbacks.java
- InputMethodManagerService.java//输入法管理服务
- IntentResolver.java
- IntentResolverOld.java
- LightsService.java
- LocationManagerService.java//地理位置服务
- MasterClearReceiver.java
- MountService.java//挂载服务
- NativeDaemonConnector.java
- NativeDaemonConnectorException.java
- NativeDaemonEvent.java
- NetworkManagementService.java//网络管理服务
- NetworkTimeUpdateService.java
- NotificationManagerService.java//通知服务
- NsdService.java
- PackageManagerBackupAgent.java
- PreferredComponent.java
- ProcessMap.java
- RandomBlock.java
- RecognitionManagerService.java
- SamplingProfilerService.java
- SerialService.java//NFC相关
- ServiceWatcher.java
- ShutdownActivity.java
- StatusBarManagerService.java//状态栏管理服务
- SystemBackupAgent.java
- SystemService.java
- TelephonyRegistry.java
- TextServicesManagerService.java
- ThrottleService.java
- TwilightCalculator.java
- TwilightService.java
- UiModeManagerService.java
- UpdateLockService.java//锁屏更新服务
- VibratorService.java//震动服务
- WallpaperManagerService.java//壁纸服务
- Watchdog.java//看门狗
- WifiService.java//无线网络服务
- WiredAccessoryManager.java//无线设备管理服务

从上面的文件夹和文件可以看出，Android中涉及的服务种类有：界面，网络，电话等核心模块，这些专属服务是系统级别的服务，这些系统服务一般都会在Android系统启动的时候加载，在系统关闭的时候结束，受到系统的管理，应用程序并没有权力去打开或者关闭，它们会随着系统的运行一直在后台运行，供应用程序和其他组件来使用。

另外，在framework/av/目录下面有一个services目录，在此目录中存放的是音频和照相机的服务的实现代码，此目录的具体结构如下所示：

**frameworks/av/services**

- audioflinger//音频管理服务
- camera//照相机的管理服务

av/services目录主要用来支持Android系统中的音频和照相机服务。

媒体库：Android中的媒体库在2.3版之前是由OpenCore实现的，2.3版之后Stragefright被替换了,OpenCore成为新的多媒体的实现库。同时Android自带了一些音视频的管理库，用于管理多媒体的录制，播放，编码和解码等功能。

Android的多媒体程序库的实现代码主要在/frameworks/av/media目录中，其目录结构如下：

**frameworks/av/media/**

- common_time  //时间相关
- libeffects  //多媒体效果
- libmedia  //多媒体录制，播放
- libmedia_native  //里面只有一个Android。迥，用来编译native文件
- libmediaplayerservice//多媒体播放服务的实现库
- libstagefright  //Stagefright的实现库
- mediaserver  //跨进程多媒体服务
- mtp //MTP协议的实现（媒体传输协议）


图层显示库：Android中的图层显示库主要负责对显示子系统的管理，负责图层的渲染，叠加，绘制等功能，提供了2D和3D图层的无缝融合，是整个Android系统显示的“大脑中枢”，其代码在/frameworks/native/services/surfaceflinger/目录下，其目录结构如下所示：

**frameworks/native/services/surfaceflinger/**

- DisplayHardware//显示底层相关
- tests//测试
- Android.mk//MakeFile文件
- Barrier.h
- Client.cpp//显示的客户端实现文件
- Client.h
- clz.cpp
- clz.h
- DdmConnection.cpp
- DdmConnection.h
- DisplayDevice.cpp//显示设备相关
- DisplayDevice.h
- EventThread.cpp//消息线程
- EventThread.h
- GLExtensions.cpp//OpenGL扩展
- GLExtensions.h
- Layer.cpp//图层相关
- Layer.h
- LayerBase.cpp//图层基类
- LayerBase.h
- LayerDim.cpp//图层相关
- LayerDim.h
- LayerScreenshot.cpp//图层相关
- LayerScreenshot.h
- MessageQueue.cpp//消息队列
- MessageQueue.h
- MODULE_LICENSE_APACHE2//证书
- SurfaceFlinger.cpp//图层管理者，图层管理的核心类
- SurfaceFlinger.h
- SurfaceTextureLayer.cpp//文字图层
- SurfaceTextureLayer.h
- Transform.cpp
- Transform.h

3D图形库：Android中的3D图形渲染是采用OpenGL来实现的，OpenGl是开源的第三方图形渲染库，使用该库可以实现Android中的3D图形硬件加速或者3D图形软件加速功能，是一个非常重要的功能库。从Android 4.3开始，支持最新，最强大的OpenGL ES3.0.其实现代码在/frameworks/native/opengl中，其目录结构如下所示：

**frameworks/native/opengl/**

- include //OpenGL中的头文件
- libagl //在Mac OS上的库
- libs //OpenGL的接口和实现库
- specs //OpenGL的文档
- tests //测试相关
- tools //工具库

SQLite：SQLite是Android系统自带的一个轻量级关系数据库，其实现源代码已经在网上开源。SQLite的优点是操作方便，运行速度较快，占用资源较少等，比较适合在嵌入式设备上面使用。SQLite是Android系统自带的实现数据库功能的核心库，其代码实现分为Java和C两个部分，Java部分的代码位于/frameworks/base/core/java/android/database，主要是实现SQLite的框架和接口的实现，使用户开发应用程序时能很简单地操作数据库，并且捕获数据库异常。目录结构如下所示：

**frameworks/base/core/java/android/database/**

- sqlite//SQLite的框架文件
- AbstractCursor.java//游标的抽象类
- AbstractWindowedCursor.java
- BulkCursorDescriptor.java
- BulkCursorNative.java
- BulkCursorToCursorAdaptor.java//游标适配器
- CharArrayBuffer.java
- ContentObservable.java
- ContentObserver.java
- CrossProcessCursor.java
- CrossProcessCursorWrapper.java//CrossProcessCursor的封装类
- Cursor.java//游标实现娄
- CursorIndexOutOfBoundsException.java//游标出界异常
- CursorJoiner.java
- CursorToBulkCursorAdaptor.java//适配器
- CursorWindow.java//游标窗口
- CursorWindowAllocationException.java//游标窗口异常
- CursorWrapper.java//游标封装类
- DatabaseErrorHandler.java//数据库错误句柄
- DatabaseUtils.java//数据库工具类
- DataSetObservable.java
- DataSetObserver.java
- DefaultDatabaseErrorHandle.java//默认数据库错误句柄
- IBulkCursor.java
- IContentObserver.aidl//aidl用于跨进程通信
- MatrixCursor.java
- MergeCursor.java
- Observable.java
- package.html
- SQLException.java//数据库异常
- StaleDataException.java



*欢迎关注我的[公众号和微博](/about)。*