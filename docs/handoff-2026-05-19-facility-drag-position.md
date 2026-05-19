# Handoff: 设施拖拽定位修复

## 修改时间
2026-05-19

## 问题描述
用户从设施列表拖动图片到地图时，预览图片的左上角位于鼠标位置，而非中心。松开鼠标创建标记时，标记位置与预期位置有偏差。

## 修复方案
在 `handleFacilityDragStart` 中使用 `dataTransfer.setDragImage()` 方法设置拖拽预览图片的偏移量，使图片中心对准鼠标位置。

## 改动文件
- `src/App.vue` (第350-358行)

## 具体改动

### `handleFacilityDragStart` 函数

```javascript
const handleFacilityDragStart = (event, facility) => {
  event.dataTransfer.setData("application/json", JSON.stringify(facility));
  event.dataTransfer.effectAllowed = "copy";

  // 设置拖拽预览图片，使其中心对准鼠标
  const img = event.target;
  const width = img.naturalWidth || facility.width || DEFAULT_MARKER_SIZE;
  const height = img.naturalHeight || facility.height || DEFAULT_MARKER_SIZE;

  event.dataTransfer.setDragImage(img, width / 2, height / 2);
};
```

**关键修改点**：
- 添加 `event.dataTransfer.setDragImage(img, width / 2, height / 2)`
- 参数 `width / 2` 和 `height / 2` 表示图片中心到左上角的偏移量
- 这样设置后，拖拽时图片中心会位于鼠标位置

## 验证步骤

```bash
pnpm build
```

构建成功即可。

如需功能测试：
1. 启动开发服务器 `pnpm dev`
2. 从设施列表拖动图片
3. 观察拖拽时图片中心是否对准鼠标
4. 在地图上松开鼠标，验证标记是否准确出现在鼠标位置

## 回退方式

如需回退，移除 `handleFacilityDragStart` 中添加的 `setDragImage` 调用即可。
