THREE.ViewportConfig = function(cam, element, side, top, distance) {
	
	var _this = this;
    this.element = element;
    this.side_edge = side;
    this.top_edge = top;
	this.dist = distance;
	var fov_angle = this.top_edge / this.dist;
    //var scale = { width : 2 * ( this.side_edge ) / this.element.style.width.slice(0, -2), height : 2 * ( this.top_edge ) / this.element.style.height.slice(0, -2) };
	this.scale = {};
    this.camera = cam;
	this.fov = 2 * Math.atan( fov_angle ) * 180 / Math.PI;
	this.aspect = this.side_edge / this.top_edge;
	this.near = 1;
	this.far = 1000;
            
	_this.camera.fov = _this.fov;
    _this.camera.aspect = _this.side_edge / _this.top_edge;
    _this.camera.near = _this.near;
    _this.camera.far = _this.far;
    _this.camera.updateProjectionMatrix();
	    
    this.updateScale = function () {
    	scale = { 
    		width : 2 * ( this.side_edge ) / this.element.style.width.slice(0, -2), 
    		height : 2 * ( this.top_edge ) / this.element.style.height.slice(0, -2) 
		};
    }
    
    this.getViewScale = function (domElement) {
    	return scale;
    }
}