---
layout: post
date: 2019-05-24
title: "DIY 24 寸的 4K 显示器"
tags: [硬件向, post]
---

这两天苹果上架了新款的 23.8 寸 LG UltraFine 4K 显示器，看了下边框还是那么的粗，Hmmm 还是桌上的这台自制 4K 显示器舒服。正好有朋友也想试试，于是想到记录一下折腾的过程，虽然大部分的工作量都是朋友 @Can 帮忙完成的哈哈。

<!--more-->

先列一下配置单和链接：

|部件|型号|链接|参考价格|
|---|---|---|---|
|面板|LM238WR3-SSB1|http://www.panelook.cn/LM238WR3-SSB1_LG%20Display_23.8_LCM_invitemdetail_cn_167827.html|￥600-750|
|驱动板|N/A|https://item.taobao.com/item.htm?id=575821521733|￥400|
|驱动板外壳|N/A|https://item.taobao.com/item.htm?id=575219610220|￥40|
|背盖|http://2bab-images.lastmayday.com/2019-05-23-diy-4k-monitor-LM238WR3-spec.pdf|http://2bab-images.lastmayday.com/2019-05-23-diy-4k-monitor-backpanel.dwg|￥60|
|电源|N/A|https://shop108273173.taobao.com/index.htm|￥50|
|总计|||￥1200 左右|

### 面板

一直想买的是 24 寸的 4K 屏幕，奈何市面上多数 4K 的屏幕都是 27 寸。具体来说：

- 27 寸对我来说太大了，而且家里没那么大，办公桌还得放不止一台显示器，不然其实我会入手 **Dell U2718Q** 或者 **LG 27UL850**，各方面都比较符合我的要求；
- 24 寸的选择里，大牌基本上只有 **Dell P2415Q**，可以说是市面上第一款消费级的 4K 24寸，奈何 P 系列的跑马灯边框实在是受不了，整体效果（可视角、色彩、白平衡）也和 U 系列有些差距，两千多块都花了，肯定想更一步到位了；
- 其他的特别选择，包括 **LG UltraFine 4K@21"/5K@27"**，也主要是尺寸 + 边框问题，价格上 21 寸的那款还算可以接受了；

嗯，废话这么多，事实上我最想要的参数是：

- 4K@24寸
- 全玻璃覆盖的隐藏式边框（窄边框）
- 国际大厂的质量保证，比如 LG、Samsung 的屏

所以决定 DIY 的时候，面板也就定下 **LG LM238WR3-SSB1** 了。关于面板的参数查找，可以去各大屏库网站查阅，比如：

- http://www.panelook.com/LM238WR3-SSB1_LG%20Display_23.8_LCM_overview_29420.html
- https://www.lcds-display.com/products/LM238WR3-SSB1_LG-Display.html

这块面板的参数[对比]( http://www.panelook.com/modelcompare.php?ids=29420,33044
) **LG UltraFine 5k@27 (LM270QQ2-SPA1)** 也丝毫不逊色，有些地方甚至还要好于 UltraFine（比如 10bit 色彩，更高对比度等等）。（PS. 购买链接里请自行 QQ 微信 与供应商联系）

![调试中的面板](http://2bab-images.lastmayday.com/blog/diy-4k-24inch-monitor-1.jpg?imageslim)
<div style="text-align:center;"><i>调试中的面板...</i></div>

### 驱动板 & 驱动板外壳（含按键）& 电源

驱动板是除面板外的最重要部件之一啦，一般用的都是第三方的自研驱动板。基本上我们也是在网上搜了一圈，看了下大家评价比较好的几款，最后选定的这个参数有：

- 2K@144Hz
- 4K@60Hz
- DP1.2 * 2 & HDMI2.0 * 2
- 2K 下的 HDR

上述的购买链接大家可以发现其实板子和它的外壳、电源是一家店，买外壳的时候商量下不要背板和遥控器，就可以用便宜的价格拿到所需的部件了。（电源就买的时候找老板要一个对应的即可）

事实上这个驱动板和外壳是 **LG LM270WR3SSA1** 的第三方标准套件，喜欢 27 寸的其实可以搜到很多这个型号的 DIY 教程，这边就直接复用了省的再去瞎折腾，反正是同一个厂商近乎相同型号的面板。

### 显示器背盖

为了让显示器能够支撑起来，以及能把驱动板安装在显示器上，我们还需要一个背盖。我在网上找了个这块面板的具体结构图（背盖-型号那栏可以下载 PDF），大佬照着这个直接撸了个 CAD 的工图 Orz，然后随手找了个淘宝店打印了一块亚克力来用。

需要说明的是，这个 CAD 的图有个 bug 就是没有考虑好跟驱动板外壳的兼容性，所以最后大佬用 502 帮我把驱动盒子粘上去了哈哈哈哈。有相关专业经验的朋友可以先买了驱动盒子后再研究怎么改进一下背盖的 CAD 图。

![安装了背壳和驱动盒子](http://2bab-images.lastmayday.com/blog/diy-4k-24inch-monitor-2.jpg?imageslim)
<div style="text-align:center;"><i>安装了背壳和驱动盒子</i></div>

### 成品

插两根排线，拧几个螺丝，组装起来（需要具体步骤的话去色魔张大妈看看），最后贴了个丑爆的膜（请勿模仿）。有条件的可以去淘宝租个红蜘蛛较色仪，大概几十块钱就可以使颜色更准确。

![](http://2bab-images.lastmayday.com/blog/diy-4k-24inch-monitor-3.jpg?imageslim)


![](http://2bab-images.lastmayday.com/blog/diy-4k-24inch-monitor-4.JPG?imageslim)

**总结：参数图里都有，4K@60Hz 稳！**


*欢迎关注我的[公众号和微博](/about)。*