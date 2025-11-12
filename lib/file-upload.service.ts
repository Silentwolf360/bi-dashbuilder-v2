import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export interface UploadedFile {
  filename: string
  originalName: string
  path: string
  size: number
  mimetype: string
}

export class FileUploadService {
  private uploadDir = join(process.cwd(), "uploads")

  constructor() {
    this.ensureUploadDir()
  }

  private async ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true })
    }
  }

  /**
   * Save uploaded file to disk
   */
  async saveFile(
    file: File,
    subdirectory?: string
  ): Promise<UploadedFile> {
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    
    const targetDir = subdirectory
      ? join(this.uploadDir, subdirectory)
      : this.uploadDir

    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true })
    }

    const filepath = join(targetDir, filename)
    await writeFile(filepath, buffer)

    return {
      filename,
      originalName: file.name,
      path: filepath,
      size: file.size,
      mimetype: file.type,
    }
  }

  /**
   * Validate file type
   */
  validateFileType(file: File, allowedTypes: string[]): boolean {
    const ext = file.name.split(".").pop()?.toLowerCase()
    return ext ? allowedTypes.includes(ext) : false
  }

  /**
   * Validate file size
   */
  validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxSize = maxSizeMB * 1024 * 1024
    return file.size <= maxSize
  }

  /**
   * Get file extension
   */
  getFileExtension(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() || ""
  }

  /**
   * Determine file type category
   */
  getFileTypeCategory(filename: string): "csv" | "excel" | "json" | "unknown" {
    const ext = this.getFileExtension(filename)
    
    if (ext === "csv") return "csv"
    if (["xlsx", "xls"].includes(ext)) return "excel"
    if (ext === "json") return "json"
    
    return "unknown"
  }
}

export const fileUploadService = new FileUploadService()
