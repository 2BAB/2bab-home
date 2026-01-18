---
layout: post
date: 2024-05-31
title: "KotlinConf 2024 Experience"
tags: [Community, post]
---

The annual Kotlin festival has arrived again. I mentioned "Next year, see you again" in last year's [KotlinConf 2023 Experience](https://2bab.me/en/blog/2023-04-15-kotlin-conf-23-exp/) and delivered on that promise. This time I posted the ticket release information in some Android groups in mainland China at the first opportunity and naturally got myself a super early bird ticket. This article is also a quick note on my phone, so please forgive simplification or omission of some technical term explanations and formatting issues.

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-1.jpg?imageslim)

This year's venue is at Bella Center in Copenhagen, Denmark, with a much larger overall scale than last year (2000 people vs 1000 people). Although last year's dining menu was fancier and the venue building had a particularly historic feel, making this year seem slightly inferior, the event management level is still very high.

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-2.jpg?imageslim)

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-3.jpg?imageslim)

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-4.jpg?imageslim)

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-5.jpg?imageslim)

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-6.jpg?imageslim)

I suggest everyone follow the on-site quick tour video recorded together with Kotlin official evangelist Shengyou and several friends (expected to be released in two or three days), as well as the next episode's on-site special of "Kotlin Fireside Chat."

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-7.png?imageslim)

(Image shows last year's on-site recording published on JetBrains China's Bilibili account)


Due to limited space, this article's content will focus on my personal perspective.

## Core Agenda

This year's core theme is ostensibly Kotlin 2.0 and K2, but actually leans more toward KMP. After KT2 was announced last year, the official has been publicly sharing various progress. So the features were actually all released before this conference, including the binary packages. The more important part of the conference is announcing the arrival of KT2's official version, marking that Kotlin has truly matured (according to former Kotlin language designer Roman), and the beginning of more teams and projects adapting. On the language itself, they're already talking about what will be beta in 2.1 and 2.2, looking ahead to the future.

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-8.jpg?imageslim)

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-9.jpg?imageslim)

But I must say, everyone has been waiting for KT2 for a long time. Whether it's the significant performance improvement of the Compiler, or some syntactic sugar that should have been there long ago, all can affect the actual development experience. The design changes for KCP, KSP, etc., are also more convenient for us plugin developers.

On the KMP side, it directly took over 20 sessions of related topic sharing, including some official sessions from JetBrains and Google, as well as best practices from the community. Google mentioned WorkSpace suite migration to KMP last year, and this year brought it out as a key case study, corresponding to the major KMP support announced at this year's I/O. In addition, other tools in Jetpack, especially Room, also have detailed migration sharing this year. Whether or not you're a Room user, you can find some useful information from their library migration experience, including how to simultaneously support KMP and the Java ecosystem on Android, how to update and solve testing issues, how to bridge underlying native libraries (sqlite) on the iOS platform, etc. KMP's open-source libraries have reached several thousand (for specifics, check John O'Reilly's KMP Libraries sharing replay), with growth rate no less than other cross-platform tools in their early stages.

On the Compose side, besides some regular performance optimization and common multi-platform practice sharing, the most interesting might be Jake's sharing on using Compose for embedded system UI (I haven't watched it yet, several friends highly recommend it).

Of course, I definitely went to listen to the Gradle content. This year's core marketing point is Gradle Declarative DSL, whose approach is to start from the needs of most developers and separate the build configuration part (only supports configuring some basic data types) from the logic part (complex build customization, with plugins as carriers and tasks as units). Currently only EAP is released, requiring a bunch of nightly versions to use together, and will continuously improve related functions and tools to enter beta by the end of this year.

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-10.jpg?imageslim)

