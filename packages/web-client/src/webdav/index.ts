import { WebDAV, WebDavOptions } from './types'
import { CopyFilesFactory } from './copyFiles'
import { CreateFolderFactory } from './createFolder'
import { GetFileContentsFactory } from './getFileContents'
import { GetFileInfoFactory } from './getFileInfo'
import { GetFileUrlFactory } from './getFileUrl'
import { GetPublicFileUrlFactory } from './getPublicFileUrl'
import { ListFilesFactory } from './listFiles'
import { MoveFilesFactory } from './moveFiles'
import { PutFileContentsFactory } from './putFileContents'
import { DeleteFileFactory } from './deleteFile'
import { RestoreFileFactory } from './restoreFile'
import { RestoreFileVersionFactory } from './restoreFileVersion'
import { ClearTrashBinFactory } from './clearTrashBin'
import { SearchFactory } from './search'
import { GetPathForFileIdFactory } from './getPathForFileId'
import { DAV } from './client/dav'
import { ListFileVersionsFactory } from './listFileVersions'
import { ListFilesByIdFactory } from './listFilesById'
import { SetFavoriteFactory } from './setFavorite'
import { ListFavoriteFilesFactory } from './listFavoriteFiles'
import axios from 'axios'
import { v4 as uuidV4 } from 'uuid'
import { unref } from 'vue'

export * from './constants'
export * from './types'

export const webdav = (options: WebDavOptions): WebDAV => {
  const dav = new DAV({
    accessToken: options.accessToken,
    baseUrl: options.baseUrl,
    language: options.language,
    clientInitiatorId: options.clientInitiatorId
  })

  const axiosClient = axios.create({
    headers: {
      'Accept-Language': unref(options.language),
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Request-ID': uuidV4(),
      'X-Requested-With': 'XMLHttpRequest',
      'Initiator-ID': unref(options.clientInitiatorId)
    }
  })

  const pathForFileIdFactory = GetPathForFileIdFactory(dav, options)
  const { getPathForFileId } = pathForFileIdFactory

  const listFilesFactory = ListFilesFactory(dav, pathForFileIdFactory, options)
  const { listFiles } = listFilesFactory

  const listFilesByIdFactory = ListFilesByIdFactory(dav, options)
  const { listFilesById } = listFilesByIdFactory

  const getFileInfoFactory = GetFileInfoFactory(listFilesFactory, options)
  const { getFileInfo } = getFileInfoFactory

  const { createFolder } = CreateFolderFactory(dav, getFileInfoFactory, options)
  const getFileContentsFactory = GetFileContentsFactory(dav, axiosClient, options)
  const { getFileContents } = getFileContentsFactory
  const { putFileContents } = PutFileContentsFactory(dav, getFileInfoFactory, options)

  const { getFileUrl, revokeUrl } = GetFileUrlFactory(
    dav,
    axiosClient,
    getFileContentsFactory,
    options
  )
  const { getPublicFileUrl } = GetPublicFileUrlFactory(dav, options)

  const { copyFiles } = CopyFilesFactory(dav, options)
  const { moveFiles } = MoveFilesFactory(dav, options)

  const { deleteFile } = DeleteFileFactory(dav, options)
  const { restoreFile } = RestoreFileFactory(dav, options)

  const { listFileVersions } = ListFileVersionsFactory(dav, options)
  const { restoreFileVersion } = RestoreFileVersionFactory(dav, options)

  const { clearTrashBin } = ClearTrashBinFactory(dav, options)

  const { search } = SearchFactory(dav, options)

  const { listFavoriteFiles } = ListFavoriteFilesFactory(dav, options)
  const { setFavorite } = SetFavoriteFactory(dav, options)

  return {
    copyFiles,
    createFolder,
    deleteFile,
    restoreFile,
    restoreFileVersion,
    getFileContents,
    getFileInfo,
    getFileUrl,
    getPublicFileUrl,
    getPathForFileId,
    listFiles,
    listFilesById,
    listFileVersions,
    moveFiles,
    putFileContents,
    revokeUrl,
    clearTrashBin,
    search,
    listFavoriteFiles,
    setFavorite
  }
}
