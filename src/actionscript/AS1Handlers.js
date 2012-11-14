/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {
  var mHandlers = global.theatre.crews.swf.ASHandlers;


  mHandlers.GetTargetAndData = function(pPath, pCurrentTarget) {
    if (!pCurrentTarget) {
      pCurrentTarget = this.target;
    }

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

  mHandlers.NextFrame = function() {
    this.target.gotoStep(this.target.currentStep + 1);
  };

  mHandlers.PreviousFrame = function() {
    this.target.gotoStep(this.target.currentStep - 1);
  };

  mHandlers.Play = function() {
    this.target.startActing();
  };

  mHandlers.Stop = function() {
    this.target.stopActing();
  };

  mHandlers.GoToFrame = function(pFrame) {
    this.target.gotoStep(pFrame) || this.target.gotoStep(0);
  };

  mHandlers.GoToLabel = function(pLabel) {
    this.target.gotoLabel(pLabel) || this.target.gotoStep(this.target.numberOfSteps - 1);
  };

  mHandlers.Trace = function(pMessage) {
    global.console.debug(pMessage);
  };

  mHandlers.Call = function(pFrame) {
    var tCurrentTarget = this.target;

    if (pFrame && pFrame.indexOf(':') === -1) {
      pFrame = ':' + pFrame; // Hack...
    }

    var tData = this.callMapped('GetTargetAndData', pFrame, tCurrentTarget);

    if (tData.label !== '') {
      var tStep = tData.target.getLabelStepFromScene('', tData.label);
      if (tStep !== null) {
        tData.target.doScripts(tStep, tCurrentTarget);
      } else {
        console.error('Label in Call() did not exist');
      }
    } else {
      tData.target.doScripts(tData.step, tCurrentTarget);
    }
  };

  mHandlers.GoToFrame2 = function(pFrame, pSceneBias) {
    var tCurrentTarget = this.target;

    if (typeof pFrame === 'number') {
      tCurrentTarget.gotoStep(pFrame + pSceneBias) || tCurrentTarget.gotoStep(0);
      return;
    }

    if (pFrame && pFrame.indexOf(':') === -1) {
      pFrame = ':' + pFrame; // Hack...
    }
    var tData = this.callMapped('GetTargetAndData', pFrame, tCurrentTarget);
    if (tData.label !== '') {
      return tData.target.gotoLabel(tData.label); // TODO: Support bias?
    } else {
      return tData.target.gotoStep(tData.step + pSceneBias);
    }
  };

  mHandlers.SetVariable = function(pName, pValue) {
    if (!/:/.test(pName)) {
      pName = ':' + pName;
    }
    var tData = this.callMapped('GetTargetAndData', pName);
    tData.target.variables[tData.label] = pValue;
  };

  mHandlers.GetVariable = function(pName) {
    if (!/:/.test(pName)) {
      pName = ':' + pName;
    }
    var tData = this.callMapped('GetTargetAndData', pName);
    return tData.target.variables[tData.label];
  };

  mHandlers.FSCommand2 = function(pName, pArgs) {
    console.debug('FSCommand2', pName, pArgs);
    return 0;
  };

  mHandlers.GetProperty = function(pName, pProperty) {
    return '';
  };

  mHandlers.SetProperty = function(pName, pProperty, pValue) {

  };

  mHandlers.CloneSprite = function(pTarget, pDepth, pName) {

  };

  mHandlers.RemoveSprite = function(pName) {

  };

}(this));