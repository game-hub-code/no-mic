// ==================================================
// forces/PointRepulsorForce.js (verbatim)
// ==================================================
var PMath = Particulate.Math;
App.PointRepulsorForce = PointRepulsorForce;

function PointRepulsorForce(position, opts) {
  opts = opts || {};
  Particulate.Force.apply(this, arguments);

  this.position = this.vector;
  this.intensity = opts.intensity != null ? opts.intensity : 0.05;
  this.setRadius(opts.radius || 0);
}

PointRepulsorForce.create = Particulate.ctor(PointRepulsorForce);
PointRepulsorForce.prototype = Object.create(Particulate.Force.prototype);
PointRepulsorForce.prototype.constructor = PointRepulsorForce;

PointRepulsorForce.prototype.setRadius = function (r) {
  this._radius2 = r * r;
};

PointRepulsorForce.prototype.applyForce = function (ix, f0, p0, p1) {
  var v0 = this.vector;
  var iy = ix + 1;
  var iz = ix + 2;

  var dx = p0[ix] - v0[0];
  var dy = p0[iy] - v0[1];
  var dz = p0[iz] - v0[2];

  var dist = dx * dx + dy * dy + dz * dz;
  var diff = PMath.clamp(0.001, 100,
    dist - this._radius2 * this.intensity);
  var diffInv = 1 / diff;
  var scale = PMath.clamp(0, 10,
    diffInv * diffInv * diffInv);

  f0[ix] += dx * scale;
  f0[iy] += dy * scale;
  f0[iz] += dz * scale;
};

// ==================================================
// materials/ShaderMaterial.js (verbatim, require() stripped)
// ==================================================
function compileShader(templateName) {
  var template = App.shaders[templateName];
  return template({
    chunks : THREE.ShaderChunk
  });
}

App.ShaderMaterial = ShaderMaterial;
function ShaderMaterial(parameters) {
  if (!this.shader) { return; }

  this.uniforms = THREE.UniformsUtils.clone(this.shader.uniforms);
  this.setUniformParameters(parameters);

  THREE.ShaderMaterial.call(this, {
    uniforms : this.uniforms,
    fragmentShader : compileShader(this.shader.fragmentShader),
    vertexShader : compileShader(this.shader.vertexShader)
  });

  this.transparent = parameters.transparent || false;
  this.blending = parameters.blending || THREE.NormalBlending;
  this.side = parameters.side || THREE.FrontSide;
  this.linewidth = parameters.linewidth || 1;
  this.depthTest = parameters.depthTest != null ? parameters.depthTest : true;
  this.depthWrite = parameters.depthWrite != null ? parameters.depthWrite : true;

  this.size = parameters.size || 1;
  this.sizeAttenuation = parameters.sizeAttenuation;

  this.fog = !!parameters.fog;
  this.map = !!parameters.map;
  this.bumpMap = !!parameters.bumpMap;
  this.normalMap = !!parameters.normalMap;
  this.specularMap = !!parameters.specularMap;
}

ShaderMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);

ShaderMaterial.prototype.setUniformParameters = function (parameters) {
  var uniforms = this.uniforms;
  Object.keys(parameters).forEach(function (key) {
    var uniform = uniforms[key];
    if (!uniform) { return; }
    switch (uniform.type) {
    case 'c':
      this[key] = uniforms[key].value = new THREE.Color(parameters[key]);
      break;
    default:
      this[key] = uniforms[key].value = parameters[key];
      break;
    }
  }.bind(this));
};

// ==================================================
// materials/BulbMaterial.js (verbatim)
// ==================================================
(function () {
  var uniforms = THREE.UniformsLib;

  App.BulbMaterial = BulbMaterial;
  function BulbMaterial(parameters) {
    parameters = parameters || {};
    parameters.map = true;
    ShaderMaterial.call(this, parameters);
  }

  BulbMaterial.prototype = Object.create(ShaderMaterial.prototype);

  BulbMaterial.prototype.shader = {
    vertexShader : 'normal-vert',
    fragmentShader : 'bulb-frag',

    uniforms : THREE.UniformsUtils.merge([
      uniforms.common,
      {
        diffuseB : { type : 'c', value : null },
        stepProgress : { type : 'f', value : 0 },
        time : { type : 'f', value : 0 }
      }
    ])
  };
}());

