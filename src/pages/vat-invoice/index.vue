<template>
  <div class="vat-invoice-container">
    <canvas
      ref="invoiceCanvas"
      @click="handleCanvasClick"
      class="invoice-canvas"
    ></canvas>
    <div v-if="editingField" class="edit-modal">
      <div class="edit-label">{{ getFieldLabel(editingField) }}</div>
      <input
        v-if="!isMultiline(editingField)"
        v-model="editingValue"
        @keyup.enter="saveEdit"
        ref="editInput"
        class="edit-input"
      />
      <textarea
        v-else
        v-model="editingValue"
        @keyup.ctrl.enter="saveEdit"
        ref="editInput"
        class="edit-textarea"
        rows="3"
      ></textarea>
      <div class="edit-buttons">
        <button @click="cancelEdit" class="btn-cancel">取消</button>
        <button @click="saveEdit" class="btn-save">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

const invoiceCanvas = ref<HTMLCanvasElement>()
const editingField = ref<string>('')
const editingValue = ref<string>('')
const editInput = ref<HTMLInputElement | HTMLTextAreaElement>()
const initialEmptyFields = ref<Set<string>>(new Set())

// 发票数据
const invoiceData = ref({
  code: '1100224130',
  number: '25447000',
  machineCode: '499011734316',
  date: '2024年12月18日',
  checkCode: '36862 46680 76035 14493',
  buyerName: '',
  buyerTaxId: '91110105MAOLXFBN3Q',
  buyerAddressPhone: '',
  buyerBankAccount: '中国建设银行股份有限公司北京朝阳支行 11050186720000000616',
  sellerName: '北京京东叁佰陆拾度电子商务有限公司',
  sellerTaxId: '91110000055395382B',
  sellerAddressPhone: '北京市经济技术开发区科创十一街18号院2号楼9层901 010-89189000',
  sellerBankAccount: '中国农业银行股份有限公司北京大兴亦庄支行 11230101040020780',
  itemName: '*外围设备*键盘',
  itemSpec: '',
  itemUnit: '个',
  itemQuantity: '1',
  itemPrice: '99.00',
  itemAmount: '99.00',
  itemTaxRate: '13%',
  itemTaxAmount: '12.87',
  totalAmount: '¥99.00',
  totalTaxAmount: '¥12.87',
  totalWithTax: '¥壹佰壹拾壹元捌角柒分',
  totalWithTaxNum: '¥111.87',
  payee: '',
  reviewer: '',
  drawer: '张三',
  remark: ''
})

// 字段位置映射
const fieldPositions = ref<Record<string, { x: number, y: number, width: number, height: number }>>({})

// 字段标签映射
const fieldLabels: Record<string, string> = {
  code: '发票代码',
  number: '发票号码',
  machineCode: '机器编号',
  date: '开票日期',
  checkCode: '校验码',
  buyerName: '购买方名称',
  buyerTaxId: '购买方纳税人识别号',
  buyerAddressPhone: '购买方地址电话',
  buyerBankAccount: '购买方开户行及账号',
  sellerName: '销售方名称',
  sellerTaxId: '销售方纳税人识别号',
  sellerAddressPhone: '销售方地址电话',
  sellerBankAccount: '销售方开户行及账号',
  itemName: '货物或应税劳务、服务名称',
  itemSpec: '规格型号',
  itemUnit: '单位',
  itemQuantity: '数量',
  itemPrice: '单价',
  itemAmount: '金额',
  itemTaxRate: '税率',
  itemTaxAmount: '税额',
  totalAmount: '价税合计(小写)',
  totalTaxAmount: '税额合计',
  totalWithTax: '价税合计(大写)',
  totalWithTaxNum: '价税合计(数字)',
  payee: '收款人',
  reviewer: '复核',
  drawer: '开票人',
  remark: '备注'
}

const getFieldLabel = (field: string) => fieldLabels[field] || field

const isMultiline = (field: string) => {
  return ['buyerAddressPhone', 'buyerBankAccount', 'sellerAddressPhone', 'sellerBankAccount', 'remark'].includes(field)
}

