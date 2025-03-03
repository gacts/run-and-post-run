import { run } from './common'
import { setFailed } from '@actions/core'
;(async () => {
  await run().catch(setFailed)
})()
