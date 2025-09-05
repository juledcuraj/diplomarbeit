/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.4215740740740741, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "GetAppointments_API_100RPS"], "isController": false}, {"data": [0.711, 500, 1500, "GetMetrics_API_250RPS"], "isController": false}, {"data": [0.113, 500, 1500, "GetMetrics_API_500RPS"], "isController": false}, {"data": [0.654, 500, 1500, "Login_API_250RPS"], "isController": false}, {"data": [0.09, 500, 1500, "Login_API_500RPS"], "isController": false}, {"data": [1.0, 500, 1500, "Login_API_50RPS"], "isController": false}, {"data": [1.0, 500, 1500, "GetMetrics_API_50RPS"], "isController": false}, {"data": [1.0, 500, 1500, "GetMetrics_API_100RPS"], "isController": false}, {"data": [0.1215, 500, 1500, "GetAppointments_API_500RPS"], "isController": false}, {"data": [1.0, 500, 1500, "Login_API_100RPS"], "isController": false}, {"data": [0.739, 500, 1500, "GetAppointments_API_250RPS"], "isController": false}, {"data": [1.0, 500, 1500, "GetAppointments_API_50RPS"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 5400, 0, 0.0, 1563.7425925925882, 10, 4671, 1175.0, 3456.5000000000027, 3780.0, 4140.0, 5.258944588253855, 10.861980277496977, 1.6982008566236408], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["GetAppointments_API_100RPS", 200, 0, 0.0, 26.689999999999994, 10, 100, 14.0, 87.9, 90.0, 94.97000000000003, 9.876543209876543, 16.97530864197531, 3.607253086419753], "isController": false}, {"data": ["GetMetrics_API_250RPS", 500, 0, 0.0, 543.8140000000004, 10, 1357, 560.5, 931.4000000000002, 1022.3499999999999, 1194.8100000000002, 10.863425020640507, 35.07273742015382, 3.9146521802894014], "isController": false}, {"data": ["GetMetrics_API_500RPS", 1000, 0, 0.0, 2614.3619999999996, 16, 4671, 2765.0, 3883.0, 3993.0, 4397.99, 9.896972516107322, 31.952530408448055, 3.5663895101988303], "isController": false}, {"data": ["Login_API_250RPS", 500, 0, 0.0, 678.6580000000001, 85, 1469, 689.5, 1089.3000000000006, 1212.0, 1370.95, 10.84104854621539, 13.540723721298324, 2.636153406257453], "isController": false}, {"data": ["Login_API_500RPS", 1000, 0, 0.0, 2671.644999999997, 103, 4586, 2856.5, 3832.8, 4062.7, 4407.76, 9.891979582954141, 12.355314342381197, 2.4053739415581847], "isController": false}, {"data": ["Login_API_50RPS", 100, 0, 0.0, 87.22, 81, 161, 84.0, 94.0, 97.84999999999997, 160.72999999999985, 5.23642456930408, 6.540417015761638, 1.2733102712467925], "isController": false}, {"data": ["GetMetrics_API_50RPS", 100, 0, 0.0, 12.720000000000004, 10, 22, 13.0, 14.0, 15.0, 21.93999999999997, 5.2856916327501455, 17.064938025265604, 1.904707238754691], "isController": false}, {"data": ["GetMetrics_API_100RPS", 200, 0, 0.0, 32.714999999999996, 10, 100, 15.0, 90.0, 92.0, 97.97000000000003, 9.87751876728566, 31.889723676412483, 3.5593793214144607], "isController": false}, {"data": ["GetAppointments_API_500RPS", 1000, 0, 0.0, 2245.8230000000035, 17, 4233, 2362.0, 3312.6, 3518.85, 3769.98, 9.897462290668672, 17.01126331208678, 3.614893453818441], "isController": false}, {"data": ["Login_API_100RPS", 200, 0, 0.0, 99.64999999999993, 80, 174, 87.5, 162.0, 165.0, 171.98000000000002, 9.83284169124877, 12.281449729596854, 2.3909937315634218], "isController": false}, {"data": ["GetAppointments_API_250RPS", 500, 0, 0.0, 516.1840000000004, 11, 1262, 532.0, 880.0000000000003, 1008.8499999999997, 1167.7000000000003, 10.863188997762183, 18.671106089903752, 3.967610044104547], "isController": false}, {"data": ["GetAppointments_API_50RPS", 100, 0, 0.0, 12.469999999999999, 11, 17, 12.0, 14.0, 15.0, 16.989999999999995, 5.2856916327501455, 9.084782493789312, 1.930516279930229], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 5400, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