Just looking at the above two sentences of explanation is still a bit abstract. Actually, there's quite complex work behind this. Based on Kotlin's syntax, they extracted a subset of KTS, which can basically be understood as only supporting current Gradle Extension configuration. The new configuration filename is "build.gradle.dcl", dcl being short for declarative. The benefit is being able to customize a parser to parse and handle this file instead of the standard complex kotlin compiler, achieving huge performance improvements in the Configuration phase (about 1/6 the time of KTS). When chatting with Slack people on-site, I mentioned that Configuration Cache is not fast enough for large projects — even if one module takes 0.3s, the time for a thousand modules (300s) is a bit too long. I believe after this new configuration file is supported, there will also be obvious improvements.

Additionally, this year I also paid attention to some more soft-skill oriented Talks, including "Tools & Techniques for Java to Kotlin Migration" on the first day afternoon, and "The best programmer I know" on the second morning. The first one would be very instructive for many friends wanting to join big companies — you can hear how various projects with millions of lines of code do this kind of technical migration step by step. How to fight for the internal funding and resource support needed for this, how to communicate with people and groups who resist, why to regularly collect feedback from internal developers, how to find the value of new technology, etc. The second one I personally think is more like Golden Rules for indie developers — if you haven't read this type of blog or production mode introduction, it would be quite instructive.

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-11.jpg?imageslim)

All edited videos will be released in a week or two. Currently you can watch previous live replays through this replay list: https://www.reddit.com/r/Kotlin/comments/1d08rv8/is_it_possible_to_watch_the_recordings_of_the/

## Deep Conversations

I spent more time on deep conversations this year, with fewer shallow introductions to new friends. On one hand, I added many people last year, and when we meet again there's always more content to chat about. On the other hand, my throat was inflamed those two days (sad), so I saved my limited voice for some in-depth topics. Below, I'll excerpt a few interesting pieces of content.

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-12.jpg?imageslim)

The first piece is a conversation with Jeffrey, one of Google's language and developer tools leaders. I mainly asked why Google didn't mention Compose Multiplatform in this I/O blog post, instead summarizing Google's current cross-platform support on the client side as "use KMP for shared logic, use Flutter for both shared UI and shared logic." His answer was very interesting, summarized in mainly two points: 1. Compose still has a lot of development space. At this stage, we're still working hard to provide better support for Android and various performance improvements. Not mentioning it now doesn't mean never — we'll see when it's more mature. 2. Flutter is very convenient when doing unified projects, while KMP has its own characteristics, including more seamless interop with Native (like uikit bindings). CMP can actually achieve a lot on this basis.

I think what he said is very reasonable, including the imagination for several integration modes of kmp and cmp now. For example, you can integrate only the logic part like early KMP, used to develop data repository and infra, including some SDKs. Another example is cashapp's redwood which doesn't use cmp's UI components, only uses the underlying composition part to build virtual structures, with actual rendering mapped to Native, even supporting hot deployment for kt/js. The migration appeal of KMP is actually very obvious: native performance, progressive integration. Going forward you can integrate CMP (partial functions or pages, partial package levels, of course all can go on too), and when stepping back you can keep using it as a native SDK while other parts use some new technology in the future. It's hard for situations like a startup company going all-in on Flutter, then deciding to rewrite most features or even the entire app when wanting to support better performance and advanced requirements.

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-13.png?imageslim)

The second piece is a conversation with Gradle's Principal Engineer, Paul. We discussed the community's general view that Gradle is "very hard to learn." Actually, on the Android side, the problem isn't just Gradle — mainly AGP and a bunch of packaging and compilation tools including aapt2, r8, ksp, etc., which also don't have much public documentation and detailed user guides. For Gradle itself, I wrote last year that documentation needs improvement. They are actually working on this, including new organizational forms, more course sharing, and working with Android to promote recipes and cross-linking references. Gradle's open-source build tool side has only 18 core team members. From public channels we can see that new employees are mostly invested in enterprise projects (develocity), so there's quite a bit of pressure for supporting new requirements. Bragging a bit: he proactively said he's too busy working at the booth these two days, and will read my book in a while and give me some feedback.