// ==================================================
// materials/GelMaterial.js (verbatim)
// ==================================================
(function () {
  var uniforms = THREE.UniformsLib;

  App.GelMaterial = GelMaterial;
  function GelMaterial(parameters) {
    parameters = parameters || {};
    ShaderMaterial.call(this, parameters);
  }

  GelMaterial.prototype = Object.create(ShaderMaterial.prototype);

  GelMaterial.prototype.shader = {
    vertexShader : 'gel-vert',
    fragmentShader : 'gel-frag',

    uniforms : THREE.UniformsUtils.merge([
      uniforms.common,
      {
        stepProgress : { type : 'f', value : 0 }
      }
    ])
  };
}());

// ==================================================
// materials/TailMaterial.js (verbatim)
// ==================================================
(function () {
  var uniforms = THREE.UniformsLib;

  App.TailMaterial = TailMaterial;
  function TailMaterial(parameters) {
    parameters = parameters || {};
    parameters.map = true;
    ShaderMaterial.call(this, parameters);
  }

  TailMaterial.prototype = Object.create(ShaderMaterial.prototype);

  TailMaterial.prototype.shader = {
    vertexShader : 'normal-vert',
    fragmentShader : 'tail-frag',

    uniforms : THREE.UniformsUtils.merge([
      uniforms.common,
      {
        diffuseB : { type : 'c', value : null },
        scale : { type : 'f', value : 1 },
        stepProgress : { type : 'f', value : 0 }
      }
    ])
  };
}());

// ==================================================
// materials/TentacleMaterial.js (verbatim)
// ==================================================
(function () {
  var uniforms = THREE.UniformsLib;

  App.TentacleMaterial = TentacleMaterial;
  function TentacleMaterial(parameters) {
    parameters = parameters || {};
    ShaderMaterial.call(this, parameters);
  }

  TentacleMaterial.prototype = Object.create(ShaderMaterial.prototype);

  TentacleMaterial.prototype.shader = {
    vertexShader : 'tentacle-vert',
    fragmentShader : 'tentacle-frag',

    uniforms : THREE.UniformsUtils.merge([
      uniforms.common,
      {
        stepProgress : { type : 'f', value : 0 },
        area : { type : 'f', value : 1 }
      }
    ])
  };
}());

// ==================================================
// materials/LerpMaterial.js (verbatim)
// ==================================================
(function () {
  var uniforms = THREE.UniformsLib;

  App.LerpMaterial = LerpMaterial;
  function LerpMaterial(parameters) {
    parameters = parameters || {};
    ShaderMaterial.call(this, parameters);
  }

  LerpMaterial.prototype = Object.create(ShaderMaterial.prototype);

  LerpMaterial.prototype.shader = {
    vertexShader : 'lerp-vert',
    fragmentShader : 'basic-frag',

    uniforms : THREE.UniformsUtils.merge([
      uniforms.common,
      {
        stepProgress : { type : 'f', value : 0 }
      }
    ])
  };
}());

// ==================================================
// materials/LerpPointMaterial.js (verbatim)
// ==================================================
(function () {
  var uniforms = THREE.UniformsLib;

  App.LerpPointMaterial = LerpPointMaterial;
  function LerpPointMaterial(parameters) {
    parameters = parameters || {};
    parameters.sizeAttenuation = true;
    ShaderMaterial.call(this, parameters);
  }

  LerpPointMaterial.prototype = Object.create(ShaderMaterial.prototype);

  LerpPointMaterial.prototype.shader = {
    vertexShader : 'lerp-point-vert',
    fragmentShader : 'basic-point-frag',

    uniforms : THREE.UniformsUtils.merge([
      uniforms.points,
      {
        stepProgress : { type : 'f', value : 0 }
      }
    ])
  };
}());

