import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

/* ---------------- GLOBAL STATE ---------------- */
let xScale, yScale, commitsGlobal;

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
        let { author, date, time, timezone, datetime } = first;

        let ret = {
            id: commit,
            url: "https://github.com/vis-society/lab-7/commit/" + commit,
            author,
            date,
            time,
            timezone,
            datetime,
            hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
            totalLines: lines.length,
        };

        Object.defineProperty(ret, "lines", {
            value: lines,
            writable: true,
            configurable: true,
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
        commit.datetime?.toLocaleString("en", {
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

function renderSelectionCount(selection) {
    const selected = selection
        ? commitsGlobal.filter((d) => isCommitSelected(selection, d))
        : [];

    document.getElementById("selection-count").textContent =
        `${selected.length || "No"} commits selected`;
}

function renderLanguageBreakdown(selection) {
    const selected = selection
        ? commitsGlobal.filter((d) => isCommitSelected(selection, d))
        : [];

    const container = document.getElementById("language-breakdown");

    if (!selected.length) {
        container.innerHTML = "";
        return;
    }

    const lines = selected.flatMap((d) => d.lines);

    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
        lines,
        (v) => v.length,
        (d) => d.type
    );

    container.innerHTML = "";

    for (const [lang, count] of breakdown) {
        // Calculate percentage based on the total lines in the selection
        const proportion = count / lines.length;
        const formattedPercentage = d3.format(".1%")(proportion);

        container.innerHTML += `
            <div>
                <dt>${lang}</dt>
                <dd>${count} lines</dd>
                <dd>(${formattedPercentage})</dd>
            </div>
        `;
    }
}

/* ---------------- SCATTERPLOT ---------------- */
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

    const svg = d3
        .select("#chart")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("overflow", "visible");

    /* scales */
    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([usable.left, usable.right])
        .nice();

    yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([usable.bottom, usable.top]);

    /* axes */
    svg.append("g")
        .attr("transform", `translate(0, ${usable.bottom})`)
        .attr("class", "x-axis")
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("transform", `translate(${usable.left}, 0)`)
        .attr("class", "y-axis")
        .call(
            d3.axisLeft(yScale).tickFormat(
                (d) => String(d).padStart(2, "0") + ":00"
            )
        );

    /* radius */
    const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);

    const rScale = d3.scaleSqrt()
        .domain([minLines, maxLines])
        .range([2, 30]);

    /* sort */
    const sorted = d3.sort(commits, d => -d.totalLines);

    /* dots */
    const dots = svg.append("g").attr("class", "dots");

    dots.selectAll("circle")
        .data(sorted, (d) => d.id)
        .join("circle")
        .attr("cx", d => xScale(d.datetime))
        .attr("cy", d => yScale(d.hourFrac))
        .attr("r", d => rScale(d.totalLines))
        .attr("fill", "steelblue")
        .style("fill-opacity", 0.7)
        .on("mouseenter", (event, d) => {
            d3.select(event.currentTarget).style("fill-opacity", 1);
            renderTooltipContent(d);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on("mouseleave", (event) => {
            d3.select(event.currentTarget).style("fill-opacity", 0.7);
            updateTooltipVisibility(false);
        });

    /* brush */
    function brushed(event) {
        const selection = event.selection;

        dots.selectAll("circle")
            .classed("selected", d => isCommitSelected(selection, d));

        renderSelectionCount(selection);
        renderLanguageBreakdown(selection);
    }

    svg.call(d3.brush().on("start brush end", brushed));

    svg.selectAll(".dots, .overlay ~ *").raise();
}

function updateScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;

    const margin = { top: 10, right: 10, bottom: 30, left: 40 };

    const usable = {
        left: margin.left,
        right: width - margin.right,
        top: margin.top,
        bottom: height - margin.bottom,
    };

    const svg = d3.select("#chart").select("svg");

    xScale = xScale.domain(
        d3.extent(commits, (d) => d.datetime)
    );

    const [minLines, maxLines] = d3.extent(
        commits,
        (d) => d.totalLines
    );

    const rScale = d3.scaleSqrt()
        .domain([minLines, maxLines])
        .range([2, 30]);

    const xAxis = d3.axisBottom(xScale);

    const xAxisGroup = svg.select("g.x-axis");

    xAxisGroup.selectAll("*").remove();

    xAxisGroup.call(xAxis);

    const dots = svg.select("g.dots");

    const sorted = d3.sort(commits, d => -d.totalLines);

    dots.selectAll("circle")
        .data(sorted, (d) => d.id)
        .join("circle")
        .attr("cx", d => xScale(d.datetime))
        .attr("cy", d => yScale(d.hourFrac))
        .attr("r", d => rScale(d.totalLines))
        .attr("fill", "steelblue")
        .style("fill-opacity", 0.7)
        .on("mouseenter", (event, d) => {
            d3.select(event.currentTarget).style("fill-opacity", 1);
            renderTooltipContent(d);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on("mouseleave", (event) => {
            d3.select(event.currentTarget).style("fill-opacity", 0.7);
            updateTooltipVisibility(false);
        });
}

/* ---------------- INIT ---------------- */
const data = await loadData();
const commits = processCommits(data);

commitsGlobal = commits;

renderScatterPlot(data, commits);

let commitProgress = 100;

let timeScale = d3
    .scaleTime()
    .domain([
        d3.min(commits, (d) => d.datetime),
        d3.max(commits, (d) => d.datetime),
    ])
    .range([0, 100]);

let commitMaxTime = timeScale.invert(commitProgress);

let filteredCommits = commits;

const slider = document.getElementById('commit-progress');
const timeElement = document.getElementById('commit-time');

function onTimeSliderChange() {
    commitProgress = Number(slider.value);

    commitMaxTime = timeScale.invert(commitProgress);

    filteredCommits = commits.filter(
        (d) => d.datetime <= commitMaxTime
    );

    updateScatterPlot(data, filteredCommits);

    timeElement.textContent = commitMaxTime.toLocaleString([], {
        dateStyle: 'long',
        timeStyle: 'short'
    });

}

slider.addEventListener('input', onTimeSliderChange);

onTimeSliderChange();