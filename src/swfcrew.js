/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {
  var theatre = global.theatre,
      quickswf = global.quickswf;

  var swfcrew = theatre.define('theatre.crews.swf');

  /**
   * Converts the given SWF to a TheatreScript Stage.
   * It is recommended to destroy the SWF object after this if
   * you can to reduce memory usage. TheatreScript will not
   * use the given SWF object at all once converted.
   * @param {quickswf.SWF} pSWF The SWF to convert.
   * @param {Element} pAttachTo An element to attach to.
   * @param {Object=} pOptions Options to pass customize the conversion.
   * @return {theatre.Stage} The Stage to use inside TheatreScript.
   */
  swfcrew.create = function(pSWF, pAttachTo, pOptions) {
    var tStage = new theatre.Stage();

    tStage.asTargetStack = [];

    var tContainer = new theatre.crews.dom.DOMActor();
    tStage.addActor(tContainer, {
      container: pAttachTo,
      width: pSWF.width,
      height: pSWF.height
    });

    tStage.stepRate = 1000 / pSWF.frameRate;
    
    var tActorTypes = swfcrew.actors;
    var tDictionaryToActorMap = new Object();
    var k;

    var tHandlers = swfcrew.handlers;

    var tDictionary = pSWF.dictionary;
    for (k in tDictionary) {
      var tDisplayListType = tDictionary[k].displayListType;
      if (tHandlers[tDisplayListType] === void 0) {
        continue;
      }
      tHandlers[tDisplayListType](pSWF, tDictionaryToActorMap, tDictionary[k], pOptions);
    }

    tHandlers[1](pSWF, tDictionaryToActorMap, pSWF.rootSprite, pOptions);

    tContainer.addActor(new tDictionaryToActorMap[0](), {
      layer: 0,
      name: 'root'
    });

    return tStage;
  };

  /**
   * Attempts to resolve and return the Actor at the location
   * given by the path.
   * @param {theatre.Actor} pCurrentTarget
   * @param {string} pPath
   */
  swfcrew.setTarget = function(pCurrentTarget, pPath) {
    if (pPath === '') {
      return pCurrentTarget.stage.asTargetStack.pop() || pCurrentTarget;
    } else if (!pPath) {
      return pCurrentTarget;
    }

    var tNewTarget = pCurrentTarget;
    var tParts = pPath.split('/');

    for (var i = 0, il = tParts.length; i < il; i++) {
      var tPart = tParts[i];
      if (tPart === '' || tPart === '.') {
        continue;
      } else if (tPart === '..') {
        tNewTarget = tNewTarget.parent;
      } else if (tPart === '_root') {
        tNewTarget = tNewTarget.stage.stageManager.getActorAtLayer(0); // Right?
      } else if (tPart.indexOf('_level') === 0) {
        tNewTarget = tNewTarget.stage.stageManager.getActorAtLayer(0); // TODO: Implement this properly.
      } else {
        tNewTarget = tNewTarget.getActorByName(tPart);
      }
      if (tNewTarget === null) {
        tNewTarget = pCurrentTarget;
        break;
      }
    }

    tNewTarget.stage.asTargetStack.push(pCurrentTarget);

    return tNewTarget;
  };

}(this));
