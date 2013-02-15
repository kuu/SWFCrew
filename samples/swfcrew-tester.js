(function(global) {

  var theatre = global.theatre;
  var quickswf = global.quickswf;
  var document = global.document;

  var mApp = global.app = {
    mode: 'none',
    data: null,
    player: null,
    play: true,
    targets: [],
    flash: null,
    mediaLoader : new quickswf.utils.MediaLoader()
  };

  function $(pId, pContext) {
    return (pContext ? pContext : document).getElementById(pId);
  }

  var mLastFPSTime = -1;
  var mLastSPSTime = -1;

  var mStage;

  var mTools;
  var mContainer;
  var mFileInput;
  var mUrlButton;
  var mUrlInput;
  var mFlashPlayerCheck;
  var mLoadButton;
  var mPlayStopButton;
  var mResetButton;
  var mSPSDefaultCheckbox;
  var mSPSInput;
  var mSPSView;
  var mSPSActualView;
  var mFPSView;
  var mTargetEnabled;
  var mTargetInput;
  var mTargetList;
  var mTargetTrackButton;
  var mTargetTemplate;

  document.addEventListener('DOMContentLoaded', onLoad, false);

  function collectElements() {
    mTools = $('tools');
    mContainer = $('container');

    mFileInput = $('file-input');
    mUrlButton = $('url-button');
    mUrlInput = $('url-input');

    mFlashPlayerCheck = $('flash-player-check');

    mLoadButton = $('load-button');


    mPlayStopButton = $('playstop-button');
    mResetButton = $('reset-button');


    mSPSDefaultCheckbox = $('sps-default-checkbox');
    mSPSInput = $('sps-input');
    mSPSView = $('sps-view');
    mSPSActualView = $('sps-actual-view');

    mFPSView = $('fps-view');

    mTargetEnabled = $('target-enabled');
    mTargetInput = $('target-input');
    mTargetList = $('target-list');

    mTargetTrackButton = $('target-track-button');
    mTargetTemplate = $('target-template');
  }

  function cancel(e) {
    e.stopPropagation();
  }

  function onLoad() {
    collectElements();

    mTools.addEventListener('keydown', cancel, false);
    mTools.addEventListener('keyup', cancel, false);
    mTools.addEventListener('keypress', cancel, false);
    mTools.addEventListener('click', cancel, false);
    //mTools.addEventListener('mousedown', cancel, false);
    mTools.addEventListener('mousemove', cancel, false);
    mTools.addEventListener('mouseup', cancel, false);

    mFileInput.addEventListener('change', onFileChange, false);
    mUrlButton.addEventListener('click', onUrlSelect, false);

    mLoadButton.addEventListener('click', onLoadClick, false);

    mPlayStopButton.addEventListener('click', onPlayStopClick, false);
    mResetButton.addEventListener('click', onResetClick, false);
    mSPSDefaultCheckbox.addEventListener('change', onSPSDefaultChange, false);
    mSPSInput.addEventListener('change', onSPSInputChange, false);

    mTargetTrackButton.addEventListener('click', onTrackClick, false);
  }

  function onTrackClick() {
    if (!mTargetEnabled.checked) {
      return;
    }

    var tTargetPath = mTargetInput.value;
    mApp.targets.push(new Target(tTargetPath));
  }

  function reset() {
    if (mStage) {
      mStage.close();
    }

    if (mApp.player && mApp.player.loader.swf) {
      mApp.player.loader.swf.destroy();
    }

    mContainer.innerHTML = '';

    mApp.player = null;
    mApp.data = null;
    mApp.root = null;
    mApp.flash = null;
  }

  function error(pError) {
    console.error(pError);

    reset();
    mContainer.classList.add('error');
    mContainer.innerHTML = pError;
  }

  function removeError() {
    mContainer.classList.remove('error');
    mContainer.innerHTML = '';
  }

  function setupLoader(pLoader) {
    pLoader.on('parsestart', function() {
      mApp.data = this.data;

      if (mFlashPlayerCheck.checked) {
        mApp.mediaLoader.load('', mApp.data, 'application/x-shockwave-flash');
        mApp.flash = mApp.mediaLoader.get('application', '');
        mContainer.insertBefore(mApp.flash, mContainer.firstChild);
      }

      console.time('Parse');
    });

    pLoader.on('parsecomplete', function() {
      console.timeEnd('Parse');

      var tSWF = this.swf;

      if (mApp.flash !== null) {
        mApp.flash.width = tSWF.width;
        mApp.flash.height = tSWF.height;
      }
    });

    pLoader.on('loadstart', function() {
      console.time('Convert');
    });

    pLoader.on('loadcomplete', function() {
      console.timeEnd('Convert');

      var tPlayer = mApp.player = new theatre.crews.swf.Player(this);
      mStage = tPlayer.stage;

      if (!mSPSDefaultCheckbox.checked) {
        mStage.stepRate = 1000 / parseInt(mSPSInput.value, 10);
      } else {
        mSPSInput.value = mSPSView.textContent = this.swf.frameRate;
      }

      tPlayer.takeCentreStage(mContainer);
      mContainer.getElementsByTagName('canvas')[0].id = 'canvas';

      mStage.on('leavestep', updateTargets);
      mStage.on('leavestep', updateSPS);

      updateTargets();
      updateFPS();
    });
  }

  function loadData(pData) {
    var tDataLoader = new theatre.crews.swf.DataLoader();
    setupLoader(tDataLoader);
    tDataLoader.load(pData);
  }

  function loadFile() {
    var tReader = new FileReader();
    var tFile = mFileInput.files[0];

    tReader.onload = function(pEvent) {
      var tData = new Uint8Array(pEvent.target.result);
      loadData(tData);
    };

    tReader.onerror = function(pEvent) {
      error(pEvent);
    }

    tReader.readAsArrayBuffer(tFile);
  }

  function loadUrl() {
    var tURLLoader = new theatre.crews.swf.URLLoader();
    setupLoader(tURLLoader);
    tURLLoader.load(mUrlInput.value);
  }

  function updateSPS() {
    var tNewTime = performance.now ? performance.now() : performance.webkitNow();

    if (mLastSPSTime !== -1) {
      var tDiff = ((1000 / (tNewTime - mLastSPSTime)) + .5) | 0;
      mSPSActualView.textContent = tDiff;
      if (tDiff < mApp.player.loader.swf.frameRate) {
        mSPSActualView.style.color = 'red';
      } else {
        mSPSActualView.style.color = 'black';
      }
    }

    mLastSPSTime = tNewTime;
  }

  function updateFPS() {
    if (!mStage) {
      return;
    }

    var tNewTime = performance.now ? performance.now() : performance.webkitNow();

    if (mLastFPSTime !== -1) {
      var tDiff = ((1000 / (tNewTime - mLastFPSTime)) + .5) | 0;
      mFPSView.textContent = tDiff;
      if (tDiff < mApp.player.loader.swf.frameRate) {
        mFPSView.style.color = 'red';
      } else {
        mFPSView.style.color = 'black';
      }
    }

    mLastFPSTime = tNewTime;

    mStage.schedule(updateFPS);
  }

  var mTagsToReplace = {
   '&': '&amp;',
   '<': '&lt;',
   '>': '&gt;'
  };

  function replaceTag(pTag) {
    return mTagsToReplace[pTag] || pTag;
  }

  function safeTagsReplace(pString) {
    return (pString + '').replace(/[&<>]/g, replaceTag);
  }

  /**
   * @constructor
   */
  function Target(pPath) {
    this.path = pPath;
    this.target = null;

    var tWindow = this.window = global.open('about:blank', pPath, 'width=210,height=500,menubar=0,location=0,resizable=1,scrollbars=1,status=0,toolbar=0,personalbar=0');

    var tContainer = mTargetTemplate.cloneNode(true);
    var tSelf = this;

    var tCSS = tWindow.document.createElement('link');
    tCSS.type = 'text/css';
    tCSS.rel = 'stylesheet';
    tCSS.href = 'swfcrew-tester.css';

    tWindow.document.head.appendChild(document.head.querySelector('link[type="text/css"]').cloneNode(true));

    tWindow.document.body.appendChild(tContainer);

    this.targetError = $('target-error', tWindow.document);
    this.targetInfo = $('target-info', tWindow.document);
    this.targetPlayStopButton = $('target-playstop-button', tWindow.document);
    this.targetNameView = $('target-name-view', tWindow.document);
    this.targetLayerView = $('target-layer-view', tWindow.document);
    this.targetParentNameView = $('target-parent-name-view', tWindow.document);
    this.targetCurrentStepView = $('target-currentstep-view', tWindow.document);
    this.targetMatrixView = $('target-matrix-view', tWindow.document);
    this.targetIsVisibleView = $('target-isvisible-view', tWindow.document);
    this.targetVariablesView = $('target-variables-view', tWindow.document);

    this.targetGotoInput = $('target-goto-input', tWindow.document);
    this.targetGotoButton = $('target-goto-button', tWindow.document);

    this.targetPlayStopButton.addEventListener('click', function() {
      tSelf.playStop();
    }, false);

    this.targetGotoButton.addEventListener('click', function() {
      tSelf.goto();
    }, false);

    this.update();

    tContainer.id = 'tools';
    tContainer.style.display = 'inherit';
  }

  Target.prototype.error = function(pError) {
    this.targetInfo.style.display = 'none';
    this.targetError.textContent = pError;
    this.targetError.style.display = 'inherit';
    this.target = null;
  };

  Target.prototype.update = function() {
    var tTargetPath = this.path;
    var tTarget = mApp.player.root;
    var tParent = tTarget;
    var tPart, tParts;
    var i, il, k, tIndex;
    var tVariables, tTargetVariables, tVariableNames;
    var tElement, tElementsToRemove, tChildren;

    if (!tTarget) {
      this.error('Target does not exist');
      return;
    }

    tParts = tTargetPath.split('/');

    for (i = 0, il = tParts.length; i < il; i++) {
      tPart = tParts[i];

      if (tPart === '') {
        continue;
      } else {
        tParent = tTarget;
        tTarget = tParent.getActorByName(tPart);

        if (tTarget === null) {
          this.error('Target does not exist');
          return;
        }
      }
    }

    this.target = tTarget;

    if (this.targetError.style.display !== 'none') {
      this.targetError.style.display = 'none';
      this.targetInfo.style.display = 'inherit';
    }

    this.targetPlayStopButton.textContent = tTarget.isActing ? 'Stop' : 'Play';

    this.targetNameView.textContent = tTarget.getName();
    this.targetLayerView.textContent = tTarget.layer;
    this.targetParentNameView.textContent = tTarget.parent ? tTarget.parent.getName() : 'NO PARENT';
    this.targetCurrentStepView.textContent = tTarget.getCurrentStep() + ' / ' + (tTarget.getNumberOfSteps() - 1);
    this.targetMatrixView.textContent = tTarget.matrix.toString();
    this.targetIsVisibleView.textContent = tTarget.isVisible ? 'Yes' : 'No';

    tTargetVariables = tTarget.variables;
    tVariableNames = Object.keys(tTargetVariables);

    tElementsToRemove = [];

    tChildren = this.targetVariablesView.children;

    for (i = 0, il = tChildren.length; i < il; i++) {
      tElement = tChildren[i];
      k = tElement.dataset.name;
      if ((tIndex = tVariableNames.indexOf(k)) !== -1) {
        if (tElement.dataset.value !== tTargetVariables[k]) {
          tElement.innerHTML = '<b>' + k + '</b><br/>' + safeTagsReplace(tElement.dataset.value = tTargetVariables[k]);
        }

        tVariableNames.splice(tIndex, 1);
      } else {
        tElementsToRemove.push(tElement);
      }
    }

    for (i = 0, il = tElementsToRemove.length; i < il; i++) {
      tElementsToRemove[i].parentNode.removeChild(tElementsToRemove[i]);
    }

    for (i = 0, il = tVariableNames.length; i < il; i++) {
      k = tVariableNames[i];
      tElement = this.window.document.createElement('p');
      tElement.classList.add('info');
      tElement.innerHTML = '<b>' + k + '</b><br/>' + safeTagsReplace(tTargetVariables[k]);
      tElement.dataset.name = k;
      tElement.dataset.value = tTargetVariables[k];
      this.targetVariablesView.appendChild(tElement);
    }
  };

  Target.prototype.playStop = function() {
    var tTarget = this.target;

    if (!tTarget) {
      return;
    }

    if (tTarget.isActing) {
      tTarget.stop();
    } else {
      tTarget.startNextStep();
    }
  };

  Target.prototype.goto = function() {
    var tStep = parseInt(this.targetGotoInput.value, 10);
    var tTarget = this.target;

    if (mStage.isOpen) {
      tTarget.goto(tStep);
    } else {
      mStage.open();
      tTarget.goto(tStep);
      tTarget.startNextStep();
      mStage.schedule(function() {
        this.close();
      });
    }
  };

  Target.prototype.close = function() {
    this.window.close();
  };

  function updateTargetList() {
    var tTargetPath = mTargetInput.value;
    var tTarget = mApp.player.root;
    var tParent = tTarget;
    var tPart, tParts;
    var i, il;
    var tVariables, tTargetVariables, tVariableNames;
    var tElement, tElementsToRemove, tChildren;

    if (!tTarget) {
      return false;
    }

    tParts = tTargetPath.split('/');

    for (i = 0, il = tParts.length; i < il; i++) {
      tPart = tParts[i];

      if (tPart === '') {
        continue;
      } else {
        tParent = tTarget;
        tTarget = tParent.getActorByName(tPart);

        if (tTarget === null) {
          tTarget = tParent;
          break;
        }
      }
    }

    var tPrefix = tParts.slice(0, i).join('/');

    var tActors = tTarget.getActors();
    var tList = mTargetList;
    var tOption;

    if (!tPrefix || tPrefix[tPrefix.length - 1] !== '/') {
      tPrefix = tPrefix + '/';
    }

    tList.innerHTML = '';

    for (var i = 0, il = tActors.length; i < il; i++) {
      tOption = document.createElement('option');
      tOption.value = tPrefix + tActors[i].getName();
      tList.appendChild(tOption);
    }
  }

  function updateTargets() {
    var tTargets = mApp.targets;

    if (!mTargetEnabled.checked) {
      return;
    }

    updateTargetList();

    for (i = 0, il = tTargets.length; i < il; i++) {
      tTargets[i].update();
    }
  }

  function onFileChange() {
    mUrlInput.disabled = true;
    mUrlInput.value = mFileInput.files[0].name;
    mApp.mode = 'file';
  }

  function onUrlSelect() {
    mUrlInput.disabled = false;
    mUrlInput.value = '';
    mApp.mode = 'url';
  }

  function onLoadClick() {
    if (mApp.mode === 'none') {
      error('Please choose a file to play');
    } else {
      removeError();
      reset();

      if (mApp.mode === 'file') {
        loadFile();
      } else if (mApp.mode === 'url') {
        loadUrl();
      } else {
        error('Invalid mode ' + mApp.mode);
      }
    }
  }

  function onPlayStopClick() {
    var tPlay = mApp.play = !(mApp.play ^ false);

    mPlayStopButton.textContent = tPlay ? 'Stop' : 'Play';

    if (!mStage) {
      return
    }

    if (tPlay) {
      mStage.open();
    } else {
      mStage.close();
    }
  }

  function onResetClick() {
    if (!mApp.data) {
      error('Load a file first');
      return
    }

    var tData = mApp.data;

    reset();

    loadData(tData);
  }

  function onSPSDefaultChange() {
    if (mSPSDefaultCheckbox.checked) {
      mSPSInput.disabled = true;
      mSPSView.textContent = mApp.player ? mApp.player.loader.swf.frameRate : 'Default';

      if (!mStage) {
        return;
      }

      mStage.stepRate = 1000 / mApp.player.loader.swf.frameRate;
    } else {
      mSPSInput.disabled = false;
      mSPSView.textContent = mSPSInput.value;

      if (!mStage) {
        return;
      }

      mStage.stepRate = 1000 / parseInt(mSPSInput.value, 10);
    }
  }

  function onSPSInputChange() {
    mSPSView.textContent = mSPSInput.value;

    if (!mStage) {
      return;
    }

    mStage.stepRate = 1000 / parseInt(mSPSInput.value, 10);
  }

}(this));
