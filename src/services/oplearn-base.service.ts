import type { PageResponse, ResponseGeneral } from './api.types'
import { oplearnClient } from './oplearnClient'

export class OplearnBaseService<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  protected readonly endpoint: string
  protected readonly basePath: string
  protected readonly client = oplearnClient

  constructor(endpoint: string) {
    this.endpoint = endpoint
    this.basePath = endpoint
  }

  async list(params?: Record<string, unknown>): Promise<PageResponse<T>> {
    const { data } = await oplearnClient.get<ResponseGeneral<PageResponse<T>>>(this.endpoint, {
      params,
    })
    return data.data
  }

  async getById(id: number | string): Promise<T> {
    const { data } = await oplearnClient.get<ResponseGeneral<T>>(`${this.endpoint}/${id}`)
    return data.data
  }

  async create(payload: TCreate): Promise<T> {
    const { data } = await oplearnClient.post<ResponseGeneral<T>>(this.endpoint, payload)
    return data.data
  }

  async update(id: number | string, payload: TUpdate): Promise<T> {
    const { data } = await oplearnClient.put<ResponseGeneral<T>>(`${this.endpoint}/${id}`, payload)
    return data.data
  }

  async remove(id: number | string): Promise<void> {
    await oplearnClient.delete(`${this.endpoint}/${id}`)
  }
}
