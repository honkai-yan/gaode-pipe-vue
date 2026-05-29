<script setup>
import { facilityList } from "@/data/facilityList";
import { useAppStatStore } from "@/store/appState";
import { storeToRefs } from "pinia";
import { computed } from "vue";

const { appStat } = storeToRefs(useAppStatStore());

const props = defineProps({
  currentSelectedId: {
    type: Number,
    required: true,
  },
});

const facilityItem = computed(() => {
  return (
    facilityList.find((val) => val.id === props.currentSelectedId) || {
      text: "",
    }
  );
});

const emit = defineEmits(["selectedIdChanged"]);

function handleClickFacility(id) {
  // 重复点击相同元素将不生效
  if (id === props.currentSelectedId) {
    return;
  }
  // 告知父组件id发生变化，参数2为false表示id变化由鼠标单击造成，
  // 否则为双击造成，用于告知父组件是否需要进入连续添加模式
  emit("selectedIdChanged", id, false);
}

function handleDbClickFacility(id) {
  // 重复点击相同元素且已经处于连续模式将不生效
  if (id === props.currentSelectedId && appStat.value.addFacilityContinuously) {
    return;
  }
  emit("selectedIdChanged", id, true);
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
              props.currentSelectedId === facility.id &&
              appStat.addFacilityContinuously,
          }"
          :title="facility.text"
          @click="() => handleClickFacility(facility.id)"
          @dblclick="() => handleDbClickFacility(facility.id)"
        >
          <div class="icon-wrapper">
            <img
              :src="facility.iconSrc"
              :alt="facility.text"
              :key="facility.id"
            />
          </div>
          <span>{{ facility.text }}</span>
        </div>
      </div>
    </el-card>
    <el-tag
      class="mode-instruct"
      v-if="props.currentSelectedId !== -1"
      :type="appStat.addFacilityContinuously ? 'warning' : 'primary'"
    >
      {{ appStat.addFacilityContinuously ? "连续添加: " : "添加: " }}
      {{ facilityItem.text }}
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
  anchor-name: --facility-list-wrapper;
}

.facility-list:deep(.el-card__body) {
  padding: 12px;
}

.facility-list .title {
  font-weight: bold;
}

.facility-list .content {
  margin-top: 8px;
  width: fit-content;
  display: grid;
  grid-template-columns: repeat(3, 70px);
  grid-template-rows: 70px;
  grid-auto-rows: 70px;
  gap: 8px;
}

.facility-item {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  /* padding: 8px; */
  background-color: rgba(243, 243, 243, 0.7);
  cursor: pointer;
}
.facility-item:hover {
  background-color: rgb(230, 230, 230);
}
.facility-item.active {
  color: white;
  background-color: rgb(179, 203, 255);
}
.facility-item.active-ex {
  color: inherit;
  background-color: rgb(255, 225, 176);
}

.facility-item .icon-wrapper {
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
}

.facility-item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  -webkit-user-drag: none;
  user-select: none;
}

.facility-item span {
  width: 100%;
  min-height: 10px;
  height: 10px;
  font-size: 10px;
  line-height: 10px;

  padding: 0 4px;

  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mode-instruct {
  max-width: 160px;

  position: absolute;
  position-anchor: --facility-list-wrapper;

  left: anchor(right);
  top: anchor(top);
}

.mode-instruct:deep(span) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
