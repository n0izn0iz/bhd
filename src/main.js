"use strict";

console.log("Hello, world!");

import { mat4, vec2 } from "gl-matrix";
import QuadTree from "td-quadtree";
import Entity from "td-entity";

const quadTree = new QuadTree();
const entity = new Entity(vec2.create(0, 0));

quadTree.insert(entity);

function webGLStart() {
  var canvas = document.getElementById("lesson01-canvas");
  initGL(canvas);
  initShaders();
  initBuffers();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  drawScene();
}

var triangleVertexPositionBuffer;
var squareVertexPositionBuffer;
var squareQuadCoordBuffer;

function initBuffers() {
  triangleVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
  var vertices = [0.0, 1.0, -1.0, -1.0, 1.0, -1.0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  triangleVertexPositionBuffer.itemSize = 2;
  triangleVertexPositionBuffer.numItems = 3;

  squareVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  vertices = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  squareVertexPositionBuffer.itemSize = 2;
  squareVertexPositionBuffer.numItems = 4;

  squareQuadCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareQuadCoordBuffer);
  vertices = [1.0, 1.0, 0, 1.0, 1.0, 0, 0, 0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  squareQuadCoordBuffer.itemSize = 2;
  squareQuadCoordBuffer.numItems = 4;
}

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

var shaderProgram, shaderProgramQtree;
function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var fragmentShaderQtree = getShader(gl, "shader-fs-qtree");
  var vertexShader = getShader(gl, "shader-vs");
  var vertexShaderQtree = getShader(gl, "shader-vs-qtree");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  shaderProgramQtree = gl.createProgram();
  gl.attachShader(shaderProgramQtree, vertexShaderQtree);
  gl.attachShader(shaderProgramQtree, fragmentShaderQtree);
  gl.linkProgram(shaderProgramQtree);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  if (!gl.getProgramParameter(shaderProgramQtree, gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  gl.useProgram(shaderProgramQtree);

  shaderProgramQtree.vertexPositionAttribute = gl.getAttribLocation(
    shaderProgramQtree,
    "aVertexPosition"
  );
  gl.enableVertexAttribArray(shaderProgramQtree.vertexPositionAttribute);

  shaderProgramQtree.quadCoordAttribute = gl.getAttribLocation(
    shaderProgramQtree,
    "quadCoordIn"
  );
  gl.enableVertexAttribArray(shaderProgramQtree.quadCoordAttribute);

  shaderProgramQtree.pMatrixUniform = gl.getUniformLocation(
    shaderProgramQtree,
    "uPMatrix"
  );

  shaderProgramQtree.mvMatrixUniform = gl.getUniformLocation(
    shaderProgramQtree,
    "uMVMatrix"
  );

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(
    shaderProgram,
    "modelVertex"
  );
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.positionUniform = gl.getUniformLocation(
    shaderProgram,
    "position"
  );

  shaderProgram.worldSizeUniform = gl.getUniformLocation(
    shaderProgram,
    "worldSize"
  );

  shaderProgram.modelSizeUniform = gl.getUniformLocation(
    shaderProgram,
    "modelSize"
  );
}

const scale = -64;

const drawTriangle = position => {
  mat4.identity(mvMatrix);
  mat4.translate(mvMatrix, mvMatrix, [position[0], position[1], scale]);
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
  gl.uniform2f(shaderProgram.positionUniform, false, position);
  gl.uniform1f(shaderProgram.worldSizeUniform, false, 64);
  gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
};

const drawSquare = (position, size) => {
  mat4.identity(mvMatrix);
  mat4.translate(mvMatrix, mvMatrix, [position[0], position[1], scale]);
  gl.useProgram(shaderProgramQtree);
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgramQtree.vertexPositionAttribute,
    squareVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, squareQuadCoordBuffer);
  gl.vertexAttribPointer(
    shaderProgramQtree.quadCoordAttribute,
    squareQuadCoordBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.uniformMatrix4fv(shaderProgramQtree.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgramQtree.mvMatrixUniform, false, mvMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
};

const drawEntity = () => {
  drawTriangle(entity.position);
};

function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  mat4.perspective(
    pMatrix,
    45,
    gl.viewportWidth / gl.viewportHeight,
    0.1,
    100.0
  );
  quadTree.forEach(node => {
    drawSquare(node.position, node.size);
  });
  drawEntity();
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
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }
}

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript) {
    return null;
  }

  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) str += k.textContent;
    k = k.nextSibling;
  }

  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

webGLStart();
