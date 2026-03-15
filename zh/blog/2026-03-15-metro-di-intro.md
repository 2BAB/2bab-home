---
layout: post
date: 2026-03-15
title: "一个有偏见的 Metro DI 入门"
tags: [kotlin, android, kmp, metro, di, post]
---

Metro 是 Zac Sweers（前 Slack Android Infra）做的 KMP DI 框架，编译期方案，目前 Cash App 和 Vinted 已在生产环境使用。这是一篇写给 DI 用的不多的人，或者从其他框架迁移过来的人的介绍文章（而不是给完全没用过的人），不求全，只是做一些自己探索的对比记录。


## 核心概念：Binding

DI 框架的本质就是维护一张绑定表：**当有人要类型 A 时，给他实例 B**。Metro 也不例外，所有注解本质上都是在往这张表里添加条目。

```
RepoA        → RepoAImpl
RepoB        → RepoBImpl
HttpClient   → HttpClient(CIO) { ... }
Json         → Json { ignoreUnknownKeys = true }
```

理解了这一点，后面的注解就笔记不会觉得多了。好吧，我还是觉得多。


## 最简单的情况：@Inject

在自己写的类上加 `@Inject`，Metro 就知道怎么创建它。参数列表里的依赖会自动被解析和注入：

```kotlin
@Inject
class ArticleRepositoryImpl(
    private val httpClient: HttpClient,
    private val json: Json,
) : ArticleRepository
```

一个注解搞定"我可以被创建"和"我需要这些依赖"两件事。跟 Koin 对比一下：

```kotlin
// Koin 需要分开写
module {
    factory { ArticleRepositoryImpl(get(), get()) }
}
```

默认情况下 `@Inject` 创建的是 factory —— 每次注入都 new 一个新实例。加上 `@SingleIn` 就变成 singleton：

```kotlin
@Inject
@SingleIn(AppScope::class)
class ArticleRepositoryImpl(...) : ArticleRepository
```

这里没有 Koin 的 `single {}` 和 `factory {}` 两个不同函数，区别就是有没有 `@SingleIn`，我觉得这个设计挺干净的。


## Aggregation

这是 Metro 相对 Dagger 最大的改进。

