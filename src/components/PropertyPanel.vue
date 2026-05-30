<script setup>
import { presetComDataKeys } from "@/data/componentDataKeys";
import { ElMessageBox } from "element-plus";

/**
{
  type: string,
  extData: {
    key: string,
    val: string,
  }[],
}
 */
const props = defineProps({
  data: {
    type: Object,
  },
});

function handleAddData() {
  // console.log(props.data);
  props.data.extData.push({
    key: "",
    value: "",
  });
}

function handleDeleteData(idx) {
  // console.log(idx);
  props.data.extData.splice(idx, 1);
}

function querySearch(_queryString, cb) {
  cb(presetComDataKeys);
}
</script>

<template>
  <el-card
    :class="{
      'property-panel-wrapper': true,
      active: props.data,
    }"
  >
    <!-- <div class="choose-tip" v-if="props.data === null">请选择一个对象</div> -->

    <div class="property-panel" v-if="props.data !== null">
      <div class="header">
        <p style="font-weight: bold">对象类型：{{ props.data.type }}</p>
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
        <el-empty
          v-if="props.data.extData.length === 0"
          description="暂无自定义数据"
        ></el-empty>
        <ul v-if="props.data.extData.length > 0">
          <li class="data-row" v-for="(row, idx) in props.data.extData">
            <!-- 键 -->
            <el-autocomplete
              @keydown.stop
              v-model="row.key"
              :fetch-suggestions="querySearch"
            ></el-autocomplete>
            <span>-</span>
            <!-- 值 -->
            <el-input @keydown.stop v-model="row.value"></el-input>
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

.property-panel:deep(.el-card__body) {
  padding: 12px;
}

.property-panel > .header {
  display: flex;
  height: fit-content;
  align-items: center;
  justify-content: space-between;
}

.property-panel > .header .del-btn {
  scale: 0.9;
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
  margin-top: 16px;
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
  font-weight: bold;
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

.custom-data .data-row:last-of-type {
  margin-bottom: 0;
}
</style>
