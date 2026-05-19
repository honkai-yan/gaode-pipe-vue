<script setup>
import { ref, computed, watch, nextTick, getCurrentInstance } from "vue";

const props = defineProps({
  visible: Boolean,
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  customData: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:visible", "save"]);

const instance = getCurrentInstance();
const $message = computed(() => instance.appContext.config.globalProperties.$message);

const localData = ref([]);

watch(
  () => props.visible,
  (val) => {
    if (val) {
      localData.value = props.customData.map((item, i) => ({ ...item, _id: i }));
    }
  },
);

const hasEmptyField = computed(() =>
  localData.value.some((row) => !row.key.trim() || !row.value.trim()),
);

const isRowInvalid = (row) => !row.key.trim() || !row.value.trim();

const popupStyle = computed(() => {
  const POPUP_WIDTH = 400;
  const POPUP_MAX_HEIGHT = 400;
  const MARGIN = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let x = props.position.x;
  let y = props.position.y;

  if (x + POPUP_WIDTH + MARGIN > vw) {
    x = vw - POPUP_WIDTH - MARGIN;
  }
  if (x < MARGIN) x = MARGIN;

  if (y + POPUP_MAX_HEIGHT + MARGIN > vh) {
    y = vh - POPUP_MAX_HEIGHT - MARGIN;
  }
  if (y < MARGIN) y = MARGIN;

  return {
    left: `${x}px`,
    top: `${y}px`,
  };
});

const addRow = () => {
  localData.value.push({ key: "", value: "", _id: Date.now() });
};

const deleteRow = (index) => {
  localData.value.splice(index, 1);
};

const tryClose = () => {
  if (hasEmptyField.value) {
    $message.value.warning("请填写完整的键名和值");
    return;
  }
  const data = localData.value.map(({ key, value }) => ({ key, value }));
  emit("save", data);
  emit("update:visible", false);
};

const handleOverlayClick = () => {
  tryClose();
};
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="segment-popup-overlay" @click="handleOverlayClick">
      <div class="segment-popup" :style="popupStyle" @click.stop>
        <div class="popup-header">
          <span class="popup-title">线段数据</span>
          <el-button text circle size="small" @click="tryClose">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </el-button>
        </div>

        <el-scrollbar max-height="320px" class="popup-body">
          <div v-if="localData.length === 0" class="empty-hint">
            暂无自定义数据
          </div>
          <div v-else class="data-rows">
            <div
              v-for="(row, index) in localData"
              :key="row._id"
              class="data-row"
            >
              <el-input
                v-model="row.key"
                placeholder="键名"
                size="small"
                :class="{ 'is-error': row.key !== undefined && !row.key.trim() }"
              />
              <el-input
                v-model="row.value"
                placeholder="值"
                size="small"
                :class="{ 'is-error': row.value !== undefined && !row.value.trim() }"
              />
              <el-button
                type="danger"
                text
                circle
                size="small"
                class="row-delete-btn"
                @click="deleteRow(index)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </el-button>
            </div>
          </div>
        </el-scrollbar>

        <div class="popup-footer">
          <el-button size="small" @click="addRow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="margin-right: 4px"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            添加数据
          </el-button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.segment-popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: transparent;
}

.segment-popup {
  position: fixed;
  width: 400px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 2001;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.popup-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.popup-body {
  padding: 12px 16px;
}

.empty-hint {
  text-align: center;
  color: #9ca3af;
  padding: 24px 0;
  font-size: 13px;
}

.data-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-row {
  display: grid;
  grid-template-columns: 1fr 1fr 28px;
  gap: 8px;
  align-items: center;
}

.row-delete-btn {
  justify-self: center;
}

.popup-footer {
  display: flex;
  justify-content: flex-start;
  padding: 10px 16px;
  border-top: 1px solid #e5e7eb;
}
</style>