Additionally, I also chatted with him and Sterling about Declarative DSL's tooling support. The Compose Desktop tool they demonstrated on-site was amazing, able to view all configurations of related Software Types under a dcl. And this tool is just a demo. I suggested they could merge it into the IDE plugin (after all, compose is also a technology supported by idea plugins). This tool will also be integrated with more other source code navigation support in the future — you can click to see documentation and declarations, and also link to the plugin source code behind.

The third piece is chatting with Slack's Boon for over an hour across multiple times. Boon is from Singapore and currently works on some Android business architecture at Slack in Seattle. Slack Android has over a thousand modules and has been using Kotlin and Compose for many years. Interestingly, their infrastructure and developer experience team (which feels more tool-oriented) are separate. After the company was acquired by SF, there's still support for many open-source projects. And recent pain points include Compose performance issues and compilation build execution time. It's quite emotional and consistent with my observations that Singapore has a relatively weak local tech atmosphere because many talents have gone to the US due to the h1b1 agreement with America. He attends tech conferences year-round — I/O, DroidCon, KotlinConf all go — and helped identify many experts on-site, like DroidCon's CEO, former and current Kotlin language designers, Uber's Ty Smith, etc. Including later when I went to chat with a table of cashapp people, it was because he tipped me off early that John, the paparazzi maintainer, was also on-site.

As a side note, I later went to the CashApp table to chat with John, Ty, Mohit and others for half an hour, and discovered John and Jake were still working on-site, merging PRs — true community legends.

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-14.jpg?imageslim)

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-15.jpg?imageslim)

## Extending Android Builds (EAB)

EAB is the English version of my book "Android Build and Architecture in Practice," which was just published last month. Last year at the KotlinConf conference, I was somewhat green asking people to help review the 'Extending Android Builds' table of contents and manuscript. Thanks to that conference, the book's content became more complete. This year I was much more confident, going directly with the newly released paper book and poster.

![](https://2bab-images.lastmayday.com/Screenshot%202024-04-02%20at%209.09.51%E2%80%AFAM.png?imageslim)

At 8 am on the first day when I just arrived at the venue, I went to Gradle's booth. Gradle officially [recommended my new book in their Newsletter last month](https://newsletter.gradle.org/2024/04), and coming this time to gift the book to the Gradle team on-site was like fulfilling a wish. We chatted about many things, and when they asked for a QR code for trial reading content, I gave them the poster just right.

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-16.png?imageslim)

Then, they actually **put the poster at Gradle's booth and helped promote it for two days. When people passing by gathered around, they would also introduce this book**! And Gradle team's enthusiasm didn't stop there — I was also invited to **participate in a Gradle interview**, discussing the book creation process, suggestions for newcomers, outlook on Gradle's future, etc. The video will be released on their YouTube channel later.

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-17.jpg?imageslim)

When I got to Google's booth, I immediately recognized Chris Willington from the AGP team. If I heard correctly, he said he's now the Manager of the AGP team in London. I said I've watched his previous sharing videos at ADS many times — what a late meeting. Ivan's help last year gave me a lot of help, and Chris this year similarly gave me a lot of confidence, affirming the coverage scope of the book. Unfortunately there was no opportunity to put the book or poster at Google's booth haha. After giving the book to him, he also shared it with other colleagues.

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-18.jpg?imageslim)

Besides that, Google's Jeffrey and Uber's Ty also flipped through the book and gave some suggestions that are very inspiring for the second edition update. Special thanks to all the experts for their help, and definitely cherish the few opportunities to chat in person.

## Summary

Finally, what makes this year happier than last year is that the Chinese developer team has grown again. Besides me and Shengyou, there's also Android GDE and KUG Shanghai organizer Yuang, KMP expert Yinlong, as well as high school student Zhuoxuan in Sweden and SiaoJie in London.

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-19.jpg?imageslim)

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-20.jpg?imageslim)

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-21.jpg?imageslim)

![](https://2bab-images.lastmayday.com/kotlin-conf-2024-22.jpg?imageslim)


Hope to meet again at next year's KotlinConf!

See you soon!
