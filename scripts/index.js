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
  console.log(CALENDAR);
  const STUDENTS = JSON.parse(fs.readFileSync(STUDENTS_PATH, 'utf8'));
  console.log(STUDENTS);

  const octokit = new Octokit({ 
    auth: process.env.PRIVATE_KEY,
  });

  STUDENTS.forEach(username => {
    console.log(username);

    Object.entries(CALENDAR).forEach(async ([repository, dateString]) => {

      const availabilityDate = new Date(dateString);
      const NEW_REPO = `${username}-${repository}`;
      const hasRepository = await doRepositoryExists(octokit)(NEW_REPO);
      console.log({
        repository, 
        dateString,
        NEW_REPO,
        hasRepository,
      });
      if (isDateBeforeToday(availabilityDate) && !hasRepository) {
        console.log('creating');
        const result = await cloneFromTemplate(octokit)(repository, username);
        console.log(result);
      }
    });
  });
})();