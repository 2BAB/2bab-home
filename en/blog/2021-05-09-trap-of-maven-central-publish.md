---
layout: post
date: 2021-05-09
title: "Pitfalls of MavenCentral Publishing Integration"
tags: [Android, Gradle, post]
---

Due to [JCenter shutting down](https://jfrog.com/blog/into-the-sunset-bintray-jcenter-gocenter-and-chartcenter/), I recently migrated the publishing process of several active open-source projects to [MavenCentral](https://search.maven.org). The two reference articles below already explain the details of each step quite well:

- [Publishing your Kotlin Multiplatform library to Maven Central](https://dev.to/kotlin/how-to-build-and-publish-a-kotlin-multiplatform-library-going-public-4a8k)
- [Publishing Android libraries to MavenCentral in 2021](https://proandroiddev.com/publishing-android-libraries-to-mavencentral-in-2021-8ac9975c3e52)

However, I still encountered some pitfalls during this process, as well as some baffling operations, which prompted me to write this article to share.

## Don't Apply for a Single Artifact

When applying for an OSSRH Ticket, what we're actually applying for is a **Group ID**. The key parameter is the Group Id; the title doesn't even need to mention the specific Artifact.

![group-id](https://2bab-images.lastmayday.com/blog/20210509204352.png?imageslim)

Generally, the Group ID is the reversed domain name. You'll be asked to verify domain ownership, Github repository ownership, JCenter Group ownership, etc. Just follow the corresponding reply instructions. Once approved, all future new package publishing won't require another application. For example: if I apply for the `me.2bab` group, then all future `me.2bab.*` publishing will be supported.

## Implicit Configuration of Signing Plugin

To verify the legitimacy of uploads, we sign the packages to be uploaded using GPG, using Gradle's official [The Signing Plugin](https://docs.gradle.org/current/userguide/signing_plugin.html). When I first integrated it, I followed the steps in the two tutorials above and always felt something was off: I didn't see myself passing the key information needed by the signing plugin into the plugin.

``` kotlin
// The most basic DSL configuration for the plugin is just this one line
signing {
    sign(publishing.publications)
}
```

After briefly browsing the documentation, you'll discover that it actually defines some Keys by convention, and the plugin configuration reads directly from the Project's Properties.

``` kotlin
// So you can see the reference tutorial writes it like this
ext["signing.keyId"] = ...
ext["signing.password"] = ...
ext["signing.secretKeyRingFile"] = ...
```

And this convention that I never knew was possible, referring to [Build Environment](https://docs.gradle.org/current/userguide/build_environment.html#sec:project_properties):

```
// Using the following setup, you can pass the secret key (in ascii-
// armored format) and the password using the
// ORG_GRADLE_PROJECT_signingKey and ORG_GRADLE_PROJECT_signingPassword
// environment variables, respectively:
signing {
    val signingKey: String? by project
    val signingPassword: String? by project
    useInMemoryPgpKeys(signingKey, signingPassword)
    sign(tasks["stuffZip"])
}
```

I really dislike this overly "implicit" convention - you can't know what you've actually written without carefully reading the documentation. Fortunately, there's also an explicit configuration method:

``` kotlin
signing {
    val signingKeyId: String? by project // Where to put it is optional, not necessarily using Project Properties
    val signingKey: String? by project
    val signingPassword: String? by project
    useInMemoryPgpKeys(signingKeyId, signingKey, signingPassword) // This line is the key
    sign(tasks["stuffZip"])
}
```

Similar approaches are used in some experimental configs of Android Gradle Plugin, but due to their widespread existence and usage, perhaps people are too tired to complain (though most switches can still be configured directly from the DSL). If you don't see the problem here, consider this scenario:

- Obviously, DSL can provide **constrained configuration**. With excellent DSL, you can understand what APIs are available and how to interact just through **IDE completion**;
- If all plugins use such implicit configuration, losing the advantages of DSL, it's no different from writing a JSON configuration - **too loose, error-prone, hard to get started**. You might not know which configuration file corresponds to which module, whether this Key is correct, etc.;

Next time I update the plugin, I plan to change to `useInMemoryPgpKeys(...)`, otherwise after a year I'll forget this pitfall, or anyone taking over your project who doesn't understand the Signing plugin will be confused again.

## Signing Plugin Key Path Specification

If you use the `signing.secretKeyRingFile` configuration, you need to consider different configurations for local and CI environments:

- Local: `../local/secret.gpg`, recommended to place in the project root directory or create a `local` folder and add the entire folder to gitignore. The reason is that one machine might use more than one secret.gpg; keeping the key with the project makes it easier to find, and setup is also convenient for other collaborators;
- CI: `/secret.gpg`, placed directly in the virtual environment root directory, convenient for coordinating with the RingFile generation script;

## Batch Upload + Control Panel Operations

I recently saw someone's MavenCentral publishing tutorial on Juejin mentioning not to upload multiple packages and then Close together. In fact, this is supported and recommended - packages with the same Group ID will be placed in one staging repo, and can then be closed & released together. If you've referenced plugins that automatically handle the close & release process, aggregate upload (batch upload) can actually improve the success rate of subsequent operations (SonaType's API and webpage are not very stable). For example, this [project](https://github.com/2BAB/Polyfill) of mine has six modules and actually uses the Batch Upload strategy.
