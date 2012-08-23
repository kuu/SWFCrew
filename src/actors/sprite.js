(function(global) {
  
  var theatre = global.theatre;

  var mActors = theatre.define('theatre.crews.swf.actors');
  var mSWFCrew = theatre.crews.swf;
  var mHandlers = mSWFCrew.handlers = mSWFCrew.handlers || new Array();


  /**
   * Initializer used for all types of sprites.
   * @private
   */
  function initializer(pOptions, pStage, pLayer, pParent, pName) {
    var tStepData = this.stepData;
    for (var i = 0, il = tStepData.length; i < il; i++) {
      var tScripts = tStepData[i];
      for (var k = 0, kl = tScripts.length; k < kl; k++) {
        this.addPreparationScript(i, tScripts[k]);
      }
    }

    if (this.spriteType === 'dom') {
      this.listen('enter', onDOMEnter);
    }

    this.listen('sceneloop', onSceneLooped);
  }

  /**
   * @private
   */
  function onDOMEnter() {
    this.ignore('enter', onDOMEnter);
    var tStyle = this.element.style;
    tStyle.position = 'absolute';
    tStyle.top = '0';
    tStyle.left = '0';
    tStyle.webkitTransformOrigin = '0 0';
  }

  /**
   * When a scene loops for a Sprite, we call this.
   * @private
   */
  function onSceneLooped() {
    var tChildren = this.getActors();
    for (var i = 0, il = tChildren.length; i < il; i++) {
      tChildren[i].leave();
    }
  }

  /**
   * @private
   */
  function canvasDraw(pContext) {
    if (this.parent.dispatchDraw === void 0) {
      pContext.clearRect(0, 0, pContext.canvas.width * 20, pContext.canvas.height * 20);
    }
  }

  var mGetDrawingCacheBackup = theatre.crews.canvas.CanvasActor.prototype.getDrawingCache;

  /**
   * @private
   */
  function getDrawingCacheOverload() {
    var tCache = mGetDrawingCacheBackup.call(this);
    if (tCache._swfAjusted !== true) {
      tCache.scale(1 / 20, 1 / 20);
      tCache._swfAjusted = true;
    }
    return tCache;
  }

  var mDOMActBackup = theatre.crews.dom.DOMActor.prototype.act;

  /**
   * @private
   */
  function domActOverload() {
    
  }

  /**
   * @private
   */
  function getClazz(pOptions) {
    if (pOptions && pOptions.spriteType) {
      switch (pOptions.spriteType) {
        case 'dom':
          return theatre.crews.dom.DOMActor;
        case 'canvas':
          return theatre.crews.canvas.CanvasActor;
        default:
          throw new Error('Sprite type of ' + pOptions.spriteType + ' is not supported.');
      }
    }

    return theatre.crews.canvas.CanvasActor;
  };

  /**
   * Handles SWF Sprites.
   * The 1 is the displayList code for sprites in QuickSWF.
   * @param {quickswf.SWF} pSWF The SWF file.
   * @param {Object.<String, theatre.Actor>} pDictionaryToActorMap A map holding mappings for dictionary objects to Actor classes.
   * @param {quickswf.Sprite} pSprite The Sprite to handle.
   * @param {Object} pOptions Options to customize things.
   */
  mHandlers[1] = function(pSWF, pDictionaryToActorMap, pSprite, pOptions) {
    var tActions = mSWFCrew.actions;
    var tSpriteActor = pDictionaryToActorMap[pSprite.id] = theatre.createActor(
      'Sprite_' + pSprite.id,
      getClazz(pOptions),
      initializer
    );
    
    var tProto = tSpriteActor.prototype;

    var tSpriteType = tProto.spriteType = pOptions.spriteType || 'canvas';

    if (tSpriteType === 'canvas') {
      tProto.draw = canvasDraw;
      tProto.getDrawingCache = getDrawingCacheOverload;
    }

    var tStepData = tProto.stepData = new Array();

    for (var i = 0, il = pSprite.frames.length; i < il; i++) {
      var tFrame = pSprite.frames[i];
      tStepData[i] = new Array();
      if (tFrame === void 0) continue;

      for (var k = 0, kl = tFrame.length; k < kl; k++) {
        var tData = tFrame[k];
        var tType = tData.type;
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
