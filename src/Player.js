/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre,
      swfcrew = theatre.crews.swf;

  swfcrew.Player = Player;

  function Player(pLoader, pStage) {
    var tStage = pStage || new theatre.Stage();

    this.stage = tStage;
    this.loader = pLoader;
    this.backingContainer = null;
    this.compositor = null;
    this.root = null;

    this.media = pLoader.media;

    this.actionScriptLoader = pLoader.actionScriptLoader;
    this.actionScriptProgram = pLoader.actionScriptProgram;

    tStage.spriteInstanceCounter = 0;
    tStage.notSpriteInstanceCounter = 0;

    theatre.crews.dom.enableKeyInput(tStage);
    theatre.crews.dom.enableMotionInput(tStage);
  }

  Player.prototype.takeCentreStage = function(pAttachTo) {
    var tStage = this.stage;
    var tLoader = this.loader;

    this.backingContainer = pAttachTo;

    tStage.stepRate = 1000 / tLoader.swf.frameRate;

    var tCompositor = this.compositor = this.newCompositor();

    tStage.addActor(tCompositor, 0);

    var tRoot = this.root = this.newRoot();

    tCompositor.addActor(tRoot, 0);

    tStage.open();

    tCompositor.invalidate();
  };

  Player.prototype.newCompositor = function() {
    var tCompositor = new swfcrew.actors.Compositor(this.loader.swf, this.backingContainer, this.loader.options);
    tCompositor.name = '__compositor__';
    tCompositor.player = this;

    return tCompositor;
  };

  Player.prototype.newRoot = function() {
    var tRoot = new this.loader.actorMap[0].clazz(this);
    tRoot.name = 'root';
    tRoot.__isRoot = true;

    return tRoot;
  };

  Player.prototype.newFromId = function(pId) {
    var tActorMap = this.loader.actorMap[pId];
    if (tActorMap.singleton && tActorMap.initialized) {
      return null;
    }
    var tClass = tActorMap.clazz;
    if (tClass === void 0) {
      return null;
    }

    var tActor = new tClass(this);

    return tActor;
  };

  Player.prototype.newFromName = function(pName) {
    var tClass = this.loader.actorNameMap[pName];
    if (tClass === void 0) {
      return null;
    }

    var tActor = new tClass(this);

    return tActor;
  };

}(this));
