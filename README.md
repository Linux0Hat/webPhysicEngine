# Web Physic Engine

Web Physic Engine is a physic engine make in JavaScript for website.
Test it on my website https://linuxhat.net/webPhysicEngine

## How to Use

### Config file

A config file is build like this for a simple gravity simulation :

_/config.json_

```
{
  "meterSize": 100,
  "speed": 1,
  "gravityX": 0,
  "gravityY": 9.81,
  "objects": {
    "obj1": {
      "type": "ball",
      "x": 50,
      "y": 200,
      "vx": 0,
      "vy": -200,
      "radius": 20,
      "color": "#0000FF",
      "mass": 10,
      "freeze": false,
      "restitution_coef": 0.8,
      "collision": true
    },
    "border1": {
      "type": "ball",
      "x": 0,
      "y": 800,
      "vx": 0,
      "vy": 0,
      "radius": 400,
      "color": "#FF0000",
      "mass": 100,
      "freeze": true,
      "restitution_coef": 0.5,
      "collision": true
    },
    "border2": {
      "type": "ball",
      "x": 800,
      "y": 800,
      "vx": 0,
      "vy": 0,
      "radius": 400,
      "color": "#FF0000",
      "mass": 100,
      "freeze": true,
      "restitution_coef": 0.5,
      "collision": true
    }
  }
}

```

### Create you game with

Add your code in the main loop.  
Exemple of a simple simulation with fps :

```
function mainLoop() {
  var fps = 1000 / (new Date().getTime() - Timer);
  document.getElementById("tps").innerText = fps.toFixed(0);
  updateObjectsPosition(objects);
  updateObjectsVelocity(objects);
  collideObjects(objects);
  Timer = new Date().getTime();
}
```

## License

```
Photocasio © 2024 by Linux_Hat is licensed under
Attribution-NonCommercial-ShareAlike 4.0 International
```

Project maintained by Linux_Hat
