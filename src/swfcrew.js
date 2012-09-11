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

  function getTargetAndData(pCurrentTarget, pPath) {
    if (!pPath) {
      return {
        target: pCurrentTarget,
        step: 0,
        label: ''
      };
    }

    var tFramePartIndex = pPath.indexOf(':');
    var tFramePart;
    if (tFramePartIndex !== -1) {
      tFramePart = pPath.substring(tFramePartIndex + 1);
      pPath = pPath.substring(0, tFramePartIndex);
    }

    var tNewTarget = pCurrentTarget;
    var tStep = 0;
    var tLabel = '';
    var tParts = pPath.split('/');

    for (var i = 0, il = tParts.length; i < il; i++) {
      var tPart = tParts[i];
      if (tPart === '' || tPart === '.') {
        continue;
      } else if (tPart === '..') {
        tNewTarget = tNewTarget.parent;
      } else if (tPart === '_root') {
        tNewTarget = tNewTarget.stage.stageManager.getActorAtLayer(0).getActorAtLayer(0); // Right?
      } else if (tPart.indexOf('_level') === 0) {
        tNewTarget = tNewTarget.stage.stageManager.getActorAtLayer(0).getActorAtLayer(0); // TODO: Implement this properly.
      } else {
        tNewTarget = tNewTarget.getActorByName(tPart);
      }
      if (tNewTarget === null) {
        tNewTarget = pCurrentTarget;
        break;
      }
    }

    if (tFramePart !== void 0) {
      var tTempStep = parseInt(tFramePart, 10);
      if (tTempStep + '' === tFramePart) {
        tStep = tTempStep;
      } else {
        tLabel = tFramePart;
      }
    }

    return {
      target: tNewTarget,
      step: tStep,
      label: tLabel
    };
  }

  /**
   * Attempts to resolve and return the Actor at the location
   * given by the path.
   * @param {string} pPath
   */
  swfcrew.setTarget = function(pArgs) {
    var tCurrentTarget = pArgs.currentTarget;
    var tPath = pArgs.target;

    if (tPath === '') {
      return tCurrentTarget.stage.asTargetStack.pop() || tCurrentTarget;
    }

    var tNewTarget = getTargetAndData(tCurrentTarget, tPath).target;

    tNewTarget.stage.asTargetStack.push(tCurrentTarget);

    return tNewTarget;
  };

  swfcrew.call = function(pArgs) {
    var tCurrentTarget = pArgs.currentTarget;
    var tFrame = pArgs.frame;

    if (tFrame && tFrame.indexOf(':') === -1) {
      tFrame = ':' + tFrame; // Hack...
    }
    var tData = getTargetAndData(tCurrentTarget, tFrame);
    if (tData.label !== '') {
      var tStep = tData.target.getLabelStepFromScene('', tData.label);
      if (tStep !== null) {
        tData.target.doScripts(tStep, tCurrentTarget);
      } else {
        console.error('Label in call() did not exist');
      }
    } else {
      tData.target.doScripts(tData.step, tCurrentTarget);
    }
  };

  swfcrew.gotoFrame = function(pArgs) {
    var tCurrentTarget = pArgs.currentTarget;
    var tFrame = parseInt(pArgs.frame, 10);

    tCurrentTarget.gotoStep(tFrame) || tCurrentTarget.gotoStep(0);
  };

  swfcrew.trace = function(pArgs) {
    global.console.debug(pArgs.message);
  };

  swfcrew.gotoLabel = function(pArgs) {
    var tCurrentTarget = pArgs.currentTarget;
    var tFrame = pArgs.frame;

    tCurrentTarget.gotoLabel(tFrame) || tCurrentTarget.gotoStep(tCurrentTarget.numberOfSteps - 1);
  };

  swfcrew.gotoFrameOrLabel = function(pArgs) {
    var tCurrentTarget = pArgs.currentTarget;
    var tFrame = pArgs.frame;
    var tBias = pArgs.bias;

    if (typeof tFrame === 'number') {
      tCurrentTarget.gotoStep(tFrame + tBias) || tCurrentTarget.gotoStep(0);
      return;
    }

    if (tFrame && tFrame.indexOf(':') === -1) {
      tFrame = ':' + tFrame; // Hack...
    }
    var tData = getTargetAndData(tCurrentTarget, tFrame);
    if (tData.label !== '') {
      return tData.target.gotoLabel(tData.label); // TODO: Support bias?
    } else {
      return tData.target.gotoStep(tData.step + tBias);
    }
  };

}(this));
