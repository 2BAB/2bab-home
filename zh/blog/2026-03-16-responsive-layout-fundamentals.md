---
layout: post
date: 2026-03-16
title: "响应式设计的布局基础"
tags: [android, ios, web, responsive, layout, post]
---

响应式设计的入门其实就考虑两件事：导航怎么放，内容怎么排。屏幕从小到大，这两块各自有一套成熟的模式。Android 开发者的官网把这些总结得较为完整，包括给出了现成组件；iOS 和 Web 思路也差不多，只是要自己动手多一些。


## 一、导航（Navigation）

导航的核心问题：屏幕变大后，导航栏放哪？

### 四种导航形态

**Bottom Bar**

最常见的移动端导航。3-5 个图标横排在屏幕底部，拇指够得到。手机竖屏的默认选择。

```
┌───────────┐
│           │
│  Content  │
│           │
├──┬──┬──┬──┤
│🏠│📋│🔍│⚙️│
└──┴──┴──┴──┘
```

**Top Bar**

Web 传统做法。logo 在左，导航项横排在右。适合导航项不多、品牌展示重要的场景。移动端 App 较少使用这种形态做主导航，但在 Web 上非常普遍，尤其是官网、文档站、SaaS 产品。

```
┌──────────────────────┐
│ Logo  Home  About  ▾ │
├──────────────────────┤
│                      │
│      Content         │
│                      │
└──────────────────────┘
```

屏幕窄时，Top Bar 通常收成一个汉堡菜单（☰），点开变成全屏或半屏的覆盖层。这个退化路径 Web 开发者应该很很熟悉了。

**Rail**

窄边栏，只放图标和简短标签，固定在屏幕左侧。平板和折叠屏的典型选择——比 Bottom Bar 利用空间更合理，又不像 Drawer 那样占太多面积。

```
┌──┬───────────┐
│🏠│           │
│📋│  Content  │
│🔍│           │
│⚙️│           │
└──┴───────────┘
```

**Drawer**

完整的侧边导航面板，图标加完整文字，可以放很多项，甚至支持分组和嵌套。大屏、桌面端的标准做法。有些实现支持展开/收起。

```
┌──────────┬─────────┐
│ 🏠 首页   │         │
│ 📋 订单   │ Content │
│ 🔍 搜索   │         │
│ ⚙️ 设置   │         │
└──────────┴─────────┘
```

### 自动切换逻辑

按屏幕宽度递增：

```
手机         平板/折叠屏      桌面/大屏
Bottom Bar  →  Rail      →  Drawer
```

Web 额外多一条线路：

```
手机                平板           桌面
汉堡菜单(☰)  →   Top Bar    →  Top Bar（项更多）
  或                或              或
Bottom Bar   →   Rail       →  Drawer
```

Web 的选择取决于产品类型。工具型产品（管理后台、邮件、文档）走 Rail/Drawer 路线；内容型产品（博客、官网、电商）走 Top Bar 路线。App 端基本只走 Bottom Bar → Rail → Drawer 这一条路。

### 三端现状

| | Android | iOS | Web |
|---|---------|-----|-----|
| Bottom Bar | `NavigationBar` | `TabView` | 自己写 |
| Top Bar | 不常用 | 不常用 | 自己写（太常见，随便找） |
| Rail | `NavigationRail` | 无原生组件 | 自己写 |
| Drawer | `NavigationDrawer` | 无原生组件 | 自己写 |
| 自动切换 | `NavigationSuiteScaffold` | 无，手动判断 Size Class | 无，用 CSS 断点手动切 |

Android 可能是唯一原生提供了一站式方案的。`NavigationSuiteScaffold` 传入导航项，它自动根据窗口大小在三种形态间切换，一行代码的事。iOS 和 Web 都得自己封装这个切换逻辑，比如 Web 经常借助 Tailwind 做断点和一些完善的组件库做组合。


## 二、内容区域（Canonical Layouts）

