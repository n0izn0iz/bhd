"use strict";

console.log("Hello, world!");

import { vec2 } from "gl-matrix";
import QuadTree from "td-quadtree";
import Entity from "td-entity";
import { createBuffer, createShaderProgram } from "td-glhelp";

const quadTree = new QuadTree();
console.log("Created qtree " + quadTree);
const worldSize = 64;
const entities = [];
const numEntities = 256;

for (let i = 0; i < 256; i++)
  entities.push(
    new Entity({
      position: vec2.fromValues(5, 5),
      size: 0.5,
      parent: quadTree
    })
  );

const genRandomVector = () => {
  return vec2.normalize(
    vec2.create(),
    vec2.fromValues(
      Math.random() - Math.random(),
      Math.random() - Math.random()
    )
  );
};

const calcMoveLength = () => Math.random() * 1000;

const moveVars = entities.map(entity => {
  return {
    entity,
    moveVector: genRandomVector(),
    moveLength: calcMoveLength(),
    lastMoveTime: performance.now()
  };
});

const moveEntities = () => {
  moveVars.forEach(moveVar => {
    const now = performance.now();
    if (
      !moveVar.entity.move(
        vec2.add(vec2.create(), moveVar.entity.position, moveVar.moveVector)
      ) ||
      now > moveVar.lastMoveTime + moveVar.moveVarmoveLength
    ) {
      moveVar.lastMoveTime = now;
      moveVar.moveVector = genRandomVector();
      moveVar.moveLength = calcMoveLength();
    }
  });
};

function webGLStart() {
  var canvas = document.getElementById("lesson01-canvas");
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
    shadersIds: ["shader-vs-basic", "shader-fs-white"],
    attributesNames: ["modelVertex"],
    uniformsNames: ["position", "worldSize", "modelSize"]
  });

  shaderProgramQtree = createShaderProgram(gl, {
    name: "qtree-grid",
    shadersIds: ["shader-vs-quadcoord", "shader-fs-borders"],
    attributesNames: ["modelVertex", "quadCoordIn"],
    uniformsNames: ["position", "worldSize", "modelSize"]
  });
}

const drawTriangle = (position, size) => {
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

function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  quadTree.forEach(node => {
    drawSquare(node.position, node.size);
  });
  entities.forEach(entity => {
    drawTriangle(entity.position, entity.size);
  });
}

var gl;
function initGL(canvas) {
  try {
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {}
  if (!gl) {
    alert("Could not initialise WebGL, sorry :-( ");
  } else {
  }
}

webGLStart();
