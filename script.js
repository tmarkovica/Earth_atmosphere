const earthImagePath = "images/earth-globe.png";
const svgWidth = 930 + 10;
const svgHeight = 900;
const earthImageWidthAndHeight = 200;
const pixelsToResizeSphere = 15;
const earthRaidus = earthImageWidthAndHeight / 2;

var svg_animation;
var svg_graph;

var divGridItem_Data;
var divData;
var div_my_dataviz;

var atmosphereJson = {};


getJsonFromFile("atmosphere.json")
    .then(responseJson => {
        atmosphereJson = responseJson;
        startDrawingAtmosphere();
        plotTemperatureGraph();
    });

function getJsonFromFile(fileName) {
    return d3.json(fileName).then(function (json) {
        return json;
    });
}

function appendDivToDivGridItemData(idName) {
    return divGridItem_Data
        .append("div")
        .attr("id", idName);
}

function startDrawingAtmosphere() {
    divGridItem_Data = d3.selectAll("body").select(".grid-container").select("#grid-item-data");
    
    divData = appendDivToDivGridItemData("data");
    div_my_dataviz = appendDivToDivGridItemData("my_dataviz");

    svg_animation = createSvgElement();
    createEarthImage();
    addAtmosphereLayers();
}

function createSvgElement() {
    return d3.select("body").selectAll(".grid-container").selectAll("#grid-item-animation")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .style("border", "0px")
        .style("background", "#252527");
}

function createEarthImage() {
    var img = svg_animation.selectAll("image").data([0]);
    img.enter()
        .append("svg:image")
        .attr("xlink:href", function () { return earthImagePath; })
        .attr("x", svgWidth / 2 - earthImageWidthAndHeight / 2)
        .attr("y", svgHeight / 2 - earthImageWidthAndHeight / 2)
        .attr("width", earthImageWidthAndHeight)
        .attr("height", earthImageWidthAndHeight)
        .attr("id", "earth");
}

function addAtmosphereLayers() {
    svg_animation.selectAll("g")
        .data(atmosphereJson)
        .enter()
        .append("g")
        .attr("id", function (d) {
            return d.name;
        })
        .attr("transform", "translate(" + svgWidth / 2 + "," + svgHeight / 2 + ")")
        .attr("d", function (d) {
            var sphere = createD3ArcForLayer(d.innerRadius, d.outerRadius);

            svg_animation.select("#" + d.name)
                .append("path")
                .attr("d", sphere)
                .attr("fill", d.color)
                .on("mouseover", function (e, d) {
                    showDataForThisLayer(d);
                    transition_SwitchDefaultSphereWithLargeSphere(d);
                    addLayerFeatureImagesToLayer(d);
                    highlightLayerSpanOnGraph(d);
                })
                .on("mouseout", function () {
                    transition_SetLayerToItsDefaultSize(d, sphere);
                    setLayerAsLastChildInSVGSoItCanExpandOverOtherArcs(d);
                    removeTextFrom_grid_item_data();
                    removeRotatingIcons();

                    removeHighlightedLayerSpanOnGraph();
                });
        });
}

function setLayerAsLastChildInSVGSoItCanExpandOverOtherArcs(layer) {
    svg_animation.select("#" + layer.name).each(function () {
        this.parentNode.appendChild(this);
    });
}

function createD3ArcForLayer(inner, outer) {
    return d3.arc()
        .innerRadius(inner)
        .outerRadius(outer)
        .startAngle(100)
        .endAngle(2 * 180)
}

function transition_SetLayerToItsDefaultSize(layer, sphere) {
    svg_animation.selectAll("#" + layer.name)
        .selectAll("path")
        .transition()
        .duration(1000)
        .attr("d", sphere)
        .attr("style", "stroke-width:0px");
}

function transition_SwitchDefaultSphereWithLargeSphere(layer) {
    var largeSphere = createD3ArcForLayer(layer.innerRadius - pixelsToResizeSphere, layer.outerRadius + pixelsToResizeSphere);

    svg_animation.select("#" + layer.name)
        .selectAll("path")
        .transition()
        .duration(1000)
        .attr("d", largeSphere)
        .attr("style", "stroke: gray; stroke-width:4px");
}

