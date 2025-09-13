import { useState, useCallback } from "react"

export interface FileUploadItem {
  id: string
  file: File | { name: string; size: number; type: string; url: string }
}

export interface UseFileUploadOptions {
  multiple?: boolean
  maxFiles?: number
  maxSize?: number
  accept?: string[]
  initialFiles?: Array<{
    name: string
    size: number
    type: string
    url: string
    id: string
  }>
}

export interface UseFileUploadState {
  files: FileUploadItem[]
  isDragging: boolean
  errors: string[]
}

export interface UseFileUploadActions {
  handleDragEnter: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDragOver: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  openFileDialog: () => void
  removeFile: (id: string) => void
  clearFiles: () => void
  getInputProps: () => {
    type: "file"
    multiple?: boolean
    accept?: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  }
}

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export const useFileUpload = (
  options: UseFileUploadOptions = {}
): [UseFileUploadState, UseFileUploadActions] => {
  const {
    multiple = false,
    maxFiles = 1,
    maxSize = 5 * 1024 * 1024, // 5MB
    accept = [],
    initialFiles = [],
  } = options

  const [files, setFiles] = useState<FileUploadItem[]>(
    initialFiles.map((file) => ({
      id: file.id,
      file: file,
    }))
  )
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const validateFile = useCallback(
    (file: File): string | null => {
      if (maxSize && file.size > maxSize) {
        return `File size must be less than ${formatBytes(maxSize)}`
      }

      if (accept.length > 0) {
        const isValidType = accept.some((type) => {
          if (type.startsWith(".")) {
            return file.name.toLowerCase().endsWith(type.toLowerCase())
          }
          return file.type.match(type.replace("*", ".*"))
        })

        if (!isValidType) {
          return `File type must be one of: ${accept.join(", ")}`
        }
      }

      return null
    },
    [maxSize, accept]
  )

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const validationErrors: string[] = []
      const validFiles: FileUploadItem[] = []

      for (const file of newFiles) {
        if (!multiple && files.length + validFiles.length >= 1) {
          validationErrors.push("Only one file is allowed")
          break
        }

        if (files.length + validFiles.length >= maxFiles) {
          validationErrors.push(`Maximum ${maxFiles} files allowed`)
          break
        }

        const error = validateFile(file)
        if (error) {
          validationErrors.push(error)
          continue
        }

        const isDuplicate = files.some(
          (existingFile) =>
            existingFile.file instanceof File &&
            existingFile.file.name === file.name &&
            existingFile.file.size === file.size
        )

        if (isDuplicate) {
          validationErrors.push(`File "${file.name}" already exists`)
          continue
        }

        validFiles.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
        })
      }

      setErrors(validationErrors)

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles])
      }
    },
    [files, multiple, maxFiles, validateFile]
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      addFiles(droppedFiles)
    },
    [addFiles]
  )

  const openFileDialog = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = multiple
    if (accept.length > 0) {
      input.accept = accept.join(",")
    }
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files) {
        addFiles(Array.from(target.files))
      }
    }
    input.click()
  }, [multiple, accept, addFiles])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
    setErrors([])
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
    setErrors([])
  }, [])

  const getInputProps = useCallback((): {
    type: "file"
    multiple?: boolean
    accept?: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  } => ({
    type: "file",
    multiple,
    accept: accept.length > 0 ? accept.join(",") : undefined,
    onChange: (e) => {
      if (e.target.files) {
        addFiles(Array.from(e.target.files))
      }
    },
  }), [multiple, accept, addFiles])

  return [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ]
}