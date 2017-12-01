class Force {

    constructor(usmap) {
        this.usmap = usmap;
    }

    draw() {

        let usmap = this.usmap;

        let width = 1600
        let height = 1050

        let domain = [-10, -5, 0, 5, 10, 15];
        // let range = ["DarkGreen", "SeaGreen", "DarkSeaGreen", "LightSteelBlue", "SkyBlue", "Crimson", "DarkRed"];
        // let range2 = ["#06783e", "#089c51", "#31bd82", "#6bd6ae", "#9ee1ca", "#c6dbef", "#fcbba1", "#fc9272", "#fb6a4a", "#de2d26", "#860308"];
        let range3 = [
            "#386434",
            "#4e8b4f",
            "#89b938",
            "#82c7db",
            "#ffdd76",
            "#ffab29",
            "#de5551"];
        let colorScale = d3.scaleThreshold()
            .domain(domain)
            .range(range3);

        let div = d3.select("#force")

        //setting svg to be responsive
        let svg = div.append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox","0 0 "+width * 0.5+" "+height * 0.5);

        //creating legend
        let legendgroup = svg.append("g")
            .attr("id", "forcelegend")
            .attr("transform", "translate("+ (width * 0.5 - 150) +", "+ (height * 0.5 - 200) +")");

        let legendQuantile = d3.legendColor()
            .labelFormat(d3.format(".2f"))
            .labels(d3.legendHelpers.thresholdLabels)
            .title("Average Departure Delay (in minutes)")
            .titleWidth(150)
            .shape("path", d3.symbol().type(d3.symbolSquare).size(60)())
            .shapePadding(5)
            .scale(colorScale)

        legendgroup.call(legendQuantile);

        //creading tooltip
        let tip = d3.tip()
            .attr('class', 'force-tip')
            .offset([-10, 0])
            .html(function(d) {
                console.log(d)
                return "<h8><strong>"+ d.name+"</strong></h8>"+
                    "<table>"+
                    "<tr>"+
                    "<td class='tooltipindex'>City: </td>"+
                    "<td>"+d.municipality+", "+d.iso_region.slice(3)+"</td>"+
                    "</tr>"+
                    "</table>";
            })
        svg.call(tip);

        let simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(d => d.id))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width * 0.5 / 2, height * 0.5 / 2));

        d3.json("dataset/force.json", function (error, graph) {

            let linkgroup = svg.append("g")
                .attr("id", "forcelinks")
            let links = linkgroup.selectAll("line")
                .data(graph.links)
                .enter().append("line")
                .attr("stroke-width", function (d) {
                    let w = Math.log(parseInt(d.value)) / 50;
                    return w;
                })
                .attr("class", "forcelink");

            let nodegroup = svg.append("g")
                .attr("id", "forcenodes")
            let nodes = nodegroup
                .selectAll("circle")
                .data(graph.nodes)
                .enter().append("circle")
                .attr("r", function (d) {
                    let v = Math.log(parseInt(d.Count)) / 2;
                    return v;
                })
                .attr("fill", function (d) {
                    return colorScale(d.DepDelay);
                })
                .attr("class", "forcenode")
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended))
                .on("click", function (d) {
                    usmap.simulateClick(d, d3.select(this));
                })
                .on("mouseover", tip.show)
                .on("mouseout", tip.hide)

            simulation.nodes(graph.nodes);
            simulation.force("link")
                .links(graph.links);

            simulation.on("tick", function () {
                links
                    .attr("x1", function (d) {
                        return d.source.x;
                    })
                    .attr("y1", function (d) {
                        return d.source.y;
                    })
                    .attr("x2", function (d) {
                        return d.target.x;
                    })
                    .attr("y2", function (d) {
                        return d.target.y;
                    });

                nodes
                    .attr("cx", function (d) {
                        return d.x;
                    })
                    .attr("cy", function (d) {
                        return d.y;
                    });
            });
        });

        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }
}