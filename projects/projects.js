import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

document.querySelector(".projects-title").innerHTML =
    `<h1>${projects.length} Projects</h1>`;

let query = "";
let selectedYear = null;
function updateView() {
    let filtered = projects;

    if (selectedYear !== null) {
        filtered = filtered.filter(p => p.year == selectedYear);
    }

    if (query) {
        filtered = filtered.filter(p =>
            Object.values(p).join(" ").toLowerCase().includes(query)
        );
    }

    renderProjects(filtered, projectsContainer, 'h2');
    renderPieChart(filtered);
}

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    query = event.target.value.toLowerCase();
    updateView();
});


// PIE CHART!!!!!!!!111111!!

let colors = d3.scaleOrdinal(d3.schemeTableau10);
let selectedIndex = -1;

function renderPieChart(projectsGiven) {

    let svg = d3.select('#projects-pie-plot');
    svg.selectAll('*').remove();

    let legend = d3.select('.legend');
    legend.selectAll('*').remove();

    let rolledData = d3.rollups(
        projectsGiven,
        v => v.length,
        d => d.year
    );

    let data = rolledData.map(([year, count]) => ({
        label: year,
        value: count
    }));

    // PUE CHART
    let arcGenerator = d3.arc()
        .innerRadius(0)
        .outerRadius(50);

    let sliceGenerator = d3.pie()
        .value(d => d.value);

    let arcData = sliceGenerator(data);
    let arcs = arcData.map(d => arcGenerator(d));

    // for the pie slicews
    arcs.forEach((arc, i) => {
        svg.append('path')
            .attr('d', arc)
            .attr('fill', colors(i))
            .on('click', () => {
                selectedIndex = (selectedYear === data[i].label) ? -1 : i;
                selectedYear = selectedIndex === -1 ? null : data[selectedIndex].label;

                updateView();
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