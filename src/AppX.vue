<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import GaoDeMap from "./components/GaoDeMap.vue";
import { useAppStatStore } from "./store/appState";
import { storeToRefs } from "pinia";
import { appRuntime } from "./runtime/appRuntime";
import {
  collectEndpoints,
  container2lnglat,
  lnglat2contaner,
  pixelPosDistance,
} from "./utils";
import { ElMessage } from "element-plus";
import PropertyPanel from "./components/PropertyPanel.vue";
import FacilityList from "./components/FacilityList.vue";
import {
  DRAW_FACILITY_MODE,
  DRAW_IDEL_MODE,
  DRAW_POLYLINE_MODE,
  EDIT_EXT_DATA_MODE,
} from "./constants/drawModeStates";
import { facilityList } from "./data/facilityList";

const appStatStore = useAppStatStore();
const { appStat } = storeToRefs(appStatStore);
let drawMode = appRuntime.drawModeSM.getStateRef();

let drawLineStartPos = null;
let drawLineEndPos = null;
let currentMousePosLnglat = null;
const defaultLineStyle = {
  outlineColor: "#ffeeff",
  borderWeight: 3,
  strokeColor: "#3366FF",
  strokeOpacity: 1,
  strokeWeight: 3,
  strokeStyle: "solid",
  lineJoin: "round",
  lineCap: "round",
  zIndex: 50,
};
// 临时保存线段的自定义数据
// const customLineData = ref([]);
// 当前按下的按
const keysPressed = {};
// 当前选中的设施的id
const currentSelectedFacilityId = ref(-1);
// 当前选中的对象的数据
const currentObjData = ref(null);
// 当前选中的对象
let currentSelectObj = null;

/**
 * 处理鼠标在地图元素上移动的事件
 */
function handleMouseMoveOnMap(e) {
  currentMousePosLnglat = e.lnglat;
  // console.debug(currentMousePosLnglat);
}

/**
 * 每帧尝试绘制预览线
 */
function drawPreviewLine() {
  if (drawMode.value === DRAW_POLYLINE_MODE && drawLineStartPos) {
    const previewPolyline = appRuntime.drawLinePreviewLine;
    // console.debug(previewPolyline);
    previewPolyline.setPath([[drawLineStartPos, currentMousePosLnglat]]);
    previewPolyline.show();
  }
  requestAnimationFrame(drawPreviewLine);
}

// 处理键盘事件
function handleKeyPressed(e) {
  // console.debug(e.key);
  // console.debug(e.code);
  const key = e.key;
  keysPressed[key] = true;
  if (keysPressed["Escape"]) {
    if (drawMode.value === DRAW_POLYLINE_MODE) {
      appRuntime.drawModeSM.changeCurrentState(DRAW_IDEL_MODE);
    } else if (drawMode.value === DRAW_FACILITY_MODE) {
      appRuntime.drawModeSM.changeCurrentState(DRAW_IDEL_MODE);
    } else if (drawMode.value === EDIT_EXT_DATA_MODE) {
      appRuntime.drawModeSM.changeCurrentState(DRAW_IDEL_MODE);
    }
  } else if (keysPressed["Alt"]) {
    appRuntime.altPressing = true;
  }
}

function handleKeyUp(e) {
  const key = e.key;
  if (key === "Alt") {
    appRuntime.altPressing = false;
  }
  keysPressed[key] = false;
}

/**
 * 处理点击地图组件
 */
function handleClickMap(e) {
  if (drawMode.value === EDIT_EXT_DATA_MODE) {
    appRuntime.drawModeSM.changeCurrentState(DRAW_IDEL_MODE);
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleKeyPressed);
  document.addEventListener("keyup", handleKeyUp);
});

onUnmounted(() => {
  if (appStat.value.mapInstanceLoadStat === "done") {
    appRuntime.mapInstance?.off("mousemove", handleMouseMoveOnMap);
    appRuntime.mapInstance?.off("click", handleClickMap);
  }
  document.removeEventListener("keydown", handleKeyPressed);
  document.removeEventListener("keyup", handleKeyUp);
});

/**
 * 开启地图上所有元素的鼠标穿透，包括管道和设施
 */
function openClickThrough() {
  const polylines = appRuntime.mapInstance.getAllOverlays("polyline");
  if (polylines.length > 0) {
    for (const polyline of polylines) {
      polyline.setOptions({
        ...polyline.getOptions(),
        bubble: true,
      });
    }
  }

  const markers = appRuntime.mapInstance.getAllOverlays("marker");
  if (markers.length > 0) {
    for (const marker of markers) {
      marker.setOptions({
        ...marker.getOptions(),
        bubble: true,
      });
    }
  }
}

/**
 * 还原地图上所有元素的鼠标穿透
 */
function restoreClickThrough() {
  const polylines = appRuntime.mapInstance.getAllOverlays("polyline");
  if (polylines.length > 0) {
    for (const polyline of polylines) {
      polyline.setOptions({
        ...polyline.getOptions(),
        bubble: false,
      });
    }
  }

  const markers = appRuntime.mapInstance.getAllOverlays("marker");
  if (markers.length > 0) {
    for (const marker of markers) {
      marker.setOptions({
        ...marker.getOptions(),
        bubble: false,
      });
    }
  }
}

