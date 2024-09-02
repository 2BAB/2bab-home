---
layout: post
date: 2024-09-01
title: "Adapting the MediaPipe LLM Demo for Kotlin Multiplatform"
tags: [KMP, android, gemma, enpost]
---

By reading this post, you'll learn about:

1. **Porting the MediaPipe "LLM Inference" Android demo to Kotlin Multiplatform (KMP) to support iOS.** Project repository: https://github.com/2BAB/mediapiper
2. **Two common ways of calling iOS SDKs in KMP:**
    1. **Directly invoking third-party libraries added via Cocoapods in Kotlin.**
    2. **Calling third-party libraries from the iOS project in Kotlin.**
3. **Tips for dependency injection in KMP across platforms (based on Koin).**
4. **A brief background on On-Device Models and the Gemma 1's 2B LLM model.**

![](https://2bab-images.lastmayday.com/202408-on-device-model-screenshot.jpg?imageslim)

## On-Device Model

Large Language Models (LLMs) have been a hot topic for quite some time, and this year, the trend has reached mobile devices. Companies like Google have deeply integrated on-device model functionalities into their latest smartphones and operating systems. Google's current public strategy regarding On-Device Models involves two main types of LLMs:

1. **Gemini Nano:** Not open source, limited support for specific devices (some are accelerated by specific chips like Tensor G4), and demonstrates extremely strong performance. It's currently available on desktop platforms (Chrome) and some Android phones (Pixel 8/9 and Samsung S23/24, etc.). It will be available to more developers later  for use and testing.
2. **Gemma:** Open source and supports all devices that meet the minimum requirements, with impressive performance as well. It uses the similar technology as Nano for training with primarily-English data from web documents, mathematics, and code. It can be experienced on multiple platforms (Android/iOS/Desktop). The MediaPipe adaptation for Gemma2 will also be available soon according to the announcement.

Since most developers do not yet have access to Gemini Nano, our focus today is on the 2B version of Gemma 1. To use Gemma directly on mobile platforms, Google has provided an out-of-the-box tool: MediaPipe. MediaPipe is a cross-platform framework that packages a series of pre-built on-device machine learning models and tools, supporting tasks like real-time gesture recognition, face detection, and more. It can also be used in applications like image generation and chatbots. For those interested, you can try the web version [demo](https://mediapipe-studio.webapps.google.com/) and explore the relevant [documentation](https://ai.google.dev/edge/mediapipe/solutions/guide).

![](https://2bab-images.lastmayday.com/on-device-model-mediapipe-intro.jpg?imageslim)

Among its features, the LLM Inference API (first row in the table above) is a component for running large language model inferences, supporting models like Gemma 2B/7B, Phi-2, Falcon-RW-1B, StableLM-3B, and more. Pre-converted models for Gemma (based on TensorFlow Lite) can be downloaded from Kaggle [here](https://www.kaggle.com/models/google/gemma/tfLite/gemma-1.1-2b-it-gpu-int4) and loaded into MediaPipe later.

![](https://2bab-images.lastmayday.com/202408-on-device-model-gemma-download.png?imageslim)

## LLM Inference Android Sample

The official [LLM Inference Demo](https://github.com/google-ai-edge/mediapipe-samples/tree/main/examples/llm_inference/android) from MediaPipe includes support for Android, iOS, and Web platforms.

![](https://2bab-images.lastmayday.com/202408-on-device-demo-android-sample.png?imageslim)

Opening the Android repository reveals several characteristics:

- **Pure Kotlin** implementation.
- The UI is implemented entirely with **Jetpack Compose**.
- The LLM Task SDK it depends on is highly encapsulated, exposing only three methods.

Now, let's check out the iOS version:

- The UI is implemented with SwiftUI, performing the same tasks as Compose but with some simplified elements (e.g., no top bar or send button).
- The LLM Task SDK it relies on is also highly encapsulated, exposing the same three methods.

This led to an interesting idea: **The Android version has a foundation that allows it to be ported to iOS. Porting would make the code on both platforms highly consistent,  reducing maintenance costs, with the core implementation only requiring a bridge to the LLM Inference SDK on iOS.**

## Kotlin Multiplatform

The technology used for the porting project is called Kotlin Multiplatform (KMP), developed by the Kotlin team to support cross-platform development. KMP allows developers to use the same codebase to build applications for Android, iOS, Web, and other platforms. By sharing business logic code, KMP can significantly reduce development time and maintenance costs while preserving native performance and experience for each platform. At this year’s I/O conference, Google also announced first-class support for KMP, migrating some Android libraries and tools to the multiplatform, enabling KMP developers to use it conveniently on iOS and other platforms.

![](https://2bab-images.lastmayday.com/202408-on-device-model-kmp-1.jpg?imageslim)
![](https://2bab-images.lastmayday.com/202408-on-device-model-kmp-2.jpg?imageslim)

Although MediaPipe supports multiple platforms, this time we mainly focus on Android and iOS.


## Porting Process

### Initialization

Start by creating a basic KMP project using IntelliJ IDEA or Android Studio. You can use the KMP Wizard or templates from third-party KMP apps. If you're unfamiliar with KMP, you'll find its structure is quite similar to an Android project, except this time, we place the iOS container project in the root directory and configure iOS dependencies in the app module's `build.gradle.kts` with the KMP Gradle Plugin.

![](https://2bab-images.lastmayday.com/202408-on-device-model-proj-3.jpg?imageslim)

### Wrapping and Calling LLM Inference

In `commonMain`, we abstract a simple interface based on the characteristics of the MediaPipe LLM Task SDK, written in Kotlin to cater to both Android and iOS. This interface replaces the `InferenceModel.kt` class in the original repository.

```kotlin
// app/src/commonMain/.../llm/LLMOperator
interface LLMOperator {

    /**
     * To load the model into the current context.
     * @return 1. null if successful, 2. an error message if failed.
     */
    suspend fun initModel(): String?

    /**
     * To calculate the token size of a string.
     */
    fun sizeInTokens(text: String): Int

    /**
     * To generate response for a given inputText in a synchronous way.
     */
    suspend fun generateResponse(inputText: String): String

    /**
     * To generate response for a given inputText in an asynchronous way.
     * @return A flow with partial response in String and completion flag in Boolean.
     */
    suspend fun generateResponseAsync(inputText: String): Flow<Pair<String, Boolean>>

}
```

On Android, since the LLM Task SDK was originally implemented in Kotlin, aside from initializing the model file, most of the functionality is essentially a proxy for the original SDK.

```kotlin
class LLMInferenceAndroidImpl(private val ctx: Context): LLMOperator {

    private lateinit var llmInference: LlmInference
    private val initialized = AtomicBoolean(false)
    private val partialResultsFlow = MutableSharedFlow<Pair<String, Boolean>>(...)

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

For iOS, we first attempt the direct invocation of libraries added via Cocoapods. In the app module, include the Cocoapods plugin and add the MediaPipe LLM Task library:

```kotlin
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

Note the addition of the `-fmodules` compiler option in the above configuration to generate Kotlin references correctly ([reference link](https://kotlinlang.org/docs/native-cocoapods-libraries.html#support-for-objective-c-headers-with-import-directives)).

> Some Objective-C libraries, specifically those that serve as wrappers for Swift libraries, have @import directives in their headers. By default, cinterop doesn't provide support for these directives. To enable support for @import directives, specify the -fmodules option in the configuration block of the pod() function.

Afterward, in `iosMain`, you can directly import the relevant library code and replicate the Android proxy approach:

```kotlin
// Note these imports start with cocoapods
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

However, we weren't as lucky this time. An NPE was thrown immediately after `MPPLLMInference` finished initializing. The likely issue is that since Kotlin's current interop target is Objective-C, the `MPPLLMInference` constructor has an extra error parameter compared to the Swift version, to which we passed `null`.

```kotlin
constructor(
  options: cocoapods.MediaPipeTasksGenAI.MPPLLMInferenceOptions, 
  error: CPointer<ObjCObjectVar<platform.Foundation.NSError?>>?)
```

Various attempts with different pointer inputs did not solve the problem:

```kotlin
// One of the attempts
memScoped {
    val pp: CPointerVar<ObjCObjectVar<NSError?>> = allocPointerTo()
    val inference = MPPLLMInference(options, pp.value)
    Napier.i(pp.value.toString())
}
```

Thus, we had to adopt a different approach: calling the third-party library from the iOS project.

```kotlin
// 1. Declare an interface similar to LLMOperator for easier iOS SDK adaptation.
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

// 2. Implement this interface in the iOS project
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

// 3. iOS then passes back the delegated (initialization-focused) object to Kotlin
// iosApp/iosApp/iosApp.swift
class AppDelegate: UIResponder, UIApplicationDelegate {
    ...
    func application(）{
        ...
        let delegate = try LLMOperatorSwiftImpl()
        MainKt.onStartup(llmInferenceDelegate: delegate)        
    }
}

// 4. The initial implementation object for iOS in KMP 
//  are directly delegated to it (injected via constructor)
class LLMOperatorIOSImpl(
   private val delegate: LLMOperatorSwift) : LLMOperator {   
   ...
}
```

You might notice that the Impl instances on both platforms require different constructor parameters. This issue is generally resolved using KMP's `expect` and `actual` keywords. In the following code:

1. We take advantage of the fact that the `expect` class does not require constructor parameters, adding a layer of encapsulation (similar to an interface).
2. We use [Koin](https://insert-koin.io/) to inject the necessary parameters for each platform, then uniformly inject the created interface instance into the Common layer as needed.

```kotlin
// Common
expect class LLMOperatorFactory {
    fun create(): LLMOperator
}
val sharedModule = module {
   // Create the LLMOperator required by the Common layer from different LLMOperatorFactory implementations
	single<LLMOperator> { get<LLMOperatorFactory>().create() }
}

// Android
actual class LLMOperatorFactory(private val context: Context){
    actual fun create(): LLMOperator = LLMInferenceAndroidImpl(context)
}
val androidModule = module {
    // Android injects the App's Context
    single { LLMOperatorFactory(androidContext()) }
}

// iOS
actual class LLMOperatorFactory(private val llmInferenceDelegate: LLMOperatorSwift) {
    actual fun create(): LLMOperator = LLMOperatorIOSImpl(llmInferenceDelegate)
}

module {
    // iOS injects the delegate passed in the onStartup function
    single { LLMOperatorFactory(llmInferenceDelegate) }
}
```

In summary, this case study gave us a taste of **deep interaction between Kotlin and Swift**. By leveraging the `expect` and `actual` keywords along with Koin's dependency injection, we made the overall solution **smoother and more automated**, achieving the goal of calling Android and iOS native SDKs from the Common module in KMP.

### Porting UI and ViewModel

The `InferenceMode` in the original project has been replaced by the `LLMOperator` from the previous section, so we copy the remaining five classes excluding Activity:

![](https://2bab-images.lastmayday.com/202408-on-device-model-copy-structure.png?imageslim)

Next, we make a few modifications to allow Jetpack Compose code to migrate easily to Compose Multiplatform.

First, the `ViewModel`. In the KMP version, I used [Voyage](https://github.com/adrielcafe/voyager), replacing it with `ScreenModel`. While an official ViewModel solution is also in the works, which you can refer to in this [document](https://www.jetbrains.com/help/kotlin-multiplatform-dev/compose-viewmodel.html).

```kotlin
// Android version
class ChatViewModel(
    private val inferenceModel: InferenceModel
) : ViewModel() {...}

// KMP version, converts ViewModel to ScreenModel and modifies the input object
class ChatViewModel(
    private val llmOperator: LLMOperator
) : ScreenModel {...}
```

Correspondingly, the ViewModel initialization method is also changed to the ScreenModel method:

```kotlin
// Android version
@Composable
internal fun ChatRoute(
    chatViewModel: ChatViewModel = viewModel(
        factory = ChatViewModel.getFactory(LocalContext.current.applicationContext)
    )
) {
    ...
    ChatScreen(...) {...}
}

// KMP version, initialized externally and passed in
@Composable
internal fun ChatRoute(
    chatViewModel: ChatViewModel
) {

// Here we use the default parameter injection solution for decoupling.
// koinInject() is a method provided by Koin for @Composable function injection in Compose.
@Composable
fun AiScreen(llmOperator:LLMOperator = koinInject()) {
    // Use the remember method from ScreenModel
    val

 chatViewModel = rememberScreenModel { ChatViewModel(llmOperator) }
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

The corresponding LLM functionality calls within the ViewModel also need to be replaced:

```kotlin
// Android version
inferenceModel.generateResponseAsync(fullPrompt)
inferenceModel.partialResults
    .collectIndexed { index, (partialResult, done) ->
        ...
    }

// KMP version, moves Flow's return to the front, compatible with SDK design on both platforms
llmOperator.generateResponseAsync(fullPrompt)
    .collectIndexed { index, (partialResult, done) ->
        ...
    }
```

Next, adapt resource loading methods specific to Compose Multiplatform, replacing `R` with `Res`:

```kotlin
// Android version
Text(stringResource(R.string.chat_label))

// KMP version, this reference is mapped from xml by the plugin
// (commonMain/composeResources/values/strings.xml)
import mediapiper.app.generated.resources.chat_label
...
Text(stringResource(Res.string.chat_label))
```

At this point, we have completed the main UI and functionality migration of `ChatScreen` and `ChatViewModel`.

Finally, there are a few minor modifications:

- For `LoadingScreen`, we replicate the approach of passing in `LLMOperator` for initialization (replacing the original `InferenceModel`).
- `ChatMessage` requires only a single line API change for UUID (which won't be needed after Kotlin 2.0.20).
- `ChatUiState` does not require any changes.
- The remaining minor tweaks include changing log library and other small details.

In summary, setting aside log and R file replacing, **the core changes less than 20 lines**, allowing the **entire UI to function as expected**.

## Simple Testing

So, how does the performance of Gemma 2B measure up? Let's look at some simple examples with Pixel 4a and iOS emulators. Here, we primarily test three versions of the model, defined in `me.xx2bab.mediapiper.llm.LLMOperator` (refer to the project README for deploying models on both platforms):

- `gemma-2b-it-gpu-int4` 
- `gemma-2b-it-cpu-int4`
- `gemma-2b-it-cpu-int8`

Key points to note:

- **it** indicates an Instruction Tuned variant, better suited for conversational use because they are fine-tuned to better understand instructions and generate more relevant responses.
- **int4/8** refers to model quantization, which converts floating-point numbers in the model to lower-precision integers, thereby reducing the model's size and computation, making it suitable for small local devices like phones. However, the model's precision and response accuracy might decrease.
- **cpu** and **gpu** refer to the target hardware platforms, allowing devices with weak or no GPUs to choose CPU execution. From the test results below, you'll find that CPU versions often outperform on current mobile devices, due to the small model size, simple computation (dialogue), and integer quantization favor CPU instruction execution.

First, we test a simple logic: "Is asparagus an animal?" As shown in the image below, the CPU version provides a more reasonable answer than both GPU versions (iOS and Android). The next test is translating the answer into Chinese, which doesn't perform well across all three attempts, but this is expected.

![](https://2bab-images.lastmayday.com/202408-on-device-model-test-1.jpg?imageslim)

Next, we elevate the complexity of the question to word classification between animals and plants: both GPU and CPU versions perform well.

![](https://2bab-images.lastmayday.com/202408-on-device-model-test-2.jpg?imageslim)

Raising the complexity further, asking it to output the answer in JSON format, leads to apparent issues:

1. The first image does not output a complete snippet, missing the closing three dots ```.
2. The second image shows a classification error, placing mangosteen under animals, and sunflowers appear twice under plants.
3. The third image mirrors the second error, and none of the three instances strictly outputs a JSON, failing to rigorously follow the role of a JSON Responder.

![](https://2bab-images.lastmayday.com/202408-on-device-model-test-3.jpg?imageslim)

Lastly, this isn't the limit. Using the cpu-int8 version can answer the above questions with higher accuracy. Moreover, if you send the entry code for this demo's iOS version for analysis, it performs quite well.

![](https://2bab-images.lastmayday.com/202408-on-device-model-test-4.jpg?imageslim)

Testing the Gemma 1's 2B version reveals that its inference capabilities still have room for improvement, but it excels in response speed. In fact, the 2B version of Gemma 2 was released recently, and according to official tests, its overall performance has surpassed GPT 3.5. This means that on a small mobile phone, local inference can now achieve the results of mainstream models from a year and a half ago. However, it has yet to be adapted to TFLite (on which MediaPipe is based).It's on the roadmap but without a specific date, you can track the following issues for the latest updates:

- https://github.com/google-ai-edge/mediapipe/issues/5570
- https://github.com/google-ai-edge/mediapipe/issues/5594

## Conclusion

Migrating this local chat demo and conducting tests provided us with some firsthand experience:

- The development of On-Device Models for LLMs is progressing rapidly. With the help of Google's infrastructure, third-party mobile app developers can quickly integrate related features across Android and iOS platforms.
- Considering the current situation, On-Device Models for LLMs are likely to reach a preliminary usable state this year. Inference speed is already good, but accuracy still requires further testing (e.g., Gemma 2's 2B version + MediaPipe).
- Adopting the "Kotlin First" strategy and boldly using Compose shows great promise—under a well-developed infrastructure, a small chat module of Android can be ported to iOS with just a handful of changes.