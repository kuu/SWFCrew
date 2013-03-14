/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var swfcrew = theatre.crews.swf;
  var mActions = swfcrew.actions;

  /**
   * Sets up adding an Actor to the Stage.
   * @param {theatre.Actor} pSpriteActor The Sprite Actor to add to.
   * @param {Object} pData The data to use to know what to add.
   */
  mActions.add = function(pSpriteActor, pData) {
    var tNewActor = pSpriteActor.player.newFromId(pData.id);
    var tName = pData.name;

    if (tNewActor === null) {
      return;
    }

    if (tName) {
      tNewActor.setName(tName.toLowerCase());
      tNewActor.swfName = tName;
    } else {
      tName = tNewActor instanceof swfcrew.actors.SpriteActor ?
                        'instance' + (++pSpriteActor.stage.spriteInstanceCounter) :
                        '__swfcrew_object__' + (++pSpriteActor.stage.notSpriteInstanceCounter);
      tNewActor.setName(tName);
      tNewActor.swfName = tName;
    }

    var tMatrix = tNewActor.matrix;
    var tDataMatrix = null;

    if (pSpriteActor.buttonMatrix) {
      tDataMatrix = pSpriteActor.buttonMatrix;
    } else if (pData.matrix !== null) {
      tDataMatrix = pData.matrix;
    }

    if (tDataMatrix !== null) {
      tMatrix.a = tDataMatrix[0];
      tMatrix.b = tDataMatrix[1];
      tMatrix.c = tDataMatrix[2];
      tMatrix.d = tDataMatrix[3];
      tMatrix.e = tDataMatrix[4];
      tMatrix.f = tDataMatrix[5];
    }

    pSpriteActor.addActor(tNewActor, pData.depth);
  };

  mActions.replace = function(pSpriteActor, pData) {
    var tActor = pSpriteActor.getActorAtLayer(pData.depth);

    if (tActor === null) {
      console.error('Could not replace non-existent Actor at layer ' + pData.depth);
      return;
    }

    var tMatrix = tActor.matrix;
    if (tMatrix && (!pData.matrix || pData.matrix.join('') === '100100')) {
      pData.matrix = tMatrix.getArray();
    }

    tActor.leave();

    mActions.add(pSpriteActor, pData);
  };

  mActions.move = function(pSpriteActor, pData) {
    var tActor = pSpriteActor.getActorAtLayer(pData.depth);

    if (tActor === null) {
      console.error('Could not move non-existent Actor at layer ' + pData.depth);
      return;
    }

    if (pData.matrix !== null) {
      if (tActor.isMatrixLocked === true) {
        return;
      }

      tActor.matrix.fill(pData.matrix);

      tActor.invalidate();
    }
  };

  mActions.clip = function(pSpriteActor, pData) {
    var tActor = pSpriteActor.getActorAtLayer(pData.depth);

    if (tActor === null) {
      console.error('Could not clip non-existent Actor at layer ' + pData.depth);
      return;
    }

    tActor.clipDepth = pData.clipDepth;

    tActor.invalidate();
  };

  mActions.colorTransform = function(pSpriteActor, pData) {
    var tActor = pSpriteActor.getActorAtLayer(pData.depth);

    if (tActor === null) {
      console.error('Could not color transform non-existent Actor at layer ' + pData.depth);
      return;
    }

    // Device text cannot have colorTransform.
    if (tActor instanceof swfcrew.actors.TextActor && tActor.device === true) {
      return;
    }

    tActor.colorTransform = pData.colorTransform;

    tActor.invalidate();
  };

  mActions.ratio = function(pSpriteActor, pData) {
    var tActor = pSpriteActor.getActorAtLayer(pData.depth);

    if (tActor === null) {
      console.error('Could not color transform non-existent Actor at layer ' + pData.depth);
      return;
    }

    tActor.ratio = Math.round((pData.ratio / 0xFFFE) * 10) / 10;

    tActor.invalidate();
  };

}(this));
