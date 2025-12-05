import { MockMethod } from 'vite-plugin-mock'
import customerApi from './customer'
import userApi from './user'

export default [
  ...customerApi,
  ...userApi,
] as MockMethod[]