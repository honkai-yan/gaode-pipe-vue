<script setup>
import {
  onMounted,
  onUnmounted,
  ref,
  computed,
  getCurrentInstance,
  markRaw,
} from "vue";
import { ElMessageBox } from "element-plus";
import BaseButton from "@/components/BaseButton.vue";
import SegmentDataPopup from "@/components/SegmentDataPopup.vue";
import SegmentContextMenu from "@/components/SegmentContextMenu.vue";
import { CommandManager } from "./commands/base.js";
import {
  AddSegmentCommand,
  DeleteSegmentCommand,
  AddMarkerCommand,
  DeleteMarkerCommand,
} from "./commands/mapCommands.js";

let mapInstance = null;
let previewLine = null;
const operateState = ref({
  drawLineMode: false,
});
const loadStatus = ref("loading");
const pipeLineCount = ref(0);
let clickPos = [-1, -1];
let hoverPos = [-1, -1];
let drawLineStartPos = [-1, -1];
let drawLineEndPos = [-1, -1];

const SNAP_DISTANCE_PX = 16;
const MAX_HISTORY_SIZE = 50;

// Command Manager 实例（借鉴 Redux Store 的设计）
const cmdManager = new CommandManager({ maxSize: MAX_HISTORY_SIZE });

// 命令执行上下文
const cmdContext = {
  mapInstance: null,
  pipeLines: [],
  placedMarkers: [],
  updateCount: () => {
    pipeLineCount.value = cmdContext.pipeLines.length;
  },
};

// 订阅状态变更用于 UI 更新
const cmdState = ref(cmdManager.getState());
cmdManager.subscribe((state) => {
  cmdState.value = state;
});
const LOGICAL_COORD_PRECISION = 3;

const popupVisible = ref(false);
const popupPosition = ref({ x: 0, y: 0 });
const popupCustomData = ref([]);
let activePolyline = null;

const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });

const DEFAULT_MARKER_SIZE = 32;

// 自定义拖拽状态
const dragPreviewElement = ref(null);
const isCustomDragging = ref(false);
const draggedFacility = ref(null);

const facilityList = ref([
  { imageUrl: '/favicon.svg', description: '设施一号' },
  { imageUrl: '/favicon.svg', description: '设施二号名称较长测试省略号' },
  { imageUrl: '/favicon.svg', description: '三号设施' },
  { imageUrl: '/favicon.svg', description: '四号设施设备', width: 48, height: 48 },
  { imageUrl: '/favicon.svg', description: '五号测试设施' },
  { imageUrl: '/favicon.svg', description: '六号设施名称' },
  { imageUrl: '/favicon.svg', description: '设施一号' },
  { imageUrl: '/favicon.svg', description: '设施二号名称较长测试省略号' },
  { imageUrl: '/favicon.svg', description: '三号设施' },
  { imageUrl: '/favicon.svg', description: '四号设施设备' },
  { imageUrl: '/favicon.svg', description: '五号测试设施' },
  { imageUrl: '/favicon.svg', description: '六号设施名称' },
]);

const instance = getCurrentInstance();
const $message = computed(
  () => instance.appContext.config.globalProperties.$message,
);

const showToast = (text) => {
  $message.value?.({ message: text, type: "info", duration: 1500 });
};

const undoCount = computed(() => cmdState.value.undoCount);
const redoCount = computed(() => cmdState.value.redoCount);
const canUndo = computed(() => cmdState.value.canUndo);
const canRedo = computed(() => cmdState.value.canRedo);

// 右键菜单当前目标（线段或标记）
let activeMarker = null;
const contextMenuTarget = ref('segment'); // 'segment' | 'marker'

const lineStyle = {
  strokeColor: "#3366FF",
  strokeWeight: 5,
  strokeStyle: "solid",
  strokeOpacity: 1,
  lineCap: "round",
  lineJoin: "round",
  zIndex: 10,
};

const activeLineStyle = {
  strokeColor: "#F97316",
  strokeWeight: 7,
  strokeOpacity: 1,
  zIndex: 20,
};

const updateMapCursor = () => {
  if (!mapInstance) return;
  mapInstance.setDefaultCursor(
    operateState.value.drawLineMode ? "crosshair" : "default",
  );
};

