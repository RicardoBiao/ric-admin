import { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'

// 客户状态枚举
const CustomerStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended'
}

// 客户类型枚举
const CustomerType = {
  ENTERPRISE: '企业客户',
  INDIVIDUAL: '个人客户',
  PARTNER: '合作伙伴'
}

// 生成模拟客户数据
const generateCustomers = (count: number = 50) => {
  const customers: any[] = []
  const companies = ['阿里巴巴', '腾讯科技', '百度网络', '字节跳动', '美团', '京东', '滴滴出行', '小米科技', '华为技术', '网易']
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二']
  
  for (let i = 1; i <= count; i++) {
    const company = Mock.Random.pick(companies)
    const contact = Mock.Random.pick(names)
    const customerType = Mock.Random.pick(Object.values(CustomerType))
    const status = Mock.Random.pick(Object.values(CustomerStatus))
    
    customers.push({
      id: i,
      name: `${company}${Mock.Random.pick(['销售部', '市场部', '技术部', '客服部'])}`,
      type: customerType,
      company: company,
      contact: contact,
      phone: Mock.mock('@phone'),
      email: Mock.mock('@email'),
      status: status,
      createTime: Mock.Random.date('yyyy-MM-dd'),
      lastContact: Mock.Random.date('yyyy-MM-dd'),
      address: Mock.mock('@county(true)'),
      industry: Mock.Random.pick(['互联网', '金融', '教育', '医疗', '制造业', '零售', '房地产']),
      revenue: Mock.Random.integer(10000, 10000000),
      description: Mock.mock('@cparagraph(1, 3)')
    })
  }
  
  return customers
}

// 模拟客户数据
let mockCustomers = generateCustomers()

const customerApi: MockMethod[] = [
  // 获取客户列表
  {
    url: '/api/customers',
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, search = '', type = '', status = '' } = query
      
      // 筛选数据
      let filteredCustomers = mockCustomers.filter(customer => {
        const matchesSearch = !search || 
          customer.name.toLowerCase().includes(search.toLowerCase()) ||
          customer.company.toLowerCase().includes(search.toLowerCase()) ||
          customer.contact.toLowerCase().includes(search.toLowerCase())
        
        const matchesType = !type || type === 'all' || customer.type === type
        const matchesStatus = !status || status === 'all' || customer.status === status
        
        return matchesSearch && matchesType && matchesStatus
      })
      
      // 分页
      const total = filteredCustomers.length
      const start = (Number(page) - 1) * Number(pageSize)
      const end = start + Number(pageSize)
      const data = filteredCustomers.slice(start, end)
      
      return {
        code: 200,
        message: 'success',
        data: {
          list: data,
          total,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: Math.ceil(total / Number(pageSize))
        }
      }
    }
  },
  
  // 获取客户详情
  {
    url: '/api/customers/:id',
    method: 'get',
    response: ({ url }) => {
      const id = Number(url.split('/').pop())
      const customer = mockCustomers.find(c => c.id === id)
      
      if (!customer) {
        return {
          code: 404,
          message: '客户不存在',
          data: null
        }
      }
      
      return {
        code: 200,
        message: 'success',
        data: customer
      }
    }
  },
  
  // 创建客户
  {
    url: '/api/customers',
    method: 'post',
    response: ({ body }) => {
      const newCustomer = {
        id: mockCustomers.length + 1,
        ...body,
        createTime: new Date().toISOString().split('T')[0],
        lastContact: new Date().toISOString().split('T')[0]
      }
      
      mockCustomers.push(newCustomer)
      
      return {
        code: 200,
        message: '客户创建成功',
        data: newCustomer
      }
    }
  },
  
  // 更新客户
  {
    url: '/api/customers/:id',
    method: 'put',
    response: ({ url, body }) => {
      const id = Number(url.split('/').pop())
      const index = mockCustomers.findIndex(c => c.id === id)
      
      if (index === -1) {
        return {
          code: 404,
          message: '客户不存在',
          data: null
        }
      }
      
      mockCustomers[index] = { ...mockCustomers[index], ...body }
      
      return {
        code: 200,
        message: '客户更新成功',
        data: mockCustomers[index]
      }
    }
  },
  
  // 删除客户
  {
    url: '/api/customers/:id',
    method: 'delete',
    response: ({ url }) => {
      const id = Number(url.split('/').pop())
      const index = mockCustomers.findIndex(c => c.id === id)
      
      if (index === -1) {
        return {
          code: 404,
          message: '客户不存在',
          data: null
        }
      }
      
      mockCustomers.splice(index, 1)
      
      return {
        code: 200,
        message: '客户删除成功',
        data: null
      }
    }
  },
  
  // 批量删除客户
  {
    url: '/api/customers/batch',
    method: 'delete',
    response: ({ body }) => {
      const { ids } = body
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return {
          code: 400,
          message: '请提供有效的客户ID列表',
          data: null
        }
      }
      
      mockCustomers = mockCustomers.filter(customer => !ids.includes(customer.id))
      
      return {
        code: 200,
        message: `成功删除 ${ids.length} 个客户`,
        data: null
      }
    }
  },
  
  // 获取客户统计信息
  {
    url: '/api/customers/stats',
    method: 'get',
    response: () => {
      const total = mockCustomers.length
      const active = mockCustomers.filter(c => c.status === CustomerStatus.ACTIVE).length
      const inactive = mockCustomers.filter(c => c.status === CustomerStatus.INACTIVE).length
      const enterprise = mockCustomers.filter(c => c.type === CustomerType.ENTERPRISE).length
      const individual = mockCustomers.filter(c => c.type === CustomerType.INDIVIDUAL).length
      
      return {
        code: 200,
        message: 'success',
        data: {
          total,
          active,
          inactive,
          enterprise,
          individual,
          growth: Mock.Random.integer(-10, 30) // 模拟增长率
        }
      }
    }
  }
]

export default customerApi