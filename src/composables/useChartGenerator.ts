/**
 * 图表生成工具
 * 根据数据自动生成 ECharts 配置
 */

import type { ChartConfig } from '@/types/analysis'

/**
 * 根据数据生成图表配置
 */
export function useChartGenerator() {
  /**
   * 生成柱状图配置
   */
  const generateBarChart = (
    title: string,
    xAxisData: string[],
    seriesData: number[],
    seriesName: string = '数值'
  ): ChartConfig => {
    return {
      id: `bar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      type: 'bar',
      option: {
        title: {
          text: title,
          left: 'center',
          top: 10,
          itemGap: 15,
          padding: [15, 0, 35, 0],
          textStyle: {
            fontSize: 16
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          top: '110px',
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: xAxisData,
          axisLabel: {
            rotate: xAxisData.length > 10 ? 45 : 0
          }
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: seriesName,
            type: 'bar',
            data: seriesData,
            itemStyle: {
              color: '#5470c6'
            }
          }
        ]
      }
    }
  }

  /**
   * 生成折线图配置
   */
  const generateLineChart = (
    title: string,
    xAxisData: string[],
    seriesData: number[],
    seriesName: string = '数值'
  ): ChartConfig => {
    return {
      id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      type: 'line',
      option: {
        title: {
          text: title,
          left: 'center',
          top: 10,
          itemGap: 15,
          padding: [15, 0, 35, 0],
          textStyle: {
            fontSize: 16
          }
        },
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          top: '110px',
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: xAxisData,
          boundaryGap: false
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: seriesName,
            type: 'line',
            data: seriesData,
            smooth: true,
            itemStyle: {
              color: '#91cc75'
            },
            areaStyle: {
              color: 'rgba(145, 204, 117, 0.3)'
            }
          }
        ]
      }
    }
  }

  /**
   * 生成饼图配置
   */
  const generatePieChart = (
    title: string,
    data: Array<{ name: string; value: number }>
  ): ChartConfig => {
    return {
      id: `pie_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      type: 'pie',
      option: {
        title: {
          text: title,
          left: 'center',
          top: 10,
          itemGap: 15,
          padding: [15, 0, 35, 0],
          textStyle: {
            fontSize: 16
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'center'
        },
        series: [
          {
            name: title,
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}: {d}%'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            data
          }
        ]
      }
    }
  }

  /**
   * 生成多系列柱状图
   */
  const generateMultiBarChart = (
    title: string,
    xAxisData: string[],
    series: Array<{ name: string; data: number[] }>
  ): ChartConfig => {
    return {
      id: `multibar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      type: 'bar',
      option: {
        title: {
          text: title,
          left: 'center',
          top: 10,
          itemGap: 15,
          padding: [15, 0, 35, 0],
          textStyle: {
            fontSize: 16
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: series.map(s => s.name),
          top: 80
        },
        grid: {
          top: '120px',
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: xAxisData
        },
        yAxis: {
          type: 'value'
        },
        series: series.map(s => ({
          name: s.name,
          type: 'bar',
          data: s.data
        }))
      }
    }
  }

  /**
   * 从财务数据自动生成图表
   */
  const generateFinancialCharts = (
    dataSnapshot: Array<{
      scenarioKey: string
      scenarioName: string
      data: Record<string, any>[]
      mappings: Array<{ targetField: string; targetLabel: string }>
    }>
  ): ChartConfig[] => {
    const charts: ChartConfig[] = []

    dataSnapshot.forEach(snapshot => {
      const data = snapshot.data
      if (!data || data.length === 0) return

      // 根据场景类型生成不同的图表
      switch (snapshot.scenarioKey) {
        case 'bank_statement':
          // 银行流水：收支趋势图
          const dateField = snapshot.mappings.find(m => m.targetField.includes('Date'))?.targetField
          const debitField = snapshot.mappings.find(m => m.targetField === 'debitAmount')?.targetField
          const creditField = snapshot.mappings.find(m => m.targetField === 'creditAmount')?.targetField
          const balanceField = snapshot.mappings.find(m => m.targetField === 'balance')?.targetField

          if (dateField && (debitField || creditField)) {
            const dates = data.map(d => d[dateField!]).filter(Boolean).slice(0, 30)
            const debits = debitField ? data.map(d => Number(d[debitField]) || 0).slice(0, 30) : []
            const credits = creditField ? data.map(d => Number(d[creditField]) || 0).slice(0, 30) : []

            // 收支对比图
            if (debits.length > 0 && credits.length > 0) {
              charts.push(generateMultiBarChart(
                '银行流水收支对比',
                dates,
                [
                  { name: '支出', data: debits },
                  { name: '收入', data: credits }
                ]
              ))
            }
            
            // 余额趋势图
            if (balanceField) {
              const balances = data.map(d => Number(d[balanceField]) || 0).slice(0, 30)
              charts.push(generateLineChart(
                '账户余额趋势',
                dates,
                balances,
                '余额'
              ))
            }
            
            // 净额趋势图
            if (debits.length > 0 && credits.length > 0) {
              const netAmounts = dates.map((_, i) => (credits[i] || 0) - (debits[i] || 0))
              charts.push(generateLineChart(
                '每日净收支趋势',
                dates,
                netAmounts,
                '净额'
              ))
            }
          }
          break

        case 'invoice':
          // 发票：按类型统计和趋势分析
          const typeField = snapshot.mappings.find(m => m.targetField === 'invoiceType')?.targetField
          const amountField = snapshot.mappings.find(m => m.targetField === 'totalWithTax')?.targetField
          const invoiceDateField = snapshot.mappings.find(m => m.targetField === 'invoiceDate')?.targetField

          if (typeField && amountField) {
            // 类型分布饼图
            const typeStats = new Map<string, number>()
            data.forEach(d => {
              const type = d[typeField]
              const amount = Number(d[amountField]) || 0
              typeStats.set(type, (typeStats.get(type) || 0) + amount)
            })

            const pieData = Array.from(typeStats.entries()).map(([name, value]) => ({ name, value }))
            charts.push(generatePieChart('发票类型金额分布', pieData))
            
            // 类型金额对比柱状图
            charts.push(generateBarChart(
              '各类型发票金额统计',
              Array.from(typeStats.keys()),
              Array.from(typeStats.values()),
              '金额'
            ))
          }
          
          // 时间趋势图
          if (invoiceDateField && amountField) {
            const dateAmountMap = new Map<string, number>()
            data.forEach(d => {
              const date = d[invoiceDateField]
              const amount = Number(d[amountField]) || 0
              if (date) {
                dateAmountMap.set(date, (dateAmountMap.get(date) || 0) + amount)
              }
            })
            
            const sortedDates = Array.from(dateAmountMap.keys()).sort().slice(0, 30)
            const amounts = sortedDates.map(d => dateAmountMap.get(d) || 0)
            
            if (sortedDates.length > 0) {
              charts.push(generateLineChart(
                '发票开具金额趋势',
                sortedDates,
                amounts,
                '金额'
              ))
            }
          }
          break

        case 'voucher':
          // 凭证：科目金额统计
          const accountField = snapshot.mappings.find(m => m.targetField === 'accountName')?.targetField
          const voucherDebitField = snapshot.mappings.find(m => m.targetField === 'debitAmount')?.targetField

          if (accountField && voucherDebitField) {
            const accountStats = new Map<string, number>()
            data.forEach(d => {
              const account = d[accountField]
              const amount = Number(d[voucherDebitField]) || 0
              if (amount > 0) {
                accountStats.set(account, (accountStats.get(account) || 0) + amount)
              }
            })

            const topAccounts = Array.from(accountStats.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)

            charts.push(generateBarChart(
              'Top 10 科目借方发生额',
              topAccounts.map(a => a[0]),
              topAccounts.map(a => a[1]),
              '借方金额'
            ))
          }
          break

        case 'financial_statement':
          // 财务报表：期末余额对比
          const reportAccountField = snapshot.mappings.find(m => m.targetField === 'accountName')?.targetField
          const endingBalanceField = snapshot.mappings.find(m => m.targetField === 'endingBalance')?.targetField

          if (reportAccountField && endingBalanceField) {
            const accounts = data.map(d => d[reportAccountField]).slice(0, 15)
            const balances = data.map(d => Number(d[endingBalanceField]) || 0).slice(0, 15)

            charts.push(generateBarChart(
              '主要科目期末余额',
              accounts,
              balances,
              '期末余额'
            ))
          }
          break
      }
    })

    return charts
  }

  return {
    generateBarChart,
    generateLineChart,
    generatePieChart,
    generateMultiBarChart,
    generateFinancialCharts
  }
}