const resetPreviewLine = () => {
  if (!previewLine) return;
  previewLine.hide();
};

const updatePreviewLine = (endPos = hoverPos) => {
  if (
    !previewLine ||
    !operateState.value.drawLineMode ||
    !posValid(drawLineStartPos) ||
    !posValid(endPos)
  ) {
    resetPreviewLine();
    return;
  }

  previewLine.setPath([drawLineStartPos, endPos]);
  previewLine.show();
};

const enterDrawPipeMode = () => {
  operateState.value.drawLineMode = true;
  updateMapCursor();
  resetAllPipeLineStyles();
  console.log("绘制模式");
  updatePreviewLine();
};

const exitDrawPipeMode = () => {
  if (!operateState.value.drawLineMode) return;

  operateState.value.drawLineMode = false;
  updateMapCursor();
  console.log("普通模式");

  hoverPos = [-1, -1];
  drawLineStartPos = [-1, -1];
  drawLineEndPos = [-1, -1];
  resetPreviewLine();
};

const toggleDrawPipeMode = () => {
  if (operateState.value.drawLineMode) {
    exitDrawPipeMode();
    return;
  }

  enterDrawPipeMode();
};

const handleKeyDown = (event) => {
  if (event.ctrlKey && event.key === "z" && !event.shiftKey) {
    event.preventDefault();
    if (popupVisible.value) return;
    if (canUndo) {
      undo();
    }
    return;
  }

  if (
    event.ctrlKey &&
    event.shiftKey &&
    (event.key === "Z" || event.key === "z")
  ) {
    event.preventDefault();
    if (popupVisible.value) return;
    if (canRedo) {
      redo();
    }
    return;
  }

  if (event.key === "Escape") {
    if (popupVisible.value) return;
    exitDrawPipeMode();
  }
};

const posValid = (pos) => {
  if (!Array.isArray(pos)) return false;
  return pos[0] !== -1 && pos[1] !== -1;
};

const roundCoordinate = (value) => {
  const roundedValue = Number(value.toFixed(LOGICAL_COORD_PRECISION));
  return Object.is(roundedValue, -0) ? 0 : roundedValue;
};

const toPlainLngLat = (point) => {
  if (!point) return null;
  if (Array.isArray(point)) return [point[0], point[1]];
  if (
    typeof point.getLng === "function" &&
    typeof point.getLat === "function"
  ) {
    return [point.getLng(), point.getLat()];
  }
  return null;
};

const createLngLat = (point) => {
  if (typeof AMap === "undefined") return null;

  const plainPoint = toPlainLngLat(point);
  if (!plainPoint) return null;

  return new AMap.LngLat(plainPoint[0], plainPoint[1]);
};

const getAxisProjectionPoint = (baseLngLat, targetLngLat, axis) => {
  if (typeof AMap === "undefined") return null;

  if (axis === "x") {
    return new AMap.LngLat(targetLngLat.getLng(), baseLngLat.getLat());
  }

  return new AMap.LngLat(baseLngLat.getLng(), targetLngLat.getLat());
};

const getSignedAxisDistanceMeters = (baseLngLat, targetLngLat, axis) => {
  const delta =
    axis === "x"
      ? targetLngLat.getLng() - baseLngLat.getLng()
      : targetLngLat.getLat() - baseLngLat.getLat();

  if (delta === 0) return 0;

  const projectionPoint = getAxisProjectionPoint(
    baseLngLat,
    targetLngLat,
    axis,
  );
  const distance = baseLngLat.distance(projectionPoint);
  return roundCoordinate(delta > 0 ? distance : -distance);
};

const toLogicalCoordinate = (point, baseLngLat) => {
  const targetLngLat = createLngLat(point);
  if (!targetLngLat || !baseLngLat) return null;

  return {
    x: getSignedAxisDistanceMeters(baseLngLat, targetLngLat, "x"),
    y: getSignedAxisDistanceMeters(baseLngLat, targetLngLat, "y"),
  };
};

const getSegmentAngleDeg = (startPoint, endPoint) => {
  const deltaX = endPoint.x - startPoint.x;
  const deltaY = endPoint.y - startPoint.y;
  return roundCoordinate((Math.atan2(deltaY, deltaX) * 180) / Math.PI);
};

