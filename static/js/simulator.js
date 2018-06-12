function Simulator(container, options) {
    var self = this;
    // INIT COMPONENTS
    var screen = document.getElementById(container);
    var mode = (options != undefined && options.mode!=undefined) ? options.mode : "static";
    var side_edge = 3;
    var top_edge = 2;
    var aspectRatio = top_edge / side_edge;
    screen.style.width = window.innerWidth;
    screen.style.height = window.innerHeight;


    var scene = new THREE.Scene();

    var pivot = new THREE.Object3D();
    pivot.name = 'pivot';
    scene.add(pivot);

    var camera = new THREE.PerspectiveCamera();
    // var camera = new THREE.PerspectiveCamera(15, side_edge/top_edge, 1, 1000);
    // var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    camera.position.z = 8;
    scene.add(camera);
    pivot.add(camera);

    //Viewport handles scaling from browser window coordinates to three.js coordinates.
    var viewport = new THREE.ViewportConfig(camera, screen, 5, 5 * aspectRatio, camera.position.z);
    viewport.updateScale();
    var scales = viewport.getViewScale();

    //CamOrbit handles all navigation. It acts like a pivot point around which the user can move.
    var camOrbit = new THREE.OrbitControls(pivot, scales.width, scales.height, screen);

    //  RENDERER
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    screen.appendChild(renderer.domElement);
    //  END RENDERER

    /////////////////////////////////
    //  Plane
    var geoP = new THREE.PlaneGeometry(200, 200, 8, 8);
    var matP = new THREE.MeshLambertMaterial({color: 0x777777, shading: THREE.FlatShading});
    var plane = new THREE.Mesh(geoP, matP);
    plane.name = "plane";
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -3.5;
    scene.add(plane);

    //Lights!!
    var light = new THREE.DirectionalLight(0x404040, 5, 100);
    light.position.set(5, 5, 10);
    scene.add(light);
    light.target = plane;

    var globo = new Globo(scene, mode);

    function draw_demo() {
        // INIT OBJECTS
        var material = new THREE.MeshBasicMaterial({color: 0x00ff00});

        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-10, 0, 0));
        geometry.vertices.push(new THREE.Vector3(0, 10, 0));
        geometry.vertices.push(new THREE.Vector3(10, 0, 0));
        var line = new THREE.Line(geometry, material);
        scene.add(line);

        /////////////////////////////////
        //  mouse (cursor)
        var geoC = new THREE.OctahedronGeometry(0.4, 1);
        var geoC2 = new THREE.OctahedronGeometry(0.02, 1);
        var matC = new THREE.MeshBasicMaterial({color: 0xFF0000, wireframe: true});
        var cur2 = new THREE.Mesh(geoC2, matC);
        var cursor = new THREE.Mesh(geoC, matC);
        cursor.add(cur2);
        //scene.add(cursor);

        /////////////////////////////////
        //  cube (mouse clickable)
        var geoB = new THREE.CubeGeometry(1, 1, 1);
        var cube = new THREE.Mesh(geoB, material);
        cube.name = "cube";
        cube.rotation.x = Math.PI / 4;
        cube.rotation.y = Math.PI / 4;
        cube.position.x = 2;
        scene.add(cube);
        this.animate = function () {
        // requestAnimationFrame( animate );
            cube.rotation.x += 0.1;
            cube.rotation.y += 0.1;
            renderer.render(scene, camera);
        };
        var grabberL = new THREE.Grabber(cube, camera, cursor, scales.width, scales.height, screen);

        /////////////////////////////////
        //  cylinder (mouse clickable)
        var geoT = new THREE.CylinderGeometry(1, 1, 2, 8, 1, false);
        var matT = new THREE.MeshLambertMaterial({color: 0xFFFF00, shading: THREE.FlatShading});
        var cylinder = new THREE.Mesh(geoT, matT);
        cylinder.name = "cylinder";
        cylinder.rotation.z = Math.PI / 4;
        cylinder.rotation.x = Math.PI / 4;
        cylinder.position.z = -4;
        cylinder.position.y = -2;
        scene.add(cylinder);
        var grabber = new THREE.Grabber(cylinder, camera, cursor, scales.width, scales.height, screen);

        /////////////////////////////////
        //  sphere (mouse clickable)
        var geoS = new THREE.OctahedronGeometry(1, 1);
        var matS = new THREE.MeshLambertMaterial({color: 0x0000FF, shading: THREE.FlatShading});
        var sphere = new THREE.Mesh(geoS, matS);
        sphere.name = "sphere";
        sphere.position.x = -1;
        sphere.position.z = 1;
        sphere.position.y = 1;
        scene.add(sphere);
        var grabberS = new THREE.Grabber(sphere, camera, cursor, scales.width, scales.height, screen);

        $(document).on('render', function () {
            grabber.update();
            grabberL.update();
            grabberS.update();
        });
        $(window).on('resize', function(){
            grabber.updateScaling(scales.width, scales.height);
            grabberL.updateScaling(scales.width, scales.height);
            grabberS.updateScaling(scales.width, scales.height);
        });

    }
    // draw_demo();

    window.addEventListener('resize', function () {
        viewport.updateScale();
        updateScales();
        scales = viewport.getViewScale();
        onWindowResize(screen, window, aspectRatio, true);
        updateCamRend(renderer, camera, screen);
    }, false);
    function onWindowResize(element, wind, aspect, vertical) {
        self.update_screen();
    }
    function updateCamRend(rend, cam, element) {
        rend.setSize(eval(element.style.width.slice(0, -2)), eval(element.style.height.slice(0, -2)));
        cam.updateProjectionMatrix();
    }
    function updateScales() {
        scales = {
            width: 2 * ( side_edge ) / eval(screen.style.width.slice(0, -2)),
            height: 2 * ( top_edge ) / eval(screen.style.height.slice(0, -2))
        };
    }

    function render() {
        camOrbit.update();

        requestAnimationFrame(render);
        $(document).trigger('render');
        renderer.render(scene, camera);

    }
    render();


    // EXPORT FUNCS
    this.update_screen = function () {
        screen.style.width = window.innerWidth;
        screen.style.height = window.innerHeight;
    };
    this.update_position_globo = function(lat, lon, alt, time) {
        globo.add_position(lat,lon, alt, time);
        globo.render_globo(time);
    };
    this.change_mode = function(_mode){
        globo.change_mode(_mode);
    };

    return this;
}


