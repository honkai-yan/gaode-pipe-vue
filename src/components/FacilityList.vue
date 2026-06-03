<script setup>
import { DRAW_IDEL_MODE } from "@/constants/drawModeStates";
import { appRuntime } from "@/runtime/appRuntime";
import { useAppStatStore } from "@/store/appState";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import { ElMessage } from "element-plus";

const isAddCompDialogOpen = ref(false);

const { appStat } = storeToRefs(useAppStatStore());

const facilityList = appStat.value.facilities;
const uploadImgUrl = ref(null);
const addCompName = ref("");
const fileSelector = ref(null);

function handleUploadImgChanged(e) {
  console.debug(e.target.files);
  if (e.target.files.length === 0) {
    return;
  }

  const file = e.target.files[0];
  if (!file.type.startsWith("image/")) {
    ElMessage.error("必须上传一张图片");
    return;
  }
  if (file.size > 1024 * 1024 * 2) {
    ElMessage.error("图片大小不能超过2MB");
    return;
  }

  uploadImgUrl.value = URL.createObjectURL(file);
}

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

function handleOpenAddComponentDialog() {
  appRuntime.drawModeSM.changeCurrentState(DRAW_IDEL_MODE);
  isAddCompDialogOpen.value = true;
}

function handleAddComponent() {
  if (!addCompName.value) {
    ElMessage.error("请输入组件名称");
    return;
  }
  if (!uploadImgUrl.value) {
    ElMessage.error("请上传组件图片");
    return;
  }

  const id = facilityList[facilityList.length - 1].id + 1;
  appStat.value.facilities.push({
    id,
    iconSrc: uploadImgUrl.value,
    text: addCompName.value,
    type: "设施",
  });

  handleCloseDialog();
}

function handleCloseDialog() {
  isAddCompDialogOpen.value = false;
  addCompName.value = "";
  uploadImgUrl.value = null;
}
</script>

<template>
  <div>
    <el-card class="facility-list-wrapper">
      <div class="comp-menu">
        <div
          class="comp-menu__item"
          style="
            background-color: rgba(125, 197, 235, 0.19);
            color: rgb(125, 197, 235);
          "
        >
          <div
            class="comp-menu__icon iconfont icon-component"
            style="font-size: 24px"
          ></div>
          <span class="comp-menu__label">基础组件</span>
        </div>

        <div
          class="comp-menu__item"
          style="
            background-color: rgba(174, 184, 250, 0.19);
            color: rgb(177, 186, 250);
          "
        >
          <div
            class="comp-menu__icon iconfont icon-plus1"
            style="font-size: 24px"
            @click="handleOpenAddComponentDialog"
          ></div>
          <span class="comp-menu__label">添加组件</span>
        </div>

        <div
          class="comp-menu__item"
          style="
            background-color: rgba(244, 234, 41, 0.125);
            color: rgb(244, 236, 138);
          "
        >
          <div
            class="comp-menu__icon iconfont icon-question-circle"
            style="font-size: 24px"
          ></div>
          <span class="comp-menu__label">Q&A</span>
        </div>
      </div>

      <h3 class="title" style="margin-top: 12px">基础组件</h3>
      <div class="facility-list">
        <div
          v-for="facility in facilityList"
          :class="{
            'facility-list__item': true,
            active: props.currentSelectedId === facility.id,
            'active-ex':
              props.currentSelectedId === facility.id &&
              appStat.addFacilityContinuously,
          }"
          :title="facility.text"
          @click="() => handleClickFacility(facility.id)"
          @dblclick="() => handleDbClickFacility(facility.id)"
        >
          <div class="facility-list__icon-wrapper">
            <img
              :src="facility.iconSrc"
              :alt="facility.text"
              :key="facility.id"
            />
          </div>
          <span>{{ facility.text }}</span>
        </div>

        <!-- 添加组件 -->
        <div
          class="facility-list__item"
          title="添加组件"
          @click="handleOpenAddComponentDialog"
        >
          <div
            class="iconfont icon-plus facility-item__icon"
            style="font-size: 32px"
          ></div>
          <span>添加组件</span>
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

    <Dialog
      :open="isAddCompDialogOpen"
      @close="handleCloseDialog"
      style="position: relative; z-index: 10"
    >
      <div class="add-comp-dialog">
        <DialogPanel class="add-comp-dialog__panel">
          <DialogTitle class="add-comp-dialog__title">
            <h3>添加组件</h3>
            <div
              class="add-comp-dialog__close iconfont icon-close"
              @click="handleCloseDialog"
            ></div>
          </DialogTitle>

          <div class="add-comp-dialog__body">
            <div class="form-row">
              <label for="comp-name">组件名称</label>
              <input
                v-model="addCompName"
                id="comp-name"
                type="text"
                placeholder="请输入组件名称"
              />
            </div>

            <div class="form-row">
              <label for="comp-img-uploader">组件图标</label>
              <div
                class="form-row__uploader"
                @click="
                  () => {
                    fileSelector?.click();
                  }
                "
              >
                <input
                  id="comp-img-uploader"
                  type="file"
                  ref="fileSelector"
                  style="display: none"
                  @change="handleUploadImgChanged"
                  accept="image/*"
                />
                <img v-if="uploadImgUrl" :src="uploadImgUrl" alt="上传的图片" />
                <span
                  v-else
                  class="iconfont icon-plus"
                  style="font-size: 48px"
                ></span>
              </div>
            </div>
          </div>

          <div class="add-comp-dialog__footer">
            <div class="add-comp-dialog__btns">
              <el-button style="margin-left: auto" @click="handleCloseDialog"
                >取消</el-button
              >
              <el-button type="primary" @click="handleAddComponent"
                >确认</el-button
              >
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.facility-list-wrapper {
  width: fit-content;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  anchor-name: --facility-list-wrapper;
  box-shadow: none;
  border-radius: 0;
  border: 0;
}