// ==================================================
// materials/DustMaterial.js (verbatim)
// ==================================================
(function () {
  var uniforms = THREE.UniformsLib;

  App.DustMaterial = DustMaterial;
  function DustMaterial(parameters) {
    parameters = parameters || {};
    ShaderMaterial.call(this, parameters);
  }

  DustMaterial.prototype = Object.create(ShaderMaterial.prototype);

  DustMaterial.prototype.shader = {
    vertexShader : 'dust-vert',
    fragmentShader : 'dust-frag',

    uniforms : THREE.UniformsUtils.merge([
      uniforms.common,
      uniforms.points,
      {
        time : { type : 'f', value : 0 },
        area : { type : 'f', value : 1 }
      }
    ])
  };
}());

// ==================================================
// materials/AlphaMaterial.js (verbatim - used by LensDirtPass quads)
// ==================================================
(function () {
  var uniforms = THREE.UniformsLib;

  App.AlphaMaterial = AlphaMaterial;
  function AlphaMaterial(parameters) {
    parameters = parameters || {};
    ShaderMaterial.call(this, parameters);
  }

  AlphaMaterial.prototype = Object.create(ShaderMaterial.prototype);

  AlphaMaterial.prototype.shader = {
    vertexShader : 'alpha-vert',
    fragmentShader : 'alpha-frag',

    uniforms : THREE.UniformsUtils.merge([
      uniforms.common
    ])
  };
}());

// ==================================================
// post-processing/LensDirtTexture.js (verbatim, requires vendor/noise.js global `noise`)
// ==================================================
App.LensDirtTexture = LensDirtTexture;
function LensDirtTexture(size, cells, opts) {
  this.canvas = document.createElement('canvas');
  this.ctx = this.canvas.getContext('2d');
  this.texture = new THREE.Texture(this.canvas);
  this.drawTexture(size, cells, opts);
}

LensDirtTexture.prototype.grayscaleColor = function (start, range, alpha) {
  var c = Math.floor(Math.random() * range) + start;
  return 'rgba(' + [c, c, c, alpha].join(',') + ')';
};

LensDirtTexture.prototype.createGradients = function (ctx, count, radius) {
  var step = Math.PI * 2 / (count + 1);
  var angle = 0;

  var gradients = [];
  var colorA, colorB, alphaA, alphaB;
  var gradient, gx0, gy0, gx1, gy1;

  for (var i = 0; i < count; i ++) {
    gx0 = Math.cos(angle) * radius;
    gy0 = Math.sin(angle) * radius;
    gx1 = Math.cos(angle + Math.PI) * radius;
    gy1 = Math.sin(angle + Math.PI) * radius;

    alphaA = Math.random() * 0.1;
    alphaB = Math.random() * 0.5;
    colorA = this.grayscaleColor(100, 100, alphaA);
    colorB = this.grayscaleColor(100, 100, alphaB);

    gradient = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
    gradient.addColorStop(0.2, colorA);
    gradient.addColorStop(0.8, colorB);
    gradients.push(gradient);
    gradient._alpha = alphaB;

    angle += step;
  }

  return gradients;
};

