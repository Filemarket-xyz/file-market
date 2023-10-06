import { type HiddenFileMetaData } from '../../../../swagger/Api'
import { type typeFiles, typeOptions } from './data'

export const fileToExtension = (file: HiddenFileMetaData): string | undefined => {
  return file.name?.split('.')[file.name?.split('.').length - 1]
}

export const filenameToExtension = (filename: string): string | undefined => {
  return filename.split('.')[filename.split('.').length - 1]
}

export const fileToType = (file: HiddenFileMetaData): typeFiles | undefined => {
  const typeFileName: string | undefined = fileToExtension(file)
  if (!typeFileName) return undefined
  for (const [key, value] of Object.entries(typeOptions)) {
    if (value.includes(`.${typeFileName}`)) return key as typeFiles
  }

  return 'another'
}

export const filenameToType = (filename: string): typeFiles | undefined => {
  const typeFileName: string | undefined = filenameToExtension(filename)
  if (!typeFileName) return undefined
  for (const [key, value] of Object.entries(typeOptions)) {
    if (value.includes(`.${typeFileName}`)) return key as typeFiles
  }

  return 'another'
}
