import { run } from './common'
import { setFailed } from '@actions/core'

run().catch(setFailed)
