THREE.OrbitControls = function( object, scalex, scaley, domElement) {
	
	var _this = this;
	this.object = object;
	this.object.rotation.order = 'YXZ';
	this.domElement = ( domElement !== undefined ) ? domElement : document;
	this.rotSensitivity = 0.7;
	this.zoomSense = 0.15;
	this.prevRotY = 0;
	this.prevRotX = 0;
	this.prevPosition = new THREE.Vector3(0,0,0);
	this.zoom = _this.object.scale.x;

	var dragStart = new THREE.Vector3(0,0,0);
	var dragEnd = new THREE.Vector3(0,0,0);
	var clicked = false;
	var moving = false;
	var panKey = false;
	var zooming = false;
	var currentState = 0;
	var STATES = {	'panning': 0, 'rotating': 1, 'zooming': 2, 'NONE': -1 };
	this.keyCodes = { 'rotate': 18, 'pan': 16 };
	this.direction = new THREE.Vector3(0,0,0);
	
	
    this.getMouseVector = function(element, clientX, clientY) {
        //var rect = canvas.getBoundingClientRect();
        return {
		    x:   scalex * ( clientX - element.offsetLeft - element.style.width.slice(0, -2) / 2 ),
		    y: - scaley * ( clientY - element.offsetTop - element.style.height.slice(0, -2) / 2 ),
		    z: 0 
        };
    }

	this.update = function() {
		if (clicked && moving && !panKey) {
			this.updateRotation();
		} else if (clicked && moving && panKey) {
			this.updatePanning();
		} else if (zooming) {
			this.updateZoom();
			zooming = false;
		} else if (moving) {
			moving = false;
		}
	}
	
	this.updatePanning = function () {
		_this.direction.subVectors(dragEnd, dragStart);
		_this.direction.applyEuler(_this.object.rotation, _this.object.eulerOrder);
		_this.object.position.x = this.prevPosition.x - _this.direction.x; 
		_this.object.position.y = this.prevPosition.y - _this.direction.y;
		_this.object.position.z = this.prevPosition.z - _this.direction.z;
		//moving = false;
		//_this.direction.set(0, 0, 0);
	}
	
	this.updateRotation = function () {
		_this.direction.subVectors(dragEnd, dragStart);
		_this.object.rotation.y = _this.prevRotY - _this.rotSensitivity * _this.direction.x;
		_this.object.rotation.x = _this.prevRotX + _this.rotSensitivity * _this.direction.y;
		//moving = false;
		//_this.direction.set(0, 0, 0);
	}

	this.updateZoom = function () {
		_this.object.scale.set(_this.zoom, _this.zoom, _this.zoom);
	}

	function wheel ( event ) {
	    var delta = 0;
	    if (!event) event = this.domElement.event;
		event.preventDefault();
	    // normalize the delta
	    if (event.wheelDelta) {
	        // IE and Opera
	        delta = event.wheelDelta / 40;
	    } else if (event.detail) {
	        // W3C
	        delta = -event.detail / 3;
	    }
	    var sign = -1;
	    if (delta < 0) sign = 1; 
		_this.zoom += _this.zoom * _this.zoomSense * sign;
		zooming = true;
	}
	
	function mousedown ( event ) {
		if (!event.button == 1) return;
		event.preventDefault();
		event.stopPropagation();
		var vec =  _this.getMouseVector( _this.domElement, event.clientX, event.clientY );
		dragStart.set(vec.x, vec.y, vec.z);
		clicked = true;
	}
	
	function mousemove ( event ) {
		if (!clicked) return;
		event.preventDefault();
		event.stopPropagation();
		var vec = _this.getMouseVector( _this.domElement, event.clientX, event.clientY );	
		dragEnd.set(vec.x, vec.y, vec.z);
		moving = true;
	}
	
	function mouseup ( event ) {
		event.preventDefault();
		event.stopPropagation();
		_this.prevRotY = _this.object.rotation.y;
		_this.prevRotX = _this.object.rotation.x;
		_this.prevPosition.copy(_this.object.position);
		//_this.direction.set(0, 0, 0);
		// dragEnd.set(0, 0, 0);
		// dragStart.set(0, 0, 0);
		clicked = false;
	}
	
	function keydown ( event ) {
		event.preventDefault();
		event.stopPropagation();
		if (event.keyCode == _this.keyCodes.pan) panKey = true;
	}
	
	function keyup ( event ) {
		event.preventDefault();
		event.stopPropagation();
		if (event.keyCode == _this.keyCodes.pan) panKey = false;
	}
	
	this.domElement.addEventListener('mousedown', mousedown, false);
	document.addEventListener('mousemove', mousemove, false);
	document.addEventListener('mouseup', mouseup, false);
	document.addEventListener('keydown', keydown, false);
	document.addEventListener('keyup', keyup, false);

    //Mozilla
    if(this.domElement.addEventListener)
        this.domElement.addEventListener('DOMMouseScroll', wheel, false);
    //for IE/OPERA etc
    this.domElement.onmousewheel = wheel;
    
}