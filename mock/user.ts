import { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'

// 用户角色枚举
const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  GUEST: 'guest'
}

// 用户状态枚举
const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LOCKED: 'locked'
}

// 模拟用户数据
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    name: '系统管理员',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    phone: '13800138000',
    department: '技术部',
    position: '系统管理员',
    createTime: '2024-01-01',
    lastLoginTime: '2024-01-20 10:30:00',
    permissions: ['*']
  },
  {
    id: 2,
    username: 'manager',
    email: 'manager@example.com',
    name: '部门经理',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
    role: UserRole.MANAGER,
    status: UserStatus.ACTIVE,
    phone: '13900139000',
    department: '销售部',
    position: '销售经理',
    createTime: '2024-01-02',
    lastLoginTime: '2024-01-20 09:15:00',
    permissions: ['customer:read', 'customer:write', 'order:read', 'order:write']
  },
  {
    id: 3,
    username: 'user',
    email: 'user@example.com',
    name: '普通用户',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    phone: '13700137000',
    department: '客服部',
    position: '客服专员',
    createTime: '2024-01-03',
    lastLoginTime: '2024-01-20 08:45:00',
    permissions: ['customer:read', 'order:read']
  }
]

// 当前登录用户（默认为管理员）
let currentUser = mockUsers[0]

const userApi: MockMethod[] = [
  // 用户登录
  {
    url: '/api/auth/login',
    method: 'post',
    response: ({ body }) => {
      const { username, password } = body
      
      // 简单的用户验证
      const user = mockUsers.find(u => u.username === username)
      
      if (!user) {
        return {
          code: 401,
          message: '用户名不存在',
          data: null
        }
      }
      
      // 简单密码验证（实际项目中应该使用加密）
      if (password !== '123456') {
        return {
          code: 401,
          message: '密码错误',
          data: null
        }
      }
      
      if (user.status !== UserStatus.ACTIVE) {
        return {
          code: 403,
          message: '账户已被禁用',
          data: null
        }
      }
      
      // 更新最后登录时间
      user.lastLoginTime = new Date().toLocaleString('zh-CN')
      currentUser = user
      
      // 生成模拟 token
      const token = Mock.Random.string('upper', 32)
      
      return {
        code: 200,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            permissions: user.permissions
          }
        }
      }
    }
  },
  
  // 获取当前用户信息
  {
    url: '/api/auth/me',
    method: 'get',
    response: () => {
      return {
        code: 200,
        message: 'success',
        data: currentUser
      }
    }
  },
  
  // 用户登出
  {
    url: '/api/auth/logout',
    method: 'post',
    response: () => {
      return {
        code: 200,
        message: '登出成功',
        data: null
      }
    }
  },
  
  // 获取用户列表
  {
    url: '/api/users',
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, search = '', role = '', status = '' } = query
      
      // 筛选数据
      let filteredUsers = mockUsers.filter(user => {
        const matchesSearch = !search || 
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.username.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
        
        const matchesRole = !role || role === 'all' || user.role === role
        const matchesStatus = !status || status === 'all' || user.status === status
        
        return matchesSearch && matchesRole && matchesStatus
      })
      
      // 分页
      const total = filteredUsers.length
      const start = (Number(page) - 1) * Number(pageSize)
      const end = start + Number(pageSize)
      const data = filteredUsers.slice(start, end)
      
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
  
  // 更新用户信息
  {
    url: '/api/users/:id',
    method: 'put',
    response: ({ url, body }) => {
      const id = Number(url.split('/').pop())
      const index = mockUsers.findIndex(u => u.id === id)
      
      if (index === -1) {
        return {
          code: 404,
          message: '用户不存在',
          data: null
        }
      }
      
      mockUsers[index] = { ...mockUsers[index], ...body }
      
      // 如果更新的是当前用户，同步更新 currentUser
      if (currentUser.id === id) {
        currentUser = mockUsers[index]
      }
      
      return {
        code: 200,
        message: '用户信息更新成功',
        data: mockUsers[index]
      }
    }
  },
  
  // 修改密码
  {
    url: '/api/auth/change-password',
    method: 'post',
    response: ({ body }) => {
      const { oldPassword, newPassword } = body
      
      // 简单验证旧密码
      if (oldPassword !== '123456') {
        return {
          code: 400,
          message: '原密码错误',
          data: null
        }
      }
      
      if (newPassword.length < 6) {
        return {
          code: 400,
          message: '新密码长度不能少于6位',
          data: null
        }
      }
      
      return {
        code: 200,
        message: '密码修改成功',
        data: null
      }
    }
  },
  
  // 获取用户权限
  {
    url: '/api/auth/permissions',
    method: 'get',
    response: () => {
      return {
        code: 200,
        message: 'success',
        data: currentUser.permissions
      }
    }
  }
]

export default userApi