LensDirtTexture.prototype.drawBlob = function (ctx, rx, ry, segments) {
  var step = Math.PI * 2 / segments;
  var angle = 0;
  var sx = Math.random() * 100;
  var sy = Math.random() * 100;
  var x, y, nx, ny;

  ctx.beginPath();

  for (var i = 0, il = segments - 1; i < il; i ++) {
    x = Math.cos(angle) * rx;
    y = Math.sin(angle) * ry;
    nx = (sx + x) * 0.01;
    ny = (sy + y) * 0.01;
    x += noise.simplex2(nx, ny) * 5;
    y += noise.simplex2(nx, ny) * 5;

    angle += step;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();
  ctx.fill();
};

LensDirtTexture.prototype.drawShadow = function (ctx, iterations) {
  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowColor = this.grayscaleColor(200, 10, 1);

  for (var i = 0; i < iterations; i ++) {
    ctx.stroke();
  }

  ctx.restore();
};

LensDirtTexture.prototype.drawTexture = function (size, cells, opts) {
  opts = opts || {};

  var canvas = this.canvas;
  var ctx = this.ctx;

  var detail = opts.detail || 10;
  var cellPad = opts.cellPad || 10;

  var cellSize = size / cells;
  var cellSizeHalf = cellSize * 0.5;
  var blobRad = (cellSize - cellPad) * 0.5;
  var blobRadHalf = blobRad * 0.5;

  var gradients = this.createGradients(ctx, cells, cellSize);
  var gradient, gi, rx, ry;

  canvas.width = canvas.height = size;
  ctx.lineWidth = 1;

  for (var i = 0; i < cells; i ++) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(0, cellSize * i + cellSizeHalf);

    for (var j = 0; j < cells; j ++) {
      ctx.translate(j === 0 ? cellSizeHalf : cellSize, 0);
      rx = Math.random() * blobRadHalf + blobRadHalf;
      ry = Math.random() * blobRadHalf + blobRadHalf;
      gi = Math.floor(Math.random() * gradients.length);
      gradient = gradients[gi];

      ctx.fillStyle = gradient;
      ctx.strokeStyle = this.grayscaleColor(
        60, 30, gradient._alpha * 0.5);

      this.drawBlob(ctx, rx, ry, detail);
      this.drawShadow(ctx, 2);
    }
  }

  this.texture.needsUpdate = true;
};

// ==================================================
// post-processing/LensDirtPass.js (verbatim, require() stripped)
// ==================================================
App.LensDirtPass = LensDirtPass;
function LensDirtPass(opts) {
  opts = opts || {};

  var quads = opts.quads || 100;
  var textureSize = opts.textureSize || 1024;
  var textureCells = opts.textureCells || 10;
  var textureCellPad = opts.textureCellPad || 20;
  var textureDetail = opts.textureDetail || 50;

  this.renderToScreen = false;
  this.enabled = true;
  this.needsSwap = false;
  this.clear = false;

  this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  this.scene = new THREE.Scene();
  this.scale = 1;

  this.textureMap = new App.LensDirtTexture(textureSize, textureCells, {
    detail : textureDetail,
    cellPad : textureCellPad
  });

  this.geom = this.createQuadGeom(quads, textureCells);
  this.mesh = new THREE.Mesh(this.geom, new App.AlphaMaterial({
    color : 0xffffff,
    opacity : 0.5,
    map : this.textureMap.texture,
    blending : THREE.AdditiveBlending,
    transparent : true
  }));

  this.scene.add(this.mesh);

  this._quadIndex = 0;
  this._quadCount = quads;
}

LensDirtPass.prototype.setSize = function (width, height) {
  var camera = this.camera;
  var w, h, s;

  if (width > height) {
    w = 1;
    h = s = height / width;
  } else {
    w = s = width / height;
    h = 1;
  }

  camera.left = -w;
  camera.right = w;
  camera.top = h;
  camera.bottom = -h;
  this.scale = s;

  camera.updateProjectionMatrix();
};

LensDirtPass.prototype._quadGeomPosition = function (count) {
  var verts = new Float32Array(count * 4 * 3);
  var positionAttr = new THREE.BufferAttribute(verts, 3);

  return positionAttr;
};

LensDirtPass.prototype._quadGeomIndex = function (count) {
  var indices = new Uint16Array(count * 6);
  var indexAttr = new THREE.BufferAttribute(indices, 1);
  var qi = 0, qj = 0;
  var a, b, c, d;

  for (var i = 0; i < count; i ++) {
    a = qi;
    b = qi + 1;
    c = qi + 2;
    d = qi + 3;

    indices[qj]     = a;
    indices[qj + 1] = b;
    indices[qj + 2] = c;
    indices[qj + 3] = c;
    indices[qj + 4] = d;
    indices[qj + 5] = a;

    qi += 4;
    qj += 6;
  }

  return indexAttr;
};

