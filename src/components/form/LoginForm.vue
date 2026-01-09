<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import CaptchaWidget from '@/components/CaptchaWidget.vue'

const props = defineProps<{
  class?: HTMLAttributes["class"]
  username?: string
  password?: string
  loading?: boolean
  error?: string | null
  showCaptcha?: boolean
}>()

const emit = defineEmits<{
  'update:username': [value: string]
  'update:password': [value: string]
  'submit': [captchaToken?: string]
  'captchaSuccess': [token: string]
}>()

const handleSubmit = (e: Event) => {
  e.preventDefault()
  emit('submit')
}

const handleCaptchaSuccess = (token: string) => {
  emit('captchaSuccess', token)
}
</script>

<template>
  <form :class="cn('flex flex-col gap-6', props.class)" @submit="handleSubmit">
    <FieldGroup>
      <div class="flex flex-col items-center gap-1 text-center">
        <h1 class="text-2xl font-bold">
          登录到您的账户
        </h1>
        <p class="text-muted-foreground text-sm text-balance">
          输入您的用户名和密码登录
        </p>
      </div>
      
      <div v-if="error" class="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
        {{ error }}
      </div>

      <Field>
        <FieldLabel for="username">
          用户名
        </FieldLabel>
        <Input 
          id="username" 
          type="text" 
          placeholder="请输入用户名" 
          required
          :model-value="username"
          @update:model-value="emit('update:username', $event)"
        />
      </Field>
      <Field>
        <FieldLabel for="password">
          密码
        </FieldLabel>
        <Input 
          id="password" 
          type="password" 
          required
          :model-value="password"
          @update:model-value="emit('update:password', $event)"
        />
      </Field>
      
      <!-- 验证码组件 -->
      <Field v-if="showCaptcha">
        <FieldLabel>
          验证码
        </FieldLabel>
        <CaptchaWidget :on-success="handleCaptchaSuccess" />
      </Field>
      
      <Field v-else>
        <Button type="submit" :disabled="loading" class="w-full">
          {{ loading ? '登录中...' : '登录' }}
        </Button>
      </Field>
    </FieldGroup>
  </form>
</template>
