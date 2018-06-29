/**
 * @file Code related to live chart
 */

/**
 * Give the points a 3D feel by adding a radial gradient
 */
Highcharts.setOptions({
	colors: $.map(Highcharts.getOptions().colors, function (color) {
		return {
			radialGradient: {
				cx: 0.4,
				cy: 0.3,
				r: 0.5
			},
			stops: [
				[0, color],
				[1, Highcharts.Color(color).brighten(-0.2).get('rgb')]
			]
		};
	})
});

/**
 * Set up the chart
 */
var chart = new Highcharts.Chart({
	chart: {
		renderTo: 'live_chart',
		margin: 100,
		type: 'scatter3d',
		animation: false,
		options3d: {
			enabled: true,
			alpha: 10,
			beta: 30,
			depth: 250,
			viewDistance: 5,
			fitToPlot: false,
			frame: {
				bottom: { size: 1, color: 'rgba(0,0,0,0.02)' },
				back: { size: 1, color: 'rgba(0,0,0,0.04)' },
				side: { size: 1, color: 'rgba(0,0,0,0.06)' }
			}
		}
	},
	exporting: {
		enabled: false
	},
	credits: {
		enabled: false
	},
	title: {
		text: 'Live Position'
	},
	subtitle: {
		text: 'Trajectory described by the balloon since browser being opened'
	},
	tooltip: {
		followPointer: false,
		formatter: function () {
			return '<b>'+this.series.name+'</b><br/>\
			lat: ' + this.point.x + '<br/>\
			lon: ' + this.point.z + '<br/>\
			alt: ' + this.point.y + '<br/>\
			time: ' + moment(this.time).format("YYYY-MM-DD H:mm");
		},
		hideDelay: 600
	},
	plotOptions: {
		scatter: {
			width: 10,
			height: 10,
			depth: 10
		}
	},
	yAxis: {
		title: null
	},
	xAxis: {
		gridLineWidth: 1
	},
	zAxis: {
		showFirstLabel: false
	},
	legend: {
		enabled: false
	},
	series: [{
		name: 'Live Position',
		colorByPoint: true,
		data: []
	}]
});

/**
 * Add mouse and touch events for rotation
 */
(function (H) {
	function dragStart(eStart) {
		eStart = chart.pointer.normalize(eStart);

		var posX = eStart.chartX,
			posY = eStart.chartY,
			alpha = chart.options.chart.options3d.alpha,
			beta = chart.options.chart.options3d.beta,
			sensitivity = 5; // lower is more sensitive

		function drag(e) {
			// Get e.chartX and e.chartY
			e = chart.pointer.normalize(e);

			chart.update({
				chart: {
					options3d: {
						alpha: alpha + (e.chartY - posY) / sensitivity,
						beta: beta + (posX - e.chartX) / sensitivity
					}
				}
			}, undefined, undefined, false);
		}

		chart.unbindDragMouse = H.addEvent(document, 'mousemove', drag);
		chart.unbindDragTouch = H.addEvent(document, 'touchmove', drag);

		H.addEvent(document, 'mouseup', chart.unbindDragMouse);
		H.addEvent(document, 'touchend', chart.unbindDragTouch);
	}
	H.addEvent(chart.container, 'mousedown', dragStart);
	H.addEvent(chart.container, 'touchstart', dragStart);
}(Highcharts));