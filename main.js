console.log("Web Physic Engine by Linux_Hat dev-0.1");

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
var cameraPos = [0, 0];
var cameraFollow = false;

function toFixed(num, fixed) {
  var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
  return num.toString().match(re)[0];
}

async function Init() {
  function get_param(param) {
    var vars = {};
    window.location.href
      .replace(location.hash, "")
      .replace(/[?&]+([^=&]+)=?([^&]*)?/gi, function (m, key, value) {
        vars[key] = value !== undefined ? value : "";
      });
    if (param) {
      return vars[param] ? vars[param] : null;
    }
    return vars;
  }
  var config_file = get_param("config");
  if (!config_file) {
    config_file = "default.json";
  }
  try {
    const reponse = await fetch(config_file);

    if (!reponse.ok) {
      throw new Error(`Error loading JSON file: ${reponse.status}`);
    }

    const data = await reponse.json();

    objects = data.objects;
    meterSize = data.meterSize;
    speed = data.speed;
    gravityX = data.gravityX * meterSize;
    gravityY = data.gravityY * meterSize;
    cameraFollow = data.cameraFollow;
  } catch (erreur) {
    console.error("Error while loading JSON file: ", erreur.message);
  }
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
      ctx.rect(
        object.x - object.width / 2 - cameraPos[0],
        object.y - object.height / 2 - cameraPos[1],
        object.width,
        object.height
      );
      ctx.fillStyle = object.color;
      ctx.fill();
      ctx.closePath();
    }

    if (object.type === "ball") {
      ctx.beginPath();
      ctx.arc(
        object.x - cameraPos[0],
        object.y - cameraPos[1],
        object.radius,
        0,
        Math.PI * 2
      );
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
    if (
      !object.collision ||
      !object_.collision ||
      (object.freeze && object_.freeze)
    ) {
      continue;
    } else if (object.type == object_.type && object.type == "ball") {
      collideBalls(object, object_);
    } else if (object.type == "ball" && object_.type == "box") {
      collideBallBox(object, object_);
    } else if (object.type == "box" && object_.type == "ball") {
      collideBallBox(object_, object);
    }
  }
}

function collideBalls(ball, ball_) {
  const deltaX = ball_.x - ball.x;
  const deltaY = ball_.y - ball.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const overlap = ball.radius + ball_.radius - distance;
  if (overlap > 0) {
    collisions += 1;
    a = Math.atan2(ball_.y - ball.y, ball_.x - ball.x);
    if (ball.freeze) {
      ball_.x += overlap * Math.cos(a);
      ball_.y += overlap * Math.sin(a);
    } else if (ball_.freeze) {
      ball.x -= overlap * Math.cos(a);
      ball.y -= overlap * Math.sin(a);
    } else {
      const correctionRatio = overlap / distance;
      ball.x -= deltaX * correctionRatio;
      ball.y -= deltaY * correctionRatio;
      ball_.x += deltaX * correctionRatio;
      ball_.y += deltaY * correctionRatio;
    }

    const relativeVelocityX = ball_.vx - ball.vx;
    const relativeVelocityY = ball_.vy - ball.vy;

    const restitution_coef = Math.max(
      ball.restitution_coef,
      ball_.restitution_coef
    );

    const dotProduct = deltaX * relativeVelocityX + deltaY * relativeVelocityY;

    if (ball.freeze) {
      const impulse = (2 * dotProduct) / (distance * (ball_.mass + ball_.mass));
      const bounceX =
        (impulse * ball_.mass * deltaX) / distance +
        restitution_coef * ((impulse * ball_.mass * deltaX) / distance);
      const bounceY =
        (impulse * ball_.mass * deltaY) / distance +
        restitution_coef * ((impulse * ball_.mass * deltaY) / distance);

      ball_.vx -= bounceX;
      ball_.vy -= bounceY;
    } else if (ball_.freeze) {
      const impulse = (2 * dotProduct) / (distance * (ball.mass + ball.mass));
      const bounceX =
        (impulse * ball.mass * deltaX) / distance +
        restitution_coef * ((impulse * ball.mass * deltaX) / distance);
      const bounceY =
        (impulse * ball.mass * deltaY) / distance +
        restitution_coef * ((impulse * ball.mass * deltaY) / distance);
      ball.vx += bounceX;
      ball.vy += bounceY;
    } else {
      const impulse = (2 * dotProduct) / (distance * (ball.mass + ball_.mass));

      ball.vx += (impulse * ball_.mass * deltaX * restitution_coef) / distance;
      ball.vy += (impulse * ball_.mass * deltaY * restitution_coef) / distance;

      ball_.vx -= (impulse * ball.mass * deltaX * restitution_coef) / distance;
      ball_.vy -= (impulse * ball.mass * deltaY * restitution_coef) / distance;
    }
  }
}