function removeTextFrom_grid_item_data() {
    document.getElementById("data").innerHTML = "";
}

function removeRotatingIcons() {
    svg_animation.selectAll(".g_icons").remove();
    svg_animation.selectAll(".g_icons_aurora").remove();
}

function removeHighlightedLayerSpanOnGraph() {
    svg_graph.selectAll("#layerSpan").remove();
}

function showLayerName(layer) {
    divData
        .append("p")
        .attr("id", "layerName")
        .attr("class", "whiteText removeMargin")
        .text(layer.name);
}

function showLayerNameMeaning(layer) {
    divData
        .append("p")
        .attr("id", "layerNameMeaning")
        .attr("class", "whiteText")
        .text(layer.meaning.word + " " + layer.meaning.translation + "; " + layer.meaning.explanation);
}

function showDistanceFromEarth(layer) {
    divData
        .append("p")
        .attr("id", "layerDistance")
        .attr("class", "whiteText removeMargin")
        .text("Distance from Earth: " + layer["distance from earth"].innerRadius + " - " + layer["distance from earth"].outerRadius + " km");
}

function show_hr_Line(widthPercentage) {
    divData
        .append("hr")
        .attr("width", widthPercentage + "%")
        .attr("align", "left");
}

function showLayerFacts(layer) {
    show_hr_Line(40);

    divData.selectAll("div")
        .data(layer.facts)
        .enter()
        .append("p")
        .attr("class", "whiteText")
        .text(function (d) { return d; });

    show_hr_Line(95);
}

function showDataForThisLayer(layer) {
    showLayerName(layer);
    showLayerNameMeaning(layer);
    showDistanceFromEarth(layer);
    showLayerFacts(layer);
}

function plotTemperatureGraph() {
    const divDataGridItemWidth = divGridItem_Data.node().getBoundingClientRect().width - 70;

    // set the dimensions and margins of the graph
    const margin = { top: 10, right: 30, bottom: 60, left: 80 },
        width = divDataGridItemWidth - margin.left - margin.right, //460
        height = 500 - margin.top - margin.bottom; //400

    // append the svg object to the body of the page
    svg_graph = div_my_dataviz
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    //Read the data
    d3.csv("temperature.csv",

        // When reading the csv, I must format variables:
        function (d) {
            return { temperature: d.temperature, distance: d.distance }
        }).then(

            // using dataset:
            function (data) {

                // Add X axis
                const x = d3.scaleLinear()
                    .domain(d3.extent(data, function (d) { return d.temperature; }))
                    .range([0, width]);
                svg_graph.append("g")
                    .attr("transform", `translate(0, ${height})`)
                    .call(d3.axisBottom(x))
                    .attr("class", "whiteText");

                // Max value observed:
                const maxDistance = d3.max(data, function (d) { return +d.distance; });

                const maxTemperature = d3.max(data, function (d) { return + d.temperature; });
                const minTemperature = d3.min(data, function (d) { return + d.temperature; });

                // Add Y axis
                const y = d3.scaleLinear()
                    .domain([0, maxDistance])
                    .range([height, 0]);
                svg_graph.append("g")
                    .call(d3.axisLeft(y))
                    .attr("class", "whiteText");

                // Set the gradient
                svg_graph.append("linearGradient")
                    .attr("id", "line-gradient")
                    .attr("gradientUnits", "userSpaceOnUse")
                    .attr("x1", x(minTemperature))
                    .attr("y1", y)
                    .attr("x2", x(maxTemperature))
                    .attr("y2", y)
                    .selectAll("stop")
                    .data([
                        { offset: "0%", color: "blue" },
                        { offset: "100%", color: "red" }
                    ])
                    .enter().append("stop")
                    .attr("offset", function (d) { return d.offset; })
                    .attr("stop-color", function (d) { return d.color; });

                // Add the line
                svg_graph.append("path")
                    .datum(data)
                    .attr("fill", "none")
                    .attr("stroke", "url(#line-gradient)")
                    .attr("stroke-width", 5)
                    .attr("d", d3.line()
                        .x(function (d) { return x(d.temperature) })
                        .y(function (d) { return y(d.distance) })
                    )
                    .attr("marker-end", "url(#arrow)");

                // x axis label
                svg_graph.append("text")
                    .attr("class", "axisLabel")
                    .text("[°C]")
                    .attr("transform", "translate(" + (width - margin.right) + "," + (height + margin.bottom - 10) + ")");

                // y axis label
                svg_graph.append("text")
                    .attr("class", "axisLabel")
                    .text("[km]")
                    .attr("transform", "translate(" + (-1*margin.left) + "," + margin.top + ")");

                // graph title label
                svg_graph.append("text")
                    .attr("class", "axisLabel")
                    .attr("text-anchor", "middle")
                    .attr("font-weight", "bold")
                    .text("Promjena temperature s udaljenosti od površine Zemlje")
                    .attr("transform", "translate(" + width/2 + "," + (height + margin.bottom - 10) + ")");
            });
}