function Globo(scene, mode) {
    var self = this;
    var positions = [];
    var globo_shape = get_globo_shape();

    function find_nerby_position(time) {
        if (time >= positions[positions.length - 1].time) return positions[positions.length - 1];
        for (var i in positions) {
            if (time > positions[i].time) continue;
            return positions[i]
        }
    }
    function find_nerby_positions(time) {
        if (time >= positions[positions.length].time) return [positions[positions.length], positions[positions.length]];
        for (var i in positions) {
            if (time > positions[i].time) continue;
            if (i < positions.length - 1)
                return [positions[i], positions[i + 1]];
            else
                return [positions[i], positions[i]];
        }
    }
    function get_globo_shape() {
        return new THREE.Mesh(
                    new THREE.CubeGeometry(1, 1, 1),
                    new THREE.MeshLambertMaterial({color: 0x00ff00, shading: THREE.FlatShading}));
    }


    this.add_position = function (lat, lon, alt, time) {
        positions.push({
            time: time,
            lat: lat,
            lon: lon,
            alt: alt
        });
    };
    this.get_positions = function () {
        return positions;
    };
    this.get_position = function(time, interpolation) {
        var position = false;
        if (interpolation == undefined) interpolation = false;
        if (interpolation) {
            var nerby_positions = find_nerby_positions(time);
            var percent = (nerby_positions[1].time - nerby_positions[0].time) / nerby_positions[1].time * 100;
            position = {
                time: time,
                lat: nerby_positions[0].lat = (nerby_positions[1].lat - nerby_positions[0].lat) * percent,
                lon: nerby_positions[0].lon = (nerby_positions[1].lon - nerby_positions[0].lon) * percent,
                alt: nerby_positions[0].alt = (nerby_positions[1].alt - nerby_positions[0].alt) * percent
            }
        } else {
            position = find_nerby_position(time);
        }
        return position;
    };

    this.render_globo = function(time){
        var pos = self.get_position(time);

        if(mode == "static"){
            var cube = get_globo_shape();
            cube.position.x = pos.lat;
            cube.position.z = pos.lon;
            cube.position.y = pos.alt;
            scene.add(cube);
        } else if(mode == "simulation") {
            globo_shape.position.x = pos.lat;
            globo_shape.position.z = pos.lon;
            globo_shape.position.y = pos.alt;
        }
    };
    this.change_mode = function(_mode){
        // remove all elements

        mode = _mode;
    };

    return this;
}