
import { info, notice, error, debug, setFailed, getInput } from '@actions/core'
import { context, getOctokit } from '@actions/github'
import {loadConfig} from './utils/fs';

async function run(): Promise<void> {
  try {
    const GH_TOKEN = getInput('token')
    const configPath = getInput('config')

    const octokit = getOctokit(GH_TOKEN)

    const org: string = context.repo?.owner

    if (!org) {
      error(`No organization found: ${JSON.stringify(context.payload, null, 2)}`)
      throw Error('Missing organization in the context payload')
    }
    const config_data = await loadConfig(configPath)
    info(config_data)
  } catch (err: any) {
    error(err)
    if (err instanceof Error) setFailed(err.message)
  }
}

run()
