THREE.Grabber = function( object, camera, cursor, scalex, scaley, domElement ) {
	
	var _this = this;
	this.camera = camera;
	this.object = object;
	this.pivot =  ( this.camera.parent !== undefined ) ? this.camera.parent : this.camera;//this.camera.parent;
	this.domElement = ( domElement !== undefined ) ? domElement : document;
	
	this.useCursor = true;
	if ( cursor == undefined ) {
		this.useCursor = false;
	} else {
		this.cursor = cursor;
	}	
	
	this.globalPosition = new THREE.Vector3().copy( ( this.pivot ).localToWorld( this.camera.position.clone() ) );
	this.pivotPosition = new THREE.Vector3().copy( this.pivot.position );
	this.prevPosition = new THREE.Vector3().copy( this.object.position );
	this.direction = new THREE.Vector3(0,0,0);
	this.zInitOffset = _this.camera.position.sub(_this.pivot.position).length();
	this.zOffset = 0;
	this.useX = true;
	this.useY = true;
	this.useZ = true;
    this.scaleW = scalex;
    this.scaleH = scaley;
	var dragStart = new THREE.Vector3(0,0,0);
	var dragEnd = new THREE.Vector3(0,0,0);
	var clicked = false;
	var moving = false;
	
    this.getMouseVector = function(element, clientX, clientY, zOffset) {
        return {
		    x:   _this.scaleW * ( clientX - element.offsetLeft - element.style.width.slice(0, -2) / 2 ),
		    y: - _this.scaleH * ( clientY - element.offsetTop - element.style.height.slice(0, -2) / 2 ),
		    z: zOffset
        };
    }

	this.update = function() {
		if ( _this.useCursor == true ) _this.cursor.position.copy(dragStart);
		if ( clicked && moving ) {
			_this.updatePosition();
		} else if (moving) {
			moving = false;
		}
	}
	
	this.updatePosition = function () {
		_this.direction.subVectors( dragEnd, dragStart ).multiplyScalar( 0.15 * _this.zOffset + 1 );
		if ( _this.useX == false ) _this.direction.x = 0;
		if ( _this.useY == false ) _this.direction.y = 0;
		if ( _this.useZ == false ) _this.direction.z = 0;
		_this.object.position.set(
			_this.prevPosition.x + _this.direction.x,
			_this.prevPosition.y + _this.direction.y,
			_this.prevPosition.z + _this.direction.z
		);
	}
	
	this.useAxisX = function ( flag ) {
		_this.useX = flag;
	}
	
	this.useAxisY = function ( flag ) {
		_this.useY = flag;
	}
		
	this.useAxisZ = function ( flag ) {
		_this.useZ = flag;
	}
	
    this.updateScaling = function(x, y) {
        _this.scaleW = x;
        _this.scaleH = y;
    }
    
	function mousedown ( event ) {
		if (!event.button == 0) return;
		event.stopPropagation();
		_this.globalPosition.copy( ( _this.pivot ).localToWorld( _this.camera.position.clone() ) );
		_this.pivotPosition.copy( _this.pivot.position );
		_this.zOffset = _this.globalPosition.clone().sub(_this.pivot.position).length() -  _this.zInitOffset;
		dragStart.copy( _this.getMouseVector( _this.domElement, event.pageX, event.pageY, _this.zOffset ) ).applyEuler(_this.pivot.rotation, _this.pivot.rotation.order).add(_this.pivotPosition);
        var ray = new THREE.Raycaster(_this.globalPosition, dragStart.clone().sub(_this.globalPosition).normalize(), 0, 500);
		var intersects = ray.intersectObject(_this.object);
		if (intersects.length > 0) clicked = true;
	}
	
	function mousemove ( event ) {
		if (!clicked) return;
		event.stopPropagation();
		dragEnd.copy( _this.getMouseVector( _this.domElement, event.pageX, event.pageY, _this.zOffset ) ).applyEuler(_this.pivot.rotation, _this.pivot.rotation.order).add(_this.pivotPosition);
		moving = true;
	}
	
	function mouseup ( event ) {
		event.stopPropagation();
		_this.prevPosition.copy(_this.object.position);
		clicked = false;
	}
	
	this.domElement.addEventListener('mousedown', mousedown, false);
	document.addEventListener('mousemove', mousemove, false);
	document.addEventListener('mouseup', mouseup, false);
}