const getSegmentLengthMeters = (startPoint, endPoint) => {
  return roundCoordinate(
    Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y),
  );
};

const buildExportPayload = () => {
  if (cmdContext.pipeLines.length === 0) return null;

  const basePoint = toPlainLngLat(cmdContext.pipeLines[0].getExtData()?.endpoints?.[0]);
  if (!basePoint) return null;

  const baseLngLat = createLngLat(basePoint);
  if (!baseLngLat) return null;

  return {
    coordinateSystem: {
      unit: "meter",
      provider: "AMap JSAPI",
      method: "AMap.LngLat.distance axis projection",
      originLngLat: {
        lng: basePoint[0],
        lat: basePoint[1],
      },
      originLogical: {
        x: 0,
        y: 0,
      },
      axis: {
        x: "east",
        y: "north",
      },
    },
    segments: cmdContext.pipeLines.map((polyline, index) => {
      const [startLngLat, endLngLat] =
        polyline.getExtData()?.endpoints?.map(toPlainLngLat) ?? [];
      const logicalStart = toLogicalCoordinate(startLngLat, baseLngLat);
      const logicalEnd = toLogicalCoordinate(endLngLat, baseLngLat);

      return {
        id: index + 1,
        startLngLat: {
          lng: startLngLat[0],
          lat: startLngLat[1],
        },
        endLngLat: {
          lng: endLngLat[0],
          lat: endLngLat[1],
        },
        start: logicalStart,
        end: logicalEnd,
        length: getSegmentLengthMeters(logicalStart, logicalEnd),
        angleDeg: getSegmentAngleDeg(logicalStart, logicalEnd),
        customData: polyline.getExtData()?.customData ?? [],
      };
    }),
  };
};

const downloadExportPayload = (payload) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[.:]/g, "-");

  link.href = url;
  link.download = `pipe-lines-${timestamp}.json`;
  link.click();

  window.URL.revokeObjectURL(url);
};

const exportPipeLines = () => {
  const payload = buildExportPayload();
  if (!payload) {
    console.warn("暂无可导出的线段数据");
    return;
  }

  downloadExportPayload(payload);
  console.log("导出线段数据", payload);
};

const toPlainPixel = (pixel) => {
  if (!pixel) return null;
  if (Array.isArray(pixel)) return [pixel[0], pixel[1]];
  if (typeof pixel.getX === "function" && typeof pixel.getY === "function") {
    return [pixel.getX(), pixel.getY()];
  }
  if (typeof pixel.x === "number" && typeof pixel.y === "number") {
    return [pixel.x, pixel.y];
  }
  return null;
};

// 创建自定义拖拽预览元素
const createDragPreview = (facility, clientX, clientY) => {
  const width = facility.width || DEFAULT_MARKER_SIZE;
  const height = facility.height || DEFAULT_MARKER_SIZE;

  const preview = document.createElement('img');
  preview.src = facility.imageUrl;
  preview.style.cssText = `
    position: fixed;
    width: ${width}px;
    height: ${height}px;
    pointer-events: none;
    z-index: 9999;
    opacity: 0.8;
    left: ${clientX - width / 2}px;
    top: ${clientY - height / 2}px;
  `;

  document.body.appendChild(preview);
  return preview;
};

// 更新预览元素位置
const updateDragPreviewPosition = (clientX, clientY) => {
  if (!dragPreviewElement.value) return;
  const facility = draggedFacility.value;
  const width = facility?.width || DEFAULT_MARKER_SIZE;
  const height = facility?.height || DEFAULT_MARKER_SIZE;

  dragPreviewElement.value.style.left = `${clientX - width / 2}px`;
  dragPreviewElement.value.style.top = `${clientY - height / 2}px`;
};

// 移除预览元素
const removeDragPreview = () => {
  if (dragPreviewElement.value) {
    document.body.removeChild(dragPreviewElement.value);
    dragPreviewElement.value = null;
  }
};

// 鼠标移动时更新预览位置
const handleDocumentMouseMove = (event) => {
  if (!isCustomDragging.value) return;
  updateDragPreviewPosition(event.clientX, event.clientY);
};

