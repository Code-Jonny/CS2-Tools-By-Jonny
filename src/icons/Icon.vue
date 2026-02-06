<script setup lang="ts">
  import { ref, watch, computed, onMounted } from 'vue';

  const props = defineProps<{
    iconName: string;
    fillColor?: string;
    size?: string | number;
    customClass?: string;
  }>();

  const svgContent = ref("");
  const isLoading = ref(true);
  const hasError = ref(false);

  const svgModules = import.meta.glob("./*.svg", {
    query: "?raw",
    import: "default",
    eager: false,
  });

  const loadSvg = async () => {
    isLoading.value = true;
    hasError.value = false;
    svgContent.value = "";

    // Handle both cases if caller passes "home" or "home.svg" though interface said "without extension"
    const name = props.iconName.replace('.svg', '');
    const path = `./${name}.svg`;

    if (svgModules[path]) {
      try {
        const mod = await svgModules[path]();
        if (typeof mod === 'string') {
          svgContent.value = mod;
        } else {
          hasError.value = true;
        }
      } catch (e) {
        console.error(e);
        hasError.value = true;
      }
    } else {
      console.warn(`Icon ${props.iconName} not found at ${path}`);
      hasError.value = true;
    }
    isLoading.value = false;
  };

  watch(() => props.iconName, loadSvg);
  onMounted(loadSvg);

  const computedSize = computed(() => {
    if (typeof props.size === "number") return `${props.size}px`;
    if (!props.size) return "24px";
    // Check if string contains only digits
    if (/^\d+$/.test(props.size)) return `${props.size}px`;
    return props.size;
  });
  const computedFillColor = computed(() => props.fillColor || "#E0E0E0");

</script>

<template>
  <span class="svg-icon-wrapper" :class="customClass"
        :style="{ color: computedFillColor, width: computedSize, height: computedSize }"
        role="img" :aria-label="`${iconName} icon`">
    <span v-if="isLoading" class="loading-placeholder"
          :style="{ width: computedSize, height: computedSize }"></span>
    <svg v-else-if="hasError" viewBox="0 0 24 24" fill="currentColor"
         width="100%" height="100%">
      <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
    <div v-else v-html="svgContent" class="svg-content"></div>
  </span>
</template>

<style scoped>
  .svg-icon-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    fill: inherit;
    color: inherit;
  }

  .svg-content {
    width: 100%;
    height: 100%;
    display: flex;
  }

  /* Deep selector to target v-html content */
  .svg-content :deep(svg) {
    width: 100%;
    height: 100%;
    display: block;
    fill: inherit;
  }

  .svg-content :deep(svg [fill]:not([fill="none"]):not([fill="currentColor"])) {
    fill: currentColor;
  }

  .loading-placeholder {
    display: inline-block;
    background-color: rgba(128, 128, 128, 0.1);
    border-radius: 3px;
  }
</style>
