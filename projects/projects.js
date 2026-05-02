import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

// initial render
renderProjects(projects, projectsContainer, 'h2');

document.querySelector(".projects-title").innerHTML =
    `<h1>${projects.length} Projects</h1>`;

// SEARCH STATE
let query = "";

// SEARCH INPUT
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    query = event.target.value.toLowerCase();

    let filteredProjects = projects.filter((project) => {
        return Object.values(project)
            .join(" ")
            .toLowerCase()
            .includes(query);
    });

    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
});


// =======================
// PIE CHART FUNCTION
// =======================

function renderPieChart(projectsGiven) {

    // clear old chart
    let svg = d3.select('#projects-pie-plot');
    svg.selectAll('*').remove();

    let legend = d3.select('.legend');
    legend.selectAll('*').remove();

    // group by year
    let rolledData = d3.rollups(
        projectsGiven,
        v => v.length,
        d => d.year
    );

    let data = rolledData.map(([year, count]) => ({
        label: year,
        value: count
    }));

    // pie + arc generators
    let arcGenerator = d3.arc()
        .innerRadius(0)
        .outerRadius(50);

    let sliceGenerator = d3.pie()
        .value(d => d.value);

    let arcData = sliceGenerator(data);
    let arcs = arcData.map(d => arcGenerator(d));

    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    let selectedIndex = -1;

    // DRAW PIE SLICES
    arcs.forEach((arc, i) => {
        svg.append('path')
            .attr('d', arc)
            .attr('fill', colors(i))
            .on('click', () => {

                selectedIndex = selectedIndex === i ? -1 : i;

                svg.selectAll('path')
                    .attr('opacity', (_, idx) =>
                        selectedIndex === -1 || idx === selectedIndex ? 1 : 0.3
                    );

                legend.selectAll('li')
                    .attr('opacity', (_, idx) =>
                        selectedIndex === -1 || idx === selectedIndex ? 1 : 0.3
                    );

                // filter projects by year
                if (selectedIndex === -1) {
                    renderProjects(projectsGiven, projectsContainer, 'h2');
                } else {
                    let year = data[selectedIndex].label;

                    let filtered = projectsGiven.filter(p => p.year == year);

                    renderProjects(filtered, projectsContainer, 'h2');
                }
            });
    });

    // DRAW LEGEND
    data.forEach((d, idx) => {
        legend.append('li')
            .attr('style', `--color:${colors(idx)}`)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
}


// initial chart
renderPieChart(projects);