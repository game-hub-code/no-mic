// Ported from scenes/MainScene.js.
// DEVIATIONS FROM ORIGINAL (all per explicit user request):
//   - Audio (AudioController, sounds, bubbleSequence, mute/unmute) removed entirely.
//   - initStats()/GraphComponent (dev FPS graphs) removed - no DOM panel in a wallpaper.
//   - IndexController's ToggleComponent/ModalComponent/ColorComponent UI chrome
//     replaced by a plain keydown listener for the one thing kept: dots toggle.
// Everything else (bloom, lens-dirt post-fx, vignette, TrackballControls
// drag-to-orbit, click-to-nudge raycasting, gravity + point-repulsor forces,
// render loop, line-width-by-distance) is a verbatim port.

var PMath2 = Particulate.Math;
var Tweens2 = App.Tweens;

var ENABLE_ZOOM = true;
var ENABLE_PAN = false;

App.MainScene = MainScene;
function MainScene(el) {
  var scene = this.scene = new THREE.Scene();
  var camera = this.camera = new THREE.PerspectiveCamera(30, 1, 5, 3500);
  this.element = el;

  this.mouse = new THREE.Vector2();
  this.raycaster = new THREE.Raycaster();
  this.nudgeIndex = 0;

  this.pxRatio = PMath2.clamp(1.5, 2, window.devicePixelRatio);
  this.gravity = -2;

  this.usePostFx = true;
  this.shouldAnimate = true;

  this.initRenderer();
  this.initFxComposer();
  this.addPostFx();
  this.initControls();
  this.onWindowResize();

  var scale = this.height / 1000;
  camera.position.set(scale * 400, scale * 300, 0);
  camera.lookAt(scene.position);

  this.loop = App.Looper.create(this, 'update', 'preRender', 1 / 30 * 1000);

  el.addEventListener('mousedown', this.onMouseDown.bind(this), false);
  el.addEventListener('mousemove', this.onMouseMove.bind(this), false);
  el.addEventListener('mouseup', this.onMouseUp.bind(this), false);
  el.addEventListener('dblclick', this.onDoubleClick.bind(this), false);

  // Swim state — all XZ, Y governed by physics pins
  this._swimCurrent = new THREE.Vector3(); // where group is now
  this._swimDest    = new THREE.Vector3(); // where it should go

  window.addEventListener('resize', this.onWindowResize.bind(this), false);
}

MainScene.create = App.ctor(MainScene);
App.Dispatcher.extend(MainScene.prototype);

// ..................................................
// Graphics
//

MainScene.prototype.initRenderer = function () {
  var renderer = this.renderer = new THREE.WebGLRenderer({
    antialias : false,
    alpha : true // wallpaper: transparent so the fluid sim layer shows through
  });

  this.updateClearColor();
  renderer.setPixelRatio(this.pxRatio);
  renderer.autoClear = false;
  renderer.sortObjects = false;
};

MainScene.prototype.updateClearColor = function () {
  // alpha 0 so the fluid canvas underneath is visible instead of solid navy
  this.renderer.setClearColor(0x000000, 0);
};

MainScene.prototype.appendRenderer = function () {
  var canvas = this.renderer.domElement;
  this.element.appendChild(canvas);
};

MainScene.prototype.initFxComposer = function () {
  var renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
    minFilter : THREE.LinearFilter,
    magFilter : THREE.LinearMipMapLinearFilter,
    format : THREE.RGBAFormat
  });

  this.composer = new THREE.EffectComposer(this.renderer, renderTarget);
  this._passIndex = {};
};

