require('dotenv').config();
const fs = require('fs');
const { Octokit } = require('octokit');
const { 
  doRepositoryExists, 
} = require('./utils');

// Path constants
const STUDENTS_PATH = 'configuration/students.json';
const OWNER = 'prjctr-html-css';
const REPOSITORY = 'home-work-5';

(async () => {
  // Reading configuration files
  const STUDENTS = JSON.parse(fs.readFileSync(STUDENTS_PATH, 'utf8'));
  const octokit = new Octokit({ 
    auth: process.env.PRIVATE_KEY,
  });

  STUDENTS.forEach(async (username) => {
    const repo = `${username}-${REPOSITORY}`;
    const hasRepository = await doRepositoryExists(octokit)(repo);
    
    console.info('repository ', repo, ' exists: ', hasRepository );

    if (!hasRepository) {
      console.info('deleting repository: ', repo );
      await deleteRepository(octokit)({
        owner: OWNER,
        repo,
      });
    }
  });
})();