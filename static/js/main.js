/**
 * @file This is the main js script of public website
 */

var data = {};
var ws_host = document.location.host;
var ws = new WebSocket("ws://"+ ws_host +"/websocket");
ws.onopen = function () {
	ws.send(JSON.stringify({
		action: "start_data_loop"
	}));
};
ws.onmessage = function (evt) {
	var json = JSON.parse(evt.data);

	if(json.action == "payload_data") {
		data = json.data;
		var str = data.channel + " " + data.payload + ": " +
				"lat=" + data.lat + " lon=" + data.lon + " alt=" + data.alt +
				", t=" + data.time;
		document.getElementById("container").innerHTML = str;

		marker.setLatLng([data.lat, data.lon]);
		mymap.panTo(new L.LatLng(data.lat, data.lon));

		var color = "red";  // GLOBO ESTA PUJANT
		if(chart.series[0].points.length > 0 && chart.series[0].points[chart.series[0].points.length-1].y > data.alt) color = "green";  // GLOBO ESTA BAIXANT
		chart.series[0].addPoint({
			x: data.lat,
			z: data.lon,
			y: data.alt,
			time: data.time,
			color: color
		}, true, false);
		chart.tooltip.hide();
		chart.update({});
		chart.tooltip.hide();

		// simulator.update_position_globo(data.lat, data.lon, data.alt, data.time);
	}
	else if(json.action ==  "sessions_list"){
		render_sessions_list(json.data);
	}
	else if(json.action ==  "new_session") {
		if (json.data) {
			var session = json.session;
			if($("#table_sessions_list").length == 0) render_sessions_list([session]);
			else {
				var html = get_session_row(session);
				$("#table_sessions_list tbody").prepend(html);
			}
		} else {
			alert("You cannot create this session.");
		}
	}
	else if(json.action ==  "session_started") {
		session_started(json.session);
	}
	else if(json.action ==  "session_finalized") {
		session_finalized();
	}
	else if(json.action ==  "session_data"){
		render_session_data(json.session, json.data);
	}
	else if(json.action ==  "session_removed"){
		session_removed(json.session);
	}

};

window.onbeforeunload = function() {
	ws.onclose = function () {}; // disable onclose handler first
	ws.close()
};

var mymap = L.map('map_id').setView([41.35, 2.105], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: false,
	maxZoom: 18
}).addTo(mymap);
var marker = L.marker([0, 0]).addTo(mymap);

var is_live = false;
var _idGetLive;
function open_live_img(){
	is_live = !is_live;
	$("#container_live_img").toggle();
	if($("#btn_live_img").hasClass('active')) $("#btn_live_img").removeClass("active");
	else $("#btn_live_img").removeClass("active").addClass("active");
	if (is_live)
		_idGetLive = setInterval(function(){
			$("#live_img").prop('src', "http://" + ws_host + "/images/live?ts="+new Date().getTime());
		}, 1000);
	else clearInterval(_idGetLive);
}

function show(mode){
	$(".window-content").hide();
	switch (mode){
		case 'map':
			$("#container_map").show();
			mymap.invalidateSize();
			break;
		case 'simulator':
			$("#container_simulator").show();
			// simulator.update_screen();
			chart.setSize($("#live_chart").width(), window.innerHeight - $("#footer").height(), doAnimation=false);
			chart.setSize($("#live_chart").width(), window.innerHeight - $("#footer").height(), doAnimation=false);
			break;
		case 'history':
			$("#container_history").show();
			$("#history_list").show();
			$("#session_data").hide();
			$("#sessions_list").html('<h1 class="center">Loading . . .</h1>');
			get_sessions_list();
			break;
	}
}