// 清理鼠标拖拽状态
const cleanupMouseDrag = () => {
  isCustomDragging.value = false;
  draggedFacility.value = null;
  removeDragPreview();
  document.removeEventListener('mousemove', handleDocumentMouseMove);
  document.removeEventListener('mouseup', handleDocumentMouseUp);
};

// 设施鼠标按下开始拖拽
const handleFacilityMouseDown = (event, facility) => {
  event.preventDefault();

  // 创建自定义预览元素
  isCustomDragging.value = true;
  draggedFacility.value = facility;
  dragPreviewElement.value = createDragPreview(facility, event.clientX, event.clientY);

  // 添加全局鼠标移动和释放监听
  document.addEventListener('mousemove', handleDocumentMouseMove);
  document.addEventListener('mouseup', handleDocumentMouseUp);
};

// 鼠标释放时判断是否放置在地图上
const handleDocumentMouseUp = (event) => {
  if (!isCustomDragging.value) return;

  if (!mapInstance) {
    cleanupMouseDrag();
    return;
  }

  // 判断鼠标是否在地图容器内
  const container = mapInstance.getContainer();
  const rect = container.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // 检查坐标是否在地图容器范围内
  if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
    cleanupMouseDrag();
    return; // 不在地图内，不处理
  }

  try {
    const facility = draggedFacility.value;
    const lngLat = mapInstance.containerToLngLat([x, y]);

    const marker = createFacilityMarker(facility, lngLat);

    // 使用 Command 添加标记
    const cmd = new AddMarkerCommand(marker, cmdContext);
    cmdManager.execute(cmd);

    showToast(`已放置: ${facility.description}`);
  } catch (err) {
    console.error("放置设施失败:", err);
  } finally {
    // 最后清理自定义拖拽状态
    cleanupMouseDrag();
  }
};

const createFacilityMarker = (facility, lngLat) => {
  const width = facility.width || DEFAULT_MARKER_SIZE;
  const height = facility.height || DEFAULT_MARKER_SIZE;

  const marker = new AMap.Marker({
    position: lngLat,
    content: `<img src="${facility.imageUrl}" style="width:${width}px;height:${height}px;pointer-events:none;" draggable="false" />`,
    // 使用 offset 控制标记位置，使标记中心对准 position
    // offset 是相对于 position 的像素偏移，负值向左/上移动
    offset: new AMap.Pixel(-width / 2, -height / 2),
  });

  marker.setExtData({
    facility: { ...facility },
    placedAt: new Date().toISOString(),
  });

  // 添加右键菜单事件
  marker.on("rightclick", (e) => {
    if (operateState.value.drawLineMode) return;
    const pixel = toPlainPixel(e.pixel);
    if (!pixel) return;
    activeMarker = marker;
    contextMenuTarget.value = 'marker';
    contextMenuPosition.value = { x: pixel[0], y: pixel[1] };
    contextMenuVisible.value = true;
  });

  return marker;
};


const findSnapStartPos = (pixel) => {
  if (!mapInstance || !pixel || cmdContext.pipeLines.length === 0) return null;

  let nearestPoint = null;
  let nearestDistance = SNAP_DISTANCE_PX;

  for (const polyline of cmdContext.pipeLines) {
    const endpoints = polyline.getExtData()?.endpoints ?? [];

    for (const endpoint of endpoints) {
      const endpointPixel = toPlainPixel(
        mapInstance.lngLatToContainer(endpoint),
      );
      if (!endpointPixel) continue;

      const dx = endpointPixel[0] - pixel[0];
      const dy = endpointPixel[1] - pixel[1];
      const distance = Math.hypot(dx, dy);

      if (distance <= nearestDistance) {
        nearestDistance = distance;
        nearestPoint = endpoint;
      }
    }
  }

  return nearestPoint ? [...nearestPoint] : null;
};

const setPipeLineStyle = (polyline, style) => {
  polyline.setOptions(style);
};

const resetAllPipeLineStyles = () => {
  for (const polyline of cmdContext.pipeLines) {
    setPipeLineStyle(polyline, lineStyle);
  }
};

const openPopup = (polyline, pixel) => {
  if (popupVisible.value) return;
  const extData = polyline.getExtData();
  activePolyline = polyline;
  popupCustomData.value = (extData?.customData ?? []).map((item, i) => ({
    ...item,
    _id: i,
  }));
  popupPosition.value = { x: pixel[0], y: pixel[1] };
  popupVisible.value = true;
};

