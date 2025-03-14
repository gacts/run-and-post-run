import { post } from './common'
import { setFailed } from '@actions/core'

post().catch(setFailed)
