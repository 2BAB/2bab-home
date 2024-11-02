---
layout: post
date: 2024-11-02
title: "Kotlin 对 SDK 初始化回调的四种优化方式"
tags: [kotlin, android, callback, coroutine, CompletableDeferred,Channel, Flow, post]
---

# Kotlin 对 SDK 初始化回调的四种优化方式

在 Android 开发中，我们经常需要小心处理各种 SDK 的初始化和回调，尤其是在需要异步操作时。本文我们将聊聊 Kotlin 中处理这些回调的四种优化方式，主要以 Google 的几个 SDK 为例。

## 回调机制的问题

首先，回顾一下传统的回调机制。在 Java 中，回调函数是处理异步任务结果的常用方式，但这种方法有不少问题：

- **代码可读性差**：回调嵌套过多，容易陷入“回调地狱”。
- **状态管理复杂**：需要手动维护初始化状态，增加了代码复杂度。
- **无法动态等待**：无法在调用方法时动态地等待初始化完成，只能通过轮询或阻塞。

在 Kotlin 中，虽然有协程等强大的工具，但由于需要兼容大量的 Java 代码和历史项目，回调问题仍然存在。以 Google 提供的 SDK 为例，尽管有些已经提供 KTX 扩展包，但并没有在初始化上的问题上进行优化。


## 四种优化方式

### 1. 使用 `AtomicBoolean` 简单记录状态

最直接的方法是使用 `AtomicBoolean` 来记录 SDK 是否已经初始化成功。

```kotlin
private val sdkInitialized = AtomicBoolean(false)

MobileAds.initialize(context) { result: InitializationStatus ->
    // 检查所有的适配器是否已准备就绪
    sdkInitialized.set(result.adapterStatusMap.values.any {
        it.initializationState == AdapterStatus.State.READY
    })
}
```

**问题在于**：这种方式只能在调用 SDK 其他方法时，手动检查 `sdkInitialized`，无法动态地等待初始化完成。

**示例**：

```kotlin
fun prepareNextRewardedAd() {
    if (sdkInitialized.get()) {
        // 正常初始化
    } else {
        // 错误提示
    }
}
```

#### 优缺点分析

- **优点**：
  - 实现简单，适用于初始化流程较短的情况。
  - 线程安全，避免并发问题。

- **缺点**：
  - 需要在每个使用 SDK 的地方手动检查状态，增加代码冗余。
  - 无法动态等待初始化完成，可能导致某些功能无法及时使用。


### 2. 使用 `CompletableDeferred` 动态等待

`CompletableDeferred` 可以让我们在协程中挂起，直到任务完成，非常适合等待 SDK 初始化的场景。

```kotlin
private val isSDKInitialized = CompletableDeferred<Unit>()

billingClient.startConnection(object : BillingClientStateListener {
    override fun onBillingSetupFinished(billingResult: BillingResult) {
        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
            // 初始化成功
        } else {
            // 初始化失败
        }
        // 无论成功与否，都标记为完成，避免协程一直挂起
        isSDKInitialized.complete(Unit)
    }

    override fun onBillingServiceDisconnected() {
        // 可以尝试重新连接
    }
})
```

**使用方式**：

```kotlin
suspend fun queryMerchandise(...) = withContext(Dispatchers.IO) {
    // 等待初始化完成
    isSDKInitialized.await()

    billingClient.queryProductDetails(...)
}
```

#### 优缺点分析

- **优点**：
  - 可以动态地等待初始化完成，代码更加简洁。
  - 避免了手动检查状态的麻烦，提升代码可读性。

- **缺点**：
  - 需要引入协程，可能对项目有一定的改动。
  - 如果初始化一直无法完成，协程会一直挂起，需要处理超时等情况。


### 3. 使用 `Channel` 处理一次性结果

当我们只需要处理一次性的回调结果时，`Channel` 是个不错的选择。

**示例**：加载激励广告

```kotlin
private val rewardedAdChannel = Channel<RewardedAd?>(1)

RewardedAd.load(
    activity,
    adUnitId,
    adRequest,
    object : RewardedAdLoadCallback() {
        override fun onAdLoaded(ad: RewardedAd) {
            rewardedAdChannel.trySend(ad).isSuccess
        }

        override fun onAdFailedToLoad(adError: LoadAdError) {
            rewardedAdChannel.trySend(null).isSuccess
        }
    }
)
```

**使用方式**：

```kotlin
suspend fun showSingleRewardedAd(activity: Activity) {
    // 等待广告加载完成
    val ad = rewardedAdChannel.receive()

    if (ad != null) {
        ad.show(activity) { rewardItem ->
            // 处理奖励逻辑
        }
    } else {
        // 处理加载失败的情况
    }
}
```

#### 优缺点分析

- **优点**：
  - 适合一次性结果的处理，避免了回调嵌套。
  - 可以在协程中以同步的方式处理异步结果，代码清晰。

- **缺点**：
  - 需要手动管理 `Channel` 的生命周期，防止内存泄漏。
  - 如果没有消费者，`Channel` 可能会阻塞，需要设置合适的容量或处理超时。


### 4. 使用 `SharedFlow` 处理多次重现的事件

当我们需要处理多次初始化或状态更新时，`SharedFlow` 非常适合。

**示例**：假设我们有一个需要多次监听的网络状态变化

```kotlin
private val networkStatusFlow = MutableSharedFlow<NetworkStatus>(replay = 1)

fun startNetworkMonitoring() {
    networkMonitor.setOnNetworkStatusChangedListener { status ->
        networkStatusFlow.tryEmit(status)
    }
}
```

**使用方式**：

```kotlin
fun observeNetworkStatus() {
    lifecycleScope.launch {
        networkStatusFlow.collect { status ->
            when (status) {
                NetworkStatus.Available -> // 网络可用
                NetworkStatus.Unavailable -> // 网络不可用
            }
        }
    }
}
```

#### 优缺点分析

- **优点**：
  - 适用于需要多次发送和接收事件的场景。
  - 订阅者可以共享同一个数据源，避免重复工作。

- **缺点**：
  - 需要注意背压策略，防止事件积压。
  - 需要手动管理订阅和取消，避免内存泄漏。


## 总结

根据不同的需求，我们可以选择不同的方式来优化回调处理：

- **单次使用，单次初始化**：`AtomicBoolean`，适用于简单的初始化状态记录。
- **多次使用，单次初始化**：`CompletableDeferred`，适用于需要在协程中等待初始化完成的情况。
- **单次使用，多次初始化**：`Channel`，适用于一次性结果的回调，如广告加载。
- **多次使用，多次初始化**：`SharedFlow`，适用于需要监听多次状态更新的场景。

希望这篇文章能给大家带来一些处理 SDK 初始化回调的思路，未来碰到类似问题时可尝试选择最适合的方式，提高代码的可读性和维护性。
