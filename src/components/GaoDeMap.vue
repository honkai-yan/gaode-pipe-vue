<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useAppStatStore } from "@/store/appState";
import { storeToRefs } from "pinia";
import { appRuntime } from "@/runtime/appRuntime";
import { ElMessage, ElLoading } from "element-plus";
import {
  DRAW_FACILITY_MODE,
  DRAW_POLYLINE_MODE,
} from "@/constants/drawModeStates";

const appStatStore = useAppStatStore();
const { appStat } = storeToRefs(appStatStore);
const drawLinePreviewLineStyle = {
  outlineColor: "#ffeeff",
  borderWeight: 3,
  strokeColor: "#3366FF",
  strokeOpacity: 1,
  strokeWeight: 3,
  strokeStyle: "dashed",
  // strokeStyle是dashed时有效
  strokeDasharray: [10, 5],
  lineJoin: "round",
  lineCap: "round",
  zIndex: 50,
};

const emit = defineEmits(["mapLoaded"]);
const drawMode = appRuntime.drawModeSM.getStateRef();
const mapCrosshairCursorOn = ref(false);

watch(drawMode, (newVal) => {
  if (!appRuntime.mapInstance) return;

  if (newVal === DRAW_FACILITY_MODE || newVal === DRAW_POLYLINE_MODE) {
    mapCrosshairCursorOn.value = true;
  } else {
    mapCrosshairCursorOn.value = false;
  }
});

onMounted(() => {
  const loading = ElLoading.service({
    lock: true,
    text: "地图加载中",
    background: "rgba(0, 0, 0, 0.7)",
  });

  AMapLoader.load({
    key: "bf16eadc6638cfe35225ad5907a424fb",
    version: "2.0",
  })
    .then((AMap) => {
      appRuntime.mapInstance = new AMap.Map("container", {
        center: [116.23, 39.64],
        zoom: 5.3,
      });

      // 添加绘制线段时的预览线
      const previewLine = new AMap.Polyline({
        path: [[0, 0]],
        bubble: true,
        ...drawLinePreviewLineStyle,
      });
      previewLine.setExtData({
        preview: true,
      });
      appRuntime.mapInstance.add(previewLine);
      appRuntime.drawLinePreviewLine = previewLine;
      previewLine.hide();

      console.debug("地图加载成功");
      console.debug(appStat.value.mapInstanceLoadStat);
      appStat.value.mapInstanceLoadStat = "done";
      loading.close();
      emit("mapLoaded");
    })
    .catch((e) => {
      console.error("地图加载失败：", e);
      ElMessage.error("地图加载失败！");
      appStat.value.mapInstanceLoadStat = "err";
    });
});

onUnmounted(() => {
  appStat.value.mapInstance?.destroy();
  appStat.value.mapInstance = null;
});
</script>

<template>
  <div
    id="container"
    :class="{ crosshair: mapCrosshairCursorOn }"
    ref="dropableMapElm"
  ></div>
</template>

<style scoped>
#container {
  flex: 1;
  cursor: default !important;
  position: relative;
}
#container.crosshair {
  cursor: crosshair !important;
}
</style>
