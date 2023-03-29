require('dotenv').config();
const fs = require('fs');
const { Octokit } = require('octokit');
const { 
  doRepositoryExists,
  deleteRepository,
} = require('./utils');


(async () => {

  // Reading configuration files
  const CALENDAR_PATH = 'configuration/calendar.json';
  const STUDENTS_PATH = 'configuration/students.json';
  const CALENDAR = JSON.parse(fs.readFileSync(CALENDAR_PATH, 'utf8'));
  const STUDENTS = JSON.parse(fs.readFileSync(STUDENTS_PATH, 'utf8'));
  const octokit = new Octokit({ 
    auth: process.env.PRIVATE_KEY,
  });

  STUDENTS.forEach(username => {
    Object.entries(CALENDAR).forEach(async ([repository]) => {
      const owner = 'prjctr-html-css';
      const repo = `${username}-${repository}`;
      const hasRepository = await doRepositoryExists(octokit)(repo);
      
      console.info('repository ', repo, ' exists: ', hasRepository );

      if (hasRepository) {
        await deleteRepository(octokit)({
          owner,
          repo,
        });
      }
    });
  });

})();