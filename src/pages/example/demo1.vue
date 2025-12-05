<template>
    <TheLayout>
        <ResizablePanelGroup direction="horizontal" class="bg-white rounded-lg">
            <!-- <ResizablePanel class="p-4 max-w-1/8">
                <ScrollArea class="max-h-[83vh]">
                    <div class="flex flex-col flex-nowrap">
                        <Button variant="outline" v-for="item in [1,2,3,4,5,1,2,3,3,1]" class=" mt-1 mb-1">{{ item }}</Button>
                    </div>
                </ScrollArea>
            </ResizablePanel>
            <ResizableHandle /> -->
            <ResizablePanel class="p-4">
                <!-- 手机端grid为1 -->
                <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <RicCard v-for="item in pyqText" :key="item.id" :copy-value="item.content" :title="item.title"
                        :description="item.description">
                    </RicCard>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>

    </TheLayout>
</template>
<script setup lang="ts">
import RicCard from '@/components/ric-ui/RicCard.vue'
import TheLayout from '@/components/ric-ui/TheLayout.vue'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import pyqText from '@/core/utils/pyq'
</script>