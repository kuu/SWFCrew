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

  function createLoaderWrapper(pActionScriptLoader, pActionScriptProgram, pScripts, pSWFVersion) {
    var tId = pActionScriptLoader.load(
      pActionScriptProgram,
      pScripts,
      {
        version: pSWFVersion
      }
    );

    return function() {
      pActionScriptProgram.run(tId, this);
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
    var tActorsToAdd = [];

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

        tActorsToAdd.push([tPastChildActor, tLayer]);
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

    tActorsToAdd.sort(function(a, b) {
      if (b[1] >= a[1]) {
        return -1;
      } else {
        return 1;
      }
    });

    for (i = 0, il = tActorsToAdd.length; i < il; i++) {
      pActor.addActor(tActorsToAdd[i][0], tActorsToAdd[i][1]);
    }

    tActorsToAdd.length = 0;

    for (i = 0, il = tFutureChildren.length; i < il; i++) {
      var tFutureChild = tFutureChildren[i];

      if (tFutureChild.isNonTimeline === true) {
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

  function SpriteActor(pPlayer) {
    this.base(pPlayer);

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

    this.addProp(new this.propClass(pPlayer.backingContainer));
  }
  theatre.inherit(SpriteActor, mSWFCrew.DisplayListActor);

  /**
   * Handles SWF Sprites.
   * @param {quickswf.Sprite} pSprite The Sprite to handle.
   */
  mHandlers['DefineSprite'] = function(pSprite) {
    var tDictionaryToActorMap = this.actorMap;
    var tActions = mSWFCrew.actions;
    var tSpriteActor = tDictionaryToActorMap[pSprite.id] = function BuiltinSpriteActor(pPlayer) {
      this.base(pPlayer);
    };
    theatre.inherit(tSpriteActor, SpriteActor);

    tSpriteActor.prototype.labels = pSprite.frameLabels;

    switch (this.options.spriteType) {
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
          tStepScripts[i].push(createLoaderWrapper(this.actionScriptLoader, this.actionScriptProgram, tData.script, this.swf.version));
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

        tStepData[i].push((function(pAction, pData) {
          return function() {
            // this is in this case is the Sprite instance.
            pAction(this, pData);
          };
        })(tActions[tType], tConvertedData));
      }
    }
  };

}(this));