const handlePopupSave = (data) => {
  if (!activePolyline) return;
  const extData = activePolyline.getExtData() || {};
  activePolyline.setExtData({
    ...extData,
    customData: data,
  });
  activePolyline = null;
};

const deletePipeLine = (polyline) => {
  const cmd = new DeleteSegmentCommand(polyline, cmdContext);
  cmdManager.execute(cmd);
  showToast("已删除线段");
};

const handleMenuEdit = () => {
  if (!activePolyline) return;
  openPopup(activePolyline, [
    contextMenuPosition.value.x,
    contextMenuPosition.value.y,
  ]);
};

const deleteMarker = (marker) => {
  const cmd = new DeleteMarkerCommand(marker, cmdContext);
  cmdManager.execute(cmd);
  showToast("已删除标记");
};

const handleMenuDelete = async () => {
  if (!activePolyline && !activeMarker) return;
  try {
    await ElMessageBox.confirm("确定删除？", "删除确认", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
    if (contextMenuTarget.value === 'segment' && activePolyline) {
      deletePipeLine(activePolyline);
      activePolyline = null;
    } else if (contextMenuTarget.value === 'marker' && activeMarker) {
      deleteMarker(activeMarker);
      activeMarker = null;
    }
  } catch {
    // 用户取消
  }
};

const drawLine = (line) => {
  const startPoint = [...line[0]];
  const endPoint = [...line[1]];
  const polyline = new AMap.Polyline({
    path: [startPoint, endPoint],
    ...lineStyle,
  });

  polyline.setExtData({
    endpoints: [startPoint, endPoint],
    customData: [],
  });

  polyline.on("mouseover", () => {
    if (operateState.value.drawLineMode) return;
    setPipeLineStyle(polyline, activeLineStyle);
  });

  polyline.on("mouseout", () => {
    setPipeLineStyle(polyline, lineStyle);
  });

  polyline.on("rightclick", (e) => {
    if (operateState.value.drawLineMode) return;
    const pixel = toPlainPixel(e.pixel);
    if (!pixel) return;
    activePolyline = polyline;
    contextMenuTarget.value = 'segment';
    contextMenuPosition.value = { x: pixel[0], y: pixel[1] };
    contextMenuVisible.value = true;
  });

  // 使用 Command 添加线段
  const cmd = new AddSegmentCommand(polyline, cmdContext);
  cmdManager.execute(cmd);
};

const undo = () => {
  const cmd = cmdManager.undo();
  if (cmd) {
    showToast(`已撤销: ${cmd.description}`);
  }
  return !!cmd;
};

const redo = () => {
  const cmd = cmdManager.redo();
  if (cmd) {
    showToast(`已重做: ${cmd.description}`);
  }
  return !!cmd;
};

/// 处理线条的绘制
const handleDrawLine = (event) => {
  if (!operateState.value.drawLineMode) return;
  if (!posValid(clickPos)) return;

  if (!posValid(drawLineStartPos)) {
    const snapDisabled = event?.originEvent?.altKey;
    const snapStartPos = snapDisabled
      ? null
      : findSnapStartPos(toPlainPixel(event?.pixel));

    drawLineStartPos = snapStartPos ?? [...clickPos];
    updatePreviewLine(clickPos);
    return;
  }

  drawLineEndPos = [...clickPos];
  const line = [drawLineStartPos, drawLineEndPos];
  drawLine(line);
  drawLineStartPos = [...drawLineEndPos];
  updatePreviewLine();
};

const moveMapHandler = (e) => {
  if (loadStatus.value !== "loaded") return;
  if (!operateState.value.drawLineMode) return;

  hoverPos = [e.lnglat.getLng(), e.lnglat.getLat()];
  updatePreviewLine();
};

const clickMapHandler = (e) => {
  if (loadStatus.value !== "loaded") {
    console.error("Uninitialized map");
    return;
  }

  if (popupVisible.value) return;

  // 更新用户点击位置
  clickPos[0] = e.lnglat.getLng();
  clickPos[1] = e.lnglat.getLat();

  // 绘制管道
  handleDrawLine(e);
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);

  AMapLoader.load({
    key: "bf16eadc6638cfe35225ad5907a424fb",
    version: "2.0",
  })
    .then((AMap) => {
      mapInstance = new AMap.Map("container", {
        defaultCursor: operateState.value.drawLineMode
          ? "crosshair"
          : "default",
      });

      // 初始化命令上下文
      cmdContext.mapInstance = mapInstance;

      previewLine = new AMap.Polyline({
        path: [],
        strokeColor: "#3366FF",
        strokeWeight: 5,
        strokeStyle: "dashed",
        strokeOpacity: 0.55,
        lineCap: "round",
        lineJoin: "round",
        zIndex: 5,
      });

      mapInstance.add(previewLine);
      previewLine.hide();
      mapInstance.on("click", clickMapHandler);
      mapInstance.on("mousemove", moveMapHandler);
      mapInstance
        .getContainer()
        .addEventListener("contextmenu", (e) => e.preventDefault(), true);

      loadStatus.value = "loaded";
    })
    .catch((e) => {
      console.error(e);
      loadStatus.value = "error";
    });
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);

  // 清理自定义拖拽状态
  cleanupMouseDrag();

  if (mapInstance) {
    mapInstance.off("click", clickMapHandler);
    mapInstance.off("mousemove", moveMapHandler);

    mapInstance.destroy();
    mapInstance = null;
  }

  previewLine = null;
  cmdContext.placedMarkers = [];
  cmdContext.pipeLines = [];
});
</script>