MainScene.prototype.addPostFx = function () {
  var bloomStrength = 0.8;
  var bloomKernel = 25;
  var bloomSigma = 8;
  var bloomRes = 512;

  var renderPass = new THREE.RenderPass(this.scene, this.camera);
  var bloomPass = new THREE.BloomPass(bloomStrength, bloomKernel, bloomSigma, bloomRes);
  var vignettePass = new THREE.ShaderPass(THREE.VignetteShader);

  var lensDirtPass = this.lensDirtPass = new App.LensDirtPass({
    quads : 200,
    textureSize : 2048
  });

  vignettePass.material.uniforms.darkness.value = 0.5;
  vignettePass.material.uniforms.offset.value = 1.25;
  vignettePass.material.uniforms.color.value = new THREE.Color(0x07070C);

  this.addPass(renderPass);
  this.addPass(bloomPass);
  this.addPass(lensDirtPass);
  this.addPass(vignettePass, true);
};

MainScene.prototype.addPass = function (name, pass, renderToScreen) {
  if (typeof name === 'string') {
    this._passIndex[name] = pass;
  } else {
    renderToScreen = pass;
    pass = name;
  }

  pass.renderToScreen = renderToScreen || false;
  this.composer.addPass(pass);
  return pass;
};

MainScene.prototype.initItems = function () {
  var medusae = this.medusae = App.Medusae.create({
    pxRatio : this.pxRatio
  });

  var dust = this.dust = App.Dust.create({
    pxRatio : this.pxRatio
  });

  medusae.addTo(this.scene);
  dust.addTo(this.scene);
};

MainScene.prototype.makeDirty = function () {
  this.needsRender = true;
};

MainScene.prototype.onWindowResize = function () {
  var width = window.innerWidth;
  var height = window.innerHeight;
  var pxRatio = this.pxRatio;

  var postWidth = width * pxRatio;
  var postHeight = height * pxRatio;
  var aspect = width / height;

  var scale = height / 1000;
  var minDistance = scale * 200;
  var maxDistance = scale * 1200;

  this.width = width;
  this.height = height;

  this.camera.aspect = aspect;
  this.camera.updateProjectionMatrix();

  this.controls.minDistance = minDistance;
  this.controls.maxDistance = maxDistance;
  this.controls.handleResize();

  this.mapDistance = Tweens2.mapRange(minDistance, maxDistance, 0, 1);

  this.renderer.setSize(width, height);
  this.composer.setSize(postWidth, postHeight);
  this.lensDirtPass.setSize(postWidth, postHeight);
  this.needsRender = true;
};

// ..................................................
// Forces
//

MainScene.prototype.initForces = function () {
  var medusae = this.medusae;
  var gravityForce = Particulate.DirectionalForce.create([0, this.gravity, 0]);
  var nudgeRadius = 50;
  var nudgeForce = App.PointRepulsorForce.create([20, 5, 0], {
    radius : nudgeRadius,
    intensity : 0
  });

  // NEW: continuous pointer-follow attractor. Active only while hovering
  // (mouse button up) so it never fights TrackballControls' drag-to-orbit.
  var followForce = Particulate.PointForce.create([0, 20, 0], {
    type : Particulate.Force.ATTRACTOR,
    radius : 30,
    intensity : 0
  });
  this.followForce = followForce;
  this.followPlane = new THREE.Plane();
  this._followTarget = new THREE.Vector3();
  medusae.system.addForce(followForce);

  medusae.system.addForce(gravityForce);
  medusae.system.addForce(nudgeForce);

  this.gravityForce = gravityForce;
  this.nudgeForce = nudgeForce;
};

// ..................................................
// Controls (drag to orbit, per user's explicit choice)
//

MainScene.prototype.initControls = function () {
  var controls = new THREE.TrackballControls(this.camera, this.element);

  controls.rotateSpeed = 0.75;
  controls.zoomSpeed = 0.75;
  controls.panSpeed = 0.6;

  controls.noZoom = !ENABLE_ZOOM;
  controls.noPan = !ENABLE_PAN;
  controls.staticMoving = false;

  controls.dynamicDampingFactor = 0.2;
  controls.keys = [65, 17, 16];

  controls.addEventListener('change', this.onControlsChange.bind(this));

  this.controls = controls;
};