// SESSIONS
var current_session = undefined;
// List
function get_sessions_list(){
	ws.send(JSON.stringify({
		action: "get_sessions_list"
	}));
}
function get_session_row(session){
	return '\
	<tr id="session_'+session+'" class="session-list">\
		<td><a onclick="show_session(\'' + session + '\')">' + session + '</a></td>\
		<td width="1%"><button class="btn btn-flat" onclick="remove_session(\'' + session + '\')"><i class="material-icons">delete</i></button></td>\
		<td width="1%">\
			<button class="btn btn-flat btn-start-session" onclick="start_session(\'' + session + '\')" ' + ((current_session != session) ? '' : 'style="display: none;"') + '><i class="material-icons">play_arrow</i></button>\
			<button class="btn btn-flat btn-finalize-session" onclick="finalize_session(\'' + session + '\')" ' + ((current_session == session) ? '' : 'style="display: none;"') + '><i class="material-icons">stop</i></button>\
		</td>\
	</tr>';
}
function render_sessions_list(sessions){
	var html = '';
	if(sessions.length == 0){
		html = '<h4 class="center">No sessions created</h4>';
	} else {
		html = '<table id="table_sessions_list" class="highlight"><thead><tr>\
			<th>Name</th>\
			<th>Remove</th>\
			<th>Action</th>\
		</tr></thead><tbody>';
		for(var i in sessions){
			var session = sessions[i];
			html += get_session_row(session);
		}
		html += '</tbody></table>';
	}
	$("#sessions_list").html(html);
}
// Manage
function open_create_session(){
	var session_name = prompt("Please enter a session name:", "");
	if (session_name !== null && session_name !== "") {
		ws.send(JSON.stringify({
			action: "new_session",
			session: session_name
		}));
	}
}
function start_session(session){
	ws.send(JSON.stringify({
		action: "start_session",
		session: session
	}));
}
function session_started(session){
	current_session = session;
	$("#current_session").html(session);
	$(".btn-start-session").show();
	$(".btn-finalize-session").hide();
	$("#session_" + current_session).find('.btn-start-session').hide();
	$("#session_" + current_session).find('.btn-finalize-session').show();
}
function finalize_session(session){
	ws.send(JSON.stringify({
		action: "finalize_session",
		session: session
	}));
}
function session_finalized(){
	current_session = undefined;
	$("#current_session").html("");
	$(".btn-start-session").show();
	$(".btn-finalize-session").hide();
}
// Remove
function remove_session(session){
	var conf = confirm("Are you sure to remove this session?");
	if(conf === true){
		ws.send(JSON.stringify({
			action: "remove_session",
			session: session
		}));
	}
}
function session_removed(session){
	if(session === current_session) {
		session_finalized();
		current_session = undefined;
	}
	$("#session_" + session).remove();
	if($(".session-list").length == 0) $("#sessions_list").html('<h4 class="center">No sessions created</h4>')
}
// Render
var current_session_data;
function show_session(session){
	$("#history_list").hide();
	$("#session_data").show();
	$("#session_data").html('<h3 class="center">Loading '+ session +' . . .</h3>');
	ws.send(JSON.stringify({
		action: "session_data",
		session: session
	}));
}
function render_session_data(session, data){
	current_session_data = {
		session: session,
		max_lat: undefined,
		min_lat: undefined,
		max_lon: undefined,
		min_lon: undefined,
		data: data
	};
	var html = '<h3 style="margin-top:0;">' +
		'<div class="right"><button class="btn btn-flat" onclick="show_session(\''+session+'\');"><i class="material-icons left">refresh</i> Refresh</button></div>' +
		'<i class="material-icons clickable" onclick="show(\'history\');" style="font-size: 32px;vertical-align: middle;">arrow_back</i> '+session+'' +
	'</h3>';

	if(data.length > 0) {
		var data_alt = [], data_velocity = [];
		var html_table_results = '<table id="table_lat_lon_session"><thead><tr>\
			<th>Lat</th>\
			<th>Lon</th>\
			<th>Alt</th>\
			<th>Time</th>\
		</tr></thead><tbody>';
		for (var i in data) {
			html_table_results += '<tr>\
				<td>'+round(data[i].lat, 4)+'</td>\
				<td>'+round(data[i].lon, 4)+'</td>\
				<td>'+round(data[i].alt, 0)+'</td>\
				<td>'+moment(data[i].time, 'X').format('YYYY-MM-DD H:mm')+'</td>\
			</tr>';
			// DATA CHARTS
			var vel = 0;
			if(i > 0) vel = (data[i].alt - data[i-1].alt) / (data[i].time - data[i-1].time);
			data_alt.push([data[i].time * 1000, data[i].alt]);
			data_velocity.push([data[i].time * 1000, vel]);

			// DATA TRAJECTORY
			if(current_session_data.max_lat == undefined || current_session_data.max_lat < data[i].lat) current_session_data.max_lat = data[i].lat;
			if(current_session_data.min_lat == undefined || current_session_data.min_lat > data[i].lat) current_session_data.min_lat = data[i].lat;
			if(current_session_data.max_lon == undefined || current_session_data.max_lon < data[i].lon) current_session_data.max_lon = data[i].lon;
			if(current_session_data.min_lon == undefined || current_session_data.min_lon > data[i].lon) current_session_data.min_lon = data[i].lon;
		}
		html_table_results += '</tbody></table>';
		html += '<div class="row">\
			<div class="col s4">\
				' + html_table_results + '\
			</div>\
			<div class="col s8">\
				<b>Time Information</b>\
				<div id="chart_time" style="margin-top: 18px;"></div>\
				<b>Lat/Lon Trajectory</b>\
				<div><canvas id="lat_lon_trajectory"/></div>\
			</div>\
		</div>';
		$("#session_data").html(html);

		var chart_time = Highcharts.chart('chart_time', {
			chart: {
				zoomType: 'x',
				events: {
					selection: function (event) {
						if(event.resetSelection === true) draw_lat_lon_trajectory(current_session_data.data);
						else {
							var data = [],
								max_lat, max_lon,min_lat, min_lon;
							for (var i in current_session_data.data) {
								if (current_session_data.data[i].time * 1000 < event.xAxis[0].min) continue;
								if (current_session_data.data[i].time * 1000 > event.xAxis[0].max) break;
								data.push(current_session_data.data[i]);

								if(max_lat == undefined || max_lat < current_session_data.data[i].lat) max_lat = current_session_data.data[i].lat;
								if(min_lat == undefined || min_lat > current_session_data.data[i].lat) min_lat = current_session_data.data[i].lat;
								if(max_lon == undefined || max_lon < current_session_data.data[i].lon) max_lon = current_session_data.data[i].lon;
								if(min_lon == undefined || min_lon > current_session_data.data[i].lon) min_lon = current_session_data.data[i].lon;

							}
							draw_lat_lon_trajectory(data, {lat:max_lat, lon:max_lon}, {lat:min_lat, lon:min_lon});
						}
					}
				}
			},
			title: {
				text: false
			},
			subtitle: {
				text: false
			},
			exporting: {
				enabled: false
			},
			credits: {
				enabled: false
			},
			xAxis: [{
				type: 'datetime'
			}],
			yAxis: [{ // Primary yAxis
				labels: {
					format: '{value} m/s',
					style: {
						color: Highcharts.getOptions().colors[1]
					}
				},
				title: {
					text: 'Velocity',
					style: {
						color: Highcharts.getOptions().colors[1]
					}
				}
			},
			{ // Secondary yAxis
				title: {
					text: 'Altitude',
					style: {
						color: Highcharts.getOptions().colors[0]
					}
				},
				labels: {
					format: '{value} m',
					style: {
						color: Highcharts.getOptions().colors[0]
					}
				},
				opposite: true
			}],
			tooltip: {
				shared: true
			},
			legend: {
				layout: 'horizontal',
				align: 'center',
				verticalAlign: 'bottom',
				floating: false,
				backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
			},
			series: [{
				name: 'Altitude',
				type: 'spline',
				yAxis: 1,
				data: data_alt,
				tooltip: {
					valueSuffix: ' m'
				}

			},
			{
				name: 'Velocity',
				type: 'spline',
				data: data_velocity,
				tooltip: {
					valueSuffix: 'm/s'
				}
			}]
		});

		draw_lat_lon_trajectory(data);

	} else {
		html += '\
		<h4 class="center">No data in this session.</h4>\
		<div class="center"><a onclick="show(\'history\');">Back to sessions list</a></div>';
		$("#session_data").html(html);
	}

}
function draw_lat_lon_trajectory(data, max_point, min_point){
	var w = $("#lat_lon_trajectory").parent().width(),
		h = w / (16/9);
	$("#lat_lon_trajectory").prop('width', w);
	$("#lat_lon_trajectory").prop('height', h);

	var canvas = $("#lat_lon_trajectory").get(0);
	var ctx = canvas.getContext("2d");

	// lat = y;
	// lon = x;
	if (max_point == undefined) {
		max_point = {
			lat: current_session_data.max_lat,
			lon: current_session_data.max_lon
		};
	}
	if (min_point == undefined) {
		min_point = {
			lat: current_session_data.min_lat,
			lon: current_session_data.min_lon
		};
	}
	// apply padding (for better visualization)
	var pad = 0.005;
	max_point.lat += pad;
	max_point.lon += pad;
	min_point.lat -= pad;
	min_point.lon -= pad;

	var total_lon = (max_point.lon - min_point.lon);
	var total_lat = (max_point.lat - min_point.lat);
	var radius = 5;
	var prev_x, prev_y;
	for(var i in data) {
		var x = ((data[i].lon - min_point.lon) / total_lon) * w;
		var y = ((data[i].lat - min_point.lat) / total_lat) * h;

		var color;
		if(i == 0) {  // START POINT
			color = "orange";

			ctx.beginPath();
			ctx.fillStyle = color;
			ctx.arc(x, y, radius + 2, 0, 2 * Math.PI);
			ctx.fill();

			ctx.beginPath();
			ctx.strokeStyle = color;
			ctx.arc(x, y, radius + 7, 0, 2 * Math.PI);
			ctx.stroke();

		} else if(i == data.length - 1) { // END POINT
			if (data[i].alt > data[i - 1].alt) color = "red";  // PUJANT
			else color = "green"; // BAIXANT

			ctx.beginPath();
			ctx.strokeStyle = color;
			ctx.moveTo(prev_x, prev_y);
			ctx.lineTo(x, y);
			ctx.stroke();

			color = "black";

			ctx.beginPath();
			ctx.fillStyle = color;
			ctx.arc(x, y, radius + 2, 0, 2 * Math.PI);
			ctx.fill();

			ctx.beginPath();
			ctx.strokeStyle = color;
			ctx.arc(x, y, radius + 7, 0, 2 * Math.PI);
			ctx.stroke();
		} else {  // FLIGHT
			if (data[i].alt > data[i - 1].alt) color = "red";  // PUJANT
			else color = "green"; // BAIXANT

			ctx.beginPath();
			ctx.strokeStyle = color;
			ctx.moveTo(prev_x, prev_y);
			ctx.lineTo(x, y);
			ctx.stroke();

			ctx.beginPath();
			ctx.fillStyle = color;
			ctx.arc(x, y, radius, 0, 2 * Math.PI);
			ctx.fill();
		}

		prev_x = x;
		prev_y = y;
	}
}


// SIMULATOR
// var simulator = new Simulator("screen");