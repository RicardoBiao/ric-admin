<template>
    <Card>
        <CardHeader class="p-4 pb-2 relative">
            <slot name="header">
                <CardTitle class="text-lg">
                    {{ props.title }}
                </CardTitle>
            </slot>
            <slot name="header-right">
                <div v-if="props.copyValue"
                    class="flex flex-col items-center text-xs text-gray-500 cursor-pointer hover:text-gray-700 absolute right-4 top-4"
                    @click="copyText">
                    <Copy />
                    <!-- <span class="ml-1">Copy</span> -->
                </div>
            </slot>
        </CardHeader>
        <CardContent class="p-4 pt-0">
            <slot>
                <Textarea v-bind:modelValue="props.copyValue" class="w-full resize-none" />
            </slot>
            <slot name="description">
                <CardDescription v-if="props.description" class="pt-1 mt-1 text-xs text-right">
                    {{ props.description }}
                </CardDescription>
            </slot>
        </CardContent>
    </Card>
</template>
<script setup lang="ts">
import {
    Card,
    CardHeader,
    CardContent,
    CardDescription,
    CardTitle
} from '@/components/ui/card'
import { useClipboard } from '@vueuse/core'
import { Copy } from 'lucide-vue-next'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'vue-sonner'

const props = defineProps({
    copyValue: {
        type: String || Number,
        default: ''
    },
    title: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    }
})

const { copy } = useClipboard()

const copyText = () => {
    copy(props.copyValue)
    // console.log('复制: ', props.copyValue);
    toast.success('copy success')
}
</script>