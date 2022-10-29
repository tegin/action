
import { info, notice, error, debug, setFailed, getInput } from '@actions/core'
import { context, getOctokit } from '@actions/github'
import {loadConfig} from './utils/fs';

import { Team } from './utils/types'

export async function getOrgTeams (octokit: any, org: string): Promise<Team[]> {
  const { data, status } = await octokit.rest.teams.list({
    org,
    per_page: 100
  })

  if (status !== 200) {
    throw Error(`Failed to get org teams: ${status}\n${data}`)
  }

  return data
}

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
    const config_data = await loadConfig(configPath);
    const team_data = await getOrgTeams(octokit, org);
    const teams = []
    for (const team of team_data) {
      teams.push(team.slug);
    }
    for (var key in config_data) {
      if (key in teams) {}
      else {
        const { data, status } = await octokit.rest.teams.create({
          org: org,
          name: key,
        })
      }
      
    }
  } catch (err: any) {
    error(err)
    if (err instanceof Error) setFailed(err.message)
  }
}

run()