LensDirtPass.prototype._quadGeomUv = function (count, cells) {
  var uvs = new Float32Array(count * 4 * 2);
  var uvAttr = new THREE.BufferAttribute(uvs, 2);
  var step = 1 / cells;
  var qi = 0, row = 0, col = 0;

  for (var i = 0; i < count; i ++) {
    uvs[qi]     = uvs[qi + 6] = step * col;
    uvs[qi + 1] = uvs[qi + 3] = step * row;
    uvs[qi + 2] = uvs[qi + 4] = step * (col + 1);
    uvs[qi + 5] = uvs[qi + 7] = step * (row + 1);

    qi += 8;

    if (++ col === cells) {
      col = 0;
      if (++ row === cells) {
        row = 0;
      }
    }
  }

  return uvAttr;
};

LensDirtPass.prototype._quadGeomAlpha = function (count) {
  var alpha = new Float32Array(count * 4);
  var alphaAttr = new THREE.BufferAttribute(alpha, 1);

  return alphaAttr;
};

LensDirtPass.prototype.createQuadGeom = function (count, cells) {
  var geom = new THREE.BufferGeometry();

  geom.addAttribute('position', this._quadGeomPosition(count));
  geom.addAttribute('uv', this._quadGeomUv(count, cells));
  geom.addAttribute('alpha', this._quadGeomAlpha(count));
  geom.setIndex(this._quadGeomIndex(count));

  return geom;
};

LensDirtPass.prototype._quadIndex = 0;

LensDirtPass.prototype.setQuadPosition = (function () {
  var pos = new THREE.Matrix4();
  var rot = new THREE.Matrix4();
  var scale = new THREE.Matrix4();
  var transform = new THREE.Matrix4();

  var a = new THREE.Vector3();
  var b = new THREE.Vector3();
  var c = new THREE.Vector3();
  var d = new THREE.Vector3();

  return function (index, x, y, r, s) {
    var position = this.geom.attributes.position;
    var ai = index * 4, bi = ai + 1, ci = ai + 2, di = ai + 3;

    scale.makeScale(s * this.scale, s * this.scale, 1);
    rot.makeRotationZ(r);
    pos.makeTranslation(x, y, 0);

    transform.identity();
    transform.multiply(pos);
    transform.multiply(rot);
    transform.multiply(scale);

    a.set(-1, -1, 0);
    b.set( 1, -1, 0);
    c.set( 1,  1, 0);
    d.set(-1,  1, 0);

    a.applyMatrix4(transform);
    b.applyMatrix4(transform);
    c.applyMatrix4(transform);
    d.applyMatrix4(transform);

    position.setXY(ai, a.x, a.y);
    position.setXY(bi, b.x, b.y);
    position.setXY(ci, c.x, c.y);
    position.setXY(di, d.x, d.y);

    position.needsUpdate = true;
  };
}());

LensDirtPass.prototype.setQuadAlpha = function (index, alpha) {
  var attr = this.geom.attributes.alpha;
  var array = attr.array;
  var ai = index * 4;

  array[ai]     = alpha;
  array[ai + 1] = alpha;
  array[ai + 2] = alpha;
  array[ai + 3] = alpha;

  attr.needsUpdate = true;
};

LensDirtPass.prototype.setGroup = function (count, x, y, spread) {
  var total = this._quadCount;
  var index = this._quadIndex;
  var qi = index;
  var xi, yi, rot, scale;

  for (var i = 0; i < count; i ++) {
    xi = x + (Math.random() - 0.5) * spread;
    yi = y + (Math.random() - 0.5) * spread;
    rot = Math.random() * Math.PI * 2;
    scale = Math.random() * 0.15;

    this.setQuadPosition(qi, xi, yi, rot, scale);
    this.setQuadAlpha(qi, 1);

    qi = index + i;
    if (qi >= total) {
      index = this._quadIndex = 0;
    }
  }

  this._quadIndex = qi;
};

