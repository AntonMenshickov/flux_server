<template>
  <span class="tag-badge">{{ label }}</span>
</template>

<script setup lang="ts">
defineProps<{
  label: string
}>();
</script>

<style scoped>
.tag-badge {
  background: #e0f2fe;
  color: #0284c7;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-block;
}
</style>
