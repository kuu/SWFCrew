/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var mActions = theatre.define('theatre.crews.swf.actions');

  /**
   * Sets up adding an Actor to the Stage.
   * @param {theatre.Actor} pSpriteActor The Sprite Actor to add to.
   * @param {Object.<String, theatre.Actor>} pDictionary A map of ids to Actor Classes.
   * @param {Object} pData The data to use to know what to add.
   */
  mActions.add = function(pSpriteActor, pDictionary, pData) {
    if (!(pData.id in pDictionary)) {
      return;
    }
    var tNewActor = new pDictionary[pData.id]();
    if (pData.name) {
      tNewActor.name = pData.name;
    }

    pSpriteActor.addActor(tNewActor, pData.layer);

    if (pData.matrix !== null) {
      var tMatrix = tNewActor.matrix;
      var tDataMatrix = pData.matrix;
      tMatrix.a = tDataMatrix[0];
      tMatrix.b = tDataMatrix[1];
      tMatrix.c = tDataMatrix[2];
      tMatrix.d = tDataMatrix[3];
      tMatrix.e = tDataMatrix[4];
      tMatrix.f = tDataMatrix[5];
    }
  };

  mActions.replace = function(pSpriteActor, pDictionary, pData) {
    var tActor = pSpriteActor.getActorAtLayer(pData.layer);
    if (tActor === null) {
      console.error('Could not move non-existent Actor at layer ' + pData.layer);
      return;
    }
    var tMatrix = tActor.matrix;

    tActor.leave();

    if (!(pData.id in pDictionary)) {
      return;
    }

    var tNewActor = new pDictionary[pData.id]();
    if (pData.name) {
      tNewActor.name = pData.name;
    }
    pSpriteActor.addActor(tNewActor, pData.layer);
    tNewActor.matrix = tMatrix;
  };

  mActions.move = function(pSpriteActor, pDictionary, pData) {
    var tActor = pSpriteActor.getActorAtLayer(pData.layer);
    if (tActor === null) {
      console.error('Could not move non-existent Actor at layer ' + pData.layer);
      return;
    }

    if (pData.matrix !== null) {
      var tMatrix = tActor.matrix;
      var tDataMatrix = pData.matrix;
      tMatrix.a = tDataMatrix[0];
      tMatrix.b = tDataMatrix[1];
      tMatrix.c = tDataMatrix[2];
      tMatrix.d = tDataMatrix[3];
      tMatrix.e = tDataMatrix[4];
      tMatrix.f = tDataMatrix[5];
    }

    tActor.invalidate();
  };

  mActions.clip = function(pSpriteActor, pDictionary, pData) {
    var tActor = pSpriteActor.getActorAtLayer(pData.layer);
    if (tActor === null) {
      console.error('Could not clip non-existent Actor at layer ' + pData.layer);
      return;
    }

    tActor.clipDepth = pData.clipDepth;

    tActor.invalidate();
  };

  mActions.colorTransform = function(pSpriteActor, pDictionary, pData) {
    var tActor = pSpriteActor.getActorAtLayer(pData.layer);
    if (tActor === null) {
      console.error('Could not color transform non-existent Actor at layer ' + pData.layer);
      return;
    }

    tActor.colorTransform = pData.colorTransform;

    tActor.invalidate();
  };

}(this));
