<script setup>
import { presetComDataKeys } from "@/data/componentDataKeys";

/**
instance: Gaode Instance // 高德的覆盖物对象

data:
{
  type: string,
  extData: {
    key: string,
    val: string,
  }[],
  fixedData: {
    name: string,
    en_name: string,
    value: string
  }[],
  iconSize: number
}
 */
const props = defineProps({
  instance: {
    type: Object,
  },
  data: {
    type: Object,
  },
});

function handleAddData() {
  console.debug(props.data);
  props.data.extData.push({
    key: "",
    value: "",
  });
}

function handleDeleteData(idx) {
  console.debug(idx);
  props.data.extData.splice(idx, 1);
}

function querySearch(_queryString, cb) {
  cb(presetComDataKeys);
}

function handleIconSizeChange(val) {
  if (!props.instance) {
    return;
  }

  const elm = props.instance.getContent();
  console.debug(elm);
  if (!elm) {
    console.error("Get html elm failed");
    return;
  }

  elm.width = val;
  elm.height = val;
  elm.style.width = val + "px";
  elm.style.height = val + "px";
}
</script>

<template>
  <el-card
    :class="{
      'property-panel-wrapper': true,
      active: props.data,
    }"
  >
    <div class="property-panel" v-if="props.data !== null">
      <div class="header" style="border-bottom: 1px solid #ccc">
        <p>对象类型：{{ props.data.type }}</p>
      </div>

      <div class="resize-bar-widget" v-if="props.data.type === '设施'">
        <span>调整图标大小</span>
        <el-slider
          :step="2"
          :min="12"
          :max="64"
          v-model="props.data.iconSize"
          @input="handleIconSizeChange"
        ></el-slider>
      </div>

      <!-- 自定义数据 -->
      <div class="custom-data">
        <div class="header">
          <h3>对象属性</h3>
          <el-button
            class="add-data-btn"
            circle
            type="primary"
            @click="handleAddData"
            >+</el-button
          >
        </div>

        <ul>
          <!-- 固定数据 -->
          <li
            class="data-row"
            :key="idx"
            v-for="(fixedData, idx) in props.data.fixedData"
          >
            <span class="data-row__label">{{ fixedData.name }}</span>
            <!-- 值 -->
            <el-input
              class="data-row__input"
              @keydown.stop
              v-model="fixedData.value"
            ></el-input>
          </li>

          <!-- 自定义数据 -->
          <li class="data-row" v-for="(row, idx) in props.data.extData">
            <!-- 键 -->
            <el-autocomplete
              class="data-row__label"
              @keydown.stop
              v-model="row.key"
              :fetch-suggestions="querySearch"
            ></el-autocomplete>
            <!-- 值 -->
            <el-input
              class="data-row__input"
              @keydown.stop
              v-model="row.value"
            ></el-input>
            <el-button link type="danger" @click="() => handleDeleteData(idx)"
              >×</el-button
            >
          </li>
        </ul>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.property-panel-wrapper {
  position: absolute;
  width: 300px;
  max-width: 300px;
  height: 100%;
  right: -300px;
  top: 0;
  transition: 0.1s right;
  box-shadow: none;
  border-radius: 0;
  border: 0;
  border-left: 1px solid rgba(117, 117, 117, 0.2);
  
  color: #4a4a4a;
}
.property-panel-wrapper.active {
  right: 0;
}

.choose-tip {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.property-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

:deep(.el-card__body) {
  padding: 0;
}

.property-panel > .header {
  display: flex;
  height: fit-content;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
}

.property-panel > .header .del-btn {
  scale: 0.9;
}

.resize-bar-widget {
  display: flex;
  flex-direction: column;
  padding: 12px;
  border-bottom: 1px solid #ccc;
}

.resize-bar-widget span {
  /* font-weight: bold; */
}

.resize-bar-widget:deep(.el-slider) {
  padding: 0 12px;
}

.cutom-name {
  display: flex;
  gap: 10px;
  height: 32px;
}

.cutom-name .label {
  flex-basis: 50px;
  line-height: 32px;
}

.cutom-name .input {
  width: 240px;
}

.custom-data {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.custom-data .header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.custom-data .header h3 {
  /* font-weight: bold; */
}

.custom-data .header .add-data-btn {
  width: 20px;
  height: 20px;
}

.custom-data ul {
  flex: 1;
  overflow-y: auto;
  padding-top: 8px;
  /* background-color: red; */
}

.custom-data .data-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

:deep(.data-row__label) {
  display: block;
  width: 70px;
  font-size: 14px;
}

.data-row__input {
  flex: 1;
}

.custom-data .data-row:last-of-type {
  margin-bottom: 0;
}
</style>
