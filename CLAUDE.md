# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`gaode-pipe-vue` is a single-page Vue 3 tool for drawing pipeline routes on Gaode Map (AMap). All UI text is in Chinese (zh-CN). The app has no backend — data is exported as a local JSON file.

## Common Commands

- `pnpm dev` — Start the Vite dev server
- `pnpm build` — Production build
- `pnpm preview` — Preview the production build

There are no test or lint scripts configured.

## Architecture

### Single-View App with No Routing

All business logic lives in `src/App.vue` (~430 lines). There is no Vue Router, no Pinia/Vuex, and no HTTP client. State is managed locally with `ref()` inside the root component.

### AMap Integration

The app loads the AMap JS API 2.0 via CDN in `index.html`. Map initialization, event handling (`click`, `mousemove`), and cleanup happen inside `App.vue`'s `onMounted` / `onUnmounted` hooks.

`src/gaode-preload.js` sets `window._AMapSecurityConfig` before the loader runs.

### Coordinate System

The app maintains two coordinate spaces:

- **LngLat** — AMap's GCJ-02 coordinates (geographic)
- **Logical coordinates** — Meters from the first-drawn point, x=east, y=north

Key utility functions in `App.vue`:
- `toLogicalCoordinate()` — converts LngLat to meters
- `getSignedAxisDistanceMeters()` — axis-aligned distance calculation
- `buildExportPayload()` — creates the export JSON structure

Logical coordinates are rounded to 3 decimal places (`LOGICAL_COORD_PRECISION = 3`).

### Export Format

The exported JSON contains a `coordinateSystem` descriptor and a `segments` array. See `docs/export-doc.md` for the full schema (documented in Chinese).

### Component Patterns

- All components use `<script setup>` with Vue 3 Composition API
- `BaseButton.vue` uses `tailwind-merge` for class composition and `defineOptions({ inheritAttrs: false })` for attribute control
- Path alias: `@/` maps to `src/` (configured in `vite.config.js` and `jsconfig.json`)

## Key Constants & Behaviors

- `SNAP_DISTANCE_PX = 16` — When drawing, the cursor snaps to existing segment endpoints within 16 screen pixels
- Hold **Alt** while drawing to disable snapping
- Press **Escape** to exit drawing mode
- Line styles are defined as plain objects (`lineStyle`, `activeLineStyle`) and passed to AMap's `Polyline` constructor

## Important Notes

- The AMap API key and security code are hardcoded in `index.html`/`src/gaode-preload.js` and `App.vue`
- Tailwind CSS v4 is used with the `@tailwindcss/vite` plugin
- There is no testing framework configured

## 用户补充

- 所有用于测试等任何用途的后台任务必须关闭后才能退出。关闭后台任务可能会失败，因此如果选择启动开发服务器来测试，在终止服务器时务必要确认是否成功终止，没有则换方法尝试几次，实在关不掉要告知用户。鉴于关闭后台任务的问题，可以仅执行构建并配合VSCode的问题列表功能来进行静态检查，而不是启动开发服务器。
- 每一轮修改都要在docs目录下留下handoff文档。相关的内容可以写在同一个文件，但要区分修改主题。如果日期不同，即使修改主题相关，也要创建新文档。
- 如有必要，请合理拆分文件，使得项目目录结构层次清晰易懂、命名没有歧义且不会过长。
- plan阶段看一下项目已经引入的依赖，尽可能在plan中利用现有依赖，以免编码时过多的重复造轮子、手搓。
- 如有必要，可以引入新依赖，但要在plan阶段告知用户，获准后可以执行命令安装依赖。
- 如有必要，你可以在plan模式中开多个subagent，最多不超过5个，来获取你想要的信息。
- 不清楚某个需求的实现细节时，可以读取/docs下的handoff文档来了解之前的开发经过，避免重复踩坑，以及更好地理解需求实现过程。
- 开发时不要逞强，以用户提到的需求为标准，用户没说的范围不要过多考虑，以免占用上下文和算力，导致核心需求实现出错。