onMounted(() => {
  // 记录初始为空的字段
  Object.entries(invoiceData.value).forEach(([key, value]) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      initialEmptyFields.value.add(key)
    }
  })
  drawInvoice()
  // 监听窗口大小变化
  window.addEventListener('resize', drawInvoice)
})

const drawInvoice = () => {
  const canvas = invoiceCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 设置高DPI显示
  const dpr = window.devicePixelRatio || 1
  const baseWidth = 750 // 基准宽度
  const minWidth = 300 // 最小宽度
  const availableWidth = window.innerWidth - 40
  // 允许画布随窗口大小缩放，最小 300px，最大不限制（但实际受窗口大小限制）
  const width = Math.max(minWidth, availableWidth)
  const height = width * 0.707 // 接近210mm×148mm比例
  const scale = width / baseWidth // 缩放因子，随画布宽度动态变化
  
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  canvas.width = width * dpr
  canvas.height = height * dpr
  
  ctx.scale(dpr, dpr)

  // 清空画布 - 浅蓝色背景
  ctx.fillStyle = '#f0f8ff'
  ctx.fillRect(0, 0, width, height)

  // 绘制双层红色边框
  ctx.strokeStyle = '#c8102e'
  ctx.lineWidth = 3 * scale
  ctx.strokeRect(6 * scale, 6 * scale, width - 12 * scale, height - 12 * scale)
  ctx.lineWidth = 1 * scale
  ctx.strokeRect(10 * scale, 10 * scale, width - 20 * scale, height - 20 * scale)

  // 标题 - 深红色加粗
  ctx.fillStyle = '#c8102e'
  ctx.font = `bold ${28 * scale}px SimSun, "STSong", "Microsoft YaHei"`
  ctx.textAlign = 'center'
  ctx.fillText('增值税专用发票', width / 2, 42 * scale)

  // 重置样式
  ctx.fillStyle = '#000'
  ctx.textAlign = 'left'
  ctx.font = `${13 * scale}px SimSun, "STSong", "Microsoft YaHei"`

  const margin = 16 * scale
  let y = 65 * scale

  // 右上角发票信息
  ctx.font = `${11 * scale}px SimSun, "STSong", "Microsoft YaHei", sans-serif`
  ctx.fillText('发 票 代 码: ' + invoiceData.value.code, width - 220 * scale, y)
  drawField('code', width - 105 * scale, y - 10 * scale, 90 * scale, 16 * scale, '', scale)
  y += 18 * scale
  ctx.fillText('发 票 号 码: ' + invoiceData.value.number, width - 220 * scale, y)
  drawField('number', width - 105 * scale, y - 10 * scale, 90 * scale, 16 * scale, '', scale)
  y += 18 * scale
  ctx.fillText('机器编号: ' + invoiceData.value.machineCode, width - 220 * scale, y)
  drawField('machineCode', width - 105 * scale, y - 10 * scale, 90 * scale, 16 * scale, '', scale)

  y = 65 * scale

  // 绘制表格 - 黑色细线
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 0.8 * scale
  ctx.font = `${12 * scale}px SimSun, "STSong", "Microsoft YaHei", sans-serif`

  const tableX = margin
  const tableWidth = width - margin * 2
  const rowHeight = 28 * scale

  // 购买方区域标题
  ctx.fillStyle = '#000'
  ctx.strokeRect(tableX, y, tableWidth, rowHeight)
  ctx.fillText('购买方', tableX + 8 * scale, y + 18 * scale)
  const divX1 = tableX + 70 * scale
  ctx.beginPath()
  ctx.moveTo(divX1, y)
  ctx.lineTo(divX1, y + rowHeight)
  ctx.stroke()
  ctx.fillText('名       称:', divX1 + 8 * scale, y + 18 * scale)
  drawField('buyerName', divX1 + 95 * scale, y + 6 * scale, tableWidth - divX1 - 95 * scale + tableX - 8 * scale, rowHeight - 12 * scale, invoiceData.value.buyerName, scale)
  y += rowHeight

  // 纳税人识别号
  ctx.strokeRect(tableX, y, tableWidth, rowHeight)
  ctx.fillText('购买方', tableX + 8 * scale, y + 18 * scale)
  ctx.beginPath()
  ctx.moveTo(divX1, y)
  ctx.lineTo(divX1, y + rowHeight)
  ctx.stroke()
  ctx.fillText('纳税人识别号:', divX1 + 8 * scale, y + 18 * scale)
  drawField('buyerTaxId', divX1 + 95 * scale, y + 6 * scale, tableWidth - divX1 - 95 * scale + tableX - 8 * scale, rowHeight - 12 * scale, invoiceData.value.buyerTaxId, scale)
  y += rowHeight

  // 地址电话
  ctx.strokeRect(tableX, y, tableWidth, rowHeight * 1.2)
  ctx.fillText('购买方', tableX + 8 * scale, y + 20 * scale)
  ctx.beginPath()
  ctx.moveTo(divX1, y)
  ctx.lineTo(divX1, y + rowHeight * 1.2)
  ctx.stroke()
  ctx.fillText('地址、电话:', divX1 + 8 * scale, y + 20 * scale)
  drawField('buyerAddressPhone', divX1 + 95 * scale, y + 6 * scale, tableWidth - divX1 - 95 * scale + tableX - 8 * scale, rowHeight * 1.2 - 12 * scale, invoiceData.value.buyerAddressPhone, scale)
  y += rowHeight * 1.2

  // 开户行账号
  ctx.strokeRect(tableX, y, tableWidth, rowHeight * 1.2)
  ctx.fillText('购买方', tableX + 8 * scale, y + 20 * scale)
  ctx.beginPath()
  ctx.moveTo(divX1, y)
  ctx.lineTo(divX1, y + rowHeight * 1.2)
  ctx.stroke()
  ctx.fillText('开户行及账号:', divX1 + 8 * scale, y + 20 * scale)
  drawField('buyerBankAccount', divX1 + 95 * scale, y + 6 * scale, tableWidth - divX1 - 95 * scale + tableX - 8 * scale, rowHeight * 1.2 - 12 * scale, invoiceData.value.buyerBankAccount, scale)
  y += rowHeight * 1.2

  // 货物明细表头
  const detailRowHeight = 32 * scale
  ctx.font = `${11 * scale}px SimSun, "STSong", "Microsoft YaHei", sans-serif`
  ctx.strokeRect(tableX, y, tableWidth, detailRowHeight)
  
  const cols = [
    { text: '货物或应税劳务、服务名称', width: 0.28 },
    { text: '规格型号', width: 0.12 },
    { text: '单位', width: 0.08 },
    { text: '数量', width: 0.10 },
    { text: '单价', width: 0.12 },
    { text: '金额', width: 0.12 },
    { text: '税率', width: 0.08 },
    { text: '税额', width: 0.10 }
  ]

  let colX = tableX
  cols.forEach((col, i) => {
    const colWidth = tableWidth * col.width
    if (i > 0) {
      ctx.beginPath()
      ctx.moveTo(colX, y)
      ctx.lineTo(colX, y + detailRowHeight)
      ctx.stroke()
    }
    const textWidth = ctx.measureText(col.text).width
    ctx.fillText(col.text, colX + (colWidth - textWidth) / 2, y + 20 * scale)
    colX += colWidth
  })
  y += detailRowHeight

  // 货物明细行
  ctx.strokeRect(tableX, y, tableWidth, detailRowHeight * 1.1)
  ctx.font = `${12 * scale}px SimSun, "STSong", "Microsoft YaHei", sans-serif`
  
  colX = tableX
  const fields = ['itemName', 'itemSpec', 'itemUnit', 'itemQuantity', 'itemPrice', 'itemAmount', 'itemTaxRate', 'itemTaxAmount']
  const values = [
    invoiceData.value.itemName,
    invoiceData.value.itemSpec,
    invoiceData.value.itemUnit,
    invoiceData.value.itemQuantity,
    invoiceData.value.itemPrice,
    invoiceData.value.itemAmount,
    invoiceData.value.itemTaxRate,
    invoiceData.value.itemTaxAmount
  ]
  
  cols.forEach((col, i) => {
    const colWidth = tableWidth * col.width
    if (i > 0) {
      ctx.beginPath()
      ctx.moveTo(colX, y)
      ctx.lineTo(colX, y + detailRowHeight * 1.1)
      ctx.stroke()
    }
    drawField(fields[i], colX + 4 * scale, y + 8 * scale, colWidth - 8 * scale, detailRowHeight * 1.1 - 16 * scale, values[i], scale)
    colX += colWidth
  })
  y += detailRowHeight * 1.1

  // 合计行
  ctx.strokeRect(tableX, y, tableWidth, rowHeight)
  ctx.font = `bold ${12 * scale}px SimSun, "STSong", "Microsoft YaHei", sans-serif`
  colX = tableX
  ctx.fillText('合    计', colX + (tableWidth * cols[0].width - 60 * scale) / 2, y + 19 * scale)
  
  ctx.font = `${12 * scale}px SimSun, "STSong", "Microsoft YaHei", sans-serif`
  colX = tableX + tableWidth * (cols[0].width + cols[1].width + cols[2].width + cols[3].width + cols[4].width)
  ctx.beginPath()
  ctx.moveTo(colX, y)
  ctx.lineTo(colX, y + rowHeight)
  ctx.stroke()
  drawField('totalAmount', colX + 4 * scale, y + 6 * scale, tableWidth * cols[5].width - 8 * scale, rowHeight - 12 * scale, invoiceData.value.totalAmount, scale)
  
  colX += tableWidth * (cols[5].width + cols[6].width)
  ctx.beginPath()
  ctx.moveTo(colX, y)
  ctx.lineTo(colX, y + rowHeight)
  ctx.stroke()
  drawField('totalTaxAmount', colX + 4 * scale, y + 6 * scale, tableWidth * cols[7].width - 8 * scale, rowHeight - 12 * scale, invoiceData.value.totalTaxAmount, scale)
  y += rowHeight

  // 价税合计行
  ctx.strokeRect(tableX, y, tableWidth, rowHeight * 1.1)
  ctx.font = `bold ${12 * scale}px SimSun, "STSong", "Microsoft YaHei", sans-serif`
  ctx.fillText('价税合计(大写)', tableX + 8 * scale, y + 20 * scale)
  
  ctx.font = `${13 * scale}px SimSun, "STSong", "Microsoft YaHei", sans-serif`
  const divX2 = tableX + tableWidth * 0.62
  ctx.beginPath()
  ctx.moveTo(divX2, y)
  ctx.lineTo(divX2, y + rowHeight * 1.1)
  ctx.stroke()
  
  drawField('totalWithTax', tableX + 110 * scale, y + 6 * scale, divX2 - tableX - 120 * scale, rowHeight * 1.1 - 12 * scale, invoiceData.value.totalWithTax, scale)
  ctx.font = `${12 * scale}px SimSun, "STSong", "Microsoft YaHei", sans-serif`
  ctx.fillText('(小写)', divX2 + 8 * scale, y + 20 * scale)
  drawField('totalWithTaxNum', divX2 + 55 * scale, y + 6 * scale, tableWidth - (divX2 - tableX) - 63 * scale, rowHeight * 1.1 - 12 * scale, invoiceData.value.totalWithTaxNum, scale)
  y += rowHeight * 1.1

  // 销售方信息
  ctx.strokeRect(tableX, y, tableWidth, rowHeight)
  ctx.fillText('销售方', tableX + 8 * scale, y + 18 * scale)
  ctx.beginPath()
  ctx.moveTo(divX1, y)
  ctx.lineTo(divX1, y + rowHeight)
  ctx.stroke()
  ctx.fillText('名       称:', divX1 + 8 * scale, y + 18 * scale)
  drawField('sellerName', divX1 + 95 * scale, y + 6 * scale, tableWidth - divX1 - 95 * scale + tableX - 8 * scale, rowHeight - 12 * scale, invoiceData.value.sellerName, scale)
  y += rowHeight

  ctx.strokeRect(tableX, y, tableWidth, rowHeight)
  ctx.fillText('销售方', tableX + 8 * scale, y + 18 * scale)
  ctx.beginPath()
  ctx.moveTo(divX1, y)
  ctx.lineTo(divX1, y + rowHeight)
  ctx.stroke()
  ctx.fillText('纳税人识别号:', divX1 + 8 * scale, y + 18 * scale)
  drawField('sellerTaxId', divX1 + 95 * scale, y + 6 * scale, tableWidth - divX1 - 95 * scale + tableX - 8 * scale, rowHeight - 12 * scale, invoiceData.value.sellerTaxId, scale)
  y += rowHeight

  ctx.strokeRect(tableX, y, tableWidth, rowHeight * 1.2)
  ctx.fillText('销售方', tableX + 8 * scale, y + 20 * scale)
  ctx.beginPath()
  ctx.moveTo(divX1, y)
  ctx.lineTo(divX1, y + rowHeight * 1.2)
  ctx.stroke()
  ctx.fillText('地址、电话:', divX1 + 8 * scale, y + 20 * scale)
  drawField('sellerAddressPhone', divX1 + 95 * scale, y + 6 * scale, tableWidth - divX1 - 95 * scale + tableX - 8 * scale, rowHeight * 1.2 - 12 * scale, invoiceData.value.sellerAddressPhone, scale)
  y += rowHeight * 1.2

  ctx.strokeRect(tableX, y, tableWidth, rowHeight * 1.2)
  ctx.fillText('销售方', tableX + 8 * scale, y + 20 * scale)
  ctx.beginPath()
  ctx.moveTo(divX1, y)
  ctx.lineTo(divX1, y + rowHeight * 1.2)
  ctx.stroke()
  ctx.fillText('开户行及账号:', divX1 + 8 * scale, y + 20 * scale)
  drawField('sellerBankAccount', divX1 + 95 * scale, y + 6 * scale, tableWidth - divX1 - 95 * scale + tableX - 8 * scale, rowHeight * 1.2 - 12 * scale, invoiceData.value.sellerBankAccount, scale)
  y += rowHeight * 1.2

  // 备注
  ctx.strokeRect(tableX, y, tableWidth, rowHeight)
  ctx.fillText('备       注:', tableX + 8 * scale, y + 18 * scale)
  drawField('remark', tableX + 80 * scale, y + 6 * scale, tableWidth - 88 * scale, rowHeight - 12 * scale, invoiceData.value.remark, scale)
  y += rowHeight

  // 底部信息
  ctx.font = `${11 * scale}px SimSun, "STSong", "Microsoft YaHei", sans-serif`
  ctx.fillText('收款人:', tableX + 8 * scale, y + 18 * scale)
  drawField('payee', tableX + 55 * scale, y + 6 * scale, 60 * scale, 16 * scale, invoiceData.value.payee, scale)
  
  ctx.fillText('复核:', tableX + 140 * scale, y + 18 * scale)
  drawField('reviewer', tableX + 175 * scale, y + 6 * scale, 60 * scale, 16 * scale, invoiceData.value.reviewer, scale)
  
  ctx.fillText('开票人:', tableX + 260 * scale, y + 18 * scale)
  drawField('drawer', tableX + 305 * scale, y + 6 * scale, 60 * scale, 16 * scale, invoiceData.value.drawer, scale)
  
  ctx.fillText('开票日期:', tableX + 390 * scale, y + 18 * scale)
  drawField('date', tableX + 450 * scale, y + 6 * scale, 120 * scale, 16 * scale, invoiceData.value.date, scale)
  y += 24 * scale

  // 校验码
  ctx.fillText('校验码: ' + invoiceData.value.checkCode, tableX + 8 * scale, y + 12 * scale)
  drawField('checkCode', tableX + 70 * scale, y, tableWidth - 78 * scale, 16 * scale, '', scale)

  function drawField(name: string, x: number, y: number, w: number, h: number, text: string, scale: number) {
    if (!ctx) return
    fieldPositions.value[name] = { x, y, width: w, height: h }
    
    ctx.save()
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.font = `${12 * scale}px SimSun, "STSong", "Microsoft YaHei", sans-serif`
    
    // 检查字段是否在初始为空的字段集合中，如果是则一直绘制红色边框
    if (initialEmptyFields.value.has(name)) {
      ctx.strokeStyle = '#d32f2f'
      ctx.lineWidth = 2 * scale
      ctx.strokeRect(x, y, w, h)
    }
    
    if (text) {
      const maxWidth = w - 4 * scale
      const lines: string[] = []
      let currentLine = ''
      
      for (let i = 0; i < text.length; i++) {
        const testLine = currentLine + text[i]
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && currentLine.length > 0) {
          lines.push(currentLine)
          currentLine = text[i]
        } else {
          currentLine = testLine
        }
      }
      if (currentLine) lines.push(currentLine)
      
      const lineHeight = 16 * scale
      const startY = y + (h - Math.min(lines.length * lineHeight, h)) / 2
      lines.forEach((line, i) => {
        if (i * lineHeight < h) {
          ctx.fillText(line, x + 2 * scale, startY + i * lineHeight)
        }
      })
    }
    
    ctx.restore()
  }
}