/**
 * 地图准备好后注册必要的事件并初始化一些全局地图元素
 */
function onMapReady() {
  console.debug(appStat.value.mapInstanceLoadStat);
  if (appStat.value.mapInstanceLoadStat === "done") {
    appRuntime.mapInstance?.on("mousemove", handleMouseMoveOnMap);
    appRuntime.mapInstance?.on("click", handleClickMap);
    console.debug("事件注册完成");
  } else {
    console.error("事件注册失败");
  }

  // 配置状态机
  appRuntime.drawModeSM
    // 空闲模式
    .addState(DRAW_IDEL_MODE)
    // 绘制线段模式
    .addState(
      DRAW_POLYLINE_MODE,
      () => {
        console.log("Enter draw line mode");
        appRuntime.mapInstance.on("click", handleDrawPolyline);
        openClickThrough();
        ElMessage.success("绘制管道： 开");
      },
      null,
      () => {
        console.log("Quit draw line mode");
        currentSelectedFacilityId.value = -1;
        appRuntime.drawLinePreviewLine.hide();
        drawLineStartPos = null;
        drawLineEndPos = null;
        appRuntime.mapInstance.off("click", handleDrawPolyline);
        appStat.value.addFacilityContinuously = false;
        restoreClickThrough();
        ElMessage.warning("绘制管道：关");
      },
    )
    // 绘制设施模式
    .addState(
      DRAW_FACILITY_MODE,
      () => {
        console.log("Enter draw facility mode");
        appRuntime.mapInstance.on("click", handleDrawFacility);
        openClickThrough();
      },
      null,
      () => {
        console.log("Quit draw facility mode");
        currentSelectedFacilityId.value = -1;
        appRuntime.mapInstance.off("click", handleDrawFacility);
        appStat.value.addFacilityContinuously = false;
        restoreClickThrough();
      },
    )
    // 编辑数据模式
    .addState(
      EDIT_EXT_DATA_MODE,
      (_prevState, _ctx, target) => {
        console.log("Enter edit mode");

        currentSelectObj = target;
        // console.debug(currentSelectObj);

        if (currentSelectObj.className === "Overlay.Polyline") {
          updateCurrentPolylineStyle();
        } else if (currentSelectObj.className === "AMap.Marker") {
          const content = currentSelectObj.getContent();
          // console.debug(content);
          content.style.filter = "drop-shadow(0 0 5px rgba(0, 0, 0, .6))";
        }

        currentObjData.value = currentSelectObj.getExtData();
      },
      (_prevState, target) => {
        console.log("Run edit mode");

        currentSelectObj = target;
        currentObjData.value = currentSelectObj.getExtData();
      },
      () => {
        console.log("Quit edit mode");

        // 恢复对象样式
        if (currentSelectObj.className === "Overlay.Polyline") {
          currentSelectObj.setOptions({
            ...currentSelectObj.getOptions(),
            strokeColor: defaultLineStyle.strokeColor,
          });
        } else if (currentSelectObj.className === "AMap.Marker") {
          currentSelectObj.getContent().style.filter = "";
        }
        currentSelectObj.setExtData(currentObjData.value);
        currentObjData.value = null;
        currentSelectObj = null;
      },
    );

  // 开始绘制预览线段
  requestAnimationFrame(drawPreviewLine);
}

function handleMouseHoverPolyline(e) {
  if (drawMode.value === DRAW_FACILITY_MODE) return;
  if (e.target === currentSelectObj) return;
  const opt = e.target.getOptions();
  e.target.setOptions({
    ...opt,
    strokeColor: "orange",
  });
}

function handleMouseLeavePolyline(e) {
  if (drawMode.value === DRAW_FACILITY_MODE) return;
  if (e.target === currentSelectObj) return;
  const opt = e.target.getOptions();
  e.target.setOptions({
    ...opt,
    strokeColor: defaultLineStyle.strokeColor,
  });
}

function updateCurrentPolylineStyle() {
  // 将所有线段的颜色改为默认值，然后修改当前线段的颜色。
  const polylines = appRuntime.mapInstance.getAllOverlays("polyline");
  for (const polyline of polylines) {
    const opt = polyline.getOptions();
    polyline.setOptions({
      ...opt,
      strokeColor: defaultLineStyle.strokeColor,
    });
  }
  if (!currentSelectObj) {
    console.debug("currentSelectObj为空");
    return;
  }

  const opt = currentSelectObj.getOptions();
  currentSelectObj.setOptions({
    ...opt,
    strokeColor: "purple",
  });
}

function handleClickPolyline(e) {
  if (drawMode.value === DRAW_FACILITY_MODE) return;
  appRuntime.drawModeSM.changeCurrentState(EDIT_EXT_DATA_MODE, e.target, false);
}

/**
 * 处理绘制线段的事件
 */
