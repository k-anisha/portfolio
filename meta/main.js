import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import scrollama from "https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm";

/* ---------------- GLOBAL STATE ---------------- */
let xScale, yScale, commitsGlobal;

let colors = d3.scaleOrdinal(d3.schemeTableau10);

/* ---------------- LOAD DATA ---------------- */
async function loadData() {
    return await d3.csv("loc.csv", (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + "T00:00" + row.timezone),
        datetime: new Date(row.datetime),
    }));
}

/* ---------------- PROCESS COMMITS ---------------- */
function processCommits(data) {
    return d3.groups(data, (d) => d.commit).map(([commit, lines]) => {
        let first = lines[0];

        let ret = {
            id: commit,
            url: "https://github.com/vis-society/lab-7/commit/" + commit,
            author: first.author,
            date: first.date,
            time: first.time,
            timezone: first.timezone,
            datetime: first.datetime,
            hourFrac:
                first.datetime.getHours() +
                first.datetime.getMinutes() / 60,
            totalLines: lines.length,
        };

        Object.defineProperty(ret, "lines", {
            value: lines,
            enumerable: false,
        });

        return ret;
    });
}

/* ---------------- TOOLTIP ---------------- */
function renderTooltipContent(commit) {
    document.getElementById("commit-link").href = commit.url;
    document.getElementById("commit-link").textContent = commit.id;

    document.getElementById("commit-date").textContent =
        commit.datetime.toLocaleString("en", {
            dateStyle: "full",
            timeStyle: "short",
        });

    document.getElementById("commit-author").textContent = commit.author;
    document.getElementById("commit-lines").textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
    document.getElementById("commit-tooltip").hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById("commit-tooltip");
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
}

/* ---------------- BRUSH HELPERS ---------------- */
function isCommitSelected(selection, commit) {
    if (!selection) return false;

    const [[x0, y0], [x1, y1]] = selection;

    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);

    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

/* ---------------- STATS ---------------- */
function renderStats(commits, data) {
    const stats = [
        { label: "Commits", value: commits.length },
        { label: "Files", value: d3.group(data, d => d.file).size },
        { label: "Total LOC", value: data.length },
        { label: "Max Depth", value: d3.max(data, d => d.depth) },
        { label: "Longest Line", value: d3.max(data, d => d.length) },
        { label: "Max Lines", value: d3.max(commits, d => d.totalLines) },
    ];

    const container = d3.select("#stats");

    container
        .selectAll("div")
        .data(stats, d => d.label)
        .join("div")
        .html(d => `
            <dt>${d.label}</dt>
            <dd>${d.value ?? "—"}</dd>
        `);
}