<template>
  <div
    id="container"
    :class="{ 'cursor-crosshair': operateState.drawLineMode }"
  ></div>
  <div class="fixed top-4 right-4 flex gap-2">
    <BaseButton :disabled="!canUndo" @click="undo" title="撤销 (Ctrl+Z)">
      撤销 ({{ undoCount }})
    </BaseButton>
    <BaseButton
      :disabled="!canRedo"
      @click="redo"
      title="重做 (Ctrl+Shift+Z)"
    >
      重做 ({{ redoCount }})
    </BaseButton>
  </div>
  <BaseButton
    :disabled="pipeLineCount === 0"
    class="bottom-16"
    @click="exportPipeLines"
  >
    导出线段
  </BaseButton>
  <BaseButton
    @click="toggleDrawPipeMode"
    :class="{ 'bg-purple-500 hover:bg-purple-600': operateState.drawLineMode }"
    >{{ operateState.drawLineMode ? "绘制模式" : "绘制管道" }}</BaseButton
  >
  <SegmentDataPopup
    v-model:visible="popupVisible"
    :position="popupPosition"
    :custom-data="popupCustomData"
    @save="handlePopupSave"
  />
  <SegmentContextMenu
    v-model:visible="contextMenuVisible"
    :position="contextMenuPosition"
    @edit="handleMenuEdit"
    @delete="handleMenuDelete"
  />

  <div class="facility-list">
    <h3 class="facility-title">设施列表</h3>
    <div class="facility-scroll-container">
      <div
        v-for="(item, index) in facilityList"
        :key="index"
        class="facility-item"
        :title="item.description"
      >
        <img
          :src="item.imageUrl"
          :alt="item.description"
          class="facility-image"
          draggable="false"
          @mousedown="handleFacilityMouseDown($event, item)"
        />
        <p class="facility-description">{{ item.description }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
#container {
  height: 100%;
}

.facility-list {
  position: absolute;
  right: 16px;
  top: 16px;
  width: fit-content;
  height: auto;
  min-height: 140px;
  background: rgb(59, 130, 246);
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 16px;
  z-index: 999;
  overflow: hidden;
}

.facility-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.facility-scroll-container {
  display: grid;
  grid-template-columns: repeat(4, 90px);
  gap: 12px;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 222px;
  padding-right: 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.5) transparent;
}

.facility-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.facility-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.5);
  border-radius: 3px;
}

.facility-item {
  width: 90px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.facility-item:hover {
  transform: scale(1.05);
}

.facility-image {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  object-fit: cover;
  margin: 0 auto 8px;
  display: block;
  background: rgba(255,255,255,0.2);
  user-select: none;
  -webkit-user-select: none;
}

.facility-description {
  font-size: 12px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  margin: 0;
}
</style>
