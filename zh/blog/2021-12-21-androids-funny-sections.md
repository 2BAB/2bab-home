---
layout: post
date: 2021-12-21
title: "《Androids》的一些有趣书摘"
tags: [Android , post]
---

Pieces of "Androids" book which are really interesting.

> Haase, Chet. Androids: The Team That Built the Android Operating System . Chet Haase. Kindle Edition. 


About the HTC G1 and hidden memory.

> One of the legends of Brian Swetland was how he “found” extra memory on the G1 shortly before it shipped. He submitted a fix in the run-up to the release, expanding the available RAM on the device from 160 Mbytes to 192 Mbytes, giving the OS and all applications 20% more memory to play with, which was a significant boost on this very memory-constrained system.
> The trick was that he knew where to find that memory because he had hidden it in the first place. The kernel is responsible for making memory available for the rest of the system to use. When he first brought up the kernel on the G1, he configured it to report less memory that it actually had. To the rest of the system, there was effectively 32Mb less memory for use than was physically available in the hardware. He did this with the certain knowledge that every developer would use all available memory if it was there, but they’d work within a tighter budget if they had to.