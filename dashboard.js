d3.csv('subject_info.csv').then(data => {
    // Parse data as needed
    data.forEach(d => {
        console.log(d.Age);
        d.Age = +d.Age; // Convert age to a number
    });
    console.log("Adding histogram");
    createHistogram(data);
    console.log("Adding bar chart");
    createBarChart(data);
    console.log("Adding pie chart");
    createPieChart(data);
    console.log("Adding second pie chart");
    createEthnicityPieChart(data);
});

function createHistogram(data) {
    console.log("In the createHistogram function");
    const width = 400, height = 300, margin = {top: 20, right: 30, bottom: 40, left: 40};
    const svg = d3.select("#histogram")
        .append("svg")
        //.attr("width", width)
        //.attr("height", height);
        .attr("viewBox", `0 0 400 300`) // Maintain a fixed aspect ratio
        .attr("preserveAspectRatio", "xMidYMid meet") // Ensure the SVG scales within the container
        .style("width", "100%") // Make SVG responsive to container width
        .style("height", "auto"); // Maintain aspect ratio

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Age))
        .nice() // Extend domain to nice round values
        .range([margin.left, width - margin.right]);

    const bins = d3.histogram()
        .value(d => d.Age)
        .domain(x.domain())
        .thresholds(x.ticks(5))(data);

    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .nice() // Extend domain to nice round values
        .range([height - margin.bottom, margin.top]);

    // Color scale for the bars
    const color = d3.scaleSequential(d3.interpolateRainbow)
        .domain([0, bins.length]); // Maps indices of bars to colors
    
    const bar = svg.selectAll(".bar")
        .data(bins)
        .join("g")
        .attr("transform", d => `translate(${x(d.x0)},${height - margin.bottom})`); // Start bars at the bottom

    // Append rectangles with animation and easing
    bar.append("rect")
        .attr("x", 1)
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("height", 0) // Start height at 0 for animation
        .attr("fill", (d, i) => d3.color(color(i)).brighter(1)) // Lighten the rainbow colors
        .transition()
        .duration(1000)
        .ease(d3.easeBounceOut) // Apply easing function here
        .attr("y", d => y(d.length) - (height - margin.bottom)) // Correct y position
        .attr("height", d => height - margin.bottom - y(d.length));

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2) // Center the label horizontally
        .attr("y", height - margin.bottom + 30) // Position it below the axis (adjust 30 as needed)
        .attr("text-anchor", "middle") // Center the text
        .attr("font-size", "14px")
        .text("Age");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5));
    
    // Add y-axis label
    svg.append("text")
        .attr("x", -height / 2) // Center vertically relative to the height
        .attr("y", margin.left - 30) // Position it relative to the left margin (adjust -40 as needed)
        .attr("text-anchor", "middle") // Center the text relative to its x and y coordinates
        .attr("transform", "rotate(-90)") // Rotate text to be vertical
        .attr("font-size", "14px")
        .text("Number of participants");

}


function createBarChart(data) {
    const width = 400, height = 300, margin = {top: 20, right: 30, bottom: 40, left: 40};
    const svg = d3.select("#barchart")
        .append("svg")
        .attr("viewBox", `0 0 400 300`) // Maintain a fixed aspect ratio
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "auto");

    const sexCounts = d3.rollup(data, v => v.length, d => d.Sex);
    const x = d3.scaleBand()
        .domain(Array.from(sexCounts.keys()))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(sexCounts.values())])
        .range([height - margin.bottom, margin.top]);

    const color = d => d === "Male" ? "#78D5D7" : d === "Female" ? "#FFA69E" : "gray";

    // Create a tooltip
    const tooltip = d3.select("#tooltip");

    svg.selectAll(".bar")
        .data(sexCounts)
        .join("rect")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(0))
        .attr("height", 0)
        .attr("width", x.bandwidth())
        .attr("fill", d => color(d[0]))
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`<strong>${d[0]}</strong>: ${d[1]} participants`);
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
        })
        .transition()
        .duration(1000)
        .ease(d3.easeElastic)
        .attr("y", d => y(d[1]))
        .attr("height", d => y(0) - y(d[1]));

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));
}


