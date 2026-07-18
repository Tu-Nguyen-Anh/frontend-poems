import { httpClient } from './httpClient'

/**
 * Service cha chứa sẵn CRUD chuẩn REST.
 * Mỗi feature chỉ cần kế thừa và truyền endpoint:
 *
 *   class ProductService extends BaseService<Product> {
 *     constructor() { super('/products') }
 *     // thêm method riêng của feature tại đây
 *   }
 */
export class BaseService<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  protected readonly endpoint: string

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  async getAll(params?: Record<string, unknown>): Promise<T[]> {
    const { data } = await httpClient.get<T[]>(this.endpoint, { params })
    return data
  }

  async getById(id: number | string): Promise<T> {
    const { data } = await httpClient.get<T>(`${this.endpoint}/${id}`)
    return data
  }

  async create(payload: TCreate): Promise<T> {
    const { data } = await httpClient.post<T>(this.endpoint, payload)
    return data
  }

  async update(id: number | string, payload: TUpdate): Promise<T> {
    const { data } = await httpClient.put<T>(`${this.endpoint}/${id}`, payload)
    return data
  }

  async remove(id: number | string): Promise<void> {
    await httpClient.delete(`${this.endpoint}/${id}`)
  }
}
