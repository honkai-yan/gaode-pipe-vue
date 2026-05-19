<script setup>
import { computed, useAttrs } from "vue";
import { twMerge } from "tailwind-merge";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  type: {
    type: String,
    default: "button",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  className: {
    type: [String, Array, Object],
    default: "",
  },
});

const attrs = useAttrs();

const passthroughAttrs = computed(() => {
  const { class: _class, ...restAttrs } = attrs;
  return restAttrs;
});

const isDisabled = computed(() => props.disabled || props.loading);

const buttonClass = computed(() =>
  twMerge(
    "absolute right-4 bottom-4 inline-flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors",
    isDisabled.value && "pointer-events-none opacity-50",
    attrs.class,
    props.className,
  ),
);
</script>

<template>
  <button
    v-bind="passthroughAttrs"
    :type="type"
    :disabled="isDisabled"
    :aria-busy="loading || undefined"
    :class="buttonClass"
  >
    <span
      v-if="loading"
      class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
      aria-hidden="true"
    />
    <span>
      <slot />
    </span>
  </button>
</template>
