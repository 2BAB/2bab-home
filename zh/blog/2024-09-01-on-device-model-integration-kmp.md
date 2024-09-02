---
layout: post
date: 2024-09-01
title: "移植 Mediapipe LLM Demo 到 Kotlin Multiplatform"
tags: [KMP, android, post]
---

不久前我在厦门和广州的 Google I/O Extended 分享了 《On-Device Model 集成（KMP）与用例》，本文是当时 Demo 的深入细节分析，同时也是后面几篇同类型文章的开头。通过本文你将了解到：

1. **移植 Mediapipe 的 LLM Inference Android 官方 Demo 到 KMP，支持在 iOS 上运行。** 项目地址：https://github.com/2BAB/mediapiper
2. **KMP 两种常见的调用 iOS SDK 的方式**：
    1. **Kotlin 直接调用 Cocoapods 引入的第三方库。**
    2. **Kotlin 通过 iOS 工程调用第三方库。**
3. **KMP 与多平台依赖注入时的小技巧（基于 Koin）。**
4. **On-Device Model 与 LLM 模型 Gemma 1.1 2B 的简单背景。**

![](https://2bab-images.lastmayday.com/202408-on-device-model-screenshot.jpg?imageslim)


## On-Device Model 本地模型

大语言模型（LLM）持续火热了很长一段时间，而今年开始这股风正式吹到了移动端，包括 Google 在内的最新手机与系统均深度集成了此类 On-Device Model 的相关功能。对于 Google 目前的公开战略中，On-Device Model 这块的大语言模型主要分为两个：

1. Gemini Nano：非开源，支持机型较少（ 支持特定芯片加速如 Tensor G3），具有极其强劲进的表现。目前可以在桌面平台（Chrome）和部分 Android 手机上使用（Pixel 8/9 和 Samsung S23/24 等）。今年晚些时候会公开给更多的开发者进行使用和测试。
2. Gemma：开源，支持所有满足最低要求的机型，同样有不俗的性能表现（最新的 Gemma2-2B 已经有超越 GPT 3.5 的推理能力），与 Nano 使用同源的技术路线进行训练。目前可以在多平台上体验（Android/iOS/Desktop）。今年晚些时候会提供 Gemma2 版本的 Mediapipe 适配。

因 Gemini Nano 目前多数开发者都还摸不到，所以今天的主角便是 Gemma 1.1 的 2B 版本。想在移动平台上直接使用 Gemma，Google 已给我们提供一个开箱即用的工具：Mediapipe。MediaPipe 是一个跨平台的框架，它封装了一系列预构建的 On-Device 机器学习模型和工具，支持实时的手势识别、面部检测、姿态估计等任务，还可应用于生成图片、聊天机器人等各种应用场景。感兴趣的朋友可以试玩它的 Web 版 [Demo](https://mediapipe-studio.webapps.google.com/)，以及相关[文档](https://ai.google.dev/edge/mediapipe/solutions/guide)。

![](https://2bab-images.lastmayday.com/on-device-model-mediapipe-intro.jpg?imageslim)

而其中的 LLM Inference API（上表第一行），用于运行大语言模型推理的组件，支持 Gemma 2B/7B，Phi-2，Falcon-RW-1B，StableLM-3B 等模型。针对 Gemma 的预转换模型(基于 TensorFlow Lite）可在 Kaggle [下载](https://www.kaggle.com/models/google/gemma/tfLite/gemma-1.1-2b-it-gpu-int4)，并在稍后直接放入 Mediapipe 中加载。

![](https://2bab-images.lastmayday.com/202408-on-device-model-gemma-download.png?imageslim)

## LLM Inference Android Sample

Mediapipe 官方的 [LLM Inference Demo](https://github.com/google-ai-edge/mediapipe-samples/tree/main/examples/llm_inference/android) 包含了 Android / iOS / Web 前端 等平台。

![](https://2bab-images.lastmayday.com/202408-on-device-demo-android-sample.png?imageslim)

打开 Android 仓库会发现几个特点：

- **纯 Kotlin** 实现。
- UI 是**纯 Jetpack Compose** 实现。
- 依赖的 LLM Task SDK 已经高度封装，暴露出来的方法仅 3 个。

再查看 iOS 的版本：

- UI 是 SwiftUI 实现，做的事情和 Compose 一模一样，稍微再简化掉一些元素（例如 Topbar 和发送按钮）。
- 依赖的 LLM Task SDK 已经高度封装，暴露出来的方法一样为 3 个。

所以，一个好玩的想法出现了：**Android 版本的这个 Demo 具备移植到 iOS 上的基础；移植可使两边的代码高度高度一致，大幅缩减维护成本，而核心要实现的仅仅是桥接下 iOS 上的 LLM Inference SDK。**


## Kotlin Multiplatform

移植工程所使用的技术叫做 Kotlin Multiplatform（缩写为 **KMP**），它是 Kotlin 团队开发的一种支持跨平台开发的技术，允许开发者使用相同的代码库来构建 Android、iOS、Web 等多个平台的应用程序。通过共享业务逻辑代码，KMP 能显著减少开发时间和维护成本，同时尽量保留每个平台的原生性能和体验。Google 在今年的 I/O 大会上也宣布对 KMP 提供一等的支持，把一些 Android 平台上的库和工具迁移到了多平台，KMP 的开发者可以方便的使用它到 iOS 等其他平台。

![](https://2bab-images.lastmayday.com/202408-on-device-model-kmp-1.jpg?imageslim)
![](https://2bab-images.lastmayday.com/202408-on-device-model-kmp-2.jpg?imageslim)

尽管 Mediapipe 也支持多个平台，但我们这次主要聚焦在 Android 和 iOS。一方面更贴近现实，各行各业使用 KMP 的公司的用例更多在移动端上；另外一方面也更方便对标其他移动端开发技术栈。

![](https://2bab-images.lastmayday.com/202408-on-device-model-kmp-3.png?imageslim)

## 移植流程

### 初始化

使用 IDEA 或 Android Studio 创建一个 KMP 的基础工程，你可以借助 KMP Wizard 或者第三方 KMP App 的模版。如果你没有 KMP 的相关经验，可以看到它其实就是一个非常类似 Android 工程的结构，只不过这一次我们把 iOS 的壳工程也放到根目录，并且在 app 模块的 `build.gradle.kts` 内同时配置了 iOS 的相关依赖。

![](https://2bab-images.lastmayday.com/202408-on-device-model-proj-3.jpg?imageslim)

### 封装和调用 LLM Inference

我们在 `commonMain` 中，根据 Mediapipe LLM Task SDK 的特征抽象一个简单的接口，使用 Kotlin 编写，用以满足 Android 和 iOS 两端的需要。该接口取代了原有仓库里的 `InferenceModel.kt` 类。

``` kotlin
// app/src/commonMain/.../llm/LLMOperator
interface LLMOperator {

    /**
     * To load the model into current context.
     * @return 1. null if it went well 2. an error message in string
     */
    suspend fun initModel(): String?

    /**
     * To calculate the token size of a string.
     */
    fun sizeInTokens(text: String): Int

    /**
     * To generate response for give inputText in synchronous way.
     */
    suspend fun generateResponse(inputText: String): String

    /**
     * To generate response for give inputText in asynchronous way.
     * @return A flow with partial response in String and completion flag in Boolean.
     */
    suspend fun generateResponseAsync(inputText: String): Flow<Pair<String, Boolean>>

}
```

在 Android 上面，因为 LLM Task SDK 原先就是 Kotlin 实现的，所以除了初始化加载模型文件，其余的部分基本就是代理原有的 SDK 功能。

``` kotlin
class LLMInferenceAndroidImpl(private val ctx: Context): LLMOperator {

    private lateinit var llmInference: LlmInference
    private val initialized = AtomicBoolean(false)
    private val partialResultsFlow = MutableSharedFlow<Pair<String, Boolean>>(
        extraBufferCapacity = 1,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )

    override suspend fun initModel(): String? {
        if (initialized.get()) {
            return null
        }
        return try {
            val modelPath = ...
            if (File(modelPath).exists().not()) {
                return "Model not found at path: $modelPath"
            }
            loadModel(modelPath)
            initialized.set(true)
            null
        } catch (e: Exception) {
            e.message
        }
    }
    private fun loadModel(modelPath: String) {
        val options = LlmInference.LlmInferenceOptions.builder()
            .setModelPath(modelPath)
            .setMaxTokens(1024)
            .setResultListener { partialResult, done ->
                // Transforming the listener to flow,
                // making it easy on UI integration.
                partialResultsFlow.tryEmit(partialResult to done)
            }
            .build()

        llmInference = LlmInference.createFromOptions(ctx, options)
    }

    override fun sizeInTokens(text: String): Int = llmInference.sizeInTokens(text)

    override suspend fun generateResponse(inputText: String): String {
        ...
        return llmInference.generateResponse(inputText)
    }

    override suspend fun generateResponseAsync(inputText: String): Flow<Pair<String, Boolean>> {
        ...
        llmInference.generateResponseAsync(inputText)
        return partialResultsFlow.asSharedFlow()
    }

}
```

而针对 iOS，我们先尝试第一种调用方式：**直接调用 Cocoapods 引入的库**。在 app 模块引入 cocoapods 的插件，同时添加 Mediapipe 的 LLM Task 库：

``` kotlin
// app/build.gradle.kts
plugins {
    ...
    alias(libs.plugins.cocoapods)
}
cocoapods {
    ...
    ios.deploymentTarget = "15"

    pod("MediaPipeTasksGenAIC") {
        version = "0.10.14"
        extraOpts += listOf("-compiler-option", "-fmodules")
    }
    pod("MediaPipeTasksGenAI") {
        version = "0.10.14"
        extraOpts += listOf("-compiler-option", "-fmodules")
    }
}
```

注意上面的引入配置中要添加一个编译参数为 `-fmodules` 才可正常生成 Kotlin 的引用（[参考链接](https://kotlinlang.org/docs/native-cocoapods-libraries.html#support-for-objective-c-headers-with-import-directives)）。

> 一些 Objective-C 库，尤其是那些作为 Swift 库包装器的库，在它们的头文件中使用了 @import 指令。默认情况下，cinterop 不支持这些指令。要启用对 @import 指令的支持，可以在 pod() 函数的配置块中指定 -fmodules 选项。

之后，我们在 iosMain 中便可直接 import 相关的库代码，如法炮制 Android 端的代理思路：

``` kotlin
// 注意这些 import 是 cocoapods 开头的
import cocoapods.MediaPipeTasksGenAI.MPPLLMInference
import cocoapods.MediaPipeTasksGenAI.MPPLLMInferenceOptions
import platform.Foundation.NSBundle
...
class LLMOperatorIOSImpl: LLMOperator {

    private val inference: MPPLLMInference
    
        init {
        val modelPath = NSBundle.mainBundle.pathForResource(..., "bin")

        val options = MPPLLMInferenceOptions(modelPath!!)
        options.setModelPath(modelPath!!)
        options.setMaxTokens(2048)
        options.setTopk(40)
        options.setTemperature(0.8f)
        options.setRandomSeed(102)

        // NPE was thrown here right after it printed the success initialization message internally.
        inference = MPPLLMInference(options, null) 
    }

    override fun generateResponse(inputText: String): String {...}
    override fun generateResponseAsync(inputText: String, ...) :... {
        ...
    }
    ...
}
```

但这回我们没那么幸运，`MPPLLMInference` 初始化结束的一瞬间有 NPE 抛出。最可能的问题是因为 Kotlin 现在 interop 的目标是 Objective-C，`MPPLLMInference` 的构造器比 Swift 版本多一个 error 参数，而我们传入的是 null。

``` kotlin
constructor(
  options: cocoapods.MediaPipeTasksGenAI.MPPLLMInferenceOptions, 
  error: CPointer<ObjCObjectVar<platform.Foundation.NSError?>>?)
```

但几番测试各种指针传入，也并未解决这个问题，：

``` kotlin
// 其中一种尝试
memScoped {
    val pp: CPointerVar<ObjCObjectVar<NSError?>> = allocPointerTo()
    val inference = MPPLLMInference(options, pp.value)
    Napier.i(pp.value.toString())
}
```

于是只能另辟蹊径采用第二种方案：通过 iOS 工程调用第三方库。

``` kotlin
// 1. 声明一个类似 LLMOperator 的接口但更简单，方便适配 iOS 的 SDK。
// app/src/iosMain/.../llm/LLMOperator.kt
interface LLMOperatorSwift {
    suspend fun loadModel(modelName: String)
    fun sizeInTokens(text: String): Int
    suspend fun generateResponse(inputText: String): String
    suspend fun generateResponseAsync(
        inputText: String,
        progress: (partialResponse: String) -> Unit,
        completion: (completeResponse: String) -> Unit
    )
}

// 2. 在 iOS 工程里实现这个接口
// iosApp/iosApp/LLMInferenceDelegate.swift
class LLMOperatorSwiftImpl: LLMOperatorSwift {
    ...
    var llmInference: LlmInference?
    
    func loadModel(modelName: String) async throws {
        let path = Bundle.main.path(forResource: modelName, ofType: "bin")!
        let llmOptions =  LlmInference.Options(modelPath: path)
        llmOptions.maxTokens = 4096
        llmOptions.temperature = 0.9
        
        llmInference = try LlmInference(options: llmOptions)
    }
    
    func generateResponse(inputText: String) async throws -> String {
        return try llmInference!.generateResponse(inputText: inputText)
    }
    
    func generateResponseAsync(inputText: String, progress: @escaping (String) -> Void, completion: @escaping (String) -> Void) async throws {
        try llmInference!.generateResponseAsync(inputText: inputText) { partialResponse, error in
            // progress
            if let e = error {
                print("\(self.errorTag) \(e)")
                completion(e.localizedDescription)
                return
            }
            if let partial = partialResponse {
                progress(partial)
            }
        } completion: {
            completion("")
        }
    }
    ...    
}

// 3. iOS 再把代理好的（重点是初始化）类传回给 Kotlin
// iosApp/iosApp/iosApp.swift
class AppDelegate: UIResponder, UIApplicationDelegate {
    ...
    func application(）{
        ...
        let delegate = try LLMOperatorSwiftImpl()
        MainKt.onStartup(llmInferenceDelegate: delegate)        
    }
}

// 4. 最初 iOS 在 KMP 上的实现细节直接代理给该对象（通过构造器注入）
class LLMOperatorIOSImpl(
   private val delegate: LLMOperatorSwift) : LLMOperator {   
   ...
}
```

细心的朋友可能已经发现，两端的 Impl 实例需要不同的构造器参数，这个问题一般使用 KMP 的 `expect` 与 `actual` 关键字解决。下面的代码中：

1. 利用了 expect class 不需要构造器参数声明的特点加了层封装（类似接口）。
2. 利用了 Koin 实现各自平台所需参数的注入，再统一把创建的接口实例注入到 Common 层所需的地方。

``` kotlin
// Common
expect class LLMOperatorFactory {
    fun create(): LLMOperator
}
val sharedModule = module {
   // 从不同的 LLMOperatorFactory 创建出 Common 层所需的 LLMOperator
	single<LLMOperator> { get<LLMOperatorFactory>().create() }
}

// Android
actual class LLMOperatorFactory(private val context: Context){
    actual fun create(): LLMOperator = LLMInferenceAndroidImpl(context)
}
val androidModule = module {
    // Android 注入 App 的 Context
    single { LLMOperatorFactory(androidContext()) }
}

// iOS
actual class LLMOperatorFactory(private val llmInferenceDelegate: LLMOperatorSwift) {
    actual fun create(): LLMOperator = LLMOperatorIOSImpl(llmInferenceDelegate)
}

module {
    // iOS 注入 onStartup 函数传入的 delegate
    single { LLMOperatorFactory(llmInferenceDelegate) }
}
```

小结：我们通过一个小小的案例，领略到了 **Kotlin** 和 **Swift** 的**深度交互**。还借助 expect / actual 关键字与依赖注入，让整体方案**更流畅和自动化**，达到了在 KMP 的 Common 模块调用 Android 和 iOS Native SDK 的目标。

### 移植 UI 和 ViewModel

原项目里的 `InferenceMode` 已经被上一节的 `LLMOperator` 所取代，因此我们拷贝除 Activity 的剩下 5 个类：

![](https://2bab-images.lastmayday.com/202408-on-device-model-copy-structure.png?imageslim)

下面我们修改几处代码使 Jetpack Compose 的代码可以方便的迁移到 Compose Multiplatform。

首先是外围的 `ViewModel`，KMP 版本我在这里使用了 [Voyage](https://github.com/adrielcafe/voyager)，因此替换为 `ScreenModel`。不过官方 ViewModel 的方案也在实验中了，请参考这个[文档](https://www.jetbrains.com/help/kotlin-multiplatform-dev/compose-viewmodel.html)。

```
// Android 版本
class ChatViewModel(
    private val inferenceModel: InferenceModel
) : ViewModel() {...}

// KMP 版本，转换 ViewModel 为 ScreenModel，并修改传入对象
class ChatViewModel(
    private val llmOperator: LLMOperator
) : ScreenModel {...}

```

相应的 ViewModel 初始化方式也更改成 ScreenModel 的方法：

``` kotlin
// Android 版本
@Composable
internal fun ChatRoute(
    chatViewModel: ChatViewModel = viewModel(
        factory = ChatViewModel.getFactory(LocalContext.current.applicationContext)
    )
) {
    ...
    ChatScreen(...) {...}
}

// KMP 版本，改成外部初始化后传入
@Composable
internal fun ChatRoute(
    chatViewModel: ChatViewModel
) {

// 此处采用了默认参数注入的方案，便于解耦。
// koinInject() 是 Koin 官方提供的针对 Compose 
// 的 @Composable 函数注入的一个方法。
@Composable
fun AiScreen(llmOperator:LLMOperator = koinInject()) {
    // 使用 ScreenModel 的 remember 方法
    val chatViewModel = rememberScreenModel { ChatViewModel(llmOperator) }
    ...
    Column {
        ...
        Box(...) {
            if (showLoading) {
                ...
            } else {
                ChatRoute(chatViewModel)
            }
        }
    }
}
```

对应的 ViewModel 内部的 LLM 功能调用接口也要进行替换：

``` kotlin
// Android 版本
inferenceModel.generateResponseAsync(fullPrompt)
inferenceModel.partialResults
    .collectIndexed { index, (partialResult, done) ->
        ...
    }

// KMP 版本，把 Flow 的返回前置了，兼容了两个平台的 SDK 设计
llmOperator.generateResponseAsync(fullPrompt)
    .collectIndexed { index, (partialResult, done) ->
        ...
    }
```

然后是 Compose Multiplatform 特定的资源加载方式，把 `R` 文件替换为 `Res`：

``` kotlin
// Android 版本
Text(stringResource(R.string.chat_label))

// KMP 版本，该引用是使用插件从 xml 映射而来
// (commonMain/composeResources/values/strings.xml)
import mediapiper.app.generated.resources.chat_label
...
Text(stringResource(Res.string.chat_label))
```

至此我们已经完成了 `ChatScreen` `ChatViewModel` 的主页面功能迁移。

最后，对于 `LoadingScreen` 我们如法炮制传入 `LLMOperator` 进行初始化（替换原有 `InferenceModel`）； 而 `ChatMessage` 只修改了 UUID 调用的一行 API；`ChatUiState` 则完全不用动。故剩下的就只有整体修改下 Log 库的引用等小细节。

小结：倘若略去 Log、R 文件的引用替换以及 import 替换等，**核心的修改其实仅十几行**，便能把**整个 UI 部分也跑起来了**。


## 简单测试

那 Gemma 2B 的性能如何，我们看几个简单的例子。此处主要使用两个基础版本的模型进行测试，模型的定义在 `me.xx2bab.mediapiper.llm.LLMOperator`（模型在两端部署请参考项目 README）。

- `gemma-2b-it-gpu-int4` 
- `gemma-2b-it-cpu-int4`

首先我们测试一个简单的逻辑：“芦笋是不是一种动物”？可以看到下图的 cpu 版本答案比两个 GPU（iOS 和 Android）更合理。而下一个测试是翻译答案为中文，则是三次尝试都不太行。

![](https://2bab-images.lastmayday.com/202408-on-device-model-test-1.jpg?imageslim)


接着我们升级了测试问题，让它执行区分动植物的单词分类：不管是 GPU 或者 CPU 的版本都不错。

![](https://2bab-images.lastmayday.com/202408-on-device-model-test-2.jpg?imageslim)


再次升级上个问题，让它用 JSON 的方式输出答案，就出现明显的问题：

1. 图1没有输出完整的代码片段，缺少了结尾的三个点 ```。
2. 图二分类错误，把山竹放到动物，植物出现了两次向日葵。
3. 图三同二的错误，但这三次都没有纯输出一个 JSON，实际上还是不够严格执行作为 JSON Responder 的角色。

![](https://2bab-images.lastmayday.com/202408-on-device-model-test-3.jpg?imageslim)


最后，这其实不是极限，如果我们使用 cpu-int8 的版本，则可以高准确率地解答上面问题。以及，如果把本 Demo 的 iOS 入口代码发送给它分析，也能答的不错。

![](https://2bab-images.lastmayday.com/202408-on-device-model-test-4.jpg?imageslim)

Gemma 1 的 2B 版本测试至此，我们发觉其推理效果还有不少进步空间，胜在回复速度不错。而事实上 Gemma 2 的 2B 版本前不久已推出，并且据官方测试其综合水平已超过 GPT 3.5。这意味着在一台小小的手机里，本地的推理已经可以达到一年半前的主流模型效果。但其还未适配到 TFLite（Mediapipe 基于此），之前的新闻稿表示将于近期放出（在 Roadmap 上但无确切日期），大家可以追踪下列 issues 获得最新消息：

- https://github.com/google-ai-edge/mediapipe/issues/5570
- https://github.com/google-ai-edge/mediapipe/issues/5594


## 总结

实现这个本地聊天 Demo 的迁移和测试，给了我们些一手的经验：

- LLM 的 On-Device Model 发展非常迅速，而借助 Google 的一系列基础设施可以让第三方 Mobile App 开发者也迅速地集成相关的功能，并跨越 Android 与 iOS 双平台。
- 观望目前情况综合判断，LLM 的 On-Device Model 有望在今年达到初步可用状态，推理速度已经不错，准确度还有待进一步测试（例如 Gemma 2 的 2B 版本 + Mediapipe）。
- 遵循 Android 团队目前的策略 “Kotlin First” 并大胆使用 Compose，是颇具前景的——在基础设施完备的情况下，一个聊天的小模块仅寥寥数行修改即可迁移到 iOS。

