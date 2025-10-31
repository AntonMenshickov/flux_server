<template>
  <div :class="{ copyable: true, decorated }" @click="copyText"
    :title="copied ? 'Copied!' : 'Click to copy'">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

interface Props {
  decorated?: boolean
}

withDefaults(defineProps<Props>(), {
  decorated: true
})

const copied = ref(false)

const copyText = async (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement | null
  if (!target) return

  const text = target.innerText.trim()

  try {
    await navigator.clipboard.writeText(text)
    copied.value = true


    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch (err) {
    console.error('Failed to copy text:', err)
  }
}
</script>

<style scoped>
.copyable {
  cursor: pointer;
}

.decorated {
  padding: 1px 4px;
  border-bottom: 1px dashed var(--color-border);
  border-radius: var(--border-radius-sm);
  display: inline-block;
  transition: background-color var(--transition-slow);
  user-select: none;
}

.decorated:hover {
  background-color: var(--color-secondary);
}
</style>
