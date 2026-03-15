---
layout: post
date: 2026-03-15
title: "Some Personal Takes on Metro DI"
tags: [kotlin, android, kmp, metro, di, enpost]
---

Metro is a compile-time DI framework for Kotlin Multiplatform, created by Zac Sweers (formerly Android Infra at Slack). Cash App and Vinted are already using it in production. This post is aimed at developers who have some DI experience or are coming from other frameworks — not a comprehensive guide, just notes from my own exploration with some comparisons along the way.


## Core Concept: Binding

At its core, any DI framework maintains a binding table: **when someone asks for type A, give them instance B**. Metro is no different — all its annotations are essentially adding entries to this table.

```
RepoA        → RepoAImpl
RepoB        → RepoBImpl
HttpClient   → HttpClient(CIO) { ... }
Json         → Json { ignoreUnknownKeys = true }
```

Once you internalize this, the number of annotations starts to feel more manageable. Starts to.


## The Simplest Case: @Inject

Add `@Inject` to your own class, and Metro knows how to create it. Dependencies in the constructor are automatically resolved and injected:

```kotlin
@Inject
class ArticleRepositoryImpl(
    private val httpClient: HttpClient,
    private val json: Json,
) : ArticleRepository
```

One annotation covers both "I can be created" and "I need these dependencies." Compare this with Koin:

```kotlin
// Koin requires a separate registration
module {
    factory { ArticleRepositoryImpl(get(), get()) }
}
```

By default, `@Inject` creates a factory — a new instance every time. Add `@SingleIn` to make it a singleton:

```kotlin
@Inject
@SingleIn(AppScope::class)
class ArticleRepositoryImpl(...) : ArticleRepository
```

Unlike Koin's separate `single {}` and `factory {}` functions, the only difference here is whether `@SingleIn` is present. A clean design choice.


## Aggregation

This is arguably Metro's biggest improvement over Dagger.

