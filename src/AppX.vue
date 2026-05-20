<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import GaoDeMap from "./components/GaoDeMap.vue";
import { useAppStatStore } from "./store/appState";
import BaseButton from "./components/BaseButton.vue";
import { storeToRefs } from "pinia";
import { appRuntime } from "./runtime/appRuntime";
import {
  collectEndpoints,
  container2lnglat,
  lnglat2contaner,
  pixelPosDistance,
} from "./utils";
import SegmentContextMenu from "./components/SegmentContextMenu.vue";
import SegmentDataPopup from "./components/SegmentDataPopup.vue";

const appStatStore = useAppStatStore();
const { appStat } = storeToRefs(appStatStore);

let drawLineStartPos = null;
let drawLineEndPos = null;
let currentMousePosLnglat = null;
const defaultLineStyle = {
  outlineColor: "#ffeeff",
  borderWeight: 3,
  strokeColor: "#3366FF",
  strokeOpacity: 1,
  strokeWeight: 6,
  strokeStyle: "solid",
  lineJoin: "round",
  lineCap: "round",
  zIndex: 50,
};
const contextMenuVisible = ref(false);
const dataPopupVisible = ref(false);
const editExtMenuPos = ref({
  x: 0,
  y: 0,
});

function handleMouseMoveOnMap(e) {
  currentMousePosLnglat = e.lnglat;
  // console.log(currentMousePosLnglat);
}

function drawPreviewLine() {
  if (appStat.value.drawLineMode && drawLineStartPos) {
    const previewPolyline = appRuntime.drawLinePreviewLine;
    // console.log(previewPolyline);
    previewPolyline.setPath([[drawLineStartPos, currentMousePosLnglat]]);
    previewPolyline.show();
  }
  requestAnimationFrame(drawPreviewLine);
}

function handleKeyPressed(e) {
  // console.log(e.key);
  const key = e.key;
  if (key === "Escape") {
    if (appStat.value.drawLineMode) {
      toggleDrawLineMode();
    }
  } else if (key === "Alt") {
    appRuntime.altPressing = true;
  }
}

function handleKeyUp(e) {
  const key = e.key;
  if (key === "Alt") {
    appRuntime.altPressing = false;
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleKeyPressed);
  document.addEventListener("keyup", handleKeyUp);
});

onUnmounted(() => {
  if (appStat.value.mapInstanceLoadStat === "done") {
    appRuntime.mapInstance?.off("mousemove", handleMouseMoveOnMap);
  }
  document.removeEventListener("keydown", handleKeyPressed);
  document.removeEventListener("keyup", handleKeyUp);
});

function onMapReady() {
  console.log(appStat.value.mapInstanceLoadStat);
  // 注册必要的事件
  if (appStat.value.mapInstanceLoadStat === "done") {
    appRuntime.mapInstance?.on("mousemove", handleMouseMoveOnMap);
    console.log("事件注册完成");
  } else {
    console.error("事件注册失败");
  }
  // 启动预览线绘制
  requestAnimationFrame(drawPreviewLine);
}

function handleRightClickPolyline(e) {
  const pixel = e.pixel;
  editExtMenuPos.value = {
    x: pixel.x,
    y: pixel.y,
  };
  contextMenuVisible.value = true;
}

function handleClickMapInDrawLineMode(e) {
  // 经纬坐标
  const lnglat = e.lnglat;
  // 像素坐标
  const pixel = e.pixel;

  // console.log("经纬坐标：", lnglat);
  // console.log("像素坐标：", pixel);

  // 尝试绘制线段。
  // 如果没有起始点，则创建起始点。
  if (!drawLineStartPos) {
    // 尝试吸附已有端点，当点击位置与线段列表的某个独立端点。
    // 间隔16px以内，将点击位置吸附到对应端点。
    // 按住Alt时吸附不生效。
    // 与多个端点间距16px以内时，取最近的端点。
    drawLineStartPos = lnglat;
    if (!appRuntime.altPressing) {
      // 收集所有端点
      const pipePolylinePoints = appRuntime.mapInstance
        .getAllOverlays("polyline")
        .filter((polyline) => {
          // 忽略预览线
          if (polyline.getExtData().preview) {
            return false;
          }
          return true;
        })
        .map((polyline) => {
          // getPath()返回一个二维数组，代表该polyline对象的所有线段的坐标集合。
          const [path] = polyline.getPath();
          return [
            [path[0].lng, path[0].lat],
            [path[1].lng, path[1].lat],
          ];
        });
      // console.log(pipePolylinePaths);

      const endpoints = collectEndpoints(pipePolylinePoints);
      // console.log(endpoints);

      // 在这些端点中寻找距离光标位置16px以内且最近的端点
      const closestEndpoint = endpoints
        .map((elm) => {
          return lnglat2contaner(elm);
        })
        .filter((endpoint) => {
          return pixelPosDistance(endpoint, pixel) <= 16;
        })
        .sort((a, b) => {
          return pixelPosDistance(a, pixel) - pixelPosDistance(b, pixel);
        });

      // console.log("endpoints:", endpoints);
      // console.log("closestEndpoint:", closestEndpoint[0]);
      if (closestEndpoint.length > 0) {
        drawLineStartPos = container2lnglat(closestEndpoint[0]);
        // console.log("吸附到端点：", drawLineStartPos);
      }
    }
    return;
  }

  drawLineEndPos = lnglat;
  // 绘制一条线段
  const polyline = new AMap.Polyline({
    ...defaultLineStyle,
    path: [[drawLineStartPos, drawLineEndPos]],
  });

  // 右键菜单
  polyline.on("rightclick", handleRightClickPolyline);

  appRuntime.mapInstance.add(polyline);

  // 更新起始点到上一个结束点
  drawLineStartPos = drawLineEndPos;
}

function toggleDrawLineMode() {
  appStat.value.drawLineMode = !appStat.value.drawLineMode;
  if (appStat.value.drawLineMode) {
    appRuntime.mapInstance.on("click", handleClickMapInDrawLineMode);
  } else {
    appRuntime.drawLinePreviewLine.hide();
    drawLineStartPos = null;
    drawLineEndPos = null;
    appRuntime.mapInstance.off("click", handleClickMapInDrawLineMode);
  }
}
</script>

<template>
  <GaoDeMap @mapLoaded="onMapReady"></GaoDeMap>
  <BaseButton
    :class="{ 'toggle-edit-mode-btn': true, active: appStat.drawLineMode }"
    @click="toggleDrawLineMode"
    >{{ appStat.drawLineMode ? "绘制管道(开)" : "绘制管道(关)" }}</BaseButton
  >
  <SegmentContextMenu
    v-model:visible="contextMenuVisible"
    :position="editExtMenuPos"
    @edit=""
    @delete=""
  ></SegmentContextMenu>

  <SegmentDataPopup
    v-model:visible="dataPopupVisible"
    :position="editExtMenuPos"
  ></SegmentDataPopup>
</template>

<style scoped>
.toggle-edit-mode-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background-color: rgb(10, 88, 255);
}
.toggle-edit-mode-btn:hover {
  background-color: rgb(43, 110, 254);
}

.toggle-edit-mode-btn.active {
  background-color: rgb(153, 0, 153);
}
.toggle-edit-mode-btn.active:hover {
  background-color: rgb(182, 0, 182);
}
</style>
