/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;

  var mSWFCrew = theatre.crews.swf;
  var mHandlers = mSWFCrew.handlers;
  var executeScripts = theatre.Actor.executeScripts;

  theatre.define('actors.SpriteActor', SpriteActor, mSWFCrew);

  function createLoaderWrapper(pStage, pScripts, pSWFVersion) {
    var tId = pStage.actionScriptLoader.load(
      pStage.actionScriptProgram,
      pScripts,
      {
        version: pSWFVersion
      }
    );

    return function() {
      pStage.actionScriptProgram.run(tId, this);
    }
  }

  function applyTimelineCache(pActor, pCurrentStep) {
    var i, il;
    var tActorsInStepMap = pActor.actorsInStepMap[pCurrentStep];
    var tLayerString, tLayer;
    var tFutureChildren = pActor.getActors();
    var tPastChild, tFutureChild;
    var tPastChildActor;

    var tNewChildren = [];

    for (tLayerString in tActorsInStepMap) {
      if (!tActorsInStepMap.hasOwnProperty(tLayerString)) {
        continue;
      }

      tLayer = parseInt(tLayerString, 10);

      tPastChild = tActorsInStepMap[tLayer];
      tPastChildActor = tPastChild.actor;

      if (tFutureChildren.indexOf(tPastChildActor) === -1) {
        if ((tFutureChild = pActor.getActorAtLayer(tLayer)) !== null) {
          tFutureChild.leave();
        }

        tPastChildActor._currentScene.currentStep = tPastChild.step;
        tPastChildActor._currentScene.previousStep = tPastChild.step - 1;
        pActor.addActor(tPastChildActor, tLayer, false);
      }

      if (tPastChildActor.isMatrixLocked === false) {
        tPastChildActor.matrix = tPastChild.matrix;
      }
      tPastChildActor.colorTransform = tPastChild.colorTransform;
      tPastChildActor.clipDepth = tPastChild.clipDepth;
      tPastChildActor.ratio = tPastChild.ratio;

      tPastChildActor.invalidate();

      tNewChildren.push(tPastChildActor);
    }

    for (i = 0, il = tFutureChildren.length; i < il; i++) {
      var tFutureChild = tFutureChildren[i];

      if (tFutureChildren.isNonTimeline === true) {
        continue;
      }

      if (tNewChildren.indexOf(tFutureChild) === -1) {
        tFutureChild.leave();
      }
    }
  }

  /**
   * @private
   */
  function onStartStep(pData) {
    var tCurrentStep = pData.currentStep;
    var tTargetStep = pData.targetStep;
    var tActorsInStepMap = this.actorsInStepMap[tCurrentStep];

    if (tActorsInStepMap !== void 0) {
      pData.stop();

      if (tCurrentStep === tTargetStep) {
        applyTimelineCache(this, tCurrentStep);
      }
    } else if (pData.delta !== 1 && tCurrentStep - 1 >= 0 && this.actorsInStepMap[tCurrentStep - 1] !== void 0) {
      applyTimelineCache(this, tCurrentStep - 1);
    }
  }

  function onEndStep(pData) {
    var tCurrentStep = pData.currentStep;
    var tChildren = this.getActors();
    var tActorsInStepMap = this.actorsInStepMap[tCurrentStep] = {};
    var tChild;
    var i, il;

    for (i = 0, il = tChildren.length; i < il; i++) {
      tChild = tChildren[i];

      if (tChild.isNonTimeline === true) {
        continue;
      }

      tActorsInStepMap[tChild.layer + ''] = {
        actor: tChild,
        matrix: tChild.matrix.clone(),
        colorTransform: tChild.colorTransform ? tChild.colorTransform.clone() : null,
        clipDepth: tChild.clipDepth,
        ratio: tChild.ratio,
        step: tChild.currentStep
      };
    }
  }

  function SpriteActor() {
    this.base();

    this.on('startstep', onStartStep);
    this.on('endstep', onEndStep);

    var i, il, k, kl, tScripts;
    var tData = this.stepData;
    var tTotalLength = Math.max(tData.length, this.stepScripts.length);

    this.setSceneLength(tTotalLength);

    var tActorsInStepMap = this.actorsInStepMap = new Array(tTotalLength);

    for (i = 0, il = tData.length; i < il; i++) {
      tScripts = tData[i];
      for (k = 0, kl = tScripts.length; k < kl; k++) {
        if (tScripts[k] === void 0) {
          continue;
        }
        this.addPreparationScript(i, tScripts[k]);
      }
    }

    tData = this.stepScripts;
    for (i = 0, il = tData.length; i < il; i++) {
      tScripts = tData[i];
      for (k = 0, kl = tScripts.length; k < kl; k++) {
        if (tScripts[k] === void 0) {
          continue;
        }
        this.addScript(i, tScripts[k]);
      }
    }

    var tLabels = this.labels;
    for (var tName in tLabels) {
      this.setLabelInScene('', tName, tLabels[tName]);
    }

    this.addProp(new this.propClass(this.backingContainer));
  }
  theatre.inherit(SpriteActor, mSWFCrew.DisplayListActor);

  /**
   * Handles SWF Sprites.
   * The 1 is the displayList code for sprites in QuickSWF.
   * @param {quickswf.SWF} pSWF The SWF file.
   * @param {Object} pParams An object containing a dictionary-actor map object.
   * @param {quickswf.Sprite} pSprite The Sprite to handle.
   * @param {Object} pOptions Options to customize things.
   */
  mHandlers['DefineSprite'] = function(pSWF, pStage, pParams, pSprite, pOptions) {
    var tDictionaryToActorMap = pParams.dictionaryToActorMap;
    var tActions = mSWFCrew.actions;
    var tSpriteActor = tDictionaryToActorMap[pSprite.id] = function BuiltinSpriteActor() {
      this.base();
    };
    theatre.inherit(tSpriteActor, SpriteActor);

    tSpriteActor.prototype.labels = pSprite.frameLabels;

    switch (pOptions.spriteType) {
      case 'dom':
        tSpriteActor.prototype.propClass = theatre.crews.dom.DOMProp;
        break;
      case 'webgl':
        tSpriteActor.prototype.propClass = mSWFCrew.props.WebGLSpriteProp;
        break;
      case 'canvas':
      default:
        tSpriteActor.prototype.propClass = mSWFCrew.props.CanvasSpriteProp;
        break;
    }

    tSpriteActor.prototype.backingContainer = pStage.backingContainer;

    var tStepData = tSpriteActor.prototype.stepData = new Array();
    var tStepScripts = tSpriteActor.prototype.stepScripts = new Array();
    var tFrames = pSprite.frames;

    for (var i = 0, il = tFrames.length; i < il; i++) {
      var tFrame = tFrames[i];
      tStepData[i] = new Array();
      tStepScripts[i] = new Array();

      if (tFrame === void 0) {
        continue;
      }

      for (var k = 0, kl = tFrame.length; k < kl; k++) {
        var tData = tFrame[k];
        var tType = tData.type;

        if (tType === 'script') {
          tStepScripts[i].push(createLoaderWrapper(pStage, tData.script, pSWF.version));
          continue;
        }

        if (!(tType in tActions)) {
          continue;
        }

        var tConvertedData = {};

        // TODO: Need to convert more stuff?
        // Need to be careful. This gets fed directly in to addActor()
        for (var l in tData) {
          switch (l) {
            case 'depth':
              tConvertedData.layer = tData[l];
              break;
            default:
              tConvertedData[l] = tData[l];
          }
        }

        tStepData[i].push((function(pAction, pParams, pData) {
          return function() {
            // this is in this case is the Sprite instance.
            pAction(this, pParams, pData);
          };
        })(tActions[tType], pParams, tConvertedData));
      }
    }
  };

}(this));
