var demo = (function(window, document) {
  'use strict';
  var core = window.core;
  var T = window.THREE;

  var renderer, scene, camera, effect, controls;

  var speaker, ground, ambientLight, soundIndicator;

  scene = new T.Scene();
  camera = core.setCameraOptions();
  if (core.isPocketDevice()) {
    camera.position.set(0, 20, 20);
  } else {
    camera.position.set(0, 40, 120);
  }
  scene.add(camera);

  renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    logarithmicDepthBuffer: true,
  });
  renderer.setSize(core.options.width, core.options.height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.soft = true;
  document.body.appendChild(renderer.domElement);
  controls = core.setControllerMethod(camera, renderer.domElement);

  effect = new T.StereoEffect(renderer);
  effect.eyeSeparation = 1;
  effect.focalLength = 25;
  effect.setSize(core.options.width, core.options.height);

  var groundTexture = T.ImageUtils.loadTexture('grid.png');
  groundTexture.wrapS = groundTexture.wrapT = T.RepeatWrapping;
  groundTexture.repeat.set(1000, 1000); // Number of times to repeat texture
  groundTexture.anisotropy = renderer.getMaxAnisotropy();
  ground = core.build(
    'PlaneBufferGeometry', [2000, 2000, 100],
    'MeshLambertMaterial', [{
      color: 0x222222,
      map: groundTexture
    }]
  );
  ground.position.y = -10;
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  var woodTexture = new T.ImageUtils.loadTexture('woodTexture.jpg');

  var speakerMaterials, speakerMaterialsArray = [];

  speakerMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // left
  speakerMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // right
  speakerMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // top
  speakerMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // bottom
  speakerMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // back
  speakerMaterialsArray.push(new T.MeshLambertMaterial({map: new T.ImageUtils.loadTexture('speaker.jpg')})); // front

  speakerMaterials = new T.MeshFaceMaterial(speakerMaterialsArray);

  speaker = new T.Mesh(
    new T.CubeGeometry(20, 40, 20, 1, 1, 1),
    speakerMaterials
  );



  speaker.position.set(0, 10, -40);
  speaker.rotation.y = -Math.PI;
  speaker.castShadow = true;
  speaker.receiveShadow = true;
  scene.add(speaker);

  ambientLight = new T.AmbientLight(0xf0f0f0, 0.2);
  scene.add(ambientLight);



  var lastViewedThing = null;
  var triggered = [];
  var count;
  var counter;
  var counterMax = 100;
  var checkIfViewingSomething = function (items, callback1, callback2) {
    var raycaster = new T.Raycaster();
    raycaster.setFromCamera(core.center, camera);

    items.forEach(function (item, i) {
      var intersects = raycaster.intersectObject(item);

      if (intersects.length) {
        if (lastViewedThing === item.id) {
          if (count) {
            if (counter <= counterMax) {
              counter++;
            } else {
              callback2(item);
              counter = 0;
              count = false;
            }
          }
        } else {
          lastViewedThing = item.id;
          triggered[i] = true;
          count = true;
          counter = 0;
          callback1(item.children[0]);
        }
      }
    });
  };
  var backDevice = core.addBackDevice();
  scene.add(backDevice);

  var playDevice = core.build('CubeGeometry', [30, 15, 10], 'MeshLambertMaterial', [{map: woodTexture}]);
  playDevice.position.set(35, 0, -20);


  var buttonMaterials, buttonMaterialsArray = [];

  buttonMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // left
  buttonMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // right
  buttonMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // top
  buttonMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // bottom
  buttonMaterialsArray.push(new T.MeshLambertMaterial({
    map: new T.ImageUtils.loadTexture('playButton.jpg'),
    color: 0xff0000
  })); // front
  buttonMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // back

  buttonMaterials = new T.MeshFaceMaterial(buttonMaterialsArray);
  var playButton = new T.Mesh(
    new T.CubeGeometry(20,10,5),
    buttonMaterials
  );
  playButton.position.z = 5;
  playDevice.add(playButton);
  playDevice.lookAt(new T.Vector3(0,5,0));
  scene.add(playDevice);



  var file = 'music.mp3';
  var sound = new Howl({
    urls: [file]
  });

  var isPlaying = false;
  var scaleSpeaker;
  var triggerPlayToggle = function (){
    if (!isPlaying) {
      playButton.material.materials[4].color.setHex(0x00ff00);
      sound.play();
      isPlaying = true;
      scaleSpeaker = setInterval(function () {
        speaker.scale.set(1.1, 1.1, 1.1);
        speaker.position.y = 12;
        setTimeout(function () {
          speaker.scale.set(1, 1, 1);
          speaker.position.y = 10;
        }, 100);
      }, 200)
    } else {
      clearInterval(scaleSpeaker);
      playButton.material.materials[4].color.setHex(0xff0000);
      sound.stop();
      isPlaying = false;
    }
    setTimeout(function () {
      lastViewedThing = null;
    }, 1000);
  };

  var dummyCallBack = function () {

  };

  var highlightBackDevice = function (device){
    device.material.visible = true;
  };
  var triggerBackDevice = function (){
    window.location.href = '../menu.html';
  };
  soundIndicator = core.build('SphereGeometry', [1, 32, 32], 'MeshPhongMaterial', [{color:0xff0000}]);
  var updateSoundPosition = function () {

    var p = new T.Vector3();
    p.setFromMatrixPosition(camera.matrixWorld);
    var px = (p.x / 5);
    var pz = -(p.z / 5);
    soundIndicator.position.set(px, 5, pz);
    sound.pos3d(px, 5, pz);
  };
  var render = function() {
    controls.update();

    effect.render(scene, camera);
    requestAnimationFrame(render);
    checkIfViewingSomething([backDevice], highlightBackDevice, triggerBackDevice);
    checkIfViewingSomething([playDevice], triggerPlayToggle, triggerPlayToggle);
    updateSoundPosition();
  };
  render();
  window.addEventListener('resize', function() {
    core.resizeRenderer(renderer, scene, camera, effect);
  }, false);

}(window, document));
