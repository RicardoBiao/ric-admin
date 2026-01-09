/**
 * 解析 DeepSeek 输出中的图表配置
 */

import type { ChartConfig } from '@/types/analysis'

interface ChartData {
  type: 'line' | 'bar' | 'pie'
  title: string
  description?: string
  xAxis?: string[]
  series: Array<{
    name: string
    data: number[]
  }>
  pieData?: Array<{
    name: string
    value: number
  }>
}

/**
 * 从 Markdown 文本中提取 JSON 代码块
 */
export function extractJsonFromMarkdown(markdown: string): any[] {
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```/g
  const matches = [...markdown.matchAll(jsonBlockRegex)]
  
  const results: any[] = []
  
  for (const match of matches) {
    try {
      const jsonStr = match[1].trim()
      const parsed = JSON.parse(jsonStr)
      
      // 如果是数组，展开
      if (Array.isArray(parsed)) {
        results.push(...parsed)
      } else {
        results.push(parsed)
      }
    } catch (error) {
      console.error('Failed to parse JSON block:', error)
    }
  }
  
  return results
}

/**
 * 将简化的图表数据转换为完整的 ECharts 配置
 */
export function convertToEChartsConfig(chartData: ChartData): ChartConfig {
  const baseId = `${chartData.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  if (chartData.type === 'pie') {
    // 饼图配置
    const pieData = chartData.pieData || chartData.series[0]?.data.map((value, index) => ({
      name: chartData.xAxis?.[index] || `项目${index + 1}`,
      value
    })) || []
    
    return {
      id: baseId,
      title: chartData.title,
      type: 'pie',
      description: chartData.description,
      option: {
        title: {
          text: chartData.title,
          left: 'center',
          top: 10,
          itemGap: 20,
          padding: [15, 0, 40, 0],
          textStyle: {
            fontSize: 16
          },
          subtextStyle: {
            fontSize: 12
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
            name: chartData.title,
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
            data: pieData
          }
        ]
      }
    }
  } else if (chartData.type === 'line') {
    // 折线图配置
    return {
      id: baseId,
      title: chartData.title,
      type: 'line',
      description: chartData.description,
      option: {
        title: {
          text: chartData.title,
          left: 'center',
          top: 10,
          itemGap: 20,
          padding: [15, 0, 40, 0],
          textStyle: {
            fontSize: 16
          },
          subtextStyle: {
            fontSize: 12
          }
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: chartData.series.map(s => s.name),
          top: 85
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '125px',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: chartData.xAxis || [],
          boundaryGap: false
        },
        yAxis: {
          type: 'value'
        },
        series: chartData.series.map(s => ({
          name: s.name,
          type: 'line',
          data: s.data,
          smooth: true,
          areaStyle: chartData.series.length === 1 ? {
            opacity: 0.3
          } : undefined
        }))
      }
    }
  } else {
    // 柱状图配置
    return {
      id: baseId,
      title: chartData.title,
      type: 'bar',
      description: chartData.description,
      option: {
        title: {
          text: chartData.title,
          left: 'center',
          top: 10,
          itemGap: 20,
          padding: [15, 0, 40, 0],
          textStyle: {
            fontSize: 16
          },
          subtextStyle: {
            fontSize: 12
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: chartData.series.map(s => s.name),
          top: 85
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: chartData.xAxis || [],
          axisLabel: {
            rotate: (chartData.xAxis?.length || 0) > 10 ? 45 : 0
          }
        },
        yAxis: {
          type: 'value'
        },
        series: chartData.series.map(s => ({
          name: s.name,
          type: 'bar',
          data: s.data
        }))
      }
    }
  }
}

/**
 * 从 DeepSeek 的响应中解析图表配置
 */
export function parseChartsFromDeepSeek(response: string): ChartConfig[] {
  try {
    const chartDataList = extractJsonFromMarkdown(response)
    
    if (!chartDataList || chartDataList.length === 0) {
      console.log('No chart configurations found in DeepSeek response')
      return []
    }
    
    const charts: ChartConfig[] = []
    
    for (const chartData of chartDataList) {
      try {
        // 验证必需字段
        if (!chartData.type || !chartData.title) {
          console.warn('Invalid chart data: missing type or title', chartData)
          continue
        }
        
        const chart = convertToEChartsConfig(chartData)
        charts.push(chart)
      } catch (error) {
        console.error('Failed to convert chart data:', error, chartData)
      }
    }
    
    console.log(`Parsed ${charts.length} charts from DeepSeek response`)
    return charts
  } catch (error) {
    console.error('Failed to parse charts from DeepSeek:', error)
    return []
  }
}
