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

    tStage.stageManager.addProp(tCompositor);

    // TODO: This is depending on the DOM... should fix it later...
    pAttachTo.appendChild(tCompositor.getSurface());

    var tRoot = this.root = this.newRoot();

    tStage.addActor(tRoot, 0);

    tStage.open();

    tStage.stageManager.invalidate();
  };

  Player.prototype.newCompositor = function() {
    return new swfcrew.props.Compositor(this);
  };

  Player.prototype.newRoot = function() {
    var tRoot = new this.loader.actorMap[0](this);
    tRoot.name = 'root';
    tRoot.__isRoot = true;

    return tRoot;
  };

  Player.prototype.newFromId = function(pId) {
    var tClass = this.loader.actorMap[pId];
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