MainScene.prototype.onControlsChange = function () {
  this.needsRender = true;
};

MainScene.prototype.toggleAnimate = function () {
  this.shouldAnimate = !this.shouldAnimate;
};

// ..................................................
// Interaction (click = nudge/repel + lens-dirt flare; drag = orbit)
//

MainScene.prototype.onMouseDown = function () {
  this.didDrag = false;
  this.isMouseDown = true;
};

MainScene.prototype.onMouseMove = function (event) {
  this.didDrag = true;

  // Hover-follow: only when not dragging (dragging = camera orbit).
  if (this.isMouseDown) { return; }

  var mouse = this._followMouse || (this._followMouse = new THREE.Vector2());
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  this.raycaster.setFromCamera(mouse, this.camera);

  // Plane facing the camera, passing through the jellyfish's rough position,
  // so the follow point tracks the cursor at a consistent depth regardless
  // of current orbit angle.
  var camDir = this.camera.getWorldDirection(new THREE.Vector3());
  this.followPlane.setFromNormalAndCoplanarPoint(camDir, new THREE.Vector3(0, 20, 0));

  if (this.raycaster.ray.intersectPlane(this.followPlane, this._followTarget)) {
    this.followForce.set(this._followTarget.x, this._followTarget.y, this._followTarget.z);
    this.followForce.intensity = 0.015; // gentle continuous pull, tune to taste
  }
};

MainScene.prototype.onMouseUp = function (event) {
  this.isMouseDown = false;
  if (this.didDrag || !this.shouldAnimate) { return; }
  var mouse = this.mouse;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  this.nudgeMedusae();
  event.preventDefault();
};

MainScene.prototype.onDoubleClick = function (event) {
  // Unproject click onto camera-facing plane at jellyfish depth
  var mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth)  *  2 - 1,
    (event.clientY / window.innerHeight) * -2 + 1
  );
  this.raycaster.setFromCamera(mouse, this.camera);

  var camDir = this.camera.getWorldDirection(new THREE.Vector3());
  var plane  = new THREE.Plane();
  var dest   = new THREE.Vector3();
  // Plane passes through jellyfish world-centre (item.position Y=20)
  plane.setFromNormalAndCoplanarPoint(
    camDir,
    new THREE.Vector3(this._swimCurrent.x, 20, this._swimCurrent.z)
  );

  if (this.raycaster.ray.intersectPlane(plane, dest)) {
    this._swimDest.set(dest.x, 0, dest.z);
  }
};

MainScene.prototype.nudgeMedusae = (function () {
  var offset = new THREE.Vector3();

  return function () {
    var lastNudge = this.lastNudge;
    var timeDiff = Date.now() - lastNudge;
    if (timeDiff < 250) { return; }

    var raycaster = this.raycaster;
    var mouse = this.mouse;

    raycaster.setFromCamera(mouse, this.camera);

    var intersects = raycaster.intersectObject(this.medusae.bulbMesh);
    if (!intersects.length) { return; }
    var nudge = this.nudgeForce;
    var point = intersects[0].point;
    var intensity = 1;

    offset.copy(point).normalize().multiplyScalar(15);
    point.add(offset);

    nudge.intensity = intensity;
    nudge.set(point.x, point.y, point.z);

    this.lensDirtPass.setGroup(15, mouse.x, mouse.y, 0.8);

    this.lastNudge = Date.now();
  };
}());

// ..................................................
// Vis
//

MainScene.prototype.toggleDots = function () {
  if (!this.medusae) { return; }
  this.medusae.toggleDots();
};

// ..................................................
// Loop
//