With traditional Dagger, you manually wire Modules into Components and maintain a large module list. Koin is similar — you need `startKoin { modules(a, b, c, ...) }` somewhere to chain everything together, or use its KCP plugin (or roll your own tool — I made one called [Koncat](https://github.com/2BAB/Koncat)). Some argue that this list becomes unwieldy in large projects; I'd say that's mostly a symptom of poorly structured modules =.= leading to oversized individual modules.

Metro's compiler-driven auto-collection looks like this:

```kotlin
// In the feature-article-domain module
@Inject
@SingleIn(AppScope::class)
@ContributesBinding(AppScope::class)
class ArticleRepositoryImpl(
    private val httpClient: HttpClient,
) : ArticleRepository
```

`@ContributesBinding(AppScope::class)` means: contribute the binding `ArticleRepositoryImpl → ArticleRepository` to the `AppScope` graph. When the compiler processes the module where the graph is defined, it automatically scans all dependent modules for classes annotated with `@ContributesTo` or `@ContributesBinding` and wires them in.

**Declare and register in one place, no manual aggregation needed.** This is a significant productivity gain for multi-module projects — you annotate the class and you're done, no need to update a registration file elsewhere. It's also more AI-coding friendly: an AI only needs to modify one file when adding a class, rather than remembering to register it in a separate module file.


## Graph and Scope

Metro's scope doesn't bind to any lifecycle by itself — it's just a tag. One scope corresponds to one graph (DI container), roughly equivalent to a `Koin` instance.

```kotlin
// Declare a scope
@Scope
annotation class AppScope

// Declare a graph
@DependencyGraph(AppScope::class)
interface AppGraph
```

The lifecycle is entirely determined by when you create and destroy the graph instance: put it in `Application` and it lives with the app process; put it in a login session holder and it lives with the user session. Unlike Hilt, Metro doesn't provide predefined scopes like `@ActivityScoped` or `@ViewModelScoped` that automatically bind to Android components — more flexibility, but more responsibility.

Graphs can have parent-child relationships via `GraphExtension`:

```kotlin
@DependencyGraph(UserScope::class)
interface UserGraph : GraphExtension<AppGraph>
```

Child graphs can access parent bindings, but not vice versa. This is how you implement nested scopes like App → User → Feature.


## Cross-Module Dependencies: Why Export Modules Exist

Say feature-a needs data from feature-b, and vice versa. Direct dependencies would create a cycle, so you extract the interfaces:

```
feature-a-export/   ← interfaces only: RepoA
feature-a-domain/   ← implementation: RepoAImpl, depends on feature-b-export
feature-b-export/   ← interfaces only: RepoB
feature-b-domain/   ← implementation: RepoBImpl, depends on feature-a-export
```

Feature modules know nothing about each other's implementations at compile time. In a KMP setup, the assembly happens when the `shared` module compiles — since `shared` depends on all feature modules, Metro's compiler plugin can see the complete dependency graph there and wire all contributed bindings into the `AppScope` graph. For a standard Android app, this would typically be the app module.


## Trade-offs Worth Noting

### BindingContainer and @Provides

For your own classes, `@Inject` + `@ContributesBinding` is concise. But for third-party classes where you can't add annotations, you need `@Provides`:

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

You need to create an interface, annotate it with `@BindingContainer` and `@ContributesTo`, then write `@Provides` functions inside.

Compare with Koin:

```kotlin
module {
    single { HttpClient(CIO) { install(ContentNegotiation) { json(json()) } } }
    single { Json { ignoreUnknownKeys = true } }
}
```

Koin feels more intuitive for this particular scenario. The name `@BindingContainer` is also less immediately obvious than Dagger's `@Module` — though `@Module` isn't exactly self-explanatory either. This is boilerplate you'll need to memorize.

### AssistedInject

When a ViewModel needs runtime parameters (e.g., an ID), you use assisted injection:

```kotlin
@AssistedInject
class DetailViewModel(
    @Assisted val id: String,           // provided at call site
    private val repo: DetailRepository, // provided by DI
) : ViewModel() {

    @AssistedFactory
    interface Factory {
        fun create(id: String): DetailViewModel
    }
}
```

Compare with Koin:

```kotlin
class DetailViewModel(
    val id: String,
    private val repo: DetailRepository,
) : ViewModel()

// Registration
module {
    viewModel { params -> DetailViewModel(params.get(), get()) }
}

// Usage
val vm = koinViewModel<DetailViewModel> { parametersOf("some-id") }
```

Metro requires `@AssistedInject`, `@Assisted`, `@AssistedFactory`, plus a Factory interface. The mental model shifts from "how do I create a ViewModel with parameters" to "I need to declare a factory interface." On the other hand, Metro's approach is type-safe — `create(id: String)` uses named parameters, while Koin's `parametersOf(...)` relies on positional arguments where ordering mistakes won't be caught at compile time.

In the age of AI-assisted coding, the extra boilerplate is less of a concern since AI handles it well — and type safety arguably matters more when AI is generating the code too.

### @ViewModelKey Redundancy

Registering a ViewModel into the DI map requires:

```kotlin
@Inject
@ViewModelKey(ArticleListViewModel::class)
@ContributesIntoMap(AppScope::class)
class ArticleListViewModel(...) : ViewModel()
```

`@ViewModelKey(ArticleListViewModel::class)` placed on `class ArticleListViewModel` — the key is the class itself, yet you must spell it out explicitly. I filed an [issue](https://github.com/ZacSweers/metro/issues/1994) suggesting default inference, but it was declined — the rationale being that special-casing ViewModel keys would set a precedent for other map keys. A reasonable stance, though it does mean repeating this line for every ViewModel.


## Overall Impressions

Aggregation combined with `@Inject` + `@ContributesBinding` is where Metro shines — multi-module projects benefit from automatic registration, and missing bindings are caught at compile time.

The `@Provides` + `@BindingContainer` and `@AssistedInject` patterns carry more ceremony. The annotation count inherits the complexity of the Dagger lineage, which can feel like a steep learning curve for developers less familiar with that ecosystem. Zac Sweers comes from the Dagger/Anvil world, so this is a natural evolution for him — for others, it's a new set of concepts to absorb.

Metro is currently at 0.11.x, not yet 1.0, but development has been quite active.
