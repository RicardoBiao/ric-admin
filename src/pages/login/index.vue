<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LoginForm from '@/components/form/LoginForm.vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { loginUser, loading, error } = useAuth()

const username = ref('')
const password = ref('')
const captchaToken = ref('')
const showCaptcha = ref(false)

const handleCaptchaSuccess = (token: string) => {
  captchaToken.value = token
  showCaptcha.value = false
  // 验证码成功后自动提交登录
  handleLogin()
}

const handleSubmit = () => {
  if (!username.value || !password.value) {
    return
  }
  // 显示验证码
  showCaptcha.value = true
}

const handleLogin = async () => {
  if (!username.value || !password.value) {
    return
  }

  try {
    await loginUser(username.value, password.value, captchaToken.value)
    // 登录成功，跳转到首页
    router.push('/')
  } catch (err) {
    console.error('登录失败:', err)
    // 登录失败，重新显示验证码
    showCaptcha.value = true
    captchaToken.value = ''
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="w-full max-w-md p-6">
      <LoginForm
        v-model:username="username"
        v-model:password="password"
        :loading="loading"
        :error="error"
        :show-captcha="showCaptcha"
        @submit="handleSubmit"
        @captcha-success="handleCaptchaSuccess"
      />
    </div>
  </div>
</template>