function highlightLayerSpanOnGraph(layer) {
    const graphWidth = divGridItem_Data.node().getBoundingClientRect().width - 70 - 120;
    const graphHeight = 430;
    const maxDistance = 140;

    const innerRadius_kilometers = layer["distance from earth"].innerRadius;
    const outerRadius_kilometers = layer["distance from earth"].outerRadius;
    const layerHeight_kilometers = layer["distance from earth"].outerRadius - layer["distance from earth"].innerRadius;

    var height = 0;
    if (layer["distance from earth"].outerRadius >= 140)
        height = 430;
    else
        height = layerHeight_kilometers / maxDistance * graphHeight;

    console.log("real height ", outerRadius_kilometers - innerRadius_kilometers);
    console.log(height);

    svg_graph.append("rect")
        .attr("id", "layerSpan")
        .attr("y", graphHeight - height - innerRadius_kilometers / maxDistance * graphHeight)
        .attr("width", graphWidth)
        .attr("height", height)
        .attr("fill", "green")
        .attr("opacity", "0.1");
}

function addLayerFeatureImagesToLayer(layer) {
    const translateValueY = -1 * layer.outerRadius + 15;
    const className = "g_icons";

    if (layer.name === "Termosphere")
    {
        addIconToSphereArc(0, translateValueY, layer.featureImagePath, "g_icons_aurora"); // 12
        addIconToSphereArc(180, translateValueY, layer.featureImagePath, "g_icons_aurora"); // 6    
        return;   
    }
    else 
    {
        addIconToSphereArc(0, translateValueY, layer.featureImagePath, className); // 12
        addIconToSphereArc(180, translateValueY, layer.featureImagePath, className); // 6
        addIconToSphereArc(90, translateValueY, layer.featureImagePath, className); // 9
        addIconToSphereArc(-90, translateValueY, layer.featureImagePath, className); // 3
    }

    // rotate images
    var startTime = Date.now();
    d3.timer(function() {
        var delta = (Date.now() - startTime);
        svg_animation.selectAll("." + className)
            .attr("transform", 
                function(d,i) {
                    return "rotate(" + delta / 45 + "," + (svgWidth / 2) + "," + (svgHeight / 2) + ")";
                }
            );
    });
}

function addIconToSphereArc(degrees, translateValueY, imageName, className) {
    const icon_Width_Height = 60;
    var g = svg_animation.append("g").attr("class", className)
        .attr("pointer-events", "none");
    g.selectAll("g")
        .data([0])
        .enter()
        .append("g:image")
        .attr("xlink:href", imageName)
        .attr("x", svgWidth / 2)
        .attr("y", svgHeight / 2)
        .attr("width", icon_Width_Height)
        .attr("height", icon_Width_Height)
        .attr("transform", "rotate(" + degrees + "," + (svgWidth/2) + "," + (svgHeight / 2) + ") translate(0," + translateValueY + ")");
}