var core = (function (window) {
  'use strict';
  var T = window.THREE;

  var construct = function (constructor, args) {
    var F = function () {
      return constructor.apply(this, args);
    };
    F.prototype = constructor.prototype;
    return new F();
  };

  var build = function (geoType, geoProps, matType, matProps) {
    var geo = construct(T[geoType], geoProps);
    var mat = construct(T[matType], matProps);
    var mesh = new T.Mesh(geo, mat);
    return mesh;
  };

  var isPocketDevice = function () {
    // Assuming this is only available on mobile
    return (typeof window.orientation !== 'undefined');
  };

  var setControllerMethod = function (camera, domElement) {
    var controls;
    if (isPocketDevice()) {
      controls = new T.DeviceOrientationControls(camera, true);
    } else {
      controls = new T.OrbitControls(camera, domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.enableZoom = false;
      controls.enablePan = false;
    }
    return controls;
  };
  var resizeRenderer = function (renderer, scene, camera, effect) {
    var width = window.innerWidth;
    var height = window.innerHeight;
    var aspect = width / height;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    effect.setSize(width, height);
    effect.render(scene, camera);
  };

  var setCameraOptions = function () {
    var camera;
    camera = new T.PerspectiveCamera(core.options.fov, core.options.aspect, core.options.near, core.options.far);


    var circle = build(
      'CircleGeometry',
      [0.1, 32],
      'MeshBasicMaterial',
      [{
        color: 0xff0000,
        transparent: true,
        opacity: 0.5
      }]
    );
    circle.position.z = -10;

    camera.add(circle);

    return camera;
  };

  var options = {
    fov: 40,
    width: window.innerWidth,
    height: window.innerHeight,
    aspect: 1,
    near: 0.1,
    far: 1000,
    assetsPath: 'assets/'
  };
  // Override some options based on context
  options.aspect = options.width / options.height;
  if (isPocketDevice()) {
    options.fov = 90;
  }

  var center = new T.Vector3(0,0,0);

  var addBackDevice = function () {
    var texture = new T.ImageUtils.loadTexture('../' + core.options.assetsPath + 'backButton.png');
    texture.wrapS = texture.wrapT = T.ClampToEdgeWrapping;
    texture.repeat.set(1,1);
    texture.minFilter = T.LinearFilter;
    var device = build(
      'CircleGeometry',
      [10, 32],
      'MeshBasicMaterial',
      [{
        color: 0xff0000,
        map: texture,
      }]
    );
    device.name = 'device';
    device.position.set(0, 4, 60);
    device.rotation.x = (Math.PI * 2) / 2;
    device.rotation.z = (Math.PI * 2) / 2;

    // Add a button child here

    var button = build(
      'CircleGeometry',
      [10.2, 32],
      'LineBasicMaterial',
      [{
        color: 0xffff00
      }]
    );
    button.name = 'button';
    button.material.visible = false;
    button.position.set(0, 0, -0.5);

    device.add(button);

    return device;
  };

  return {
    options: options,
    construct: construct,
    build: build,
    isPocketDevice: isPocketDevice,
    setControllerMethod: setControllerMethod,
    resizeRenderer: resizeRenderer,
    setCameraOptions: setCameraOptions,
    addBackDevice: addBackDevice,
    center: center
  };
}(window));
