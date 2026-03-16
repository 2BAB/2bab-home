---
layout: post
date: 2026-03-16
title: "Responsive Layout Fundamentals"
tags: [android, ios, web, responsive, layout, enpost]
---

Getting started with responsive design really comes down to two things: where to put the navigation, and how to arrange content. As screens get larger, each of these has a well-established set of patterns. Android's developer docs have the most thorough summary, complete with ready-made components. iOS and Web follow similar ideas but require more manual work.


## 1. Navigation

The core question: as the screen gets wider, where does the navigation go?

### Four Navigation Patterns

**Bottom Bar**

The most common mobile navigation. 3-5 icons lined up at the bottom of the screen, within thumb reach. The default choice for phones in portrait.

```
┌───────────┐
│           │
│  Content  │
│           │
├──┬──┬──┬──┤
│🏠│📋│🔍│⚙️│
└──┴──┴──┴──┘
```

**Top Bar**

The traditional Web approach. Logo on the left, nav items on the right. Works well when there aren't too many items and brand presence matters. Rarely used as the primary navigation on native mobile apps, but extremely common on the Web — marketing sites, docs, SaaS products.

```
┌──────────────────────┐
│ Logo  Home  About  ▾ │
├──────────────────────┤
│                      │
│      Content         │
│                      │
└──────────────────────┘
```

On narrow screens, the Top Bar typically collapses into a hamburger menu that opens as a full or half-screen overlay. Web developers know this drill well.

**Rail**

A narrow sidebar with just icons and short labels, pinned to the left edge. The go-to choice for tablets and foldables — makes better use of horizontal space than a Bottom Bar, without eating as much area as a Drawer.

```
┌──┬───────────┐
│🏠│           │
│📋│  Content  │
│🔍│           │
│⚙️│           │
└──┴───────────┘
```

**Drawer**

A full sidebar with icons and complete labels. Can hold many items, supports grouping and nesting. The standard for large screens and desktops. Some implementations support expand/collapse.

```
┌──────────┬─────────┐
│ 🏠 Home   │         │
│ 📋 Orders │ Content │
│ 🔍 Search │         │
│ ⚙️ Settings│         │
└──────────┴─────────┘
```

### Switching Logic

As screen width increases:

```
Phone        Tablet/Foldable    Desktop/Large
Bottom Bar  →    Rail       →   Drawer
```

Web has an additional path:

```
Phone              Tablet          Desktop
Hamburger(☰)  →  Top Bar    →  Top Bar (more items)
  or               or              or
Bottom Bar    →  Rail        →  Drawer
```

Which path to take on the Web depends on the product type. Tool-oriented products (admin panels, email, docs) go the Rail/Drawer route. Content-oriented products (blogs, marketing sites, e-commerce) go the Top Bar route. Native apps almost always follow the Bottom Bar → Rail → Drawer path.

### Platform Support

| | Android | iOS | Web |
|---|---------|-----|-----|
| Bottom Bar | `NavigationBar` | `TabView` | Roll your own |
| Top Bar | Uncommon | Uncommon | Roll your own (trivial to find) |
| Rail | `NavigationRail` | No native component | Roll your own |
| Drawer | `NavigationDrawer` | No native component | Roll your own |
| Auto-switch | `NavigationSuiteScaffold` | None, manually check Size Class | None, use CSS breakpoints |

Android is probably the only platform with a turnkey solution. `NavigationSuiteScaffold` takes your nav items and automatically switches between the three forms based on window size — one line of code. iOS and Web both require you to build this switching logic yourself, though Web often leverages Tailwind breakpoints and mature component libraries to get there.


## 2. Content Area (Canonical Layouts)

Once navigation is settled, the remaining question is how the content area adapts to different screen sizes. Google identified three canonical layouts that cover the vast majority of cases.

### List-Detail

On small screens, the list and detail are separate pages — tap an item to navigate to its detail. On large screens, they sit side by side.

```
Small:                   Large:
┌──────────┐            ┌─────┬────────┐
│ Item A   │            │ A   │        │
│ Item B   │    →       │ B ● │ Detail │
│ Item C   │            │ C   │ of B   │
└──────────┘            └─────┴────────┘
  Tap → full-screen        Side by side
```

The most classic responsive pattern. Email clients, chat apps, settings pages, file managers — all List-Detail.

**Platform implementations:**
- Android: `ListDetailPaneScaffold`, works out of the box
- iOS: `NavigationSplitView`, functional but limited in customization
- Web: CSS Grid/Flexbox + media queries, or simply `grid-template-columns: 300px 1fr`

### Feed

Content comes in cards. Single column on small screens, multi-column grid on large ones.

```
Small:             Large:
┌────────┐        ┌────┬────┬────┐
│ Card A │        │ A  │ B  │ C  │
│ Card B │   →    │ D  │ E  │ F  │
│ Card C │        │ G  │ H  │    │
└────────┘        └────┴────┴────┘
  Single col        Multi-col grid
```

Social feeds, news, image galleries, product listings. The key is letting the column count adapt to screen width rather than hardcoding it.

**Platform implementations:**
- Android: `LazyVerticalGrid` + `GridCells.Adaptive(minSize)`
- iOS: `LazyVGrid` + `GridItem(.adaptive(minimum:))`
- Web: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` — one line of CSS, and Web actually wins here in simplicity

### Supporting Pane

The main content takes the majority of space, with supplementary info alongside. Unlike List-Detail, this isn't a master-detail relationship — it's main content plus auxiliary information.

```
Small:                   Large:
┌──────────┐            ┌────────┬─────┐
│          │            │        │     │
│   Main   │    →       │  Main  │ SP  │
│          │            │        │     │
├──────────┤            └────────┴─────┘
│ Support  │              Main + side panel
└──────────┘
 Below or in a sheet
```

Maps + search results, video + comments, code editor + properties panel. On small screens, the supporting pane typically sits below, collapses into a bottom sheet, or becomes an expandable overlay.

**Platform implementations:**
- Android: `SupportingPaneScaffold`
- iOS: No equivalent component, build with `HStack` + `GeometryReader`
- Web: CSS Grid or Flexbox, straightforward

### Combining Layouts

In practice, these three often nest inside each other. Take an email client: the overall structure is List-Detail, the list itself is a Feed (email cards), and the detail view might have a Supporting Pane on the side showing attachments or contact info. Once you understand these three base patterns, every variation is just a combination.

---

## Summary

```
Responsive layout = Navigation adaptation + Content area adaptation

Navigation:
  Bottom Bar → Rail → Drawer (native apps)
  Hamburger → Top Bar (Web content sites)

Content area (Canonical Layouts):
  List-Detail      List and detail, separate pages on small screens, side by side on large
  Feed             Card stream, single column on small, multi-column on large
  Supporting Pane  Main content + auxiliary panel
```

Android has the most complete story here, with dedicated Material 3 components for each pattern. iOS only has `NavigationSplitView` and `LazyVGrid` roughly covering List-Detail and Feed — the rest is manual. Web has the most flexibility — CSS Grid was designed for exactly these scenarios — but lacks high-level turnkey components, so you assemble them yourself.

That's the full picture. When building a screen, first identify which Canonical Layout it falls into, then decide which navigation form to use. The rest is platform API details.