LensDirtPass.prototype.update = function (delta) {
  var alphaAttr = this.geom.attributes.alpha;
  var alphaArray = alphaAttr.array;

  for (var i = 0, il = alphaArray.length; i < il; i ++) {
    alphaArray[i] *= 0.995;
  }

  alphaAttr.needsUpdate = true;
};

LensDirtPass.prototype.render = function (renderer, writeBuffer, readBuffer, delta) {
  if (this.renderToScreen) {
    renderer.render(this.scene, this.camera);
  } else {
    renderer.render(this.scene, this.camera, readBuffer, this.clear);
  }
};

// ==================================================
// items/Dust.js (verbatim)
// ==================================================
(function () {
  var DEBUG_TEXTURE = false;
  var mapLinear = THREE.Math.mapLinear;

  App.Dust = Dust;
  function Dust(opts) {
    this.pxRatio = opts.pxRatio || 1;
    this.particleSize = 18 * this.pxRatio;
    this.particleCount = 3800;
    this.area = 200;
    this.createParticles();
    this.createMaterials();
    this.createItem();
  }

  Dust.create = App.ctor(Dust);

  Dust.prototype.createParticles = function () {
    var count = this.particleCount;
    var geom = this.geometry = new THREE.BufferGeometry();
    var verts = new Float32Array(count * 3);

    var area = this.area;
    var areaHalf = area * 0.5;
    var ix;

    for (var i = 0, il = verts.length / 3; i < il; i ++) {
      ix = i * 3;
      verts[ix]     = Math.random() * area - areaHalf;
      verts[ix + 1] = Math.random() * area - areaHalf;
      verts[ix + 2] = Math.random() * area - areaHalf;
    }

    geom.addAttribute('position',
      new THREE.BufferAttribute(verts, 3));
  };

  Dust.prototype.createTexture = function () {
    var canvas = document.createElement('canvas');
    var texture = new THREE.Texture(canvas);
    var ctx = canvas.getContext('2d');

    var size = Math.pow(2, 6);
    var sizeHalf = size * 0.5;
    var rings = 2;
    var t, radius, alpha;

    canvas.width = canvas.height = size;
    ctx.fillStyle = '#fff';

    for (var i = 0; i < rings; i ++) {
      t = i / (rings - 1);
      radius = mapLinear(t * t, 0, 1, 4, sizeHalf);
      alpha = mapLinear(t, 0, 1, 1, 0.05);

      ctx.beginPath();
      ctx.arc(sizeHalf, sizeHalf, radius, 0, Math.PI * 2);
      ctx.globalAlpha = alpha;
      ctx.fill();
    }

    texture.needsUpdate = true;

    if (DEBUG_TEXTURE) {
      document.body.appendChild(canvas);
      canvas.style.position = 'absolute';
    }

    return texture;
  };

  Dust.prototype.createMaterials = function () {
    var params = {
      psColor : 0xffffff,
      opacity : 0.7,
      size : this.particleSize,
      map : this.createTexture(),
      scale : 150,
      area : this.area,
      blending: THREE.AdditiveBlending,
      transparent : true,
      depthTest : false,
      depthWrite : false
    };

    this.materialFore = new App.DustMaterial(params);
    this.timeAttrFore = this.materialFore.uniforms.time;
  };

  Dust.prototype.createItem = function () {
    this.itemFore = new THREE.Points(this.geometry, this.materialFore);
  };

  Dust.prototype.addTo = function (scene) {
    scene.add(this.itemFore);
  };

  Dust.prototype.updateGraphics = function (delta) {
    this.timeAttrFore.value += delta * 0.005;
  };
}());