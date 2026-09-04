// Replaces controllers/IndexController.js's UI wiring (ToggleComponent /
// ModalComponent / ColorComponent don't apply to a wallpaper with no
// on-screen controls panel). The one interactive toggle kept from the
// original ('U' key = dots debug view, keyCode 85) is wired directly.
// Replaces controllers/IndexController.js's UI wiring (ToggleComponent /
// ModalComponent / ColorComponent don't apply to a wallpaper with no
// on-screen controls panel). The one interactive toggle kept from the
// original ('U' key = dots debug view, keyCode 85) is wired directly.
(function () {
  function forwardPointerEvents(fromEl, toEl) {
    // The jellyfish container sits on top (z-index 2) and would otherwise
    // swallow every mouse event before it reaches the fluid canvas below,
    // so the fluid sim's own hover-splat listeners never fire. Re-dispatch
    // the same event onto the fluid canvas so both layers react.
    ['mousemove', 'mousedown', 'mouseup'].forEach(function (type) {
      fromEl.addEventListener(type, function (e) {
        var clone = new MouseEvent(type, {
          bubbles : true,
          cancelable : true,
          clientX : e.clientX,
          clientY : e.clientY,
          button : e.button
        });
        toEl.dispatchEvent(clone);
      }, false);
    });
  }

  function boot() {
    var container = document.getElementById('medusa-container');
    var fluidCanvas = document.getElementById('fluid');

    forwardPointerEvents(container, fluidCanvas);

    var scene = App.MainScene.create(container);

    scene.initItems();
    scene.initForces();
    scene.appendRenderer();

    window.addEventListener('keydown', function (e) {
      if (e.keyCode === 85) { scene.toggleDots(); } // 'U'
    });

    scene.loop.start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