.facility-list-wrapper:deep(.el-card__body) {
  padding: 12px;
}

.facility-list-wrapper .title {
  font-weight: bold;
}

.comp-menu {
  width: fit-content;
  display: grid;
  grid-template-columns: repeat(3, 70px);
  grid-template-rows: 70px;
  grid-auto-rows: 70px;
  gap: 12px;
}

.comp-menu__item {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background-color: rgba(239, 239, 239, 0.7);
  cursor: pointer;
}

.comp-menu__icon {
  height: 45px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 8px;
}

.comp-menu__label {
  width: 100%;
  min-height: 10px;
  height: 10px;
  font-size: 10px;
  line-height: 10px;

  padding: 0 8px;

  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.facility-list {
  margin-top: 8px;
  width: fit-content;
  display: grid;
  grid-template-columns: repeat(3, 70px);
  grid-template-rows: 70px;
  grid-auto-rows: 70px;
  gap: 12px;
}

.facility-list__item {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background-color: rgba(239, 239, 239, 0.7);
  cursor: pointer;
}
.facility-list__item:hover {
  background-color: rgb(230, 230, 230);
}
.facility-list__item:active {
  background-color: rgb(209, 209, 209);
}
.facility-list__item.active {
  color: white;
  background-color: rgb(179, 203, 255);
}
.facility-list__item.active-ex {
  color: inherit;
  background-color: rgb(255, 225, 176);
}

.facility-item__icon {
  display: block;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.facility-list__icon-wrapper {
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
}

.facility-list__item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  -webkit-user-drag: none;
  user-select: none;
}

.facility-list__item span {
  width: 100%;
  min-height: 10px;
  height: 10px;
  font-size: 10px;
  line-height: 10px;

  padding: 0 8px;

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

  z-index: 1;
}

.mode-instruct:deep(span) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-comp-widget {
  display: flex;
}

.add-comp-dialog {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.add-comp-dialog__panel {
  min-width: 300px;
  max-width: 560px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 36px rgba(0, 0, 0, 0.3);
}

.add-comp-dialog__title {
  width: 100%;
  padding: 24px;
  font-size: 20px;
  font-weight: bold;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);

  display: flex;
  align-items: center;
  justify-content: space-between;
}

.add-comp-dialog__close {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
}
.add-comp-dialog__close:hover {
  background-color: rgb(255, 194, 194);
  color: rgb(255, 55, 55);
}
.add-comp-dialog__close:active {
  background-color: rgb(255, 177, 177);
}

.add-comp-dialog__body {
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.form-row {
  margin-bottom: 20px;
}

.form-row label {
  display: block;
  width: 100%;
}

.form-row input[type="text"] {
  width: 360px;
  margin-top: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 8px 16px;
  border-radius: 8px;
}

.form-row__uploader {
  margin-top: 4px;
  background-color: rgba(0, 0, 0, 0.07);
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;

  width: 64px;
  height: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.form-row__uploader:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.add-comp-dialog__footer {
  padding: 24px;
}

.add-comp-dialog__btns {
  display: flex;
}
</style>
