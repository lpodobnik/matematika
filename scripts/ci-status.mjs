// Waits for the GitHub Actions runs of HEAD and prints their results, with the failing lines
// of any failed job. The token comes from git's credential helper and is never printed.
import { execSync } from 'node:child_process';

const git = (args, input) => execSync(`git ${args}`, { input }).toString().trim();
const credential = git('credential fill', 'protocol=https\nhost=github.com\n\n');
const headers = { Authorization: `Bearer ${credential.match(/^password=(.*)$/m)?.[1]}` };
const api = 'https://api.github.com/repos/lpodobnik/matematika/actions';
const get = async (path) => (await fetch(`${api}/${path}`, { headers })).json();

const WAIT_MS = 10_000;
const MAX_WAITS = 60;
const FAILURE_LINE = /FAIL|AssertionError|error TS|Tests {2}|##\[error\]|Error:|format/;
const TIMESTAMP_LENGTH = 29;

const sha = git('rev-parse HEAD');
let runs = [];
for (let wait = 0; wait < MAX_WAITS; wait++) {
  runs = (await get(`runs?head_sha=${sha}`)).workflow_runs;
  if (runs.length > 0 && runs.every((run) => run.status === 'completed')) break;
  await new Promise((resolve) => setTimeout(resolve, WAIT_MS));
}

console.log(sha.slice(0, 7));
if (runs.length === 0) console.log('No runs found: was this commit pushed?');
for (const run of runs) {
  console.log(`${run.name}: ${run.status} ${run.conclusion ?? ''}`);
  if (run.conclusion !== 'failure') continue;
  const { jobs } = await get(`runs/${run.id}/jobs`);
  for (const job of jobs.filter((each) => each.conclusion === 'failure')) {
    const failedSteps = job.steps.filter((step) => step.conclusion === 'failure');
    console.log(`  ${job.name}, failed at: ${failedSteps.map((step) => step.name).join(', ')}`);
    const log = await (await fetch(`${api}/jobs/${job.id}/logs`, { headers })).text();
    const lines = log.split('\n').filter((line) => FAILURE_LINE.test(line));
    for (const line of lines.slice(0, 20)) console.log(`    ${line.slice(TIMESTAMP_LENGTH, 190)}`);
  }
}
