const path = require('path');
const OWNER = 'prjctr-html-css';

const deleteRepository = (octokit) => async ({
  owner = OWNER,
  repo, 
}) => {
  await octokit.request(`DELETE /repos/${owner}/${repo}`, {
    owner,
    repo,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
}

const repalceUsernamePlaceholders = (octokit) => async ({
  owner = OWNER,
  repo, 
  path = 'README.md',
  placeholder = '[[username]]',
  replacement,
  committerName = 'PrjctrInstitute',
  committerEmail = 'devfaculty@prjctr.com',
  message = 'Update REAME.md according to the username',
}) => {

  const response  = await octokit.request(`GET /repos/${owner}/${repo}/readme`, {
    owner,
    repo,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  const content = Buffer.from(response.data.content, 'base64').toString('utf8').replaceAll(placeholder, replacement);
  const sha = response.data.sha;

  await octokit.request(`PUT /repos/${owner}/${repo}/contents/${path}`, {
    owner,
    repo,
    path,
    sha,
    message,
    committer: {
      name: committerName,
      email: committerEmail,
    },
    content: Buffer.from(content, 'utf8').toString('base64'),
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

};

const setGitHubPagesURL = (octokit) => async ({
  owner = OWNER,
  repo,
  homepage,
}) => {
  await octokit.request(`PATCH /repos/${owner}/${repo}`, {
    owner,
    repo,
    name: repo,
    homepage,
    headers: {
        'X-GitHub-Api-Version': '2022-11-28'
    }
  });

};

const getTheGitHubPagesURL = (octokit) => async ({
  owner = OWNER,
  repo,
  path: GitHubPath = '/',
}) => {
  const { data: { html_url: GitHubPagesBaseURL}} = await octokit.request(`GET /repos/${owner}/${repo}/pages`, {
    owner,
    repo: repo,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  // Getting file list in the repo to check if we have single .html file, which is not index.html
  // If it's the case, we should add it into the GitHub pages link
  const {data: filesList} = await octokit.request(`GET /repos/${owner}/${repo}/contents/`, {
    owner,
    repo,
    path: GitHubPath,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  const fileNamesList = filesList
    .filter(({type}) => (type === 'file'))
    .filter(({path: filePath}) => path.extname(filePath) === '.html')
    .map(({name}) => name);
  const hasHTML = fileNamesList.length > 0;
  const hasSingleHTML = fileNamesList.length === 1;
  const hasIndex = fileNamesList.find((name)=>(name === 'index.html')) !== undefined;
  return (hasHTML && !hasIndex && hasSingleHTML) 
    ? `${GitHubPagesBaseURL}${fileNamesList[0]}`
    : GitHubPagesBaseURL;

}

const createGitHubPages = (octokit) => async ({
  owner = OWNER,
  repo,
  branch = 'main',
  path = '/',
}) => {
  await octokit.request(`POST /repos/${owner}/${repo}/pages`, {
    owner,
    repo,
    source: {
      branch,
      path,
    },
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
};

const createBranch = (octokit) => async ({
  sourceBranch = 'main',
  targetBranch = 'homework',
  owner = OWNER,
  repo,
}) => {
  const commits = await octokit.request(`GET /repos/${owner}/${repo}/commits`, {
    owner: owner,
    repo: repo,
    sha: sourceBranch,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  const sha = commits.data?.[0].sha;

  await octokit.request(`POST /repos/${owner}/${repo}/git/refs`, {
    owner: owner,
    repo,
    ref: `refs/heads/${targetBranch}`,
    sha: sha,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
};

const doRepositoryExists = (octokit) => async (REPO) => {
  let repository;
  try {
    repository = await octokit.request(`GET /repos/${OWNER}/${REPO}`, {
      owner: OWNER,
      repo: REPO,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
  } catch (error) {
    repository = error;
  }
  return repository.status === 200;
};

const cloneFromTemplate = (octokit) => async (REPO, USERNAME) => {
  const NEW_REPO = `${USERNAME}-${REPO}`;

  await octokit.request(`POST /repos/${OWNER}/${REPO}/generate`, {
    owner: OWNER,
    name: NEW_REPO,
    include_all_branches: true,
    'private': true,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  await octokit.request(`PUT /repos/${OWNER}/${NEW_REPO}/collaborators/${USERNAME}`, {
    owner: OWNER,
    repo: NEW_REPO,
    username: USERNAME,
    permission: 'maintain',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

};

const waitForBranch = (octokit) => async (owner = OWNER, repo, branch = 'main') => {
  const waitForBranch = () => new Promise((resolve, reject) => {
    const BRANCH_CHECK_TIMER = 1000;
    let TIMES_LEFT = 10;
    const checkForBranch = async () => {
      if (TIMES_LEFT <= 0) {
        reject('Branch creation timeout');
      }
      TIMES_LEFT--;
      const { data } = await octokit.request(`GET /repos/${owner}/${repo}/branches`, {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      if (data.find(({name})=>(name === branch)) !== undefined) {
        resolve('branch found');
      } else {
        startCheckBranchTimer();
      }
    };
    const startCheckBranchTimer = () => new setTimeout(checkForBranch, BRANCH_CHECK_TIMER);
    checkForBranch();
  });

  return await waitForBranch();
};

const isDateBeforeToday = (date) => (new Date(date.toDateString()) < new Date(new Date().toDateString()));

module.exports = {
  createBranch,
  doRepositoryExists,
  cloneFromTemplate,
  isDateBeforeToday,
  waitForBranch,
  createGitHubPages,
  getTheGitHubPagesURL,
  setGitHubPagesURL,
  repalceUsernamePlaceholders,
  deleteRepository,
};