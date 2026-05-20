<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useAppStatStore } from "@/store/appState";
import { storeToRefs } from "pinia";
import { appRuntime } from "@/runtime/appRuntime";

const appStatStore = useAppStatStore();
const { appStat } = storeToRefs(appStatStore);
const drawLinePreviewLineStyle = {
  outlineColor: "#ffeeff",
  borderWeight: 3,
  strokeColor: "#3366FF",
  strokeOpacity: 1,
  strokeWeight: 6,
  strokeStyle: "dashed",
  // strokeStyle是dashed时有效
  strokeDasharray: [10, 5],
  lineJoin: "round",
  lineCap: "round",
  zIndex: 50,
};

const emit = defineEmits(["mapLoaded"]);

onMounted(() => {
  AMapLoader.load({
    key: "bf16eadc6638cfe35225ad5907a424fb",
    version: "2.0",
  })
    .then((AMap) => {
      appRuntime.mapInstance = new AMap.Map("container");

      // 添加绘制折现时的预览线
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

      console.log("地图加载成功");
      // console.log(appStat.value.mapInstanceLoadStat);
      appStat.value.mapInstanceLoadStat = "done";
      emit("mapLoaded");
    })
    .catch((e) => {
      console.error("地图加载失败：", e);
      appStat.value.mapInstanceLoadStat = "err";
    });
});

onUnmounted(() => {
  appStat.value.mapInstance?.destroy();
  appStat.value.mapInstance = null;
});
</script>

<template>
  <div id="container"></div>
</template>

<style scoped>
#container {
  width: 100svw;
  height: 100svh;
}
</style>