const handleCanvasClick = (event: MouseEvent) => {
  const canvas = invoiceCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  // 由于使用了 ctx.scale(dpr, dpr)，坐标系统已经是逻辑坐标
  // 所以点击坐标直接使用 CSS 坐标即可
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // 检查点击位置是否在某个字段上，只有初始为空的字段才能编辑
  for (const [field, pos] of Object.entries(fieldPositions.value)) {
    if (x >= pos.x && x <= pos.x + pos.width && y >= pos.y && y <= pos.y + pos.height) {
      // 只有当字段在初始为空的字段集合中时才允许编辑
      if (initialEmptyFields.value.has(field)) {
        startEditing(field)
      }
      break
    }
  }
}

const startEditing = (field: string) => {
  editingField.value = field
  editingValue.value = invoiceData.value[field as keyof typeof invoiceData.value] as string

  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus()
      if ('select' in editInput.value) {
        editInput.value.select()
      }
    }
  })
}

const saveEdit = () => {
  if (editingField.value) {
    (invoiceData.value as any)[editingField.value] = editingValue.value
    editingField.value = ''
    drawInvoice()
  }
}

const cancelEdit = () => {
  editingField.value = ''
  editingValue.value = ''
}
</script>

<style scoped>
.vat-invoice-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #e8eaed;
  padding: 20px 10px;
  overflow-y: auto;
}

.invoice-canvas {
  background: white;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.15);
  max-width: 100%;
  cursor: pointer;
  touch-action: manipulation;
}

.edit-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  min-width: 300px;
  max-width: 90vw;
  z-index: 1000;
}

.edit-modal::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: -1;
}

.edit-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.edit-input,
.edit-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #1976d2;
  border-radius: 6px;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.edit-input:focus,
.edit-textarea:focus {
  outline: none;
  border-color: #1565c0;
}

.edit-textarea {
  resize: vertical;
  min-height: 80px;
}

.edit-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: flex-end;
}

.edit-buttons button {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-save {
  background: #1976d2;
  color: white;
}

.btn-save:hover {
  background: #1565c0;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

.btn-save:active {
  transform: translateY(0);
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

@media (max-width: 768px) {
  .vat-invoice-container {
    padding: 8px;
  }
  
  .edit-modal {
    min-width: auto;
    width: calc(100vw - 32px);
    padding: 20px;
  }
}
</style>