# Handoff: 标记撤销/重做功能实现

## 修改时间
2026-05-19

## 需求背景
用户需要为设施标记（Marker）添加撤销/重做功能。项目已实现了线段的撤销/重做，需要扩展支持标记，并且保留完整的对象历史（撤销并重做后，自定义数据不丢失）。

## 设计方案
采用**命令模式（Command Pattern）** + **Redux 时间旅行思想**：
- 每个操作封装为独立的 Command 类
- CommandManager 借鉴 Redux Store 的订阅模式
- 支持混合操作序列（线段和标记操作可交错撤销/重做）

## 文件变更

### 新增文件

#### `src/commands/base.js`
- `Command` 基类：定义 `execute()` 和 `undo()` 接口
- `CommandManager` 类：管理命令历史栈，支持订阅状态变更
- `generateId()` 工具函数

#### `src/commands/mapCommands.js`
- `AddSegmentCommand` - 添加线段
- `DeleteSegmentCommand` - 删除线段
- `AddMarkerCommand` - 添加标记
- `DeleteMarkerCommand` - 删除标记

### 修改文件

#### `src/App.vue`

**1. 导入新模块**（第14-20行）
```javascript
import { CommandManager } from "./commands/base.js";
import {
  AddSegmentCommand,
  DeleteSegmentCommand,
  AddMarkerCommand,
  DeleteMarkerCommand,
} from "./commands/mapCommands.js";
```

**2. 初始化 CommandManager**（第37-54行）
- 替换原有的 `historyStack` ref
- 创建 `cmdContext` 包含 `pipeLines`、`placedMarkers`、`mapInstance`
- 订阅状态变更自动更新 UI

**3. 修改撤销/重做计算属性**（第98-106行）
```javascript
const undoCount = computed(() => cmdState.value.undoCount);
const redoCount = computed(() => cmdState.value.redoCount);
const canUndo = computed(() => cmdState.value.canUndo);
const canRedo = computed(() => cmdState.value.canRedo);
```

**4. 修改线段操作**
- `drawLine()` - 使用 `AddSegmentCommand`
- `deletePipeLine()` - 使用 `DeleteSegmentCommand`

**5. 修改标记操作**
- `handleDocumentMouseUp()` - 使用 `AddMarkerCommand` 添加标记
- `createFacilityMarker()` - 添加右键菜单事件监听
- 新增 `deleteMarker()` - 使用 `DeleteMarkerCommand`

**6. 修改右键菜单**
- 新增 `contextMenuTarget` ref 区分线段/标记
- 新增 `activeMarker` 变量
- `handleMenuDelete()` 支持删除标记

**7. 修改 undo/redo 函数**
```javascript
const undo = () => {
  const cmd = cmdManager.undo();
  if (cmd) showToast(`已撤销: ${cmd.description}`);
};
```

## 技术要点

### 1. 命令模式优势
- 每个操作自包含，易于测试
- 支持操作组合（未来可扩展宏命令）
- 调试友好（每个命令有 ID/类型/时间戳/描述）

### 2. 数据保留机制
撤销/重做直接操作高德地图对象引用：
```javascript
// 撤销标记
mapInstance.remove(marker);  // 对象仍在内存中

// 重做标记
mapInstance.add(marker);  // 同一个对象，ExtData 完全保留
```

### 3. Redux 借鉴
- **单一状态源**：CommandManager 统一管理
- **订阅模式**：UI 自动响应状态变更
- **不可变性**：命令创建后不可修改

## 验证步骤

```bash
pnpm build
```

功能测试：
1. 绘制线段 → 放置标记 → 绘制线段
2. 按 Ctrl+Z 3次 → 依次撤销：线段2、标记、线段1
3. 按 Ctrl+Shift+Z 3次 → 依次恢复
4. 为线段添加自定义数据 → 撤销 → 重做 → 验证数据保留
5. 右键删除标记 → Ctrl+Z 恢复 → 验证恢复成功

## 调试技巧

在浏览器控制台查看操作历史：
```javascript
// 查看已执行命令
console.table(cmdManager.past.map(cmd => ({
  type: cmd.type,
  description: cmd.description,
  timestamp: new Date(cmd.timestamp).toLocaleTimeString(),
})));

// 查看可重做命令
console.table(cmdManager.future);
```

## 未来扩展

### 1. 宏命令（批量操作）
```javascript
const deleteAll = new MacroCommand(
  pipeLines.map(p => new DeleteSegmentCommand(p, cmdContext)),
  '删除所有线段'
);
cmdManager.execute(deleteAll);
```

### 2. 操作分组
```javascript
cmdManager.beginGroup('绘制管道系统');
// ... 执行多个命令
cmdManager.endGroup();
// 撤销时会一次性撤销组内所有操作
```

### 3. 持久化
```javascript
const history = cmdManager.past.map(cmd => ({
  type: cmd.type,
  data: cmd.serialize(),
  timestamp: cmd.timestamp,
}));
localStorage.setItem('mapHistory', JSON.stringify(history));
```

## 回退方式

如需回退到简单栈方案：
1. 删除 `src/commands/` 目录
2. 恢复 App.vue 中的 `historyStack` 相关代码
3. 恢复原有的 `saveToHistory`、`undo`、`redo` 函数
