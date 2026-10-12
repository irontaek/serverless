import { jest } from '@jest/globals'
import commandUsage from '../../../../../src/lib/runners/core/usage.js'

const auth = { orgId: 'org-1', orgName: 'acme', accessKeyV2: 'key' }

const response = (ok, body, statusText = 'OK') => ({
  ok,
  statusText,
  json: async () => body,
})

describe('serverless usage', () => {
  const realFetch = global.fetch
  afterEach(() => {
    global.fetch = realFetch
  })

  it('reports a failed instances request instead of reading its error body', async () => {
    global.fetch = jest.fn(async () =>
      response(false, { message: 'forbidden' }, 'Forbidden'),
    )

    await expect(commandUsage({ auth })).rejects.toMatchObject({
      message: 'Failed to get a list of billable instances: Forbidden',
      code: 'GET_INSTANCES_FAILED',
    })
  })

  it('reports a failed subscription request', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        response(true, { qualifiedInstances: [], dashboardInstances: [] }),
      )
      .mockResolvedValueOnce(
        response(false, { message: 'unavailable' }, 'Service Unavailable'),
      )

    await expect(commandUsage({ auth })).rejects.toMatchObject({
      message: 'Failed to fetch your subscription details: Service Unavailable',
      code: 'GET_SUBSCRIPTION_FAILED',
    })
  })
})
