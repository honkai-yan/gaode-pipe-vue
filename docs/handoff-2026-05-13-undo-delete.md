# Handoff: 右键菜单删除线段支持撤销/重做 + 历史栈淘汰修复

## 日期
2026-05-13

## 变更内容

### 1. 右键菜单删除支持撤销/重做
修改 `src/App.vue` 中的历史栈机制，将条目从 polyline 引用改为 `{ type, polyline }` 操作对象，使 `undo()`/`redo()` 能区分 `add`/`delete` 操作类型。

### 2. 历史栈淘汰逻辑修复
修复 `saveToHistory` 中淘汰最旧条目时错误地从地图移除线段的问题。淘汰只丢弃历史记录，线段保留在地图上。

## 修改的函数
- `saveToHistory(polyline, type='add')` — 支持 type 参数，淘汰时仅丢弃记录不移除线段
- `undo()` — 根据操作类型反向执行（撤销添加=移除，撤销删除=恢复）
- `redo()` — 根据操作类型重新执行（重做添加=恢复，重做删除=移除）
- `deletePipeLine(polyline)` — 改为调用 `saveToHistory(polyline, 'delete')` 记录删除操作

## 验证
1. 绘制线段 → 右键删除 → Ctrl+Z 恢复 → Ctrl+Shift+Z 再次删除
2. 混合添加/删除操作后，撤销/重做顺序正确
3. 绘制新线段后，重做栈被正确清空
4. 绘制超过 50 条线段后，最早添加的线段仍在地图上可见