MainScene.prototype.update = function (delta) {
  var medusae = this.medusae;
  var nudgeForce = this.nudgeForce;

  var distance = this.camera.position.length();
  var distNorm = this.mapDistance(distance);
  var lineWidth = Math.max(0.5, Math.round((1 - distNorm) * 2 * 1.5) / 2);

  medusae.updateLineWidth(lineWidth);
  nudgeForce.intensity *= 0.8;
  this.followForce.intensity *= 0.9;

  // ── Swim ──────────────────────────────────────────────────────────────────
  // All movement on the THREE.Group. Physics runs in local space — no
  // constraint changes, structure always intact.
  //
  // Pattern:
  //   1. Tilt head (rotate group) toward dest direction first.
  //   2. Once roughly aligned, begin slow smooth translation.
  //   3. On arrival, lerp rotation back to upright.
  //
  var sc  = this._swimCurrent;
  var sd  = this._swimDest;
  var dx  = sd.x - sc.x;
  var dz  = sd.z - sc.z;
  var dist = Math.sqrt(dx * dx + dz * dz);
  var ARRIVAL = 5;
  var item = medusae.item;

  if (dist > ARRIVAL) {
    var ndx = dx / dist;
    var ndz = dz / dist;

    // Target tilt: rotate around the axis perpendicular to travel direction.
    // rotZ tilts when moving left/right (dx), rotX tilts when moving in/out (dz).
    // MAX_TILT ~20 deg. Scales down near destination so it eases in upright.
    var MAX_TILT  = 2;
    var tiltScale = Math.min(1.0, dist / 60);
    var tRotX =  ndz * MAX_TILT * tiltScale;  // lean forward/back
    var tRotZ = -ndx * MAX_TILT * tiltScale;  // lean left/right

    // How aligned is the current tilt with the target? (dot of normalised rotation)
    var curTiltLen = Math.sqrt(item.rotation.x * item.rotation.x + item.rotation.z * item.rotation.z);
    var tarTiltLen = Math.sqrt(tRotX * tRotX + tRotZ * tRotZ);
    var alignment  = 1;
    if (curTiltLen > 0.01 && tarTiltLen > 0.01) {
      alignment = (item.rotation.x / curTiltLen) * (tRotX / tarTiltLen) +
                  (item.rotation.z / curTiltLen) * (tRotZ / tarTiltLen);
    }

    // Lerp tilt at same rate as travel so turn and move feel unified
    item.rotation.x += (tRotX - item.rotation.x) * 0.009;
    item.rotation.z += (tRotZ - item.rotation.z) * 0.009;

    // Head yaw: turn to face the exact double-tap point (shortest-path lerp,
    // wrapped to [-PI, PI] so it never spins the long way round).
    var targetYaw = Math.atan2(ndx, ndz);
    var yawDiff = targetYaw - item.rotation.y;
    yawDiff = ((yawDiff + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    item.rotation.y += yawDiff * 0.02;

    // Only translate once roughly facing dest (alignment > 0.5).
    // This produces the "turn then swim" feel.
    if (alignment > 0.5) {
      var SPEED = 0.005; // slow drift — tune here
      sc.x += dx * SPEED;
      sc.z += dz * SPEED;
    }
  } else {
    // Arrived — lerp upright at same rate
    item.rotation.x += (0 - item.rotation.x) * 0.009;
    item.rotation.z += (0 - item.rotation.z) * 0.009;
  }

  item.position.x = sc.x;
  item.position.z = sc.z;
  // ──────────────────────────────────────────────────────────────────────────

  if (this.shouldAnimate) {
    medusae.update(delta);
    this.lensDirtPass.update(delta);
  }
};

MainScene.prototype.preRender = function (delta, stepProgress) {
  this.controls.update();
  this.medusae.updateTweens(delta);

  if (this.shouldAnimate || this.needsRender || this.medusae.needsRender) {
    this.render(delta, stepProgress);
    this.needsRender = false;
  }
};

MainScene.prototype.render = function (delta, stepProgress) {
  if (this.shouldAnimate) {
    this.medusae.updateGraphics(delta, stepProgress);
    this.dust.updateGraphics(delta, stepProgress);
  }

  if (this.usePostFx) {
    this.composer.render(0.01);
  } else {
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
  }
};