function handleDrawPolyline(e) {
  // 经纬坐标
  const lnglat = e.lnglat;
  // 像素坐标
  const pixel = e.pixel;

  // console.debug("经纬坐标：", lnglat);
  // console.debug("像素坐标：", pixel);

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
          // polyline.getPath()返回一个二维数组，
          // 代表该polyline对象的所有线段的坐标集合。
          const [path] = polyline.getPath();
          return [
            [path[0].lng, path[0].lat],
            [path[1].lng, path[1].lat],
          ];
        });
      // console.debug(pipePolylinePaths);

      const endpoints = collectEndpoints(pipePolylinePoints);
      // console.debug(endpoints);

      // 在这些端点中寻找距离光标位置16px以内且最近的端点
      const closestEndpoints = endpoints
        .map((elm) => {
          return lnglat2contaner(elm);
        })
        .filter((endpoint) => {
          return pixelPosDistance(endpoint, pixel) <= 16;
        })
        .sort((a, b) => {
          return pixelPosDistance(a, pixel) - pixelPosDistance(b, pixel);
        });

      // console.debug("endpoints:", endpoints);
      // console.debug("closestEndpoint:", closestEndpoint[0]);
      if (closestEndpoints.length > 0) {
        drawLineStartPos = container2lnglat(closestEndpoints[0]);
        // console.debug("吸附到端点：", drawLineStartPos);
      }
    }
    return;
  }

  drawLineEndPos = lnglat;
  // 创建一条线段
  const polyline = new AMap.Polyline({
    ...defaultLineStyle,
    path: [[drawLineStartPos, drawLineEndPos]],
  });

  // 鼠标移入移出事件
  polyline.on("mouseover", handleMouseHoverPolyline);
  polyline.on("mouseout", handleMouseLeavePolyline);
  polyline.on("click", handleClickPolyline);

  polyline.setExtData({
    type: "管道",
    extData: [],
  });

  // 绘制线段
  appRuntime.mapInstance.add(polyline);

  // 更新起始点到上一个结束点
  drawLineStartPos = drawLineEndPos;
}

function handleClickFacility(e) {
  // 如果当前处于编辑数据模式，则直接切换操作对象
  if (drawMode.value === EDIT_EXT_DATA_MODE) {
    appRuntime.drawModeSM.changeCurrentState(
      EDIT_EXT_DATA_MODE,
      e.target,
      false,
    );
  }
  // 否则只有当前状态为空闲态时才切换到编辑模式
  else if (drawMode.value === DRAW_IDEL_MODE) {
    appRuntime.drawModeSM.changeCurrentState(EDIT_EXT_DATA_MODE, e.target);
  }
}

/**
 * 处理绘制设施的模式
 */
function handleDrawFacility(e) {
  // 经纬坐标
  const lnglat = e.lnglat;
  // 像素坐标
  const pixel = e.pixel;

  const facility = facilityList[currentSelectedFacilityId.value - 1];

  const img = document.createElement("img");
  img.src = facility.iconSrc;
  img.alt = facility.text;
  img.width = 32;
  img.height = 32;
  img.style.width = "32px";
  img.style.height = "32px";
  img.style.objectFit = "contain";
  img.style.maxWidth = "none";

  // console.debug(img);

  const marker = new AMap.Marker({
    position: lnglat,
    content: img,
    extData: {
      ...facility,
      extData: [],
    },
    title: facility.text,
    anchor: "center",
  });

  marker.on("click", handleClickFacility);

  appRuntime.mapInstance.add(marker);
  if (!appRuntime.drawModeSM.getCustomContext().continuously) {
    appRuntime.drawModeSM.changeCurrentState(DRAW_IDEL_MODE);
  }
}

/**
 * 处理当前选择的设施发生变化的事件
 */
function handleSelectedFacilityIdChanged(newId, doubleClicked) {
  if (newId < 1) {
    return;
  }
  // console.log(newId, doubleClicked);

  // id为1的是管道
  if (newId === 1) {
    if (!doubleClicked) {
      appRuntime.drawModeSM.changeCurrentState(DRAW_POLYLINE_MODE);
    }
  } else {
    if (doubleClicked) {
      appStat.value.addFacilityContinuously = true;
    } else {
      appStat.value.addFacilityContinuously = false;
    }
    appRuntime.drawModeSM.changeCurrentState(DRAW_FACILITY_MODE, null);
  }
  currentSelectedFacilityId.value = newId;
}

function handleDeleteObj() {
  if (!currentSelectObj) {
    return;
  }
  appRuntime.mapInstance.remove(currentSelectObj);
  currentObjData.value = null;
}
</script>

<template>
  <GaoDeMap @mapLoaded="onMapReady"></GaoDeMap>

  <FacilityList
    :currentSelectedId="currentSelectedFacilityId"
    v-on:selectedIdChanged="handleSelectedFacilityIdChanged"
  ></FacilityList>

  <PropertyPanel
    class="property-panel"
    :data="currentObjData"
    v-on:deleteObj="handleDeleteObj"
  ></PropertyPanel>
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

.property-panel {
  anchor-name: --property-panel;
}

.draw-polyline-btn {
  position: absolute;
  position-anchor: --property-panel;
  right: anchor(left);
  top: anchor(top);
}

.draw-polyline-btn.active {
  background-color: purple;
}
</style>
