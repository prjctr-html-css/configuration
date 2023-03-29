const OWNER = 'prjctr-html-css';

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

const isDateBeforeToday = (date) => (new Date(date.toDateString()) < new Date(new Date().toDateString()));

module.exports = {
  doRepositoryExists,
  cloneFromTemplate,
  isDateBeforeToday,
};