传统 Dagger 你需要手动把 Module 塞进 Component，维护一个巨大的模块列表。Koin 也一样，你要在某个地方 `startKoin { modules(a, b, c, ...) }` 把所有 module 串起来，或者接入它的 KCP 插件（自己写个小工具也行，我就做过一个 [Koncat](https://github.com/2BAB/Koncat))。有人觉得项目大了之后这个列表会变成几百行的怪物，每加一个类都要去那边登记一下；而我认为这基本上只是模块没拆好的问题 =。= 导致单一模块太大。

Metro 的编译器自动收集大概是：

```kotlin
// 在 feature-article-domain 模块里
@Inject
@SingleIn(AppScope::class)
@ContributesBinding(AppScope::class)
class ArticleRepositoryImpl(
    private val httpClient: HttpClient,
) : ArticleRepository
```

`@ContributesBinding(AppScope::class)` 的意思是：把 `ArticleRepositoryImpl → ArticleRepository` 这条绑定，贡献到 `AppScope` 的 graph 里。编译器在编译 graph 所在的模块时，会自动扫描所有依赖模块里标记了 `@ContributesTo` 或 `@ContributesBinding` 的类，把它们全部塞进去。

**声明即注册，不需要手动汇总。** 这对多模块项目是巨大的效率提升 —— 你在 feature 模块里写完类加上注解就完事了，不用跑去另一个文件里登记。对 AI 编程也更友好：AI 加一个类时只需要改一个文件，而不是改完类还要记得去某个 module 列表里注册，少一步就少一个出错的机会。


## Graph 和 Scope

Metro 的 scope 本身不绑定任何生命周期，它只是个 tag。一个 scope 对应一个 graph（DI 容器），相当于 Koin 的一个 `Koin` 实例。

```kotlin
// 声明 scope
@Scope
annotation class AppScope

// 声明 graph
@DependencyGraph(AppScope::class)
interface AppGraph
```

生命周期完全取决于你什么时候创建和销毁这个 graph 实例：放在 `Application` 里就跟 app 同生命周期，放在登录 session 里就跟用户会话同生命周期。Metro 不像 Hilt 那样预定义 `@ActivityScoped`、`@ViewModelScoped` 帮你自动绑定 Android 组件，自由度更高，但也意味着你得自己管理。

Graph 之间可以有父子关系，通过 `GraphExtension` 实现：

```kotlin
@DependencyGraph(UserScope::class)
interface UserGraph : GraphExtension<AppGraph>
```

子 graph 能访问父 graph 的绑定，父看不到子。这就是实现 App → User → Feature 嵌套 scope 的方式。


## 跨模块依赖：为什么有 export 模块

假设 feature-a 需要 feature-b 的数据，反过来也是。直接依赖会循环，所以把接口抽出来：

```
feature-a-export/   ← 只有接口 RepoA
feature-a-domain/   ← 实现 RepoAImpl，依赖 feature-b-export
feature-b-export/   ← 只有接口 RepoB
feature-b-domain/   ← 实现 RepoBImpl，依赖 feature-a-export
```

各 feature 模块编译时完全不知道彼此的实现。比如用 KMP，这个拼装就发生在 `shared` 模块编译阶段 —— 因为 `shared` 依赖了所有 feature 模块，Metro 编译器插件在那里能看到完整的依赖图，自动把所有贡献的绑定塞进 `AppScope` 的 graph。普通 Android App 基本就是 App 模块了。


## 一些不爽的部分

### BindingContainer 和 @Provides

自己的类用 `@Inject` + `@ContributesBinding` 一行搞定，很爽。但第三方类你没法在上面加注解，只能用 `@Provides`：

```kotlin
@ContributesTo(AppScope::class)
@BindingContainer
interface NetworkBindings {
    @Provides @SingleIn(AppScope::class)
    fun httpClient(): HttpClient = HttpClient(CIO) {
        install(ContentNegotiation) { json(json()) }
    }

    @Provides @SingleIn(AppScope::class)
    fun json(): Json = Json { ignoreUnknownKeys = true }
}
```

你需要新建一个 interface，标记 `@BindingContainer`，标记 `@ContributesTo`，然后在里面写 `@Provides` 函数。

来对比下 Koin：

```kotlin
module {
    single { HttpClient(CIO) { install(ContentNegotiation) { json(json()) } } }
    single { Json { ignoreUnknownKeys = true } }
}
```

说实话，Koin 在这个场景下更直觉。Metro 的 `@BindingContainer` 这个名字也不如 Dagger 的 `@Module` 好理解 —— 虽然叫 Module 也不是就很直观，这部分就是得硬记的样板代码名。

### AssistedInject

当 ViewModel 需要外部传入的参数（比如一个 ID）时，你需要 assisted injection：

```kotlin
@AssistedInject
class DetailViewModel(
    @Assisted val id: String,           // 外部传入
    private val repo: DetailRepository, // DI 提供
) : ViewModel() {

    @AssistedFactory
    interface Factory {
        fun create(id: String): DetailViewModel
    }
}
```

对比 Koin：

```kotlin
class DetailViewModel(
    val id: String,
    private val repo: DetailRepository,
) : ViewModel()

// 注册
module {
    viewModel { params -> DetailViewModel(params.get(), get()) }
}

// 使用
val vm = koinViewModel<DetailViewModel> { parametersOf("some-id") }
```

Metro 多了 `@AssistedInject`、`@Assisted`、`@AssistedFactory` 三个注解加一个 Factory 接口。你得先从"我怎么写个带参数的 ViewModel"这个简单问题里转到"我需要声明一个工厂接口"这个概念，心智负担明显更高。当然，Metro 的好处是类型安全 —— `create(id: String)` 是具名参数，Koin 的 `parametersOf(...)` 是位置传参，多个参数时顺序错了编译不会报错。

如果是以前，是不是值得为了类型安全多写这些样板，见仁见智；现在有 AI，多写几行也无所谓，可能 Metro 更好点；因为 AI 也不是 100% 能确保类型。

### @ViewModelKey 的冗余

注册 ViewModel 到 DI 的 map 时需要写：

```kotlin
@Inject
@ViewModelKey(ArticleListViewModel::class)
@ContributesIntoMap(AppScope::class)
class ArticleListViewModel(...) : ViewModel()
```

`@ViewModelKey(ArticleListViewModel::class)` 放在 `class ArticleListViewModel` 上面 —— key 就是类本身，但你必须显式写出来。我给 Zac 提了 [issue](https://github.com/ZacSweers/metro/issues/1994) 建议做默认推导，被拒绝了，理由是不想为 ViewModel 开特例。理解他的考虑，但每个 ViewModel 都要重复写这一行，二十个就是二十行废话。


## 整体感受

Aggregation 和 `@Inject` + `@ContributesBinding` 的组合是 Metro 最舒服的部分，多模块项目里省掉大量手动注册，编译期就能发现缺失的绑定。

但 `@Provides` + `@BindingContainer` 和 `@AssistedInject` 的样板代码确实烦人。注解数量整体上继承了 Dagger 体系的复杂度，从 Koin DSL 过来的人会觉得一下子多了很多概念要记。Zac Sweers 从 Dagger/Anvil 那个世界过来，这套东西对他来说是自然演化，对很多 DI 不熟的来说是依旧是额外学习曲线。

最后就是，Metro 目前还在 0.11.x 没到 1.0，他虽然离职了但维护更积极了。
