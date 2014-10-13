'use strict';

function VRUi(container) {
	var self = this;
	this.container = container;
	this.active = false;
	this.hud = new VRHud();
	this.cursor = new VRCursor();
	this.title = new VRTitle();
	this.transition = new VRTransition();
	this.scene = this.camera = this.controls = this.renderer = this.effect = null;

	// main
	this.initRenderer();

	this.scene.add(this.hud.layout);

	this.hud.ready.then(function() {
		var cursorLayout = self.cursor.init(self.renderer.domElement, self.camera, self.hud.layout);
		self.scene.add(cursorLayout);
	})

	this.title.ready.then(function() {
		self.scene.add(self.title.mesh);
	});

	this.scene.add(self.transition.init());

	//self.scene.add(self.gridlines());

	this.initKeyboardControls();

	return this;
};

// temporary wireframe lines for testing purposes.
/*
todo: bug: the gridlines from the UI renderer to not match content.
*/
VRUi.prototype.gridlines = function() {
	var geometry = new THREE.BoxGeometry(1,1,1,5,5,5);
	var material = new THREE.MeshBasicMaterial( { color: 0x0000ff, wireframe: true } );
	var cube = new THREE.Mesh( geometry, material );
	cube.scale.set( 50, 50, 50);
	return cube;
}

VRUi.prototype.load = function(url, userData) {
	var self = this;

	this.hud.hide()
		.then(function() {
			self.cursor.disable();
			self.transition.fadeOut()
			.then(function() {
				self.hud.updateLive(self.hud.d23.data, '.authors', userData.author);
				self.hud.updateLive(self.hud.d23.data, '.title h1', userData.title);

				VRManager.load(url);

				self.title.show(userData);
				self.transition.fadeIn();
			})
		});
};

VRUi.prototype.toggleHud = function() {
	if (!this.active) {
		return false;
	}

	if (!this.hud.visible) {
		this.hud.show();
		this.cursor.enable();
	} else {
		this.hud.hide();
		this.cursor.disable();
	}
};

VRUi.prototype.initRenderer = function() {
	this.renderer = new THREE.WebGLRenderer( { alpha: true } );
  this.renderer.setClearColor( 0x000000, 0 );
  this.scene = new THREE.Scene();
  this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );

  this.controls = new THREE.VRControls( this.camera );
  this.effect = new THREE.VREffect( this.renderer );
  this.effect.setSize( window.innerWidth, window.innerHeight );
  this.container.appendChild(this.renderer.domElement);
  this.initResizeHandler();
};

VRUi.prototype.start = function() {
	this.active = true;
	this.animate();
};

VRUi.prototype.stop = function() {
	this.active = false;
};

VRUi.prototype.reset = function() {
	var self = this;

	self.cursor.disable();
	self.hud.hide().then(function() {
		self.stop();
	})
};

VRUi.prototype.animate = function() {
	var self = this;
	var controls = self.controls;
	var headQuat = controls.getVRState().hmd.rotation;

	self.controls.update();
	self.transition.update();
	self.cursor.update(headQuat);
	this.effect.render(this.scene, this.camera);

	if (this.active) {
		requestAnimationFrame(this.animate.bind(this));
	}
}

VRUi.prototype.initKeyboardControls = function() {
 	/*
 	todo: Entering VR mode should be done with a button and not a
 	keyboard key.  This could be part of the startup scene.
 	*/
 	var self = this;

  function onkey(event) {
    if (!(event.metaKey || event.altKey || event.ctrlKey)) {
      event.preventDefault();
    }

    switch (event.key) {
      case 'f': // f
        VRManager.enableVR();
        break;
      case 'z': // z
        VRManager.zeroSensor();
        break;
      case ' ':
        self.toggleHud();
        break;
    }
  }

  window.addEventListener("keypress", onkey, true);
};

VRUi.prototype.initResizeHandler = function() {
	var effect = this.effect;
	var camera = this.camera;
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		effect.setSize( window.innerWidth, window.innerHeight );
	}
	window.addEventListener( 'resize', onWindowResize, false );
};
