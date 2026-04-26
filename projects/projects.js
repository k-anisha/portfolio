import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const numProjects = projects.length
const nProj = document.querySelector(".projects-title")
nProj.innerHTML = `<h1>${numProjects} Projects</h1>`
