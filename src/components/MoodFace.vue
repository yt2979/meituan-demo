<script setup>
defineProps({ tone: { type: Number, default: 3 }, small: Boolean });
</script>
<template>
  <span
    class="mood-face"
    :class="[`mood-tone-${tone}`, { small }]"
    aria-hidden="true"
  >
    <svg viewBox="0 0 80 80" fill="none">
      <path
        d="M66 40c0 16-10 28-27 27C23 69 12 57 13 42c-2-16 9-29 25-29 15-2 28 9 28 27Z"
        fill="var(--face-fill)"
      />
      <ellipse
        cx="24"
        cy="45"
        rx="5"
        ry="3"
        fill="var(--face-cheek)"
        opacity=".7"
      />
      <ellipse
        cx="55"
        cy="45"
        rx="5"
        ry="3"
        fill="var(--face-cheek)"
        opacity=".7"
      />
      <g stroke="var(--face-ink)" stroke-width="2.2" stroke-linecap="round">
        <path v-if="tone === 1" d="m28 33 4 2m16 0 4-2m-18 18q6-6 12 0" />
        <path v-else-if="tone === 2" d="M28 36v2m23-2v2m-17 12q6-4 12 0" />
        <path v-else-if="tone === 3" d="M28 36v1m23-1v1m-16 13h9" />
        <path v-else-if="tone === 4" d="M28 36v2m23-2v2m-17 9q6 7 12 0" />
        <path v-else d="m26 37 3-2 3 2m15 0 3-2 3 2m-19 10q6 9 12 0" />
      </g>
      <path v-if="tone === 1" d="M23 49c-6 7 2 9 2 3Z" fill="#86a8bc" />
    </svg>
    <span class="mood-sprout"></span>
  </span>
</template>
