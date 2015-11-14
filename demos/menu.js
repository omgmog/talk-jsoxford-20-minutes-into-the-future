(function (window) {
  'use strict';
  // IMPORTS
  var T = window.THREE;
  var console = window.console;

  // UTILITIES
  var scale = 0.8;
  var scaledUnit = function (unit) {
    return unit * scale;
  };

  var construct = function (constructor, args) {
    var F = function () {
      return constructor.apply(this, args);
    };
    F.prototype = constructor.prototype;
    return new F();
  };

  var throttle = function (fn, threshhold, scope) {
    threshhold || (threshhold = 250);
    var last, deferTimer;
    return function () {
      var context = scope || this;
      var now = +new Date,
          args = arguments;
      if (last && now < last + threshhold) {
        clearTimeout(deferTimer);
        deferTimer = setTimeout(function () {
          last = now;
          fn.apply(context, args);
        }, threshhold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  };

  var isPocketDevice = function () {
    // Assuming this is only available on mobile
    return (typeof window.orientation !== 'undefined');
  };
  if (isPocketDevice()) {
    document.body.classList.add('throwable');
  }

  console.log('Device orientation:', isPocketDevice());

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
  var setCameraOptions = function () {
    var camera;
    camera = new T.PerspectiveCamera(fov, aspect, near, far);
    if (isPocketDevice()) {
      camera.position.y = 4;
    } else {
      camera.position.y = 10;
    }
    camera.lookAt(center);
    var radius = 0.125;
    var segments = 32;
    var material = new T.LineBasicMaterial(
      {
        color: 0x111111,
        linewidth: 5,
        transparent: true,
        opacity: 0.8
      }
    );
    var geometry = new T.CircleGeometry( radius, segments );
    geometry.vertices.shift();
    circle = new T.Line( geometry, material ) ;
    circle.position.z = -10;
    camera.add( circle );

    return camera;
  };

  var center = new T.Vector3(0,0,0);
  var width = window.innerWidth;
  var height = window.innerHeight;
  var aspect = width / height;
  var fov = 40;
  var near = 0.1;
  var far = 10000;
  var renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    logarithmicDepthBuffer: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio||1);
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.soft = true;
  var effect = new T.StereoEffect(renderer);
  effect.eyeSeparation = 1;
  effect.setSize(width, height);
  var scene = new T.Scene();
  var circle;
  var camera = setCameraOptions();
  var controls = setControllerMethod(camera, renderer.domElement);
  var cards = [];
  var buttons = [];
  var assetsPath = 'assets/';

  var data = [
    {
      title: 'Basic VR',
      image: 'image1.png',
      id: 'basic_vr',
      position: {
        x: scaledUnit(-10),
        z: scaledUnit(-4),
      }
    },
    {
      title: 'Look Interaction',
      image: 'image2.jpeg',
      id: 'look_interaction',
      position: {
        x: scaledUnit(-9),
        z: scaledUnit(6.5),
      }
    },
    {
      title: 'Gamepad Interaction',
      image: 'image3.jpeg',
      id: 'gamepad_interaction',
      position: {
        x: scaledUnit(0),
        z: scaledUnit(11),
      }
    },
    {
      title: 'Using getUserMedia',
      image: 'image4.jpeg',
      id: 'getusermedia',
      position: {
        x: scaledUnit(9),
        z: scaledUnit(6.5),
      }
    },
    {
      title: 'Spacial Audio',
      image: 'image5.jpeg',
      id: 'spacial_audio',
      position: {
        x: scaledUnit(10),
        z: scaledUnit(-4),
      }
    }
  ];
  var createPlane = function (geometryOptions, materialOptions) {
    var geometry = construct(T.PlaneBufferGeometry, geometryOptions);
    var material = construct(T.MeshLambertMaterial, materialOptions);
    return new T.Mesh(geometry, material);
  };
  var handleCardLook = function (card) {
    var button;
    // Greedily reset other cards
    cards.forEach(function (card) {
      card.scale.set(1, 1, 1);
      card.lookAt(center);
      button = card.children[0];
    });

    // Make this card prominent
    var scale = 1.4;
    card.scale.set(scale, scale, 1);
    card.lookAt(new T.Vector3(0,1,0));
    button = card.children[0];

    // Do some magic

  };

  var launchDemo = function (demo) {
    if (isPocketDevice()) {
      alert(demo.name);
    }else{
      console.log(demo.name);
    }
    return false;
    var iframe = document.createElement('iframe');
    iframe.src = window.location.href + demo.name;
    iframe.width = width;
    iframe.height = height;
    document.body.innerHTML = iframe.outerHTML;
    window.removeEventListener('onviewedtarget', onViewedTargetDebounced, false);
    scene = null;
    cancelAnimationFrame(rendering);
  };

  var createDemoCards = function () {
    data.forEach(function (item, i) {
      var texture;
      if (item.image) {
        texture = new T.ImageUtils.loadTexture(assetsPath + item.image);
        texture.wrapS = texture.wrapT = T.ClampToEdgeWrapping;
        texture.repeat.set(1,1);
        texture.minFilter = T.LinearFilter;
      }
      var card = createPlane(
        [7, 5.25, 1, 1],
        [{
          map: texture
        }]
      );
      card.material.transparent = true;
      card.material.opacity = 0.5;
      card.position.x = item.position.x;
      card.position.z = item.position.z;
      card.lookAt(center);

      // Extra info
      card.name = item.id;
      card.viewid = 'card-' + i;
      card.callback = function (e) {
        console.log(e);
        throttle(handleCardLook(card), 250);
      };


      var buttonTexture = new T.ImageUtils.loadTexture(assetsPath + 'launchButton.png');
      buttonTexture.wrapS = buttonTexture.wrapT = T.ClampToEdgeWrapping;
      buttonTexture.repeat.set(1,1);
      buttonTexture.minFilter = T.LinearFilter;

      var button = createPlane(
        [2, 1, 1, 1],
        [{
          color: 0xff0000,
          map: buttonTexture,
        }]
      );

      button.position.set(0, 0, 1);
      button.name = item.id + '_button';
      button.viewid = 'button-' + i;
      button.callback = function () {
        // Button stuff here
      };
      buttons.push(button);
      card.add(button);

      cards.push(card);
      scene.add(card);
    });
  };
  var createGround = function () {
    var ground = createPlane([200, 200, 4, 4], [{ color: 0x555555 }]);
    ground.position.set(0, -10, -1);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
  };
  var createLights = function () {
    var ambientlight = new T.AmbientLight(0xffffff, 1);
    scene.add(ambientlight);

    var spotlight = new T.SpotLight(0xffffff, 0.5);
    spotlight.position.set(0, 100, 0);
    spotlight.castShadow = true;
    spotlight.shadowMapWidth = 1024;
    spotlight.shadowMapHeight = 1024;
    spotlight.shadowCameraNear = 500;
    spotlight.shadowCameraFar = 4000;
    spotlight.shadowCameraFov = 30;
    scene.add(spotlight);
  };

  var onViewedTarget = function (target) {
    var evt = new CustomEvent('onviewedtarget', { detail: target});
    window.dispatchEvent(evt);
  };

  var onViewedTargetDebounced = throttle(function (e) {
    e.detail.callback(e.target);
  }, 250);

  var lastViewedThing = null;
  var checkIfViewingSomething = function (items) {
    setTimeout(function () {
      var raycaster = new T.Raycaster();
      raycaster.setFromCamera(center, camera);

      items.forEach(function (item, i) {
        var intersects = raycaster.intersectObject(item);
        if (intersects.length) {
          if (lastViewedThing !== item.viewid) {
            lastViewedThing = item.viewid;
            item = intersects[0].object;
            setTimeout(function () {
              onViewedTarget(item);
            }, 250);
          }
        }
      });

    }, 1000);
  };

  var buildScene = function () {
    createGround();
    createDemoCards();
    createLights();
    scene.add(camera);
    animateRenderer();
  };


  var animateRenderer = function () {
    effect.render(scene, camera);
    controls.update();
    requestAnimationFrame(animateRenderer);
    checkIfViewingSomething(cards);
  };

  var resizeRenderer = function () {
    width = window.innerWidth;
    height = window.innerHeight;
    aspect = width / height;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    effect.setSize(width, height);
    effect.render(scene, camera);

  };
  var init = function () {
    buildScene();
    window.addEventListener('resize', resizeRenderer, false);
    window.addEventListener('onviewedtarget', onViewedTargetDebounced, false);
    document.body.appendChild(renderer.domElement);
  };

  // START
  init();
}(window));
