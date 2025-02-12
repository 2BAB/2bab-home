---
layout: post
date: 2025-01-02
title: "Four Ways to Optimize SDK Initialization Callbacks in Kotlin"
tags: [kotlin, android, callback, coroutine, CompletableDeferred, Channel, Flow, enpost]
---

In Android development, we often need to carefully handle the initialization and callbacks of various SDKs, especially when asynchronous operations are involved. In this article, we'll discuss four ways to optimize these callbacks in Kotlin, primarily using several of Google's Android SDKs as examples like Firebase, AdMob, etc.

## Problems with the Traditional Callback Mechanism

First, let's revisit the traditional callback mechanism. In Java, callback functions are commonly used to handle the results of asynchronous tasks, but this method has several drawbacks:

- **Poor code readability**: Excessive callback nesting can easily lead to "callback hell."
- **Complex state management**: Manually maintaining initialization states increases code complexity.
- **Inability to await**: It's impossible to await for initialization to complete when calling methods; polling or blocking are the only options.

In Kotlin, although we have powerful tools like coroutines, callback issues still exist due to the need to maintain compatibility with a large amount of Java code and legacy projects. Taking Google's SDKs as an example, although some have provided KTX extension packages, they have not optimized the initialization process.

## Four Optimization Methods

### 1. Using `AtomicBoolean` to Simply Record State

The most straightforward method is to use an `AtomicBoolean` to record whether the SDK has been successfully initialized.

```kotlin
private val sdkInitialized = AtomicBoolean(false)

MobileAds.initialize(context) { result: InitializationStatus ->
    // Check if all adapters are ready
    sdkInitialized.set(result.adapterStatusMap.values.any {
        it.initializationState == AdapterStatus.State.READY
    })
}
```

**The issue is**: This method requires manually checking `sdkInitialized` every time you call other SDK methods; it cannot await for initialization to complete (while yield the CPU resources).

**Example**:

```kotlin
fun prepareNextRewardedAd() {
    if (sdkInitialized.get()) {
        // Proceed with normal initialization
    } else {
        // Show error message
    }
}
```

#### Pros and Cons

- **Pros**:
  - Simple to implement, suitable for situations where the initialization process is short.
  - Thread-safe, avoiding concurrency issues.

- **Cons**:
  - Requires manual state checks wherever the SDK is used, increasing code redundancy.
  - Cannot await for initialization to complete, which may cause some functions to be unavailable when needed.

### 2. Using `CompletableDeferred` to Await

`CompletableDeferred` allows us to suspend a coroutine until a task is completed, making it ideal for scenarios where we need to wait for SDK initialization.

```kotlin
private val isSDKInitialized = CompletableDeferred<Unit>()

billingClient.startConnection(object : BillingClientStateListener {
    override fun onBillingSetupFinished(billingResult: BillingResult) {
        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
            // Initialization successful
        } else {
            // Initialization failed
        }
        // Mark as complete regardless of success or failure to avoid the coroutine being suspended indefinitely
        isSDKInitialized.complete(Unit)
    }

    override fun onBillingServiceDisconnected() {
        // You can attempt to reconnect
    }
})
```

**Usage**:

```kotlin
suspend fun queryMerchandise(...) = withContext(Dispatchers.IO) {
    // Wait for initialization to complete
    isSDKInitialized.await()

    billingClient.queryProductDetails(...)
}
```

#### Pros and Cons

- **Pros**:
  - Can await for initialization to complete, making the code more concise.
  - Avoids the need for manual state checks, improving code readability.

- **Cons**:
  - If initialization never completes, the coroutine will remain suspended, so you need to handle timeouts and other potential issues.

### 3. Using `Channel` to Handle Producer-Consumer

When you need to handle a callback result in a single producer-consumer scenario, `Channel` is a good choice.

**Example**: Loading a rewarded ad from AdMob SDK

```kotlin
private val rewardedAdChannel = Channel<RewardedAd?>(1)

...
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

**Usage**:

```kotlin
suspend fun showSingleRewardedAd(activity: Activity) {
    // Wait for the ad to load
    val ad = rewardedAdChannel.receive()

    if (ad != null) {
        ad.show(activity) { rewardItem ->
            // Handle reward logic
        }
    } else {
        // Handle loading failure
    }
}
```

#### Pros and Cons

- **Pros**:
  - Suitable for handling one-time or continuous producer-consumer single result, avoiding callback nesting.

- **Cons**:
  - Requires manual management of the `Channel` lifecycle to prevent memory leaks.
  - If there are no consumers, the `Channel` may block; you need to set an appropriate capacity or handle timeouts.

### 4. Using `SharedFlow` to Handle Recurring Events

When you need to handle multiple initializations or state updates, `SharedFlow` is very suitable.

**Example**: Suppose we have a network status change that needs to be monitored multiple times

```kotlin
private val networkStatusFlow = MutableSharedFlow<NetworkStatus>(replay = 1)

fun startNetworkMonitoring() {
    networkMonitor.setOnNetworkStatusChangedListener { status ->
        networkStatusFlow.tryEmit(status)
    }
}
```

**Usage**:

```kotlin
fun observeNetworkStatus() {
    lifecycleScope.launch {
        networkStatusFlow.collect { status ->
            when (status) {
                NetworkStatus.Available -> // Network is available
                NetworkStatus.Unavailable -> // Network is unavailable
            }
        }
    }
}
```

#### Pros and Cons

- **Pros**:
  - Suitable for scenarios where events need to be sent and received multiple times.
  - Subscribers can share the same data source, avoiding redundant work.

- **Cons**:
  - Need to pay attention to backpressure strategies to prevent event backlog.
  - Requires manual management of subscriptions and cancellations to avoid memory leaks.

## Conclusion

Depending on your specific needs, you can choose different methods to optimize callback handling:

- **Single use, single initialization**: Use `AtomicBoolean` for simple initialization state recording.
- **Multiple uses, single initialization**: Use `CompletableDeferred` when you need to wait for initialization to complete within coroutines.
- **Single use, multiple initializations**: Use `Channel` for one-time result callbacks, such as ad loading.
- **Multiple uses, multiple initializations**: Use `SharedFlow` when you need to monitor multiple state updates.

I hope this article provides some insights into handling SDK initialization callbacks. When you encounter similar issues in the future, you can try choosing the most suitable method to improve your code's readability and maintainability.