/* ---------------- SCATTERPLOT (INITIAL) ---------------- */
function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 40 };

    const usable = {
        left: margin.left,
        right: width - margin.right,
        top: margin.top,
        bottom: height - margin.bottom,
    };

    const svg = d3.select("#chart")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`);

    /* scales */
    xScale = d3.scaleTime()
        .domain(d3.extent(commits, d => d.datetime))
        .range([usable.left, usable.right])
        .nice();

    yScale = d3.scaleLinear()
        .domain([0, 24])
        .range([usable.bottom, usable.top]);

    /* axes */
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${usable.bottom})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${usable.left}, 0)`)
        .call(d3.axisLeft(yScale));

    const dots = svg.append("g").attr("class", "dots");

    const sorted = d3.sort(commits, d => -d.totalLines);

    dots.selectAll("circle")
        .data(sorted, d => d.id)
        .join("circle")
        .attr("cx", d => xScale(d.datetime))
        .attr("cy", d => yScale(d.hourFrac))
        .attr("r", 3)
        .attr("fill", "steelblue")
        .style("fill-opacity", 0.7)
        .on("mouseenter", (event, d) => {
            renderTooltipContent(d);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on("mouseleave", () => updateTooltipVisibility(false));

    svg.call(d3.brush().on("brush end", (event) => {
        const selection = event.selection;

        dots.selectAll("circle")
            .classed("selected", d => isCommitSelected(selection, d));
    }));
}

/* ---------------- UPDATE SCATTERPLOT ---------------- */
function updateScatterPlot(commits) {
    const svg = d3.select("#chart").select("svg");

    xScale.domain(d3.extent(commits, d => d.datetime));

    const rScale = d3.scaleSqrt()
        .domain(d3.extent(commits, d => d.totalLines))
        .range([2, 30]);

    /* update axis */
    const xAxisGroup = svg.select("g.x-axis");
    xAxisGroup.call(d3.axisBottom(xScale));

    /* update dots */
    const dots = svg.select("g.dots");

    const sorted = d3.sort(commits, d => -d.totalLines);

    dots.selectAll("circle")
        .data(sorted, d => d.id)
        .join("circle")
        .attr("cx", d => xScale(d.datetime))
        .attr("cy", d => yScale(d.hourFrac))
        .attr("r", d => rScale(d.totalLines))
        .attr("fill", "steelblue")
        .style("fill-opacity", 0.7)
        .on("mouseenter", (event, d) => {
            renderTooltipContent(d);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on("mouseleave", () => updateTooltipVisibility(false));
}

/* ---------------- FILE DISPLAY ---------------- */
function updateFileDisplay(commits) {
    let lines = commits.flatMap(d => d.lines);

    let files = d3
        .groups(lines, (d) => d.file)
        .map(([name, lines]) => {
            return { name, lines };
        })
        .sort((a, b) => b.lines.length - a.lines.length);
    let container = d3.select("#files")
        .selectAll("div")
        .data(files, d => d.name)
        .join(enter =>
            enter.append("div").call(div => {
                div.append("dt").append("code");
                div.append("dd");
            })
        );

    container.select("dt").html(d =>
        `<code>${d.name}</code><small>${d.lines.length} lines</small>`
    );

    container.select("dd")
        .selectAll("div")
        .data(d => d.lines)
        .join("div")
        .attr("class", "loc")
        .style("--color", d => colors(d.type));
}

/* ---------------- INIT ---------------- */
const data = await loadData();
const bommits = processCommits(data);

const commits = d3.sort(processCommits(data), d => d.datetime);

commitsGlobal = commits;

renderScatterPlot(data, commits);
renderStats(commits, data);
updateFileDisplay(commits);

// /* ---------------- SLIDER ---------------- */
// let commitProgress = 100;

// let timeScale = d3.scaleTime()
//     .domain(d3.extent(commits, d => d.datetime))
//     .range([0, 100]);

// let commitMaxTime = timeScale.invert(commitProgress);

// const slider = document.getElementById("commit-progress");
// const timeElement = document.getElementById("commit-time");

// function onTimeSliderChange() {
//     commitProgress = +slider.value;
//     commitMaxTime = timeScale.invert(commitProgress);

//     const filtered = commits.filter(d => d.datetime <= commitMaxTime);

//     updateScatterPlot(filtered);
//     updateFileDisplay(filtered);
//     renderStats(filtered, data);

//     timeElement.textContent = commitMaxTime.toLocaleString([], {
//         dateStyle: "long",
//         timeStyle: "short"
//     });
// }

// slider.addEventListener("input", onTimeSliderChange);
// onTimeSliderChange();

// Target the inner container specifically
d3.select('#scatter-story')
    .selectAll('.step')
    .data(commits)
    .join('div')
    .attr('class', 'step')
    .html(
        (d, i) => `
        <p>On <strong>${d.datetime.toLocaleString('en', { dateStyle: 'full', timeStyle: 'short' })}</strong>, 
        I made <a href="${d.url}" target="_blank">${i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}</a>.</p>
        <p>I edited <strong>${d.totalLines} lines</strong> across <strong>${d3.rollups(d.lines, D => D.length, d => d.file).length} files</strong>.</p>
        <p style="font-style: italic; color: gray;">Then I looked over all I had made, and I saw that it was very good.</p>
    `,
    );



function updateFromScroll(commit) {
    const filtered = d3.sort(
        commits.filter(d => d.datetime <= commit.datetime),
        d => d.datetime
    );

    updateScatterPlot(filtered);
    updateFileDisplay(filtered);
    renderStats(filtered, data);
}

function onStepEnter(response) {
    const commit = response.element.__data__;
    updateFromScroll(commit);
}

const scroller = scrollama();

function initScrollama() {
    scroller
        .setup({
            container: "#scrolly-1",
            step: "#scrolly-1 .step",
            offset: 0.5
        })
        .onStepEnter(onStepEnter);
}

initScrollama();