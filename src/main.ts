
import { info, notice, error, debug, setFailed, getInput } from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { createReadStream } from 'fs';
import { createContext } from 'vm';
import {loadConfig} from './utils/fs';

import { Team } from './utils/types'

async function getOrgTeams (octokit: any, org: string): Promise<Team[]> {
  const { data, status } = await octokit.rest.teams.list({
    org,
    per_page: 100
  })

  if (status !== 200) {
    throw Error(`Failed to get org teams: ${status}\n${data}`)
  }

  return data
}

async function createTeam(octokit: any, org: string, team:string) {
  const { data, status } = await octokit.rest.teams.create({
    org: org,
    name: team,
  })
  if (status !== 200) {
    throw Error(`Failed to get org teams: ${status}\n${data}`)
  }
  return data;
}
async function addMember(octokit: any, org: string, team:any, user:string) {
  const { data, status } = await octokit.rest.teams.addOrUpdateMembershipForUserInOrg({
    org: org,
    team_slug: team.slug,
    username: user,
  })
  if (status !== 200) {
    throw Error(`Failed to get org teams: ${status}\n${data}`)
  }
}
async function getTeamMembers(octokit: any, org: string, team:any) {
  const { data, status } = await octokit.rest.teams.listMembersInOrg({
    org: org,
    team_slug: team.slug,
    per_page: 100,
  })
  if (status !== 200) {
    throw Error(`Failed to get org teams: ${status}\n${data}`)
  }
  return data;
}
async function removeTeamMember(octokit: any, org: string, team:any, user:any) {
  const { data, status } = await octokit.rest.teams.removeMembershipForUserInOrg({
    org: org,
    team_slug: team.slug,
    username: user.login,
  })
  if (status !== 200) {
    throw Error(`Failed to remove team members: ${status}\n${data}`)
  }
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
    const teams:{[key: string]: Team } = {};
    for (const team of team_data) {
      teams[team.slug] = team;
    }
    for (var key in config_data) {
      info("Checking team " + key)
      var team;
      var users:{[key:string]: string} = {}
      if (key in teams) {
        team = teams[key]
      }
      else {
        team = createTeam(octokit, org, key)
      }
      for (var user in config_data[key].users) {
        info("Adding member " + config_data[key].users[user])
        addMember(octokit, org, team, config_data[key].users[user]);
        users[config_data[key].users[user]] = config_data[key].users[user];
      }
      const current_members = await getTeamMembers(octokit, org, team);
      for (var member in current_members) {
        if (current_members[member].login in users) {}
        else {
          info("Removing member " + current_members[member].login)
          removeTeamMember(octokit, org, team, current_members[member])
        }
      }
      info("TODO: Repo creation");
      
    }
  } catch (err: any) {
    error(err)
    if (err instanceof Error) setFailed(err.message)
  }
}

run()
