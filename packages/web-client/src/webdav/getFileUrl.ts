import { unref } from 'vue'
import { AxiosInstance } from 'axios'
import { Resource, SpaceResource } from '../helpers'
import { urlJoin } from '../utils'
import { GetFileContentsFactory } from './getFileContents'
import { WebDavOptions } from './types'
import { DAV, buildAuthHeader } from './client'
import { ocs } from '../ocs'

export const GetFileUrlFactory = (
  dav: DAV,
  axiosClient: AxiosInstance,
  getFileContentsFactory: ReturnType<typeof GetFileContentsFactory>,
  { accessToken, baseUrl, user }: WebDavOptions
) => {
  return {
    async getFileUrl(
      space: SpaceResource,
      resource: Resource,
      {
        disposition = 'attachment',
        isUrlSigningEnabled = false,
        signUrlTimeout = 86400,
        version = null,
        doHeadRequest = false
      }: {
        disposition?: 'inline' | 'attachment'
        isUrlSigningEnabled?: boolean
        signUrlTimeout?: number
        version?: string
        doHeadRequest?: boolean
      }
    ): Promise<string> {
      const inlineDisposition = disposition === 'inline'
      const { path } = resource
      let { downloadURL } = resource

      let signed = true
      if (!downloadURL && !inlineDisposition) {
        const authHeader = buildAuthHeader(unref(accessToken), space)['Authorization']

        // compute unsigned url
        const webDavPath = space ? urlJoin(space.webDavPath, path) : resource.webDavPath
        downloadURL = version
          ? dav.getFileUrl(urlJoin('meta', resource.fileId, 'v', version))
          : dav.getFileUrl(webDavPath)

        if (unref(user) && doHeadRequest) {
          await axiosClient.head(downloadURL, { headers: { Authorization: authHeader } })
        }

        // sign url
        if (isUrlSigningEnabled && unref(user)) {
          axiosClient.interceptors.request.use((config) => {
            config.headers['Authorization'] = authHeader
            return config
          })

          const ocsClient = ocs(baseUrl, axiosClient, user)
          downloadURL = await ocsClient.signUrl(downloadURL)
        } else {
          signed = false
        }
      }

      // FIXME: re-introduce query parameters
      // They are not supported by getFileContents() and as we don't need them right now, I'm disabling the feature completely for now
      //
      // // Since the pre-signed url contains query parameters and the caller of this method
      // // can also provide query parameters we have to combine them.
      // const queryStr = qs.stringify(options.query || null)
      // const [url, signedQuery] = downloadURL.split('?')
      // const combinedQuery = [queryStr, signedQuery].filter(Boolean).join('&')
      // downloadURL = [url, combinedQuery].filter(Boolean).join('?')

      if (!signed || inlineDisposition) {
        const response = await getFileContentsFactory.getFileContents(space, resource, {
          responseType: 'blob'
        })
        downloadURL = URL.createObjectURL(response.body)
      }

      return downloadURL
    },
    revokeUrl: (url: string) => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    }
  }
}
