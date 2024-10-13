---
layout: post
date: 2024-10-04
title: "Adapting MediaPipe Demos for Kotlin Multiplatform: Object Detection"
tags: [KMP, android, mediapipe, mediapiper, objectdetection, enpost]
---

Following our previous exploration of porting Mediapipe's LLM Inference, this article delves into migrating the Object Detection Demo. By reading this, you'll learn:

1. **How to port Mediapipe's official Object Detection Android Demo to Kotlin Multiplatform (KMP), enabling it to run on iOS.** Project link: [https://github.com/2BAB/MediaPiper/tree/object-detection](https://github.com/2BAB/MediaPiper/tree/object-detection)
2. **Integrating Compose Multiplatform with iOS native controls (Camera Preview), including handling permission requests.**
3. **Tips for injecting iOS controls using dependency injection in KMP (based on Koin).**
4. **An introduction to the two Object Detection algorithms used in the Demo.**

![](https://2bab-images.lastmayday.com/20241004-object-detection-camera-ppt.png?imageslim)

## Object Detection Android Sample

First, let's examine the original Object Detection project. You'll notice that the Android portion includes both an `android.view.View` implementation and a Jetpack Compose version. Following our previous approach, we'll directly port the Jetpack Compose version to KMP.

Upon closer inspection, you'll find that this app is more complex. In the LLM Inference example, the SDK only provided text inference interfaces, which we could easily wrap in Kotlin to abstract platform-specific details (though we ultimately used an alternative due to some `cinterop` support issues). The UI was entirely reusable. However, Object Detection is based on real-time image processing and includes three modes in the demo: real-time camera detection, local video detection, and local image detection. **Camera preview** typically **relies heavily on platform-specific implementations**, and players rarely use custom rendering (i.e., they use native platform solutions).

![](https://2bab-images.lastmayday.com/Screenshot%202024-10-05%20at%201.25.14%E2%80%AFPM.png?imageslim)

In summary, from the outset, we need to **reserve parts that are challenging to implement with Compose Multiplatform (CMP)** (such as the `CameraView` shown above) and **abstract them into separate `expect` Composable functions for each platform to implement individually**. To simplify the learning process and reduce the demo's scale, we'll focus solely on implementing the `CameraView` component, leaving the Gallery (Video + Image) sections for you to explore. In essence, once you grasp how to embed a Camera Preview, you can implement the other two parts similarly, including Compose and UIKit interactions and iOS permission requests.

![](https://2bab-images.lastmayday.com/20241004-object-detection-options-layers3.png?imageslim)

By cross-referencing the iOS version of the demo, we've broken down the UI layers related to `CameraView` into four components, as illustrated above:

- The Camera Preview layer must be implemented separately on each platform.
- The `ResultOverlay`, which draws bounding boxes and other results, could be implemented in the common layer. However, **due to complexities like matching the overlay with the Camera Preview (since the preview size can vary depending on the camera's aspect ratio) and coordinate transformations**, we'll delegate this component to platform-specific implementations in this demo.
- The `Scaffold` and `Inference Time Label` will be implemented in the common layer.

## Migration Process

### Porting the Main UI and Data Structures

Building on the foundation from the previous section, we'll add a new folder named `objectdetection` to the `Mediapiper` project. With our prior experience, we realize that much of the UI content isn't overly complex—except for the focal point of this section, the camera preview interface. Therefore, we can proceed by migrating all files except for `camera` and `gallery`:

![](https://2bab-images.lastmayday.com/202410121605950.png?imageslim)

The necessary modifications can be categorized into two areas:

1. **Data and Logic:**
   - Extract the `ObjectDetectionResult` declarations from original SDKs and create a common version as a data class. This allows both SDKs to convert their results into the common version, facilitating the display of inference time, unified logging, and even paving the way to potentially move `ResultOverlay` to the common layer in the future.
   - Move utility classes and default value enumerations to the common layer with minimal changes—mainly replacing references to the inference result classes with the common version.

2. **UI Components:**
   - Make uniform changes similar to the previous section, such as replacing `R` references with `Res`, adopting the unified theme, and adjusting some import packages.
   - Notably, this demo doesn't use the CMP version of Navigation, so switching between the Home and Option pages is handled with a simple `if...else...` at the top level.

At this point, we can run an application that doesn't include camera functionality. The images below demonstrate how these CMP codes run on iOS across two pages.

![](https://2bab-images.lastmayday.com/20241004-object-detection-no-cameras.jpg?imageslim)

### Integrating CameraView Functionality

As previously analyzed, we need to extract the `CameraView` component for native implementation. Therefore, in the common `CameraView`, we'll use two `expect` Composable functions: `CameraPermissionControl` and `CameraPreview`:

```kotlin
@Composable
fun CameraView(
    threshold: Float,
    maxResults: Int,
    delegate: Int,
    mlModel: Int,
    setInferenceTime: (newInferenceTime: Int) -> Unit,
) {
    CameraPermissionControl {
        CameraPreview(
            threshold,
            maxResults,
            delegate,
            mlModel,
            setInferenceTime,
            onDetectionResultUpdate = { detectionResults ->
                // ...
            }
        )
    }
}

@Composable
expect fun CameraPermissionControl(PermissionGrantedContent: @Composable @UiComposable () -> Unit)

@Composable
expect fun CameraPreview(
    threshold: Float,
    maxResults: Int,
    delegate: Int,
    mlModel: Int,
    setInferenceTime: (newInferenceTime: Int) -> Unit,
    onDetectionResultUpdate: (result: ObjectDetectionResult) -> Unit
)
```

#### Android Implementation

The Android side is straightforward—we can directly copy the original Jetpack Compose code:

```kotlin
// Android implementation
@OptIn(ExperimentalPermissionsApi::class)
@Composable
actual fun CameraPermissionControl(
    PermissionGrantedContent: @Composable @UiComposable () -> Unit
) {
    val storagePermissionState: PermissionState =
        rememberPermissionState(Manifest.permission.CAMERA)
    LaunchedEffect(key1 = Unit) {
        if (!storagePermissionState.hasPermission) {
            storagePermissionState.launchPermissionRequest()
        }
    }

    if (!storagePermissionState.hasPermission) {
        Text(text = "No Storage Permission!")
    } else {
        PermissionGrantedContent()
    }
}

@Composable
actual fun CameraPreview(...) {
    // Define properties

    DisposableEffect(Unit) {
        onDispose {
            active = false
            cameraProviderFuture.get().unbindAll()
        }
    }

    // Describe the UI of this camera view
    BoxWithConstraints {
        val cameraPreviewSize = getFittedBoxSize(
            containerSize = Size(
                width = this.maxWidth.value,
                height = this.maxHeight.value,
            ),
            boxSize = Size(
                width = frameWidth.toFloat(),
                height = frameHeight.toFloat()
            )
        )

        Box(
            Modifier
                .width(cameraPreviewSize.width.dp)
                .height(cameraPreviewSize.height.dp)
        ) {
            // Use AndroidView to integrate CameraX, as there's no prebuilt composable in Jetpack Compose
            AndroidView(
                factory = { ctx ->
                    val previewView = PreviewView(ctx)
                    val executor = ContextCompat.getMainExecutor(ctx)
                    cameraProviderFuture.addListener({
                        val cameraProvider = cameraProviderFuture.get()
                        val preview = Preview.Builder().build().also {
                            it.setSurfaceProvider(previewView.surfaceProvider)
                        }

                        val cameraSelector = CameraSelector.Builder()
                            .requireLensFacing(CameraSelector.LENS_FACING_BACK)
                            .build()

                        // Instantiate an image analyzer for frame transformations before object detection
                        val imageAnalyzer = ImageAnalysis.Builder()
                            .setTargetAspectRatio(AspectRatio.RATIO_4_3)
                            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                            .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
                            .build()

                        // Execute object detection in a new thread
                        val backgroundExecutor = Executors.newSingleThreadExecutor()

                        backgroundExecutor.execute {
                            // Use ObjectDetectorHelper to abstract Mediapipe specifics
                            val objectDetectorHelper = AndroidObjectDetector(
                                context = ctx,
                                threshold = threshold,
                                currentDelegate = delegate,
                                currentModel = mlModel,
                                maxResults = maxResults,
                                objectDetectorListener = ObjectDetectorListener(
                                    onErrorCallback = { _, _ -> },
                                    onResultsCallback = {
                                        // Set frame dimensions upon receiving results
                                        frameHeight = it.inputImageHeight
                                        frameWidth = it.inputImageWidth

                                        // Update results and inference time if the view is active
                                        if (active) {
                                            results = it.results.first()
                                            setInferenceTime(it.inferenceTime.toInt())
                                        }
                                    }
                                ),
                                runningMode = RunningMode.LIVE_STREAM
                            )

                            // Set the analyzer and start detecting objects from the live stream
                            imageAnalyzer.setAnalyzer(
                                backgroundExecutor,
                                objectDetectorHelper::detectLivestreamFrame
                            )
                        }

                        // Unbind any currently open camera and bind our own
                        cameraProvider.unbindAll()
                        cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            cameraSelector,
                            imageAnalyzer,
                            preview
                        )
                    }, executor)
                    // Return the preview view from the AndroidView factory
                    previewView
                },
                modifier = Modifier.fillMaxSize()
            )

            // Display the results overlay if there are current results
            results?.let {
                ResultsOverlay(
                    results = it,
                    frameWidth = frameWidth,
                    frameHeight = frameHeight
                )
            }
        }
    }
}
```

#### iOS Implementation

The iOS side requires a bit more effort. For camera permission control, we'll directly call iOS's `platform.AVFoundation` APIs within this Composable function, asynchronously request permissions, and display appropriate messages based on the result—loading, failure, or success, where we show the camera preview. You'll notice that our iOS implementation is quite comprehensive, covering all three scenarios.

```kotlin
import platform.AVFoundation.*
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

@Composable
actual fun CameraPermissionControl(PermissionGrantedContent: @Composable @UiComposable () -> Unit) {
    var hasCameraPermission by remember { mutableStateOf<Boolean?>(null) }

    LaunchedEffect(Unit) {
        hasCameraPermission = requestCameraAccess()
    }

    when (hasCameraPermission) {
        true -> {
            PermissionGrantedContent()
        }
        false -> {
            Text("Camera permission denied. Please grant access from settings.")
        }
        null -> {
            Text("Requesting camera permission...")
        }
    }
}

private suspend fun requestCameraAccess(): Boolean = suspendCoroutine { continuation ->
    val authorizationStatus = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo)

    when (authorizationStatus) {
        AVAuthorizationStatusNotDetermined -> {
            AVCaptureDevice.requestAccessForMediaType(AVMediaTypeVideo) { granted ->
                continuation.resume(granted)
            }
        }
        AVAuthorizationStatusRestricted, AVAuthorizationStatusDenied -> {
            continuation.resume(false)
        }
        AVAuthorizationStatusAuthorized -> {
            continuation.resume(true)
        }
        else -> {
            continuation.resume(false)
        }
    }
}
```

Now, let's tackle the core camera preview functionality. According to the [CMP documentation](https://www.jetbrains.com/help/kotlin-multiplatform-dev/compose-uikit-integration.html), we can embed a UIKit view within a Composable function using `UIKitView`:

```kotlin
// Example 1
UIKitView(
    factory = { MKMapView() },
    modifier = Modifier.size(300.dp),
)

// Example 2
@OptIn(ExperimentalForeignApi::class)
@Composable
fun UseUITextField(modifier: Modifier = Modifier) {
    var message by remember { mutableStateOf("Hello, World!") }
    UIKitView(
        factory = {
            val textField = object : UITextField(CGRectMake(0.0, 0.0, 0.0, 0.0)) {
                @ObjCAction
                fun editingChanged() {
                    message = text ?: ""
                }
            }
            textField.addTarget(
                target = textField,
                action = NSSelectorFromString(textField::editingChanged.name),
                forControlEvents = UIControlEventEditingChanged
            )
            textField
        },
        modifier = modifier.fillMaxWidth().height(30.dp),
        update = { textField ->
            textField.text = message
        }
    )
}
```

These examples applied some default iOS components, not custom ones. The corresponding reference headers are already converted to Kotlin by JetBrains, such as `platform.UIKit.UITextField`, which can be directly imported into the KMP project's iOS target. 

![](https://2bab-images.lastmayday.com/202410131137759.png?imageslim)

In our case, we want to reuse a custom `CameraPreview` view with recognition capabilities. However, the `app.framework` produced by KMP is a shared layer upon which the iOS native code depends. **Due to the dependency hierarchy, we can't directly call `CameraPreview` defined in the iOS app's source code**. There are generally two solutions:

1. Package the relevant code into a separate module, producing `cameraview.framework`, which the KMP's `app` can depend on.
2. When initializing `app.framework` in the iOS app, pass a lambda that initializes and returns a `UIView` to `app`.

We'll opt for the second solution, defining `IOSCameraPreviewCreator` as the protocol for interaction between the two sides.

```kotlin
// Definition
typealias IOSCameraPreviewCreator = (
    threshold: Float,
    maxResults: Int,
    delegate: Int,
    mlModel: Int,
    setInferenceTime: (newInferenceTime: Int) -> Unit,
    callback: IOSCameraPreviewCallback
) -> UIView

typealias IOSCameraPreviewCallback = (result: ObjectDetectionResult) -> Unit

// Inject the implementation from the iOS side during startup and add it to Koin's definitions
fun onStartup(iosCameraPreviewCreator: IOSCameraPreviewCreator) {
    Startup.run { koinApp ->
        koinApp.apply {
            modules(module {
                single { LLMOperatorFactory() }
                single<IOSCameraPreviewCreator> { iosCameraPreviewCreator }
            })
        }
    }
}

// In the implementation of CameraPreview, 
// we inject and invoke this function to obtain a UIView instance
import androidx.compose.ui.viewinterop.UIKitView
import platform.UIKit.UIView

@Composable
actual fun CameraPreview(
    threshold: Float,
    maxResults: Int,
    delegate: Int,
    mlModel: Int,
    setInferenceTime: (newInferenceTime: Int) -> Unit,
    onDetectionResultUpdate: (result: ObjectDetectionResult) -> Unit,
) {
    val iOSCameraPreviewCreator = koinInject<IOSCameraPreviewCreator>()
    // Similar to how Android integrates the native Camera View
    UIKitView(
        factory = {
            val iosCameraPreview: UIView = iOSCameraPreviewCreator(
                threshold,
                maxResults,
                delegate,
                mlModel,
                setInferenceTime,
                onDetectionResultUpdate
            )
            iosCameraPreview
        },
        modifier = Modifier.fillMaxSize(),
        update = { _ -> }
    )
}
```

The above code leverages Koin for dependency injection, simplifying the interaction process. Now, let's follow the injection of startup parameters to check the iOS side.

```swift
MainKt.onStartup(iosCameraPreviewCreator: { threshold, maxResults, delegate, mlModel, onInferenceTimeUpdate, resultCallback in
    return IOSCameraView(
        frame: CGRectMake(0, 0, 0, 0),
        modelName: Int(truncating: mlModel) == 0 ? "EfficientDet-Lite0" : "EfficientDet-Lite2",
        maxResults: Int(truncating: maxResults),
        scoreThreshold: Float(truncating: threshold),
        onInferenceTimeUpdate: onInferenceTimeUpdate,
        resultCallback: resultCallback
    )
})
```

The `IOSCameraView` here is essentially the `CameraViewController` from the original iOS demo. We've modified some initialization and lifecycle content and simplified parameter change listeners to highlight the core migration aspects:

1. **Lifecycle Handling**: `ViewController` uses methods like `viewDidLoad`, while `UIView` uses `didMoveToWindow` to handle logic when the view is added or removed. `ViewController` initializes through its lifecycle, whereas `UIView` provides custom initializers to pass in models and detection parameters.

2. **Subview Setup**: `ViewController` uses `@IBOutlet` and Interface Builder, while `UIView` directly creates and adds subviews via a `setupView` method, manually setting constraints with AutoLayout and handling tap events.

3. **Callbacks and Delegates**: `ViewController` uses delegates, while `UIView` adds closure callbacks like `onInferenceTimeUpdate` and `resultCallback`. These are passed during initialization and set up for type conversion, facilitating callbacks to the KMP layer.

![](https://2bab-images.lastmayday.com/20241004-object-detection-controller-to-view.jpg?imageslim)

We also retain `OverlayView`, `CameraFeedService`, `ObjectDetectorService`, and parts of `DefaultConstants`, without modifying their code. Notably, `ObjectDetectorService` encapsulates the Object Detection SDK. If you examine its API calls, you'll find it's closely coupled with iOS's Camera APIs (like `CMSampleBuffer`), indicating the difficulty of abstracting it into the common layer.

![](https://2bab-images.lastmayday.com/202410131208100.png?imageslim)

With this, we can run the camera preview with Object Detection on iOS.

## Simple Testing

![](https://2bab-images.lastmayday.com/20241004-object-detection-overview-gif.gif?imageslim)

The above GIF showcases the performance of EfficientDet-Lite0 running in CPU mode on an iPhone 13 mini. In official tests using the Pixel 6's CPU/GPU, switching to GPU execution can slightly improve performance. It's evident that the real-time performance is sufficient for production environments, and the accuracy is acceptable.

![](https://2bab-images.lastmayday.com/202410131403617.png?imageslim)

The demo comes with two optional models:

- **EfficientDet-Lite0**: Uses 320x320 input, balancing latency and accuracy, suitable for lightweight applications. The demo includes its float32 version by default.
- **EfficientDet-Lite2**: Uses 448x448 input, offering higher accuracy at the cost of speed, suitable for scenarios demanding greater precision. The demo includes its float32 version by default.

Both models are trained on a dataset containing 1.5 million instances and 80 object labels.

## Summary

- Traditional ML models on mobile devices are relatively mature and can handle many specific scenarios. The two models discussed are only 13–25 MB in size. Compared to LLM models that are often over 1 GB, these models are much more practical for deployment.
- Embedding UIKit views within Compose Multiplatform allows us to address high-performance needs that require native APIs and hardware.
- We kept `ResultOverlay` in the common layer, and the iOS side set up result callbacks to the KMP layer. However, on iOS, we still used native views for implementation due to the cost of migration. In real-world scenarios, we can further consider:
  - If the business scenario is simple, such as rectangle recognition with a full-screen camera preview, we can easily reuse `ResultOverlay` at the Compose layer.
  - For complex business scenarios, like facial recognition with sticker selection and rendering during video chats, the high complexity of the business logic makes reusing the same `StickerOverlay` highly valuable. In this case, regardless of the camera preview size, the cost of adaptation becomes acceptable. Moreover, there's potential for optimization in calculations within `StickerOverlay`, such as using sampled calculations and interpolated animations.
- Complex dependency management scenarios, including UI view injection, can be  simplified using dependency injection frameworks like Koin.