<script setup>
import { useId } from "vue";
defineProps({ kind: { type: String, default: "plant" } });
const id = useId().replace(/:/g, "");
</script>

<template>
  <svg
    class="illustration"
    :class="`illustration-${kind}`"
    viewBox="0 0 200 200"
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="`${id}-leaf`" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#cbd2b5" />
        <stop offset="1" stop-color="#8da58d" />
      </linearGradient>
      <linearGradient :id="`${id}-gold`" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#f6dfab" />
        <stop offset="1" stop-color="#e8c481" />
      </linearGradient>
      <filter :id="`${id}-paper`">
        <feTurbulence
          type="fractalNoise"
          baseFrequency=".19"
          numOctaves="3"
          seed="8"
        />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="linear" slope=".09" />
        </feComponentTransfer>
        <feBlend in="SourceGraphic" mode="multiply" />
      </filter>
    </defs>
    <g v-if="kind === 'plant' || kind === 'leaf'" :filter="`url(#${id}-paper)`">
      <ellipse
        v-if="kind === 'plant'"
        cx="101"
        cy="186"
        rx="40"
        ry="7"
        fill="#e9e8d9"
        opacity=".55"
      />
      <path
        d="M102 183C98 150 115 127 103 96C97 78 103 56 99 24"
        stroke="#91a084"
        stroke-width="2.3"
        stroke-linecap="round"
      />
      <path
        d="M102 91C72 86 69 61 74 54C94 58 101 73 102 91Z"
        :fill="`url(#${id}-leaf)`"
      />
      <path
        d="M104 111C127 104 140 81 137 70C116 72 107 90 104 111Z"
        fill="#aab999"
      />
      <path
        d="M105 133C77 132 59 111 64 100C87 103 100 119 105 133Z"
        fill="#b7c5ad"
      />
      <path
        d="M104 155C127 149 144 133 139 119C115 119 106 139 104 155Z"
        :fill="`url(#${id}-leaf)`"
      />
      <path
        d="M100 175C77 172 65 158 66 146C85 146 96 160 100 175Z"
        fill="#a7b89d"
      />
      <path d="M99 60C85 46 85 27 97 12C110 23 111 46 99 60Z" fill="#c9cba7" />
      <path
        d="M102 79C119 74 130 54 126 43C107 47 103 65 102 79Z"
        fill="#bcc6a6"
      />
      <g stroke="#859a7f" stroke-width=".7" opacity=".6">
        <path
          d="m76 61 25 30m34-14-30 34m-37-4 36 26m31-6-31 28M97 22l2 38m22-10-19 29"
        />
      </g>
      <path
        v-if="kind === 'plant'"
        d="M85 176h33l-5 19H91Z"
        fill="#e5d6ba"
        opacity=".7"
      />
    </g>
    <g v-else-if="kind === 'brand'">
      <path d="M86 143C40 129 44 83 52 68c33 7 45 40 34 75Z" fill="#a4b49b" />
      <path
        d="M85 139C70 80 102 44 154 35C162 91 127 126 85 139Z"
        fill="#c1cab1"
      />
      <path
        d="m72 165 57-98m-41 69-29-44"
        stroke="#82997f"
        stroke-width="3"
        stroke-linecap="round"
      />
    </g>
    <g v-else-if="kind === 'sun'">
      <circle cx="100" cy="92" r="34" fill="#f9dfaa" />
      <circle cx="100" cy="92" r="25" fill="#f5d597" />
      <g stroke="#e9bd73" stroke-width="2.5" stroke-linecap="round">
        <path
          d="M100 42V30m0 124v-12m50-50h12M38 92H26m111-37 8-8M55 137l8-8m74 0 8 8M55 47l8 8"
        />
      </g>
      <path d="M88 122v15c0 7 24 7 24 0v-15" fill="#b3b69a" />
      <path d="M88 132h24m-20 8h16" stroke="#8e997e" stroke-width="2" />
      <path
        d="m90 88 10 14 10-14m-10 14v22"
        stroke="#e5b665"
        stroke-width="2"
      />
    </g>
    <g v-else-if="kind === 'cup'" :filter="`url(#${id}-paper)`">
      <ellipse cx="93" cy="155" rx="58" ry="10" fill="#e8d5b3" opacity=".7" />
      <path d="M135 96c40-5 38 47-9 40" stroke="#bda684" stroke-width="8" />
      <path d="M47 85h90l-9 58c-8 20-62 20-72 0Z" fill="#e4caa3" />
      <ellipse cx="92" cy="85" rx="46" ry="12" fill="#b99d79" />
      <ellipse cx="92" cy="83" rx="40" ry="7" fill="#eee0c8" />
      <path
        d="M84 64c-17-19 18-19 5-40m22 40c-12-10 10-18 3-30"
        stroke="#cec3a8"
        stroke-width="3"
        stroke-linecap="round"
      />
    </g>
    <g v-else-if="kind === 'cat'" :filter="`url(#${id}-paper)`">
      <ellipse cx="103" cy="158" rx="82" ry="10" fill="#e8e4d5" />
      <path
        d="M72 146c-13-22 1-54 32-54 26 0 38 16 40 36 20 1 24 10 42 14 12 6 2 14-11 9l-35-8Z"
        fill="#cab89b"
      />
      <path
        d="M74 136c-11 13-3 23 18 22h43c12-1 15-11 3-16-4-4-11-6-20-6"
        fill="#faf4e5"
      />
      <path d="m32 126 3-43 22 18 22-14 9 42c0 34-58 31-56-3Z" fill="#f8efdc" />
      <path d="m36 91 14 13-14 7m43-14-13 8 16 8" fill="#dba783" />
      <path
        d="M51 108c-4 13-11 17-18 18l2-26m39 5c-4 10-1 14 11 18"
        fill="#c5af8e"
      />
      <path
        d="m41 131 8 3 6-3m10 0 7 3 6-4"
        stroke="#8a8070"
        stroke-width="2"
        stroke-linecap="round"
      />
      <path d="m58 137 5 0-3 3Z" fill="#c79e8c" />
      <path
        d="M60 140v3m-29-6-12-2m13 8-13 2m64-8 12-3"
        stroke="#b8aa94"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <path
        d="M100 103c-2 9 3 17 10 22m10-22c-3 12 3 18 12 22"
        stroke="#ac9678"
        stroke-width="8"
        stroke-linecap="round"
      />
      <path
        d="M23 156c-9-15-10-19-12-17-3 6 4 15 12 17m1 0c0-11 8-17 11-15 3 7-6 14-11 15"
        fill="#a6b59a"
      />
    </g>
    <g v-else-if="kind === 'walk'" :filter="`url(#${id}-paper)`">
      <ellipse cx="102" cy="159" rx="73" ry="10" fill="#dfe6d8" />
      <path
        d="m44 116 25-36 25 24 29 6 15 20 21 7-8 17H39c-13-9-13-29 5-38Z"
        fill="#a6bcc7"
      />
      <path d="M35 143h121l5 10c-40 12-79 10-124 2Z" fill="#f7f0e4" />
      <path
        d="m80 102 20 10m-27 0 24 11m-18-1 19 10"
        stroke="#f4f3e8"
        stroke-width="4"
        stroke-linecap="round"
      />
      <path d="M39 146c44 8 79 9 114 3" stroke="#93aab4" stroke-width="2" />
    </g>
  </svg>
</template>
