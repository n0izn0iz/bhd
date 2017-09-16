"use strict";

console.log("Hello, world!");

import { vec2 } from "gl-matrix";
import QuadTree from "td-quadtree";
import Entity from "td-entity";
import AABB from "td-aabb";
import { createBuffer, createShaderProgram } from "td-glhelp";

const quadTree = new QuadTree();
console.log("Created qtree " + quadTree);
const worldSize = 64;

const canvasSize = 1024;

const entities = [];
const numEntities = 256;
const triangleSize = 0.5;
const one = 1;
const half = number => number / 2;
const coinFlip = () => Math.random() >= half(one);

const genRandomVector = () => {
  const x = Math.random();
  const y = Math.random();
  return vec2.fromValues(coinFlip() ? x : -x, coinFlip() ? y : -y);
};

for (let i = 0; i < numEntities; i++) {
  const entity = new Entity({
    position: vec2.scale(
      vec2.create(),
      genRandomVector(),
      half(worldSize - triangleSize)
    ),
    size: triangleSize
  });
  if (!quadTree.collide(entity)) {
    quadTree.insert(entity);
    entities.push(entity);
  }
}

const calcMoveLength = () => Math.random() * 1000;

const moveVars = entities.map(entity => {
  return {
    entity,
    moveVector: genRandomVector()
  };
});

const addVectors = (a, b) => {
  return vec2.add(vec2.create(), a, b);
};

const moveEntities = () => {
  moveVars.forEach(moveVar => {
    const { entity } = moveVar;
    const aABB = new AABB({
      position: addVectors(entity.position, moveVar.moveVector),
      size: entity.size
    });
    let i = 0;
    while (
      !(!quadTree.collideAABB(aABB, entity) && entity.move(aABB.position)) &&
      i < 100
    ) {
      moveVar.moveVector = genRandomVector();
      aABB.position = addVectors(entity.position, moveVar.moveVector);
      i++;
    }
  });
};

let mousePos = vec2.create();

const getMousePos = (canvas, evt) => {
  var rect = canvas.getBoundingClientRect();
  return vec2.fromValues(
    ((evt.clientX - rect.left) / canvasSize * 2 - 1) * half(worldSize),
    -((evt.clientY - rect.top) / canvasSize * 2 - 1) * half(worldSize)
  );
};

function webGLStart() {
  var canvas = document.getElementById("canvas");

  canvas.addEventListener(
    "mousemove",
    evt => {
      mousePos = getMousePos(canvas, evt);
    },
    false
  );
  initGL(canvas);
  initShaders();
  initBuffers();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  drawScene();

  const loop = () => {
    moveEntities();
    drawScene();
    window.setTimeout(loop, 20);
  };
  loop();
}

var triangleVertexPositionBuffer;
var squareVertexPositionBuffer;
var squareQuadCoordBuffer;

function initBuffers() {
  triangleVertexPositionBuffer = createBuffer(
    gl,
    [0.0, 1.0, -1.0, -1.0, 1.0, -1.0],
    2
  );
  squareVertexPositionBuffer = createBuffer(
    gl,
    [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0],
    2
  );
  squareQuadCoordBuffer = createBuffer(gl, [1.0, 1.0, 0, 1.0, 1.0, 0, 0, 0], 2);
}

var shaderProgram, shaderProgramQtree;

function initShaders() {
  shaderProgram = createShaderProgram(gl, {
    name: "default",
    shadersIds: ["shader-vs-basic", "shader-fs-rgba"],
    attributesNames: ["modelVertex"],
    uniformsNames: ["position", "worldSize", "modelSize", "color"]
  });

  shaderProgramQtree = createShaderProgram(gl, {
    name: "qtree-grid",
    shadersIds: ["shader-vs-quadcoord", "shader-fs-borders"],
    attributesNames: ["modelVertex", "quadCoordIn"],
    uniformsNames: ["position", "worldSize", "modelSize"]
  });
}

const drawTriangle = (position, size, color) => {
  gl.useProgram(shaderProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    triangleVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(shaderProgram.attributes.modelVertex);
  gl.uniform2fv(shaderProgram.uniforms.position, position);
  gl.uniform4fv(shaderProgram.uniforms.color, color);
  gl.uniform1f(shaderProgram.uniforms.modelSize, size);
  gl.uniform1f(shaderProgram.uniforms.worldSize, worldSize);
  gl.enable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
};

const drawSquare = (position, size) => {
  gl.useProgram(shaderProgramQtree);
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgramQtree.attributes.modelVertex,
    squareVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(shaderProgramQtree.attributes.modelVertex);
  gl.bindBuffer(gl.ARRAY_BUFFER, squareQuadCoordBuffer);
  gl.vertexAttribPointer(
    shaderProgramQtree.attributes.quadCoordIn,
    squareQuadCoordBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(shaderProgramQtree.attributes.quadCoordIn);
  gl.uniform2fv(shaderProgramQtree.uniforms.position, position);
  gl.uniform1f(shaderProgramQtree.uniforms.modelSize, size);
  gl.uniform1f(shaderProgramQtree.uniforms.worldSize, worldSize);
  gl.enable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
};

const drawEntity = () => {};
const white = [1, 1, 1, 1];
const red = [1, 0, 0, 1];

function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  quadTree.forEach(node => {
    drawSquare(node.position, node.size);
  });
  entities.forEach(entity => {
    if (entity.aABB.containsPoint(mousePos))
      drawTriangle(entity.position, entity.size, red);
    else drawTriangle(entity.position, entity.size, white);
  });
}

var gl;
function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {}
  if (!gl) {
    alert("Could not initialise WebGL, sorry :-( ");
  } else {
  }
}

webGLStart();
