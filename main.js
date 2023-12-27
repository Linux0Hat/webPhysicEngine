var canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
var Timer;
var FpsTimer;
var objects;
var collisions;
var meterSize = 100;
var speed = 1;
var gravityX = 0 * meterSize;
var gravityY = 0 * meterSize;

function Init() {
  console.log("Web Physic Engine by Linux_Hat dev-0.1");
  objects = {
    border: {
      type: "circle",
      x: 150,
      y: 400,
      vx: 0,
      vy: 0,
      radius: 70,
      color: "#000000",
      mass: 1,
      freeze: true,
      restitution_coef: 1,
    },
    obj1: {
      type: "circle",
      x: 400,
      y: 400,
      vx: 0,
      vy: 0,
      radius: 70,
      color: "#FF0000",
      mass: 1,
      freeze: false,
      restitution_coef: 1,
    },
    obj2: {
      type: "circle",
      x: 600,
      y: 400,
      vx: -150,
      vy: 0,
      radius: 70,
      color: "#FF0000",
      mass: 100,
      freeze: false,
      restitution_coef: 1,
    },
  };
  Timer = new Date().getTime();
  FpsTimer = new Date().getTime();
  collisions = 0;
}

function drawObjects(objects) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var key in objects) {
    var object = objects[key];

    if (object.type === "box") {
      ctx.beginPath();
      ctx.rect(object.x, object.y, object.width, object.height);
      ctx.fillStyle = object.color;
      ctx.fill();
      ctx.closePath();
    }

    if (object.type === "circle") {
      ctx.beginPath();
      ctx.arc(object.x, object.y, object.radius, 0, Math.PI * 2);
      ctx.fillStyle = object.color;
      ctx.fill();
      ctx.closePath();
    }
  }
}

function updateObjectsPosition(objects) {
  for (var key in objects) {
    var object = objects[key];

    var t = ((new Date().getTime() - Timer) / 1000) * speed;
    if (!object.freeze) {
      object.x += object.vx * t;
      object.y += object.vy * t;
    }
  }
}

function updateObjectsVelocity(objects) {
  for (var key in objects) {
    var object = objects[key];
    if (!object.freeze) {
      var t = ((new Date().getTime() - Timer) / 1000) * speed;
      object.vx += gravityX * t;
      object.vy += gravityY * t;
    } else {
      object.vx = 0;
      object.vy = 0;
    }
  }
}

function collideObjects(objects) {
  var pairs = new getPairs(objects);
  for (let i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    var object = objects[pair[0]];
    var object_ = objects[pair[1]];
    const deltaX = object_.x - object.x;
    const deltaY = object_.y - object.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const overlap = object.radius + object_.radius - distance;
    if (overlap > 0) {
      collisions += 1;
      a = Math.atan2(object_.y - object.y, object_.x - object.x);
      if (object.freeze && object_.freeze) {
        continue;
      } else if (object.freeze) {
        object_.x += overlap * Math.cos(a);
        object_.y += overlap * Math.sin(a);
      } else if (object_.freeze) {
        object.x -= overlap * Math.cos(a);
        object.y -= overlap * Math.sin(a);
      } else {
        const correctionRatio = overlap / distance;
        object.x -= deltaX * correctionRatio;
        object.y -= deltaY * correctionRatio;
        object_.x += deltaX * correctionRatio;
        object_.y += deltaY * correctionRatio;
      }

      const relativeVelocityX = object_.vx - object.vx;
      const relativeVelocityY = object_.vy - object.vy;

      const restitution_coef = Math.max(
        object.restitution_coef,
        object_.restitution_coef
      );

      const dotProduct =
        deltaX * relativeVelocityX + deltaY * relativeVelocityY;

      if (object.freeze) {
        const impulse =
          (2 * dotProduct) / (distance * (object_.mass + object_.mass));
        const bounceX =
          (impulse * object_.mass * deltaX) / distance +
          restitution_coef * ((impulse * object_.mass * deltaX) / distance);
        const bounceY =
          (impulse * object_.mass * deltaY) / distance +
          restitution_coef * ((impulse * object_.mass * deltaY) / distance);

        object_.vx -= bounceX;
        object_.vy -= bounceY;
      } else if (object_.freeze) {
        const impulse =
          (2 * dotProduct) / (distance * (object_.mass + object_.mass));
        const bounceX =
          (impulse * object.mass * deltaX) / distance +
          restitution_coef * ((impulse * object.mass * deltaX) / distance);
        const bounceY =
          (impulse * object.mass * deltaY) / distance +
          restitution_coef * ((impulse * object.mass * deltaY) / distance);

        object.vx += bounceX;
        object.vy += bounceY;
      } else {
        const impulse =
          (2 * dotProduct) / (distance * (object.mass + object_.mass));

        object.vx +=
          (impulse * object_.mass * deltaX * restitution_coef) / distance;
        object.vy +=
          (impulse * object_.mass * deltaY * restitution_coef) / distance;

        object_.vx -=
          (impulse * object.mass * deltaX * restitution_coef) / distance;
        object_.vy -=
          (impulse * object.mass * deltaY * restitution_coef) / distance;
      }
    }
  }
}

function gravityBetweenObjects(objects) {
  var pairs = new getPairs(objects);
  for (let i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    var object = objects[pair[0]];
    var object_ = objects[pair[1]];
    const deltaX = object_.x - object.x;
    const deltaY = object_.y - object.y;
    const d = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / meterSize;
    var G = 6.674e-11;
    var F = ((G * (object.mass * object_.mass)) / (d * d)) * meterSize;
    var a = Math.atan2(deltaY, deltaX);
    var t = ((new Date().getTime() - Timer) / 1000) * speed;
    object.vx += F * t * Math.cos(a);
    object.vy += F * t * Math.sin(a);
    object_.vx -= F * t * Math.cos(a);
    object_.vy -= F * t * Math.sin(a);
  }
}

function getPairs(objects) {
  var objects_list = [];
  for (var key in objects) {
    objects_list.push(key);
  }
  let pairs = [];
  for (let i = 0; i < objects_list.length; i++) {
    for (let j = i + 1; j < objects_list.length; j++) {
      pairs.push([objects_list[i], objects_list[j]]);
    }
  }
  return pairs;
}

Init();

function computingLoop() {
  var tps = 1000 / (new Date().getTime() - Timer);
  document.getElementById("tps").innerText = tps.toFixed(0);
  updateObjectsPosition(objects);
  gravityBetweenObjects(objects);
  updateObjectsVelocity(objects);
  collideObjects(objects);
  Timer = new Date().getTime();
}

function renderLoop() {
  var fps = 1000 / (new Date().getTime() - FpsTimer);
  document.getElementById("fps").innerText = fps.toFixed(2);
  document.getElementById("collisions").innerText = collisions;
  drawObjects(objects);
  requestAnimationFrame(renderLoop);
  FpsTimer = new Date().getTime();
}

renderLoop();
while (true) {
  computingLoop();
}
