import inquirer from 'inquirer';
import fs from 'fs/promises';
import generateMarkdown from './generateMarkdown.js';

// Questions for the user
const questions = [
  {
    type: 'input',
    name: 'title',
    message: 'What is the title of your project?',
  },
  {
    type: 'input',
    name: 'description',
    message: 'Enter a short description of your project:',
  },
  {
    type: 'input',
    name: 'installation',
    message: 'How do you install this project?',
  },
  {
    type: 'input',
    name: 'usage',
    message: 'How do you use this project?',
  },
  {
    type: 'list',
    name: 'license',
    message: 'Choose a license for your project:',
    choices: ['MIT', 'Apache 2.0', 'GPL 3.0', 'None'],
  },
  {
    type: 'input',
    name: 'contributing',
    message: 'How can others contribute to this project?',
  },
  {
    type: 'input',
    name: 'tests',
    message: 'How do you test this project?',
  },
];

// Function to write the README file
async function writeToFile(fileName, data) {
  try {
    await fs.writeFile(fileName, data);
    console.log('✅ README.md successfully generated!');
  } catch (err) {
    console.error('❌ Error writing file:', err);
  }
}

// Function to initialize the app
async function init() {
  try {
    const answers = await inquirer.prompt(questions);
    const markdownContent = generateMarkdown(answers);
    await writeToFile('README.md', markdownContent);
  } catch (err) {
    console.error('❌ Error initializing app:', err);
  }
}

// Start the application
init();