function createPieChart(data) {
    const width = 300, height = 300, radius = Math.min(width, height) / 2;
    const svg = d3.select("#piechart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const causeCounts = d3.rollup(data, v => v.length, d => d.Race);
    const pie = d3.pie().value(d => d[1])(Array.from(causeCounts));
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const pieColors = ["#78D5D7", "#FFA69E", "#D4E157", "#C3A6FF", "#FFC5A1"];
    const color = d3.scaleOrdinal().range(pieColors);

    // Define an arc generator for the initial state (start angle = end angle)
    const arcTween = function(d) {
        const i = d3.interpolate({startAngle: 0, endAngle: 0}, d);
        return function(t) {
            return arc(i(t));
        };
    };

    //const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create pie slices
    const slices = svg.selectAll("path")
        .data(pie)
        .join("path")
        .attr("fill", (d, i) => color(i))
        .transition()
        .duration(1000)
        .attrTween("d", arcTween);

    // Add labels
    const labelArc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius * 0.6);

    svg.selectAll("text")
        .data(pie)
        .join("text")
        .transition()
        .delay(1000) // Delay labels until slices are fully grown
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text(d => d.data[0]); // Display the cause (label)
}

function createEthnicityPieChart(data) {
    const width = 300, height = 300, radius = Math.min(width, height) / 2;
    const svg = d3.select("#piechart2")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const causeCounts = d3.rollup(data, v => v.length, d => d.Ethnicity);
    const pie = d3.pie().value(d => d[1])(Array.from(causeCounts));
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const pieColors = ["#78D5D7", "#FFA69E", "#D4E157", "#C3A6FF", "#FFC5A1"];
    const color = d3.scaleOrdinal().range(pieColors);

    // Define an arc generator for the initial state (start angle = end angle)
    const arcTween = function(d) {
        const i = d3.interpolate({startAngle: 0, endAngle: 0}, d);
        return function(t) {
            return arc(i(t));
        };
    };

    //const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create pie slices
    const slices = svg.selectAll("path")
        .data(pie)
        .join("path")
        .attr("fill", (d, i) => color(i))
        .transition()
        .duration(1000)
        .attrTween("d", arcTween);

    // Add labels
    const labelArc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius * 0.6);

    svg.selectAll("text")
        .data(pie)
        .join("text")
        .transition()
        .delay(1000) // Delay labels until slices are fully grown
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text(d => d.data[0]); // Display the cause (label)
}



function createRaceEthnicityChart(data) {
    const width = 400, height = 300, margin = {top: 20, right: 30, bottom: 60, left: 60};
    const svg = d3.select("#dashboard")
        .append("div")
        .attr("id", "raceEthnicityChart")
        .append("svg")
        //.attr("width", width)
        //.attr("height", height);
        .attr("viewBox", `0 0 300 300`) // Maintain a fixed aspect ratio
        .attr("preserveAspectRatio", "xMidYMid meet") // Ensure the SVG scales within the container
        .style("width", "100%") // Make SVG responsive to container width
        .style("height", "auto"); // Maintain aspect ratio

    // Aggregate counts of race and ethnicity combinations
    const nestedData = d3.group(data, d => d.Race, d => d.Ethnicity);
    const races = Array.from(nestedData.keys());
    const ethnicityCategories = ["Hispanic or Latino", "Not Hispanic or Latino"];

    // Count totals for bar heights
    const counts = races.map(race => {
        return ethnicityCategories.map(ethnicity => {
            const count = nestedData.get(race)?.get(ethnicity)?.length || 0;
            return {race, ethnicity, count};
        });
    }).flat();

    // Scales
    const x0 = d3.scaleBand()
        .domain(races)
        .range([margin.left, width - margin.right])
        .paddingInner(0.1);

    const x1 = d3.scaleBand()
        .domain(ethnicityCategories)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, d3.max(counts, d => d.count)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
        .domain(ethnicityCategories)
        .range(["#98FB98", "#FFB6C1"]); // Colors for the bars

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x0))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    // Bars
    const barGroups = svg.selectAll(".bar-group")
        .data(counts)
        .join("g")
        .attr("transform", d => `translate(${x0(d.race)},0)`);

    barGroups.append("rect")
        .attr("x", d => x1(d.ethnicity))
        .attr("y", y(0)) // Start at the bottom for animation
        .attr("width", x1.bandwidth())
        .attr("height", 0) // Start with zero height for animation
        .attr("fill", d => color(d.ethnicity))
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("y", d => y(d.count))
        .attr("height", d => height - margin.bottom - y(d.count));

    // Legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right - 100},${margin.top})`);

    legend.selectAll("rect")
        .data(ethnicityCategories)
        .join("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => color(d));

    legend.selectAll("text")
        .data(ethnicityCategories)
        .join("text")
        .attr("x", 20)
        .attr("y", (d, i) => i * 20 + 12)
        .text(d => d)
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
}

