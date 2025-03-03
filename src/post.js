import { post } from './common'
import { setFailed } from '@actions/core'
;(async () => {
  await post().catch(setFailed)
})()
