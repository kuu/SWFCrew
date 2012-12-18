/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var swfcrew = theatre.crews.swf;
  var mActions = theatre.define('theatre.crews.swf.actions');

  /**
   * Sets up adding an Actor to the Stage.
   * @param {theatre.Actor} pSpriteActor The Sprite Actor to add to.
   * @param {Object} pData The data to use to know what to add.
   */
  mActions.add = function(pSpriteActor, pData) {
    var tNewActor = pSpriteActor.player.newFromId(pData.id);
    if (tNewActor === null) {
      return;
    }

    if (pData.name) {
      tNewActor.name = pData.name;
    } else {
      tNewActor.name = tNewActor instanceof swfcrew.actors.SpriteActor ?
                        'instance' + (++pSpriteActor.stage.spriteInstanceCounter) :
                        '__swfcrew_object__' + (++pSpriteActor.stage.notSpriteInstanceCounter);
    }

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

    tNewActor.stepAdded = pSpriteActor.currentStep;

    pSpriteActor.addActor(tNewActor, pData.layer);
  };

  mActions.replace = function(pSpriteActor, pData) {
    var tActor = pSpriteActor.getActorAtLayer(pData.layer);
    if (tActor === null) {
      console.error('Could not replace non-existent Actor at layer ' + pData.layer);
      return;
    }
    var tMatrix = tActor.matrix;

    tActor.leave();

    var tNewActor = pSpriteActor.player.newFromId(pData.id);

    if (tNewActor === null) {
      return;
    }

    if (pData.name) {
      tNewActor.name = pData.name;
    } else {
      tNewActor.name = tNewActor instanceof swfcrew.actors.SpriteActor ?
                        'instance' + (++pSpriteActor.stage.spriteInstanceCounter) :
                        '__swfcrew_object__' + (++pSpriteActor.stage.notSpriteInstanceCounter);
    }

    tNewActor.matrix = tMatrix;
    tNewActor.stepAdded = pSpriteActor.currentStep;

    pSpriteActor.addActor(tNewActor, pData.layer);
  };

  mActions.move = function(pSpriteActor, pData) {
    var tActor = pSpriteActor.getActorAtLayer(pData.layer);
    if (tActor === null) {
      console.error('Could not move non-existent Actor at layer ' + pData.layer);
      return;
    }

    if (pData.matrix !== null) {
      if (tActor.isMatrixLocked === true) {
        return;
      }

      var tMatrix = tActor.matrix;
      var tDataMatrix = pData.matrix;
      tMatrix.a = tDataMatrix[0];
      tMatrix.b = tDataMatrix[1];
      tMatrix.c = tDataMatrix[2];
      tMatrix.d = tDataMatrix[3];
      tMatrix.e = tDataMatrix[4];
      tMatrix.f = tDataMatrix[5];

      tActor.invalidate();
    }
  };

  mActions.clip = function(pSpriteActor, pData) {
    var tActor = pSpriteActor.getActorAtLayer(pData.layer);
    if (tActor === null) {
      console.error('Could not clip non-existent Actor at layer ' + pData.layer);
      return;
    }

    tActor.clipDepth = pData.clipDepth;

    tActor.invalidate();
  };

  mActions.colorTransform = function(pSpriteActor, pData) {
    var tActor = pSpriteActor.getActorAtLayer(pData.layer);
    if (tActor === null) {
      console.error('Could not color transform non-existent Actor at layer ' + pData.layer);
      return;
    }

    tActor.colorTransform = pData.colorTransform;

    tActor.invalidate();
  };

  mActions.ratio = function(pSpriteActor, pData) {
    var tActor = pSpriteActor.getActorAtLayer(pData.layer);
    if (tActor === null) {
      console.error('Could not color transform non-existent Actor at layer ' + pData.layer);
      return;
    }

    tActor.ratio = Math.round((pData.ratio / 0xFFFE) * 10) / 10;

    tActor.invalidate();
  };

}(this));
