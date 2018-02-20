class Hierarchy {

    constructor(usmap) {
        this.usmap = usmap;
    }

    draw() {
        let diameter = 960;

        let cluster = d3.cluster()
            .size([360, diameter / 2 -120]);

        let line = d3.radialLine()
            .curve(d3.curveBundle.beta(0.9))
            .radius(function (d) {
                return d.y;
            })
            .angle(function (d) {
                return d.x / 180 * Math.PI;
            });

        let div = d3.select("#hierarchy")

        let svg = div.append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox","0 0 "+diameter+" "+diameter);

        let legendgroup1 = svg.append("g")
            .attr("id", "hierarchylegend1")
            .attr("transform", "translate(10, 80)");

        let legendgroup2 = svg.append("g")
            .attr("id", "hierarchylegend2")
            .attr("transform", "translate("+ (diameter - 120) +", "+ (diameter - 120) +")");

        let colorScale = d3.scaleOrdinal()
            .domain(["Inbound Only", "Outbound Only", "Inbound & Outbound"])
            .range(["#ffb51d", "#68a064", "#dc6c6f"])
        let legendOrdinal = d3.legendColor()
            .shape("path", d3.symbol().type(d3.symbolSquare).size(42)())
            .shapePadding(7)
            .scale(colorScale);

        legendgroup1.call(legendOrdinal);
        legendgroup2.call(legendOrdinal);

        //creading tooltip
        let tip = d3.tip()
            .attr('class', 'hierarchy-tip')
            .offset([-30, 0])
            .html(function(d) {
                let point = new GeoPoint(Math.abs(d.data.lon), Math.abs(d.data.lat));
                return "<h7><strong>"+ d.data.fullname+"</strong></h7>"+
                    "<table>"+
                    "<tr>"+
                    "<td class='tooltipindex'>City</td>"+
                    "<td>"+d.data.municipality+", "+d.data.iso_region.slice(3)+"</td>"+
                    "</tr>"+
                    "<tr>"+
                    "<td class='tooltipindex'>Coordinate</td>"+
                    "<td>"+point.getLonDeg() + (d.data.lon < 0 ? 'W' : 'E') +" "+ point.getLatDeg() + (d.data.lat < 0 ? 'S' : 'N')+"</td>"+
                    "</tr>"+
                    "<tr>"+
                    "<td class='tooltipindex'>Elevation</td>"+
                    "<td>"+d.data.elevation_ft+" ft</td>"+
                    "</tr>"+
                    "<tr>"+
                    "<td class='tooltipindex'>Annual Flights</td>"+
                    "<td>"+d.data.Count+"(Dep), "+d.data.Count2+"(Arr)</td>"+
                    "</tr>"+
                    "<tr>"+
                    "<td class='tooltipindex'>Average Delay</td>"+
                    "<td>"+d.data.DepDelay.toFixed(2)+"min (Dep), "+d.data.ArrDelay.toFixed(2)+"min (Arr)</td>"+
                    "</tr>"+
                    "<tr>"+
                    "<td class='tooltipindex'>15+ min Delay</td>"+
                    "<td>"+(d.data["15minDepDelay"] * 100).toFixed(2)+"% (Dep), "+(d.data["15minArrDelay"] * 100).toFixed(2)+"% (Arr)</td>"+
                    "</tr>"+
                    "</table>";
            })
        svg.call(tip);

        let graphgroup = svg.append("g")
            .attr("transform", "translate(" + (diameter / 2) + "," + (diameter / 2) + ")");

        let link = graphgroup.append("g").selectAll(".link"),
            node = graphgroup.append("g").selectAll(".node");

        d3.json("dataset/hierarchy.json", function (error, classes) {

            let root = packageHierarchy(classes)
                .sum(function (d) {
                    return d.size;
                });

            cluster(root);

            link = link
                .data(packageImports(root.leaves()))
                .enter().append("path")
                .each(function (d) {
                    d.source = d[0], d.target = d[d.length - 1];
                })
                .attr("class", "link")
                .attr("d", line);

            node = node
                .data(root.leaves())
                .enter().append("text")
                .attr("class", "node")
                .attr("dy", "0.2em")
                .attr("transform", function (d) {
                    return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)");
                })
                .attr("text-anchor", function (d) {
                    return d.x < 180 ? "start" : "end";
                })
                .text(function (d) {
                    let result = d.data.municipality + " (" + d.data.key + "), " +d.data.iso_region.slice(3, 5)
                    return result;
                })
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);
        });

        function mouseover(d) {

            tip.show(d);

            node
                .each(function (n) {
                    n.target = n.source = false;
                });

            link
                .each(function (l) {
                    if (l.target === d)
                        l.source.source = true;
                    if (l.source === d)
                        l.target.target = true;
                })

            link
                .classed("link--both", function (l) {
                    if (l.target === d) {
                        return l.source.target && l.source.source;
                    } else if (l.source === d) {
                        return l.target.target && l.target.source;
                    } else {
                        return false;
                    }
                })
                .classed("link--source", function (l) {
                    if (l.target === d) {
                        return l.source.source && !l.source.target;
                    } else {
                        return false;
                    }
                })
                .classed("link--target", function (l) {
                    if (l.source === d) {
                        return l.target.target && !l.target.source;
                    } else {
                        return false;
                    }
                })
                .filter(function (l) {
                    return l.target === d || l.source === d;
                })
                .raise();

            node
                .classed("node--target", function (n) {
                    return n.target && !n.source;
                })
                .classed("node--source", function (n) {
                    return n.source && !n.target;
                })
                .classed("node--both", function (n) {
                    return n.target && n.source;
                });
        }

        function mouseout(d) {

            tip.hide(d);

            link
                .classed("link--both", false)
                .classed("link--target", false)
                .classed("link--source", false);

            node
                .classed("node--both", false)
                .classed("node--target", false)
                .classed("node--source", false);
        }

        function packageHierarchy(classes) {
            let map = {};

            function find(name, data) {
                let node = map[name], i;
                if (!node) {
                    node = map[name] = data || {name: name, children: []};
                    if (name.length) {
                        node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
                        node.parent.children.push(node);
                        node.key = name.substring(i + 1);
                    }
                }
                return node;
            }

            classes.forEach(function (d) {
                find(d.name, d);
            });

            return d3.hierarchy(map[""]);
        }

        function packageImports(nodes) {
            var map = {},
                imports = [];

            // Compute a map from name to node.
            nodes.forEach(function (d) {
                map[d.data.name] = d;
            });

            // For each import, construct a link from the source to target node.
            nodes.forEach(function (d) {
                if (d.data.imports) d.data.imports.forEach(function (i) {
                    imports.push(map[d.data.name].path(map[i]));
                });
            });

            return imports;
        }
    }
}