import { oplearnClient } from './oplearnClient'
import type { FileUploadResponse } from '@/types'

const MAX_SINGLE_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_MULTIPLE_FILES_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_MULTIPLE_FILES_COUNT = 10

export const fileService = {
  /**
   * Tải lên 1 file đơn lẻ (Avatar, ảnh bìa, âm thanh...)
   * @param file File cần upload (tối đa 10MB)
   */
  async uploadFile(file: File): Promise<FileUploadResponse> {
    if (file.size > MAX_SINGLE_FILE_SIZE) {
      throw new Error(`Dung lượng file vượt quá giới hạn 10MB (${(file.size / (1024 * 1024)).toFixed(2)}MB)`)
    }

    const formData = new FormData()
    formData.append('file', file)

    const res = await oplearnClient.post<any>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const data = res.data?.data ?? res.data
    return {
      url: data.url,
      file_name: data.file_name ?? data.fileName,
      fileName: data.fileName ?? data.file_name,
      size: data.size,
      content_type: data.content_type ?? data.contentType,
      contentType: data.contentType ?? data.content_type,
    }
  },

  /**
   * Tải lên danh sách nhiều file cùng lúc (tối đa 10 file, tổng dung lượng <= 100MB)
   * @param files Danh sách các file
   */
  async uploadMultipleFiles(files: File[]): Promise<FileUploadResponse[]> {
    if (files.length === 0) return []
    if (files.length > MAX_MULTIPLE_FILES_COUNT) {
      throw new Error(`Số lượng file vượt quá giới hạn cho phép (tối đa ${MAX_MULTIPLE_FILES_COUNT} file)`)
    }

    const totalSize = files.reduce((acc, f) => acc + f.size, 0)
    if (totalSize > MAX_MULTIPLE_FILES_SIZE) {
      throw new Error(
        `Tổng dung lượng các file vượt quá giới hạn 100MB (${(totalSize / (1024 * 1024)).toFixed(2)}MB)`
      )
    }

    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    const res = await oplearnClient.post<any>('/files/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const data = res.data?.data ?? res.data
    const items = Array.isArray(data) ? data : [data]
    return items.map((item: any) => ({
      url: item.url,
      file_name: item.file_name ?? item.fileName,
      fileName: item.fileName ?? item.file_name,
      size: item.size,
      content_type: item.content_type ?? item.contentType,
      contentType: item.contentType ?? item.content_type,
    }))
  },

  /**
   * Xóa file khỏi hệ thống theo file_name
   * @param fileName Tên file cần xóa (vd: uuid-ten-file.jpg)
   */
  async deleteFile(fileName: string): Promise<void> {
    if (!fileName) return
    await oplearnClient.delete('/files', {
      params: {
        file_name: fileName,
      },
    })
  },
}