function collideBallBox(ball, box) {
  // Calculate the distances between the ball center and the box edges
  const distX = Math.abs(ball.x - box.x) - box.width / 2 - ball.radius;
  const distY = Math.abs(ball.y - box.y) - box.height / 2 - ball.radius;

  let overlap = 0;

  // Check if the ball is inside the box
  if (distX < 0 && distY < 0) {
    const dx = Math.min(distX, 0);
    const dy = Math.min(distY, 0);
    overlap = Math.sqrt(dx * dx + dy * dy);

    // Move the ball out of the box
    ball.x -= dx * (overlap / Math.abs(distX));
    ball.y -= dy * (overlap / Math.abs(distY));
  }

  if (overlap > 0) {
    collisions += 1;

    // Calculate the relative velocity
    const relativeVelocityX = ball.vx - box.vx;
    const relativeVelocityY = ball.vy - box.vy;

    // Calculate the restitution coefficient
    const restitution_coef = Math.max(
      ball.restitution_coef,
      box.restitution_coef
    );

    // Calculate the normal vector and the tangential vector
    const normalX = (ball.x - box.x) / box.width;
    const normalY = (ball.y - box.y) / box.height;
    const tangentialX = -normalY;
    const tangentialY = normalX;

    // Calculate the impulse
    const dotProduct =
      relativeVelocityX * normalX + relativeVelocityY * normalY;
    const invMassSum = 1 / ball.mass + 1 / box.mass;
    const j = (-(1 + restitution_coef) * dotProduct) / invMassSum;
    const impulseX = j * normalX;
    const impulseY = j * normalY;

    // Apply the impulse
    ball.vx += impulseX;
    ball.vy += impulseY;
    box.vx -= normalX * (impulseX / box.mass);
    box.vy -= normalY * (impulseY / box.mass);
  }
}
function gravityBetweenObjects(objects) {
  var pairs = new getPairs(objects);
  var text = "Forces :\n";
  for (let i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    var object = objects[pair[0]];
    var object_ = objects[pair[1]];
    const deltaX = object_.x - object.x;
    const deltaY = object_.y - object.y;
    const d = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / meterSize;
    var G = 6.674e-11;
    var F = ((G * (object.mass * object_.mass)) / (d * d));
    var a = Math.atan2(deltaY, deltaX);
    var t = ((new Date().getTime() - Timer) / 1000) * speed;
    object.vx += F * t * Math.cos(a);
    object.vy += F * t * Math.sin(a);
    object_.vx -= F * t * Math.cos(a);
    object_.vy -= F * t * Math.sin(a);
    text += `Force between ${pair[0]} and ${pair[1]} is ${toFixed(F,3)} N.\n`;
  }
  document.getElementById("forces").innerText = text;
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

function mainLoop() {
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
  if (objects && cameraFollow) {
    cameraPos = [
      objects[Object.keys(objects)[0]].x - canvas.width / 2,
      objects[Object.keys(objects)[0]].y - canvas.height / 2,
    ];
  }
  drawObjects(objects);
  requestAnimationFrame(renderLoop);
  FpsTimer = new Date().getTime();
}

setInterval(mainLoop);
renderLoop();
