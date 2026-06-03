<script setup>
import { onMounted, onUnmounted, ref } from "vue";
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
import { ElMessage, ElMessageBox } from "element-plus";
import PropertyPanel from "./components/PropertyPanel.vue";
import FacilityList from "./components/FacilityList.vue";
import {
  DRAW_FACILITY_MODE,
  DRAW_IDEL_MODE,
  DRAW_POLYLINE_MODE,
  EDIT_EXT_DATA_MODE,
} from "./constants/drawModeStates";
import Header from "./components/Header.vue";
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from "@headlessui/vue";
import DatabasePanel from "./components/DatabasePanel.vue";

const appStatStore = useAppStatStore();
const { appStat } = storeToRefs(appStatStore);
let drawMode = appRuntime.drawModeSM.getStateRef();

const facilityList = appStat.value.facilities;

// 绘制线段时的起始点
let drawLineStartPos = null;
// 绘制线段时的终点
let drawLineEndPos = null;
// 当前鼠标位置对应的经纬度坐标
let currentMousePosLnglat = null;
// 默认线段样式
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
// 当前按下按键的缓存
let keysPressed = {};
// 当前选中设施的id
const currentSelectedFacilityId = ref(-1);
// 当前选中对象的数据
const currentObjExtData = ref(null);
// 当前选中的对象
let currentSelectObj = null;
// 初始自定义数据
const initialExtData = {
  type: "",
  fixedData: [
    {
      name: "深度",
      en_name: "depth",
      value: "",
    },
    {
      name: "数据1",
      en_name: "custom_data1",
      value: "",
    },
    {
      name: "数据2",
      en_name: "custom_data2",
      value: "",
    },
  ],
  extData: [],
  iconSize: 32,
};
// 是否正在拖动对象
let isMovingObj = false;
// 当前正在拖动的对象
let currentDragingObj = null;

/**
 * 处理鼠标在地图元素上移动的事件
 */
function handleMouseMoveOnMap(e) {
  const lnglat = e.lnglat;
  // console.debug(lnglat);
  // console.log(e);
  currentMousePosLnglat = lnglat;
  
  if (!e.originEvent.ctrlKey) {
    if (isMovingObj && currentDragingObj) {
      isMovingObj = false;
      currentDragingObj.setOptions({
        ...currentDragingObj.getOptions(),
        bubble: false,
      });
    }
  } else if (isMovingObj && currentDragingObj) {
    currentDragingObj.setPosition(lnglat);
  }
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
  console.debug(e.key);
  console.debug(e.code);
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
  } else if (keysPressed["Backspace"] && currentSelectObj) {
    handleDeleteCurObj();
  }
}

function handleKeyUp(e) {
  keysPressed[e.key] = false;
}

/**
 * 处理点击地图组件
 */
function handleClickMap(e) {
  console.debug("click map");
  if (drawMode.value === EDIT_EXT_DATA_MODE) {
    appRuntime.drawModeSM.changeCurrentState(DRAW_IDEL_MODE);
  }
}

/**
 * 清空按键缓存避免卡键
 */
function clearKeydownCache() {
  keysPressed = {};
}

onMounted(() => {
  document.addEventListener("keydown", handleKeyPressed);
  document.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", clearKeydownCache);
});

onUnmounted(() => {
  if (appStat.value.mapInstanceLoadStat === "done") {
    appRuntime.mapInstance?.off("mousemove", handleMouseMoveOnMap);
    appRuntime.mapInstance?.off("click", handleClickMap);
  }
  document.removeEventListener("keydown", handleKeyPressed);
  document.removeEventListener("keyup", handleKeyUp);
  window.removeEventListener("blur", clearKeydownCache);
});

/**
 * 开启地图上所有元素的鼠标穿透，包括管道和设施
 */
