/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var AtoJ = global.AtoJ;

  var mSWFCrew = theatre.crews.swf;
  var mHandlers = mSWFCrew.handlers = mSWFCrew.handlers || new Array();

  /**
   * When a scene seeks backwards for a Sprite, we call this.
   * @private
   */
  function onReverseStep() {
    var tChildren = this.getActors();
    for (var i = 0, il = tChildren.length; i < il; i++) {
      tChildren[i].leave();
    }
  }

  function SpriteActor() {
    this.base();
    this.variables = {};
    this.colorTransform = null;
    this.clipDepth = 0;

    this.on('reversestep', onReverseStep);

    var i, il, k, kl, tScripts;
    var tData = this.stepData;
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
  theatre.inherit(SpriteActor, theatre.Actor);

  var mFunctionMap = {
    setTarget: {
      type: 'call',
      value: {
        type: 'raw',
        value: 'theatre.crews.swf.setTarget'
      }
    },
    nextFrame: {
      type: 'raw',
      value: 'tTarget.gotoStep(tTarget.currentStep + 1);'
    },
    previousFrame: {
      type: 'raw',
      value: 'tTarget.gotoStep(tTarget.currentStep - 1);'
    },
    play: {
      type: 'raw',
      value: 'tTarget.startActing();'
    },
    stop: {
      type: 'raw',
      value: 'tTarget.stopActing();'
    },
    gotoFrame: {
      type: 'call',
      value: {
        type: 'raw',
        value: 'theatre.crews.swf.gotoFrame'
      }
    },
    gotoLabel: {
      type: 'call',
      value: {
        type: 'raw',
        value: 'theatre.crews.swf.gotoLabel'
      }
    },
    trace: {
      type: 'call',
      value: {
        type: 'raw',
        value: 'theatre.crews.swf.trace'
      }
    },
    call: {
      type: 'call',
      value: {
        type: 'raw',
        value: 'theatre.crews.swf.call'
      }
    },
    gotoFrameOrLabel: {
      type: 'call',
      value: {
        type: 'raw',
        value: 'theatre.crews.swf.gotoFrameOrLabel'
      }
    },
    setVariable: {
      type: 'call',
      value: {
        type: 'raw',
        value: 'theatre.crews.swf.setVariable'
      }
    },
    getVariable: {
      type: 'call',
      value: {
        type: 'raw',
        value: 'theatre.crews.swf.getVariable'
      }
    },
    fscommand2: {
      type: 'call',
      value: {
        type: 'raw',
        value: 'theatre.crews.swf.fscommand2'
      }
    },
    getProperty: {
      type: 'call',
      value: {
        type: 'raw',
        value: 'theatre.crews.swf.getProperty'
      }
    },
    setProperty: {
      type: 'call',
      value: {
        type: 'raw',
        value: 'theatre.crews.swf.setProperty'
      }
    },
    cloneSprite: {
      type: 'call',
      value: {
        type: 'raw',
        value: 'theatre.crews.swf.cloneSprite'
      }
    },
    removeSprite: {
      type: 'call',
      value: {
        type: 'raw',
        value: 'theatre.crews.swf.removeSprite'
      }
    }
  };

  /**
   * Handles SWF Sprites.
   * The 1 is the displayList code for sprites in QuickSWF.
   * @param {quickswf.SWF} pSWF The SWF file.
   * @param {Object.<String, theatre.Actor>} pDictionaryToActorMap A map holding mappings for dictionary objects to Actor classes.
   * @param {quickswf.Sprite} pSprite The Sprite to handle.
   * @param {Object} pOptions Options to customize things.
   */
  mHandlers[1] = function(pSWF, pStage, pDictionaryToActorMap, pSprite, pOptions) {
    var tActions = mSWFCrew.actions;
    var tSpriteActor = pDictionaryToActorMap[pSprite.id] = function BuiltinSpriteActor() {
      this.base();
    };
    theatre.inherit(tSpriteActor, SpriteActor);

    tSpriteActor.prototype.labels = pSprite.frameLabels;

    switch (pOptions.spriteType) {
      case 'dom':
        tSpriteActor.prototype.propClass = theatre.crews.dom.DOMProp;
        break;
      case 'canvas':
      default:
        tSpriteActor.prototype.propClass = mSWFCrew.props.CanvasSpriteProp;
        break;
    }

    tSpriteActor.prototype.backingContainer = pStage.backingContainer;

    var tStepData = tSpriteActor.prototype.stepData = new Array();
    var tStepScripts = tSpriteActor.prototype.stepScripts = new Array();

    for (var i = 0, il = pSprite.frames.length; i < il; i++) {
      var tFrame = pSprite.frames[i];
      tStepData[i] = new Array();
      tStepScripts[i] = new Array();

      if (tFrame === void 0) {
        continue;
      }

      for (var k = 0, kl = tFrame.length; k < kl; k++) {
        var tData = tFrame[k];
        var tType = tData.type;

        if (tType === 'script') {
          tStepScripts[i].push(AtoJ.compileActionScript2(tData.script, mFunctionMap, pSWF.version));
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

        tStepData[i].push((function(pAction, pDictionaryToActorMap, pData) {
          return function() {
            // this is in this case is the Sprite instance.
            pAction(this, pDictionaryToActorMap, pData);
          };
        })(tActions[tType], pDictionaryToActorMap, tConvertedData));
      }
    }
  };

}(this));
