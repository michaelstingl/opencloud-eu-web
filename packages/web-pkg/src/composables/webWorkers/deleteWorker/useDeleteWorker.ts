import { unref } from 'vue'
import { useWebWorkersStore } from '../../piniaStores/webWorkers'
import {
  createHttpError,
  HttpError,
  type Resource,
  type SpaceResource
} from '@ownclouders/web-client'
import { useConfigStore } from '../../piniaStores'
import { useLoadingService } from '../../loadingService'
import { useRequestHeaders } from '../../requestHeaders'
import DeleteWorker from './worker?worker'

export type DeleteWorkerReturnData = {
  successful: Resource[]
  failed: { resource: Resource; message: string; statusCode: number; xReqId: string }[]
}

type CallbackOptions = {
  successful: Resource[]
  failed: { resource: Resource; error: HttpError }[]
}

export type DeleteWorkerTopic = 'fileListDelete' | 'trashBinDelete' | 'tokenUpdate'

export const useDeleteWorker = ({
  concurrentRequests = 4
}: { concurrentRequests?: number } = {}) => {
  const configStore = useConfigStore()
  const loadingService = useLoadingService()
  const { headers } = useRequestHeaders()
  const { createWorker, terminateWorker } = useWebWorkersStore()

  const startWorker = (
    {
      topic,
      space,
      resources
    }: { topic: DeleteWorkerTopic; space: SpaceResource; resources: Resource[] },
    callback: (result: CallbackOptions) => void
  ) => {
    const worker = createWorker<DeleteWorkerReturnData>(DeleteWorker as unknown as string, {
      needsTokenRenewal: true
    })

    let resolveLoading: (value: unknown) => void

    unref(worker.worker).onmessage = (e: MessageEvent) => {
      terminateWorker(worker.id)
      resolveLoading?.(true)

      const { successful, failed } = JSON.parse(e.data) as DeleteWorkerReturnData

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

    worker.post(getWorkerData({ topic, space, resources }))
  }

  const getWorkerData = ({
    topic,
    space,
    resources
  }: {
    topic: DeleteWorkerTopic
    space: SpaceResource
    resources: Resource[]
  }) => {
    return JSON.stringify({
      topic,
      data: {
        space,
        resources,
        concurrentRequests,
        baseUrl: configStore.serverUrl,
        headers: unref(headers)
      }
    })
  }

  return { startWorker }
}
