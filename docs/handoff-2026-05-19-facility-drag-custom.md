# Handoff: 设施拖拽自定义预览实现

## 修改时间
2026-05-19

## 问题描述
用户从设施列表拖动图片到地图时遇到两个问题：
1. 拖拽预览图片从原图片位置开始，而非中心跟随鼠标
2. 松开鼠标创建标记时，标记的右下角位于光标位置，而非标记中心

之前的 `setDragImage()` 修复尝试未生效。

## 解决方案

采用**自定义拖拽预览**方案，完全控制拖拽视觉效果。

### 核心改动

#### 1. 新增拖拽状态管理（src/App.vue 第48-52行）
```javascript
const dragPreviewElement = ref(null);
const isCustomDragging = ref(false);
const draggedFacility = ref(null);
```

#### 2. 新增自定义预览函数（第368-413行）
- `createDragPreview()` - 创建固定定位的预览图片元素，初始位置在鼠标中心
- `updateDragPreviewPosition()` - 拖拽过程中更新预览元素位置
- `removeDragPreview()` - 清理预览元素
- `handleDocumentDragOver()` - 全局 dragover 监听，更新预览位置
- `cleanupDrag()` - 统一清理拖拽状态

#### 3. 修改 `handleFacilityDragStart`（第415-430行）
- 使用 1x1 透明像素图片隐藏浏览器默认拖拽预览
- 创建自定义预览元素并添加到 body
- 添加全局 dragover 事件监听

```javascript
const handleFacilityDragStart = (event, facility) => {
  event.dataTransfer.setData("application/json", JSON.stringify(facility));
  event.dataTransfer.effectAllowed = "copy";

  // 隐藏浏览器默认拖拽预览
  const emptyImg = new Image();
  emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  event.dataTransfer.setDragImage(emptyImg, 0, 0);

  // 创建自定义预览元素
  isCustomDragging.value = true;
  draggedFacility.value = facility;
  dragPreviewElement.value = createDragPreview(facility, event.clientX, event.clientY);

  document.addEventListener('dragover', handleDocumentDragOver);
};
```

#### 4. 修改 `createFacilityMarker`（第432-447行）
- 移除 `anchor: "center"`（与 offset 可能有冲突）
- 仅使用 `offset` 控制标记位置

```javascript
const createFacilityMarker = (facility, lngLat) => {
  const width = facility.width || DEFAULT_MARKER_SIZE;
  const height = facility.height || DEFAULT_MARKER_SIZE;

  const marker = new AMap.Marker({
    position: lngLat,
    content: `<img src="${facility.imageUrl}" ... />`,
    // 使用 offset 使标记中心对准 position
    offset: new AMap.Pixel(-width / 2, -height / 2),
  });
  // ...
};
```

#### 5. 修改 `handleMapDrop`（第449-476行）
- 添加 `cleanupDrag()` 调用，确保放置后清理预览元素

#### 6. 修改 `onUnmounted`（第736-753行）
- 添加 `cleanupDrag()` 调用，确保组件卸载时清理

## 技术要点

1. **隐藏默认预览**：使用 `setDragImage(emptyImg, 0, 0)` 配合 1x1 透明 GIF 隐藏浏览器默认拖拽效果

2. **自定义预览元素**：
   - 使用 `position: fixed` 使预览元素跟随鼠标在全局移动
   - 计算位置时减去宽高的一半，使元素中心对准鼠标
   - `pointer-events: none` 确保预览元素不干扰鼠标事件

3. **标记位置校准**：
   - 高德地图 `AMap.Pixel(x, y)` 中 x 为正向右，y 为正向下
   - 使用负的半宽高偏移，使标记中心对准放置坐标

## 验证步骤

```bash
pnpm build
```

构建成功即可。

功能测试：
1. 从设施列表拖动图片
2. 观察预览图片中心是否始终跟随鼠标位置
3. 在地图上松开鼠标
4. 验证标记中心是否准确出现在鼠标位置

## 回退方式

如需回退，恢复以下函数到修改前状态：
- `handleFacilityDragStart`
- `createFacilityMarker`
- `handleMapDrop`
- `onUnmounted`

并删除新增的辅助函数和状态变量。