导航确定之后，剩下的就是内容区域怎么随屏幕大小调整布局。Google 归纳了三种典型布局，覆盖了绝大多数场景。

### List-Detail（列表-详情）

小屏上列表和详情是两个独立页面，点击列表项跳转到详情；大屏上并排显示，左边列表右边详情。

```
小屏:                    大屏:
┌──────────┐            ┌─────┬────────┐
│ Item A   │            │ A   │        │
│ Item B   │    →       │ B ● │ Detail │
│ Item C   │            │ C   │ of B   │
└──────────┘            └─────┴────────┘
  点击后全屏详情            左右并排
```

最经典的响应式模式。邮件客户端、聊天应用、设置页、文件管理器全是这个。

**各端实现：**
- Android：`ListDetailPaneScaffold`，开箱即用
- iOS：`NavigationSplitView`，基本能用，但自定义能力有限
- Web：CSS Grid/Flexbox + 媒体查询，或者直接用 `grid-template-columns: 300px 1fr`

### Feed（信息流）

内容以卡片为单位，小屏单列，大屏多列网格。

```
小屏:              大屏:
┌────────┐        ┌────┬────┬────┐
│ Card A │        │ A  │ B  │ C  │
│ Card B │   →    │ D  │ E  │ F  │
│ Card C │        │ G  │ H  │    │
└────────┘        └────┴────┴────┘
  单列               多列网格
```

社交动态、新闻、图片瀑布流、商品列表。关键是列数随屏幕宽度自适应，而不是写死。

**各端实现：**
- Android：`LazyVerticalGrid` + `GridCells.Adaptive(minSize)`
- iOS：`LazyVGrid` + `GridItem(.adaptive(minimum:))`
- Web：`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` 一行 CSS 搞定，Web 在这个场景反而是最简洁的

### Supporting Pane（辅助面板）

主内容占大头，辅助信息在旁边。和 List-Detail 的区别在于两边不是"列表→详情"的主从关系，而是"主内容 + 补充信息"的并列关系。

```
小屏:                    大屏:
┌──────────┐            ┌────────┬─────┐
│          │            │        │     │
│   Main   │    →       │  Main  │ SP  │
│          │            │        │     │
├──────────┤            └────────┴─────┘
│ Support  │              主内容 + 侧面板
└──────────┘
 辅助在下方或弹出
```

地图 + 搜索结果、视频 + 评论区、代码编辑器 + 属性面板。小屏上辅助面板通常在下方、收进底部抽屉、或者做成可展开的浮层。

**各端实现：**
- Android：`SupportingPaneScaffold`
- iOS：无对等组件，自己用 `HStack` + `GeometryReader` 拼
- Web：CSS Grid 或 Flexbox，简单直接

### 组合使用

实际项目中这三种经常嵌套。比如一个邮件客户端：整体是 List-Detail，列表部分本身是 Feed（邮件卡片流），详情页右侧可能还挂一个 Supporting Pane 显示附件或联系人信息。理解了这三种基本模式，各种变体都是排列组合。

---

## 总结

```
响应式布局 = 导航适配 + 内容区域适配

导航:
  Bottom Bar → Rail → Drawer（App 端）
  汉堡菜单 → Top Bar（Web 内容站）

内容区域（Canonical Layouts）:
  List-Detail    列表和详情，小屏分页，大屏并排
  Feed           卡片流，小屏单列，大屏多列
  Supporting Pane 主内容 + 辅助面板
```

Android 在这方面做得最完善，有对应的 Material 3 组件直接用。iOS 只有 `NavigationSplitView` 和 `LazyVGrid` 勉强对应了 List-Detail 和 Feed，其余都要手写。Web 灵活度最高，CSS Grid 本身就是为这些场景设计的，但没有封装好的高级组件，需要自己搭。

模式就这些。具体写代码时，先确定页面属于哪种 Canonical Layout，再确定导航用哪种形态，剩下的就是各平台 API 层面的事了。
