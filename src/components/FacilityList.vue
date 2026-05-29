<script setup>
import { ref } from "vue";
import { DRAW_FACILITY_MODE } from "@/constants/drawModeStates";
import { facilityList } from "@/data/facilityList";
import { appRuntime } from "@/runtime/appRuntime";

const props = defineProps({
  active: {
    type: Boolean,
    required: true,
  },
  currentSelectedId: {
    type: Number,
    required: true,
  },
});

const continuously = ref(false);

if (props.currentSelectedId === -1) {
  continuously.value = false;
}

const emit = defineEmits(["update:currentSelectedId"]);

function isInContinuousDrawMode() {
  return props.active && continuously.value;
}

/**
 * 单击进入添加设施模式
 */
function handleClickFacility(id) {
  // 重复点击相同元素将不生效
  if (id === props.currentSelectedId) return;

  appRuntime.drawModeSM.changeCurrentState(DRAW_FACILITY_MODE);
  emit("update:currentSelectedId", id);
  continuously.value = false;
  appRuntime.drawModeSM.setCustomContext({
    continuously: false,
  });
}

/**
 * 双击进入连续添加设施模式，连续添加模式会给状态机上下文设置continuous属性
 * 来表示可以连续操作
 */
function handleDbClickFacility(id) {
  // 重复点击相同元素且已经处于连续模式将不生效
  if (id === props.currentSelectedId && isInContinuousDrawMode()) return;

  appRuntime.drawModeSM.changeCurrentState(DRAW_FACILITY_MODE);
  emit("update:currentSelectedId", id);
  continuously.value = true;
  appRuntime.drawModeSM.setCustomContext({
    continuously: true,
  });
}
</script>

<template>
  <div class="facility-list-wrapper">
    <el-card class="facility-list">
      <h3 class="title">设施列表</h3>
      <div class="content">
        <div
          v-for="facility in facilityList"
          :class="{
            'facility-item': true,
            active: props.currentSelectedId === facility.id,
            'active-ex':
              props.currentSelectedId === facility.id && continuously,
          }"
          :title="facility.text"
          @click="() => handleClickFacility(facility.id)"
          @dblclick="() => handleDbClickFacility(facility.id)"
        >
          <img
            class="facility-img"
            :src="facility.iconSrc"
            :alt="facility.text"
            :key="facility.id"
          />
        </div>
      </div>
    </el-card>
    <el-tag
      class="mode-instruct"
      v-if="props.active"
      :type="continuously ? 'warning' : 'primary'"
    >
      {{ continuously ? "连续添加设施" : "添加设施" }}
    </el-tag>
  </div>
</template>

<style scoped>
.facility-list-wrapper {
  position: absolute;
  width: fit-content;
  height: 100%;
  left: 0;
  top: 0;
  display: flex;
  align-items: start;
}

.facility-list {
  width: fit-content;
  height: 100%;
  position: relative;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
}

.facility-list .title {
  font-weight: bold;
}

.facility-list .content {
  margin-top: 8px;
  width: fit-content;
  display: grid;
  grid-template-columns: repeat(2, 60px);
  gap: 8px;
}

.facility-list:deep(.el-card__body) {
  padding: 12px !important;
}

.facility-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  padding: 8px;
  background-color: rgb(235, 235, 235);
}
.facility-item.active {
  color: white;
  background-color: rgb(145, 180, 255);
}
.facility-item.active-ex {
  color: white;
  background-color: rgb(255, 225, 176);
}

.facility-item img {
  width: 100%;
  aspect-ratio: 1/1;
  object-fit: cover;
  -webkit-user-drag: none;
  user-select: none;
}

.facility-item p {
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
}
</style>
