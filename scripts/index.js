const fs = require('fs');
const { Octokit } = require('octokit');
const { 
  doRepositoryExists, 
  cloneFromTemplate,
  isDateBeforeToday,
} = require('./utils');

// Path constants
const CALENDAR_PATH = 'configuration/calendar.json';
const STUDENTS_PATH = 'configuration/students.json';

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
      if (isDateBeforeToday(availabilityDate) && !hasRepository) {
        await cloneFromTemplate(octokit)(repository, username);
      }
    });
  });
})();