/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var mSWFCrew = theatre.crews.swf;
  var STATE_SCRIPTING = theatre.Stage.STATE_SCRIPTING;

  /**
   * @class
   * @extends {theatre.crews.swf.actors.DisplayListActor}
   */
  var SpriteActor = (function(pSuper) {

    /**
     * This will apply the timeline cache that was
     * saved in the endStep handler.
     *
     * @param  {theatre.Actor} pActor The Actor to apply cache to.
     * @param  {number} pCurrentStep The current step to apply.
     */
    function applyTimelineCache(pActor, pCurrentStep, pDelta) {
      var i, il;
      var tActorsInStepMap = pActor.actorsInStepMap[pCurrentStep];
      var tLayerString, tLayer;
      var tCurrentChildren = pActor.getActors();
      var tCachedChild, tCurrentChild;
      var tCachedChildActor, tCurrentChildActor;

      var tNewChildren = [];
      var tActorsToAdd = [];

      for (tLayerString in tActorsInStepMap) {
        if (!tActorsInStepMap.hasOwnProperty(tLayerString)) {
          continue;
        }

        tLayer = parseInt(tLayerString, 10);

        tCachedChild = tActorsInStepMap[tLayerString];
        tCachedChildActor = tCachedChild.actor;

        if (tCurrentChildren.indexOf(tCachedChildActor) === -1) {
          if ((tCurrentChild = pActor.getActorAtLayer(tLayer)) !== null) {
            tCurrentChild.leave();
          }

          tActorsToAdd.push([tCachedChildActor, tLayer]);
        }

        if (tCachedChildActor.isMatrixLocked === false) {
          tCachedChildActor.matrix = tCachedChild.matrix.clone();
        }

        tCachedChildActor.colorTransform = tCachedChild.colorTransform;
        tCachedChildActor.clipDepth = tCachedChild.clipDepth;
        tCachedChildActor.ratio = tCachedChild.ratio;

        tCachedChildActor.invalidate();

        tNewChildren.push(tCachedChildActor);
      }

      tActorsToAdd.sort(function(a, b) {
        if (b[1] >= a[1]) {
          return -1;
        } else {
          return 1;
        }
      });

      for (i = 0, il = tActorsToAdd.length; i < il; i++) {
        /*if (tActorsToAdd[i][0].stage === null) {
          tCachedChildActor = tActorsToAdd[i][0];
          tCurrentChildActor = pActor.player.newFromId(tCachedChildActor.displayListId);
          tCurrentChildActor.name = tCachedChildActor.name;
          tCurrentChildActor.matrix = tCachedChildActor.matrix;
          tCurrentChildActor.colorTransform = tCachedChildActor.colorTransform;
          tCurrentChildActor.clipDepth = tCachedChildActor.clipDepth;
          tCurrentChildActor.ratio = tCachedChildActor.ratio;
          pActor.addActor(tCurrentChildActor, tActorsToAdd[i][1]);
        } else {
          pActor.addActor(tActorsToAdd[i][0], tActorsToAdd[i][1]);
        }*/
        pActor.addActor(tActorsToAdd[i][0], tActorsToAdd[i][1]);
      }

      tActorsToAdd.length = 0;

      for (i = 0, il = tCurrentChildren.length; i < il; i++) {
        tCurrentChild = tCurrentChildren[i];

        if (tCurrentChild.isNonTimeline === true) {
          continue;
        }

        if (tNewChildren.indexOf(tCurrentChild) === -1) {
          tCurrentChild.leave();
        }
      }
    }

    /**
     * @private
     * If we have some cache for this step, instead of
     * playing the entire step (which can be slow) apply
     * the cache from the previous time we did this step.
     */
    function onStartStep(pData) {
      var tCurrentStep = pData.currentStep;
      var tTargetStep = pData.targetStep;
      var tActorsInStepMap = this.actorsInStepMap[tCurrentStep];
      var tDelta = pData.delta;

      if (tActorsInStepMap !== void 0) {
        pData.stop();

        if (tCurrentStep === tTargetStep) {
          applyTimelineCache(this, tCurrentStep, tDelta);
        }
      } else if (tDelta !== 1 && tCurrentStep - 1 >= 0 && this.actorsInStepMap[tCurrentStep - 1] !== void 0) {
        applyTimelineCache(this, tCurrentStep - 1, tDelta);
      }
    }

    /**
     * This will cache the status of all Actors
     * currently belonging to this Actor so that
     * when we move around the timeline later
     * we can move very fast.
     * The downside is that this uses quite a bit
     * of memory.
     */
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
          ratio: tChild.ratio
        };
      }
    }

    function redirectScripts() {
      var tSelf = this;
      var tStep = this.getCurrentStep();
      var tParent = this.parent;
      var tParentCurrentStep = tParent.getCurrentStep();
      this.scheduleScripts = pSuper.prototype.scheduleScripts;

      if (tParent === null) {
        console.warn('null parent in script redirect!');
        return;
      }

      var tNumOfScripts = tParent.getData('numOfScripts_' + tParentCurrentStep);

      if (tNumOfScripts === void 0) {
        tNumOfScripts = tParent.getNumberOfScripts(tParentCurrentStep);
        tParent.setData('numOfScripts_' + tParentCurrentStep, tNumOfScripts);
      }

      tParent.addScript(tParentCurrentStep, function() {
        if (tSelf.parent !== null) {
          tSelf.doScripts(tStep);
        }
        return false;
      }, tNumOfScripts);
    }

    function onEnter() {

      if (this.stage.state === STATE_SCRIPTING) {
        this.scheduleScripts();
      } else {
        this.scheduleScripts = redirectScripts;
      }
      this.start();
    }

    /**
     * When we leave the stage, remove all children.
     * Also destroy our own cache.
     * @param  {object} pData
     */
    function onLeave(pData) {
      var tChildren = this.getActors();
      var i, il;

      for (i = 0, il = tChildren.length; i < il; i++) {
        tChildren[i].leave();
      }

      this.stop();

      // Reset these.
      this.variables = {};
      this.accessors = {};
      this.isMatrixLocked = false;
      this.isVisible = true;

      this.setStep(0);
    }


    function SpriteActor(pPlayer) {
      pSuper.call(this, pPlayer);

      this.on('enter', onEnter);

      // When a step starts, check to see if
      // we should use the cached version or not.
      this.on('startstep', onStartStep);

      // Cache our results after executing a step.
      this.on('endstep', onEndStep);

      // Remove all children permamently, even from cache when we leave.
      this.on('leave', onLeave);

      var i, il, k, kl, tScripts;
      var tData = this.stepData;
      var tTotalLength = Math.max(tData.length, this.stepScripts.length);

      // Need to forceable set the scene length as
      // it's possible to have empty steps to the end of the scene.
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
        this.setLabel(tName, tLabels[tName]);
      }
    }

    SpriteActor.prototype = Object.create(pSuper.prototype);
    SpriteActor.prototype.constructor = SpriteActor;

    /**
     * Returns all the variables in this movie clip.
     * @return {Object} An object containing all variable names and values.
     */
    SpriteActor.prototype.getAllVariables = function () {
      var tAccessors = this.accessors,
          tVariables = this.variables,
          tKeyValueList = {}, k, tGetter;

      for (k in tAccessors) {
        var v;
        tGetter = tAccessors[k].getter;
        if (typeof tGetter === 'function') {
          v = tGetter();
        }
        tKeyValueList[k] = v;
      }

      for (k in tVariables) {
        tKeyValueList[k] = tVariables[k];
      }

      return tKeyValueList;
    };

    return SpriteActor;
  })(mSWFCrew.actors.DisplayListActor);

  mSWFCrew.actors.SpriteActor = SpriteActor;

}(this));
