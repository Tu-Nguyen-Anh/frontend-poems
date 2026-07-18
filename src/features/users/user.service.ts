import { BaseService } from '@/services/base.service'
import type { User } from './types'

/**
 * Kế thừa BaseService → có sẵn getAll/getById/create/update/remove.
 * Chỉ viết thêm những API đặc thù của feature này.
 */
class UserService extends BaseService<User> {
  constructor() {
    super('/users')
  }

  async search(keyword: string): Promise<User[]> {
    return this.getAll({ q: keyword })
  }
}

export const userService = new UserService()
