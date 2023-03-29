require('dotenv').config();
const fs = require('fs');
const { Octokit } = require('octokit');
const { 
  doRepositoryExists, 
  cloneFromTemplate,
  isDateBeforeToday,
  createBranch,
  waitForBranch,
  getTheGitHubPagesURL,
  createGitHubPages,
  setGitHubPagesURL,
  repalceUsernamePlaceholders,
} = require('./utils');

// Path constants
const CALENDAR_PATH = 'configuration/calendar.json';
const STUDENTS_PATH = 'configuration/students.json';
const OWNER = 'prjctr-html-css';
const MAIN_BRANCH = 'main';
const HOME_WORK_BRANCH = 'homework';

(async () => {
  // Reading configuration files
  const CALENDAR = JSON.parse(fs.readFileSync(CALENDAR_PATH, 'utf8'));
  const STUDENTS = JSON.parse(fs.readFileSync(STUDENTS_PATH, 'utf8'));
  const octokit = new Octokit({ 
    auth: process.env.PRIVATE_KEY,
  });

  STUDENTS.forEach(username => {
    Object.entries(CALENDAR).forEach(async ([repository, dateString]) => {
      const availabilityDate = new Date(dateString);
      const NEW_REPO = `${username}-${repository}`;
      const hasRepository = await doRepositoryExists(octokit)(NEW_REPO);
      
      console.info('repository ', NEW_REPO, ' exists: ',hasRepository );

      if (isDateBeforeToday(availabilityDate) && !hasRepository) {

        console.info('cloning: ', repository);
        await cloneFromTemplate(octokit)(repository, username);
        console.info('waiting for branch: ', MAIN_BRANCH);
        await waitForBranch(octokit)(OWNER, NEW_REPO, MAIN_BRANCH);
        console.info('update README.md');
        await repalceUsernamePlaceholders(octokit)({
          owner: OWNER,
          repo: NEW_REPO,
          path: 'README.md',
          placeholder: '[[username]]',
          replacement: username,
        });
        console.info('creating branch: ', HOME_WORK_BRANCH);
        await createBranch(octokit)({
          repo: NEW_REPO,
          owner: OWNER,
          sourceBranch: MAIN_BRANCH,
          targetBranch: HOME_WORK_BRANCH,
        });
        console.info('waiting for branch: ', HOME_WORK_BRANCH);
        await waitForBranch(octokit)(OWNER, NEW_REPO, HOME_WORK_BRANCH);
        console.info('create GitHub Pages:');
        await createGitHubPages(octokit)({
          owner: OWNER,
          repo: NEW_REPO,
          branch: HOME_WORK_BRANCH,
          path: '/',
        });
        console.info('getting GitHub Pages URL:');
        const GitHubPagesBaseURL = await getTheGitHubPagesURL(octokit)({
          owner: OWNER,
          repo: NEW_REPO,
          path: '/',
        });
        console.info('setting: ',  GitHubPagesBaseURL, ' as GitHub repository homepage.');
        await setGitHubPagesURL(octokit)({
          owner: OWNER,
          repo: NEW_REPO,
          homepage: GitHubPagesBaseURL,
        });
        console.info('finished working on ', repository, ' for ', username);
      }
    });
  });
})();