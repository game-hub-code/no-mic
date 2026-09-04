// ==================================================
// application/App.js (verbatim)
// ==================================================
window.App = Object.create({
  ctor : Particulate.ctor,
  log : (window.console && window.console.log.bind &&
    window.console.log.bind(window.console)) || function () {},

  shaders : window.App && window.App.shaders,

  _register : {},
  register : function (name, fn) {
    this._register[name] = fn;
  },

  run : function (name) {
    if (!this._register[name]) { return; }
    this._register[name].call(this);
  }
});

// npm particulate@0.3.3 dropped the `Math` export from its public API
// (source still has it at src/math/Math.js, just not re-exported from
// the package index). Re-added here verbatim from that source file so
// PointRepulsorForce.js / MainScene.js's `Particulate.Math.clamp` calls
// keep working unmodified.
Particulate.Math = {
  clamp : function (min, max, v) {
    return Math.min(Math.max(v, min), max);
  }
};

// ==================================================
// utils/Dispatcher.js (verbatim)
// ==================================================
var Dispatcher = App.Dispatcher = {};

Dispatcher.extend = function (proto) {
  proto.addListener = addListener;
  proto.triggerListeners = triggerListeners;
};

function addListener(type, context, fn) {
  var listeners = this._listeners;
  if (!listeners) { listeners = this._listeners = {}; }
  if (!listeners[type]) { listeners[type] = []; }

  listeners[type].push({
    context : context,
    fn : fn
  });
}

function triggerListeners(type, event) {
  var listeners = this._listeners && this._listeners[type];
  if (!listeners) { return; }
  var listener, context, fn;

  for (var i = 0, il = listeners.length; i < il; i ++) {
    listener = listeners[i];
    context = listener.context;
    fn = listener.fn;

    if (typeof context === 'function') {
      fn = context;
      context = null;
    } else if (typeof fn === 'string') {
      fn = context[fn];
    }

    fn.call(context, event);
  }
}

// ==================================================
// utils/Looper.js (verbatim)
// ==================================================
/*global requestAnimationFrame*/
App.Looper = Looper;
function Looper(context, update, render, delta) {
  var _this = this;
  var _update = context[update];
  var _render = context[render];

  var stepTime = 0;
  var targetDelta = delta || (1 / 30 * 1000);
  var maxDelta = targetDelta;

  var isLooping = false;
  var lastTime;

  function animateStep(delta) {
    stepTime += delta;
    var steps = Math.floor(stepTime / targetDelta);

    if (steps > 0) {
      stepTime -= steps * targetDelta;
      _this.didUpdate = true;
    }

    while (steps > 0) {
      _update.call(context, targetDelta);
      steps --;
    }

    var stepProgress = stepTime / targetDelta;
    _render.call(context, targetDelta, stepProgress);
  }

  function animate() {
    if (!isLooping) { return; }
    var time = Date.now();
    var delta = Math.min(maxDelta, time - lastTime);

    _this.didUpdate = false;
    animateStep(delta);
    requestAnimationFrame(animate);
    lastTime = time;
  }

  this.stop = function () {
    isLooping = false;
  };

  this.start = function () {
    lastTime = Date.now();
    isLooping = true;
    animate();
  };

  this.toggle = function () {
    if (isLooping) { this.stop(); }
    else { this.start(); }
  };
}

Looper.create = App.ctor(Looper);

// ==================================================
// utils/Geometry.js (verbatim)
// ==================================================
var Geometry = App.Geometry = {};

Geometry.point = function (x, y, z, buffer) {
  buffer.push(x, y, z);
  return buffer;
};

Geometry.circle = function (segments, radius, y, buffer) {
  var step = Math.PI * 2 / segments;
  var angle = 0;
  var x, z;

  for (var i = 0; i < segments; i ++) {
    x = Math.cos(angle) * radius;
    z = Math.sin(angle) * radius;

    buffer.push(x, y, z);
    angle += step;
  }
  return buffer;
};

// ==================================================
// utils/Links.js (verbatim)
// ==================================================
var Links = App.Links = {};

Links.line = function (index, howMany, buffer) {
  var a, b;

  for (var i = 0; i < howMany - 1; i ++) {
    a = index + i;
    b = index + i + 1;

    buffer.push(a, b);
  }

  return buffer;
};

Links.loop = function (index, howMany, buffer) {
  var a, b;

  for (var i = 0; i < howMany - 1; i ++) {
    a = index + i;
    b = index + i + 1;

    buffer.push(a, b);
  }

  a = index;
  b = index + howMany - 1;

  buffer.push(a, b);

  return buffer;
};

Links.rings = function (index0, index1, howMany, buffer) {
  var a, b;

  for (var i = 0; i < howMany; i ++) {
    a = index0 + i;
    b = index1 + i;

    buffer.push(a, b);
  }

  return buffer;
};

Links.radial = function (indexCenter, index, howMany, buffer) {
  var b;

  for (var i = 0; i < howMany; i ++) {
    b = index + i;

    buffer.push(indexCenter, b);
  }

  return buffer;
};

// ==================================================
// utils/Faces.js (verbatim)
// ==================================================
var Faces = App.Faces = {};

Faces.quad = function (a, b, c, d, buffer) {
  buffer.push(
    a, b, c,
    c, d, a);

  return buffer;
};

Faces.quadDoubleSide = function (a, b, c, d, buffer) {
  buffer.push(
    a, b, c,
    c, d, a,
    d, c, b,
    b, a, d);

  return buffer;
};

Faces.radial = function (indexCenter, index, howMany, buffer) {
  var b, c;

  for (var i = 0, il = howMany - 1; i < il; i ++) {
    b = index + i + 1;
    c = index + i;

    buffer.push(indexCenter, b, c);
  }

  b = index;
  c = index + howMany - 1;

  buffer.push(indexCenter, b, c);

  return buffer;
};

Faces.rings = function (index0, index1, howMany, buffer) {
  var a, b, c, d;

  for (var i = 0, il = howMany - 1; i < il; i ++) {
    a = index0 + i;
    b = index0 + i + 1;
    c = index1 + i + 1;
    d = index1 + i;

    buffer.push(
      a, b, c,
      c, d, a);
  }

  a = index0 + howMany - 1;
  b = index0;
  c = index1;
  d = index1 + howMany - 1;

  buffer.push(
    a, b, c,
    c, d, a);

  return buffer;
};

// ==================================================
// utils/Tweens.js (verbatim)
// ==================================================
var Tweens = App.Tweens = {};

Tweens.mapRange = function (a0, a1, b0, b1) {
  if (arguments.length === 2) {
    b1 = a1[1];
    b0 = a1[0];
    a1 = a0[1];
    a0 = a0[0];
  }

  var rangeAInv = 1 / (a1 - a0);
  var rangeB = b1 - b0;

  return function (x) {
    var t = (x - a0) * rangeAInv;
    return b0 + t * rangeB;
  };
};

Tweens.factorTween = function (context, defaultFactor) {
  return function (name, target, instanceFactor) {
    var state = context[name];
    if (state == null) { state = context[name] = target; }
    var factor = instanceFactor || defaultFactor;

    return context[name] += (target - state) * factor;
  };
};

Tweens.stepTween = function (context, defaultStep) {
  return function (name, target, instanceStep) {
    var state = context[name];
    if (state == null) { state = context[name] = target; }
    if (state === target) { return state; }
    var step = instanceStep || defaultStep;
    var dir = state < target ? 1 : -1;

    if ((target - state) * dir < step) {
      context[name] = target;
      return state;
    }

    return context[name] += step * dir;
  };
};