function openClickThrough() {
  console.debug("open click through");
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
  console.debug("restore click through");
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
 * 地图准备好后注册必要的事件并做一些初始化
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
        console.debug("Enter draw line mode");
        appRuntime.mapInstance.on("click", handleDrawPolyline);
        openClickThrough();
        // ElMessage.success("绘制管道： 开");
      },
      null,
      () => {
        console.debug("Quit draw line mode");
        currentSelectedFacilityId.value = -1;
        appRuntime.drawLinePreviewLine.hide();
        drawLineStartPos = null;
        drawLineEndPos = null;
        appRuntime.mapInstance.off("click", handleDrawPolyline);
        appStat.value.addFacilityContinuously = false;
        restoreClickThrough();
        // ElMessage.warning("绘制管道：关");
      },
    )
    // 绘制设施模式
    .addState(
      DRAW_FACILITY_MODE,
      () => {
        console.debug("Enter draw facility mode");
        appRuntime.mapInstance.on("click", handleDrawFacility);
        openClickThrough();
      },
      null,
      () => {
        console.debug("Quit draw facility mode");
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
        console.debug("Enter edit mode");

        currentSelectObj = target;
        console.debug(currentSelectObj);

        if (!currentSelectObj) {
          return;
        }

        if (currentSelectObj.className === "Overlay.Polyline") {
          updateCurrentPolylineStyle();
        } else if (currentSelectObj.className === "AMap.Marker") {
          const content = currentSelectObj.getContent();
          console.debug(content);
          content.style.filter = "drop-shadow(0 0 5px rgba(0, 0, 0, 1))";
        }

        currentObjExtData.value = currentSelectObj.getExtData();
      },
      (_prevState, target) => {
        console.debug("Run edit mode");

        currentSelectObj = target;
        currentObjExtData.value = currentSelectObj.getExtData();
      },
      () => {
        console.debug("Quit edit mode");

        if (!currentSelectObj) {
          return;
        }

        // 恢复对象样式
        if (currentSelectObj.className === "Overlay.Polyline") {
          currentSelectObj.setOptions({
            ...currentSelectObj.getOptions(),
            strokeColor: defaultLineStyle.strokeColor,
          });
        } else if (currentSelectObj.className === "AMap.Marker") {
          currentSelectObj.getContent().style.filter = "";
        }
        // 保存组件数据
        currentObjExtData.value.extData =
          currentObjExtData.value.extData.filter((val) => {
            return val.key && val.key !== "";
          });
        currentSelectObj.setExtData(currentObjExtData.value);
        currentObjExtData.value = null;
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

  console.debug("经纬坐标：", lnglat);
  console.debug("像素坐标：", pixel);

  // 尝试绘制线段。
  // 如果没有起始点，则创建起始点。
  if (!drawLineStartPos) {
    // 尝试吸附已有端点，当点击位置与线段列表的某个独立端点。
    // 间隔16px以内，将点击位置吸附到对应端点。
    // 按住Alt时吸附不生效。
    // 与多个端点间距16px以内时，取最近的端点。
    drawLineStartPos = lnglat;
    if (!e.originEvent.altKey) {
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
      const endpoints = collectEndpoints(pipePolylinePoints);
      console.debug(endpoints);

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

      console.debug("endpoints:", endpoints);
      console.debug("closestEndpoints:", closestEndpoints);
      if (closestEndpoints.length > 0) {
        drawLineStartPos = container2lnglat(closestEndpoints[0]);
        console.debug("吸附到端点：", drawLineStartPos);
      }
    }
    return;
  }

  drawLineEndPos = lnglat;
  // 创建一条线段
  const polyline = new AMap.Polyline({
    ...defaultLineStyle,
    path: [[drawLineStartPos, drawLineEndPos]],
    bubble: true,
  });

  // 鼠标移入移出事件
  polyline.on("mouseover", handleMouseHoverPolyline);
  polyline.on("mouseout", handleMouseLeavePolyline);
  polyline.on("click", handleClickPolyline);

  let data = { ...initialExtData };
  data.type = "管道";
  polyline.setExtData(data);

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

function handleMouseDownFacility(e) {
  // console.debug(e.originavent.ctrlKey);
  if (e.originEvent.ctrlKey) {
    isMovingObj = true;
    const facility = e.target;
    currentDragingObj = facility;
    facility.setOptions({
      ...facility.getOptions(),
      bubble: true,
    });
  }
}

function handleMouseUpFacility(e) {
  isMovingObj = false;
  currentDragingObj = null;
  const facility = e.target;
  facility.setOptions({
    ...facility.getOptions(),
    bubble: false,
  });
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
  img.width = initialExtData.iconSize;
  img.height = initialExtData.iconSize;
  img.style.width = initialExtData.iconSize + "px";
  img.style.height = initialExtData.iconSize + "px";
  img.style.objectFit = "contain";
  img.style.maxWidth = "none";

  console.debug(img);

  let data = { ...initialExtData, ...facility };
  const marker = new AMap.Marker({
    position: lnglat,
    content: img,
    extData: data,
    bubble: true,
    title: facility.text,
    anchor: "center",
  });

  marker.on("click", handleClickFacility);
  marker.on("mousedown", handleMouseDownFacility);
  marker.on("mouseup", handleMouseUpFacility);

  // setInterval(() => {
  //   console.debug(marker.getOptions().bubble);
  // }, 1000);

  appRuntime.mapInstance.add(marker);
  if (!appStat.value.addFacilityContinuously) {
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
  console.debug(newId, doubleClicked);

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

function handleDeleteCurObj() {
  if (!currentSelectObj) {
    return;
  }

  ElMessageBox.confirm("确认删除此对象吗？", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
  })
    .then(() => {
      appRuntime.mapInstance.remove(currentSelectObj);
      currentSelectObj = null;
      currentObjExtData.value = null;
    })
    .catch((_) => null); // 忽略取消
}
</script>

<template>
  <Header></Header>

  <div class="content">
    <div class="tab">
      <TabGroup>
        <TabList class="tab__list tab__list--padding">
          <Tab as="template" v-slot="{ selected }">
            <div
              :class="{
                tab__item: true,
                'tab__item--active': selected,
              }"
            >
              <span
                class="iconfont icon-layers-1--design-layer-layers-pile-stack-align"
              ></span>
              <span class="tab__item-label">组件</span>
            </div>
          </Tab>

          <Tab as="template" v-slot="{ selected }">
            <div
              :class="{
                tab__item: true,
                'tab__item--active': selected,
              }"
            >
              <span class="iconfont icon-database"></span>
              <span class="tab__item-label">数据库</span>
            </div>
          </Tab>
        </TabList>

        <TabPanels class="tab__panels">
          <TabPanel class="tab__panel">
            <FacilityList
              class="facility-list-panel"
              :currentSelectedId="currentSelectedFacilityId"
              v-on:selectedIdChanged="handleSelectedFacilityIdChanged"
            ></FacilityList>
          </TabPanel>

          <TabPanel class="tab__panel">
            <DatabasePanel class="database-panel"></DatabasePanel>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>

    <GaoDeMap @mapLoaded="onMapReady"></GaoDeMap>

    <PropertyPanel
      :data="currentObjExtData"
      :instance="currentSelectObj"
    ></PropertyPanel>
  </div>
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

.content {
  position: relative;
  display: flex;
  flex: 1;
}

.tab {
  width: fit-content;
  height: 100%;
  display: flex;
}

.tab__list {
  width: fit-content;
  height: 100%;
  border-right: 1px solid rgba(117, 117, 117, 0.2);

  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tab__list--padding {
  padding: 12px 8px;
}

.tab__item {
  width: 48px;
  height: 48px;
  border-radius: 8px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  cursor: pointer;
}
.tab__item:not(.tab__item--active):hover {
  background-color: rgba(72, 72, 72, 0.1);
}

.tab__item--active {
  background-color: rgba(0, 0, 0, 0.15);
}

.tab__item-label {
  font-size: 12px;
}

.tab__panels {
  width: fit-content;
  height: 100%;
}

.tab__panel {
  height: 100%;
}

.facility-list-panel {
  width: 260px;
  height: 100%;
  border-right: 1px solid rgba(117, 117, 117, 0.2);
}

.database-panel {
  width: 260px;
  height: 100%;
  border-right: 1px solid rgba(117, 117, 117, 0.2);
}
</style>
