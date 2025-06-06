import { unref } from 'vue'
import { useWebWorkersStore } from '../../piniaStores/webWorkers'
import {
  HttpError,
  createHttpError,
  type Resource,
  type SpaceResource
} from '@opencloud-eu/web-client'
import { useConfigStore } from '../../piniaStores'
import { useLoadingService } from '../../loadingService'
import { useRequestHeaders } from '../../requestHeaders'
import RestoreWorker from './worker?worker'

export type RestoreWorkerReturnData = {
  successful: Resource[]
  failed: { resource: Resource; message: string; statusCode: number; xReqId: string }[]
}

type CallbackOptions = {
  successful: Resource[]
  failed: { resource: Resource; error: HttpError }[]
}

/**
 * Web worker for restoring deleted resources from the trash bin.
 */
export const useRestoreWorker = () => {
  const configStore = useConfigStore()
  const loadingService = useLoadingService()
  const { headers } = useRequestHeaders()
  const { createWorker, terminateWorker } = useWebWorkersStore()

  const startWorker = (
    {
      space,
      resources,
      missingFolderPaths
    }: { space: SpaceResource; resources: Resource[]; missingFolderPaths: string[] },
    callback: (result: CallbackOptions) => void
  ) => {
    const worker = createWorker<RestoreWorkerReturnData>(RestoreWorker as unknown as string, {
      needsTokenRenewal: true
    })

    let resolveLoading: (value: unknown) => void

    unref(worker.worker).onmessage = (e: MessageEvent) => {
      terminateWorker(worker.id)
      resolveLoading?.(true)

      const { successful, failed } = JSON.parse(e.data) as RestoreWorkerReturnData

      // construct http error based on the parsed error data
      const failedWithErrors = failed.map(({ resource, ...errorData }) => {
        return { resource, error: createHttpError(errorData) }
      })

      callback({ successful, failed: failedWithErrors })
    }

    loadingService.addTask(
      () =>
        new Promise((res) => {
          resolveLoading = res
        })
    )

    worker.post(getWorkerData({ space, resources, missingFolderPaths }))
  }

  const getWorkerData = ({
    space,
    resources,
    missingFolderPaths
  }: {
    space: SpaceResource
    resources: Resource[]
    missingFolderPaths: string[]
  }) => {
    return JSON.stringify({
      topic: 'startProcess',
      data: {
        space,
        resources,
        missingFolderPaths,
        baseUrl: configStore.serverUrl,
        headers: {
          ...unref(headers),
          'X-Request-ID': undefined // is being generated by the dav client in the worker
        }
      }
    })
  }

  return { startWorker }
}
