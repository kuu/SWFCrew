(function(global) {

  var theatre = global.theatre;
  var quickswf = global.quickswf;
  var document = global.document;

  var mApp = global.app = {
    mode: 'none',
    parser: null,
    data: null,
    stage: null,
    play: true,
    target: null,
    root: null
  };

  function $(pId) {
    return document.getElementById(pId);
  }

  var mLastFPSTime = -1;
  var mLastSPSTime = -1;

  var mStage;
  var mParser;

  var mTools;
  var mContainer;
  var mFileInput;
  var mUrlButton;
  var mUrlInput;
  var mFlashPlayerCheck;
  var mLoadButton;
  var mPlayStopButton;
  var mResetButton;
  var mGotoInput;
  var mGotoButton;
  var mSPSDefaultCheckbox;
  var mSPSInput;
  var mSPSView;
  var mSPSActualView;
  var mFPSView;
  var mTargetEnabled;
  var mTargetInput;
  var mTargetList;
  var mTargetPlayStopButton;
  var mTargetNameView;
  var mTargetLayerView;
  var mTargetParentNameView;
  var mTargetCurrentStepView;
  var mTargetMatrixView;
  var mTargetIsVisibleView;
  var mTargetVariablesView;
  var mTargetInfo;
  var mTargetError;

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

    mGotoInput = $('goto-input');
    mGotoButton = $('goto-button');

    mSPSDefaultCheckbox = $('sps-default-checkbox');
    mSPSInput = $('sps-input');
    mSPSView = $('sps-view');
    mSPSActualView = $('sps-actual-view');

    mFPSView = $('fps-view');

    mTargetEnabled = $('target-enabled');
    mTargetInput = $('target-input');
    mTargetList = $('target-list');
    mTargetPlayStopButton = $('target-playstop-button');
    mTargetNameView = $('target-name-view');
    mTargetLayerView = $('target-layer-view');
    mTargetParentNameView = $('target-parent-name-view');
    mTargetCurrentStepView = $('target-currentstep-view');
    mTargetMatrixView = $('target-matrix-view');
    mTargetIsVisibleView = $('target-isvisible-view');
    mTargetVariablesView = $('target-variables-view');
    mTargetError = $('target-error');
    mTargetInfo = $('target-info');
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
    mGotoButton.addEventListener('click', onGotoClick, false);
    mSPSDefaultCheckbox.addEventListener('change', onSPSDefaultChange, false);
    mSPSInput.addEventListener('change', onSPSInputChange, false);

    mTargetPlayStopButton.addEventListener('click', onTargetPlayStopClick, false);
  }

  function reset() {
    if (mStage) {
      mStage.close();
    }

    if (mParser && mParser.swf) {
      mParser.swf.destroy();
    }

    mContainer.innerHTML = '';

    mApp.parser = null;
    mApp.stage = null;
    mApp.data = null;
    mApp.target = null;
    mApp.root = null;
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

  function loadData(pData) {
    var tFlash = null;

    mApp.data = pData;

    if (mFlashPlayerCheck.checked) {
      tFlash = quickswf.polyfills.createMedia(null, pData, 'application/x-shockwave-flash');
      mContainer.insertBefore(tFlash.data, mContainer.firstChild);
    }

    mParser = mApp.parser = new quickswf.Parser(pData);

    console.time('Parse');

    mParser.parse(
      function(pSWF) {
        console.timeEnd('Parse');

        var tCanvas = global.document.createElement('canvas');
        tCanvas.width = pSWF.width;
        tCanvas.height = pSWF.height;

        if (tFlash !== null) {
          tFlash.data.width = pSWF.width;
          tFlash.data.height = pSWF.height;
        }

        mContainer.appendChild(tCanvas);

        console.time('Convert');

        mStage = mApp.stage = theatre.crews.swf.create(pSWF, tCanvas, {
          spriteType: "canvas"
        });

        console.timeEnd('Convert');

        if (!mSPSDefaultCheckbox.checked) {
          mStage.stepRate = 1000 / parseInt(mSPSInput.value, 10);
        } else {
          mSPSInput.value = mSPSView.textContent = mParser.swf.frameRate;
        }

        mApp.root = mStage
                      .stageManager
                      .getActorByName('__compositor__')
                      .getActorByName('root');

        mStage.on('leavestep', updateTarget);
        mStage.on('leavestep', updateSPS);

        updateTarget();
        updateFPS();
      },
      function(pError) {
        error(pError);
      }
    );
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
    var tXhr = new XMLHttpRequest();
    tXhr.addEventListener('load', function() {
      var tData = new Uint8Array(this.response);
      loadData(tData);
    }, false);

    tXhr.addEventListener('error', function(e) {
      error(e);
    }, false);

    tXhr.open('GET', mUrlInput.value, true);
    tXhr.responseType = 'arraybuffer';
    tXhr.send(null);
  }

  function updateSPS() {
    var tNewTime = performance.now ? performance.now() : performance.webkitNow();

    if (mLastSPSTime !== -1) {
      var tDiff = ((1000 / (tNewTime - mLastSPSTime)) + .5) | 0;
      mSPSActualView.textContent = tDiff;
      if (tDiff < mParser.swf.frameRate) {
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
      if (tDiff < mParser.swf.frameRate) {
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

  function updateTargetList(pPrefix, pParent) {
    var tActors = pParent.getActors();
    var tList = mTargetList;
    var tOption;

    if (!pPrefix || pPrefix[pPrefix.length - 1] !== '/') {
      pPrefix = pPrefix + '/';
    }

    tList.innerHTML = '';

    for (var i = 0, il = tActors.length; i < il; i++) {
      tOption = document.createElement('option');
      tOption.value = pPrefix + tActors[i].name;
      tList.appendChild(tOption);
    }
  }

  function updateTarget() {
    if (!mTargetEnabled.checked) {
      return;
    }

    var tTargetPath = mTargetInput.value;
    var tTarget = mApp.root;
    var tParent = tTarget;
    var tPart, tParts;
    var i, il, k, tIndex;
    var tVariables, tTargetVariables, tVariableNames;
    var tScrollTop, tScrollLeft;
    var tElement, tElementsToRemove, tChildren;

    if (!tTarget) {
      targetError('Target does not exist');
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
          targetError('Target does not exist');
          updateTargetList(tParts.slice(0, i).join('/'), tParent);
          return false;
        }
      }
    }

    updateTargetList(tParts.slice(0, i).join('/'), tTarget);

    if (mTargetError.style.display !== 'none') {
      mTargetError.style.display = 'none';
      mTargetInfo.style.display = 'inherit';
    }

    mTargetPlayStopButton.textContent = tTarget.isActing ? 'Stop' : 'Play';

    mTargetNameView.textContent = tTarget.name;
    mTargetLayerView.textContent = tTarget.layer;
    mTargetParentNameView.textContent = tTarget.parent ? tTarget.parent.name : 'NO PARENT';
    mTargetCurrentStepView.textContent = tTarget.currentStep + ' / ' + tTarget.numberOfSteps;
    mTargetMatrixView.textContent = tTarget.matrix.toString();
    mTargetIsVisibleView.textContent = tTarget.isVisible ? 'Yes' : 'No';

    tTargetVariables = tTarget.variables;
    tVariableNames = Object.keys(tTargetVariables);

    tElementsToRemove = [];

    tChildren = mTargetVariablesView.children;

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
      tElement = document.createElement('p');
      tElement.classList.add('info');
      tElement.innerHTML = '<b>' + k + '</b><br/>' + safeTagsReplace(tTargetVariables[k]);
      tElement.dataset.name = k;
      tElement.dataset.value = tTargetVariables[k];
      mTargetVariablesView.appendChild(tElement);
    }

    mApp.target = tTarget;

    return true;
  }

  function targetError(pError) {
    mTargetInfo.style.display = 'none';
    mTargetError.textContent = pError;
    mTargetError.style.display = 'inherit';
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

  function onTargetPlayStopClick() {
    var tTarget = mApp.target;

    if (!tTarget) {
      return;
    }

    if (tTarget.isActing) {
      tTarget.stopActing();
    } else {
      tTarget.startActing(false);
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

  function onGotoClick() {
    if (!mStage) {
      error('Load a file first');
      return;
    }

    var tStep = parseInt(mGotoInput.value, 10);
    var tTarget = mApp.target;

    if (mStage.isOpen) {
      tTarget.gotoStep(tStep);
    } else {
      mStage.open();
      tTarget.gotoStep(tStep);
      tTarget.startActing(false);
      mStage.schedule(function() {
        this.close();
      });
    }
  }

  function onSPSDefaultChange() {
    if (mSPSDefaultCheckbox.checked) {
      mSPSInput.disabled = true;
      mSPSView.textContent = mParser ? mParser.swf.frameRate : 'Default';

      if (!mStage) {
        return;
      }

      mStage.stepRate = 1000 / mParser.swf.frameRate;
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