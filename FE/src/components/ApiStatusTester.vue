<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

const baseUrl = ref('http://localhost:5000/api')
const endpoint = ref('/vitrikho/not-found-demo')
const method = ref<HttpMethod>('GET')
const bodyText = ref('{\n  "sample": true\n}')

const loading = ref(false)
const statusCode = ref<number | null>(null)
const ok = ref<boolean | null>(null)
const responseText = ref('')
const errorText = ref('')

const sendRequest = async () => {
  loading.value = true
  statusCode.value = null
  ok.value = null
  responseText.value = ''
  errorText.value = ''

  try {
    let data: unknown = undefined
    if (method.value !== 'GET' && bodyText.value.trim()) {
      try {
        data = JSON.parse(bodyText.value)
      } catch {
        errorText.value = 'Body JSON không hợp lệ. Vui lòng kiểm tra dấu ngoặc/phẩy.'
        return
      }
    }

    const token = localStorage.getItem('token')
    const res = await axios.request({
      method: method.value,
      url: `${baseUrl.value}${endpoint.value}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      validateStatus: () => true,
      timeout: 15000,
    })

    statusCode.value = res.status
    ok.value = res.status >= 200 && res.status < 300
    responseText.value = JSON.stringify(res.data, null, 2)
  } catch (err: unknown) {
    ok.value = false
    errorText.value = err instanceof Error ? err.message : 'Không gọi được API (network/CORS/server down)'
  } finally {
    loading.value = false
  }
}

const quick404 = () => {
  method.value = 'GET'
  endpoint.value = '/vitrikho/___khong_ton_tai___'
}

const quick200 = () => {
  method.value = 'GET'
  endpoint.value = '/vitrikho'
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-4 rounded-xl border border-slate-200 p-4">
    <h2 class="text-xl font-bold">API Status Tester (FE)</h2>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <label class="flex flex-col gap-1 text-sm">
        Base URL
        <input v-model="baseUrl" class="rounded border px-3 py-2" />
      </label>

      <label class="flex flex-col gap-1 text-sm">
        Endpoint
        <input v-model="endpoint" class="rounded border px-3 py-2" />
      </label>

      <label class="flex flex-col gap-1 text-sm">
        Method
        <select v-model="method" class="rounded border px-3 py-2">
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>PATCH</option>
          <option>DELETE</option>
        </select>
      </label>

      <div class="flex items-end gap-2">
        <button class="rounded bg-slate-700 px-3 py-2 text-white" type="button" @click="quick200">Mẫu 200</button>
        <button class="rounded bg-amber-600 px-3 py-2 text-white" type="button" @click="quick404">Mẫu 404</button>
      </div>
    </div>

    <label class="flex flex-col gap-1 text-sm">
      Body (JSON)
      <textarea v-model="bodyText" rows="8" class="rounded border px-3 py-2 font-mono text-sm" />
    </label>

    <button
      class="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
      type="button"
      :disabled="loading"
      @click="sendRequest"
    >
      {{ loading ? 'Đang gọi...' : 'Gọi API' }}
    </button>

    <div class="rounded border p-3 text-sm">
      <p>
        Status:
        <strong :class="ok ? 'text-green-600' : 'text-red-600'">
          {{ statusCode ?? 'N/A' }}
        </strong>
      </p>
      <p v-if="errorText" class="mt-2 text-red-600">{{ errorText }}</p>
      <pre v-if="responseText" class="mt-2 overflow-auto rounded bg-slate-50 p-3">{{ responseText }}</pre>
    </div>
  </div>
</template>
