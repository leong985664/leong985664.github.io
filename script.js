let width = 550;
let height = 650;

let svg = d3.select('svg')
    .attr('width', width)
    .attr('height', height)

let table = [];
let sumEmp = 0;
let sumUnemp = 0;
let sumPop = 0;

let colorscale = d3.scaleLinear()
    .domain([0, 0.065])
    .range(['#FFFFDD', 'LightCoral'])


// Load in GeoJSON data
d3.json('data/utah.json', function (json) {

    let projection = d3.geoTransverseMercator()
        .rotate([111 + 30 / 60, -40 - 20 / 60])
        .fitExtent([[0, 0], [550, 650]], json);

    let path = d3.geoPath()
        .projection(projection);

    svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 550)
        .attr('height', 650)
        .attr('class', 'boarder')

    d3.select('#tract').selectAll('path')
        .data(json.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('id', function (d) {
            return 'n'+d.properties.geoid;
        })
        .attr('class', 'tract')
        .attr('stroke-width', 0.5)
        .attr('fill', function (d) {
            if (d.properties.emp + d.properties.unemp == 0) {
                return colorscale(0);
            }
            let rate = d.properties.unemp / (d.properties.emp + d.properties.unemp)
            if (rate < 0.065) {
                return colorscale(rate);
            } else {
                return 'darkred';
            }
        })
        .on('mouseover', function (d) {
            d3.select(this).classed('hovered', true)
            tip.show(d)
        })
        .on('mouseout', function (d) {
            d3.select(this).classed('hovered', false)
            tip.hide(d)
        })
        .on('click', function (d) {
            changeClass(d3.select(this));
            changeTable(d.properties);
            drawTable();
        })

    let tip = d3.tip()
        .attr('class', 'chart-tip')
        .offset([0, 0])
        .html(function (d) {
            let urate = 100 * d.properties.unemp / (d.properties.unemp + d.properties.emp)
            return "<h7><strong>"+ d.properties.name+"</strong></h7>"+
                "<table>"+
                "<tr>"+
                "<td class='tooltipindex'>Geoid</td>"+
                "<td>"+d.properties.geoid+"</td>"+
                "</tr>"+
                "<tr>"+
                "<td class='tooltipindex'>Population</td>"+
                "<td>"+d.properties.pop+"</td>"+
                "</tr>"+
                "<tr>"+
                "<td class='tooltipindex'>Unemployment Rate</td>"+
                "<td>"+urate.toFixed(3)+"%</td>"+
                "</tr>"
                "</table>";
        })
    let zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', zoomed);

    svg.call(tip)
    svg.call(zoom);
});

function zoomed() {
    d3.select('#tract').selectAll('path')
        .attr('stroke-width', 0.5 / d3.event.transform.k);
    d3.select('#tract')
        .attr('transform', d3.event.transform);
}

function rate(data) {
    let emp = data.properties.emp;
    let unemp = data.properties.unemp;
    if (emp + unemp == 0) {
        return 0;
    } else {
        return unemp / (emp + unemp);
    }
}

function changeClass(e) {
    let name = e.attr('class');
    if (name.includes('selected')) {
        e.classed('selected', false)
    } else {
        e.classed('selected', true)
    }
}

function changeTable(e) {
    console.log(e)
    let inTable = false;
    for (let i = table.length - 1; i >= 0; i--) {
        if (table[i].name == 'Total') {
            table.splice(i, 1);
            continue;
        }
        if (table[i].name == e.name) {
            table.splice(i, 1);
            inTable = true;
        }
    }
    if (!inTable)
        table.push(e);

    sumPop = 0
    sumEmp = 0
    sumUnemp = 0
    for (let i = 0; i < table.length; i++) {
        sumPop += table[i].pop;
        sumEmp += table[i].emp;
        sumUnemp += table[i].unemp;
    }
    sum = {name:'Total', pop:sumPop, emp:sumEmp, unemp:sumUnemp}
    table.push(sum);
    console.log(table)
}

function drawTable() {
    let tablebody = d3.select('#tablebody');
    let tr = tablebody.selectAll('tr')
        .data(table)
    tr.exit().remove()
    tr = tr.enter().append('tr').merge(tr)

    let td = tr.selectAll('td')
        .data(function (d) {
            let rate = ''
            if (d.emp + d.unemp == 0) {
                rate = 0 + '%';
            } else {
                rate = (100 * d.unemp / (d.emp + d.unemp)).toFixed(3) + '%';
            }
            return [d.name, d.pop, d.emp, d.unemp, rate]
        })
    td = td.enter().append('td').merge(td)
        .text(d => d)

    d3.select('#rate').html(function () {
        if (sumUnemp + sumEmp == 0) {
            return '0%'
        } else {
            return (100 * sumUnemp / (sumUnemp + sumEmp)).toFixed(3)+'%';
        }
    });
    d3.select('#pop').html(function () {
        return sumPop;
    });
    d3.select('#number').html(function () {
        return table.length-1 < 0 ? 0 : table.length-1;
    });
}

function greedy(i) {
    clearmap();
    if (i > 0) {
        d3.json('data/asu'+i+'.json', function (csv) {
            for (let i in csv) {
                d3.select('#n'+i).classed('selected', true);
                changeTable(csv[i]);
            }
            drawTable();
        });
    } else {
        d3.json('data/asub'+(-i)+'.json', function (csv) {
            for (let i in csv) {
                d3.select('#n'+i).classed('selected', true);
                changeTable(csv[i]);
            }
            drawTable();
        });
    }
}

function clearmap() {
    d3.select('#tract').selectAll('path')
        .classed('selected', false);
    table = [];
    sumUnemp = 0;
    sumEmp = 0;
    sumPop = 0;
    drawTable();
}