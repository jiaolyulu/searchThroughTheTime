Class(function DetailVideo({
    youtubeId = "hZK640cDj2s",
    aspectRatio = "16x9",
    altLabel
}) {
    Inherit(this, Element);
    Inherit(this, StateComponent);
    const _this = this;
    const $this = _this.element;
    var _videoPlayerCreated = false;
    var _videoFinished = false;
    var _initUIInteractable = true;
    var _playerVolume = { value: 50 };
    var _apiLoadRequestMade = false;

    var $container, $videoWrapper, $thumbnailWrapper, $thumbnail, $playButton, $playIcon, $playButtonBackground, $youtubeIframeContainer, $video, $caption;
    var _youtubePlayer;

    //*** Constructor
    (function () {
        initHTML();
        initStyles();
        addHandlers();
    })();

    function initHTML() {
        $container = $this.create('detail-video-container');
        $videoWrapper = $container.create('video-wrapper');
        $thumbnailWrapper = $videoWrapper.create('detail-video-thumbnail');
        $thumbnail = $thumbnailWrapper.create('thumbnail-img')
            .html(`<img class="detail-video-thumbnail" src="https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg" alt="${altLabel} ${DataModel.get('videoThumbnailAlt')}"></img>`);
        $playButton = $container.create('detail-video-play-button');
        $playButtonBackground = $playButton.create('detail-video-play-button-bg');
        $playIcon = $playButton.create('detail-video-play-icon').html(DetailVideo.PlayIcon);

        // let captionDescription = `${altLabel}`;
        $caption = $this.create('detail-video-caption').html(`<span>${altLabel}</span>`);
    }

    function initStyles() {
        _this.initClass(DetailVideoCSS, $this, aspectRatio);
    }

    function loadYouTubeAPI() {
        if (_apiLoadRequestMade) return;
        _apiLoadRequestMade = true;
        const src = "https://www.youtube.com/iframe_api";
        window.onYouTubeIframeAPIReady = function () {
            initYouTubePlayer();
        };
        let script = document.createElement('script');
        script.src = src;
        document.head.appendChild(script);
    }

    function initYouTubePlayer() {
        if (_videoPlayerCreated) return;
        $youtubeIframeContainer = $videoWrapper.create('detail-video-youtube-iframe-container');
        //hide container initially so we don't have to see the player being created;
        $youtubeIframeContainer.css({ opacity: 0 });
        $video = $youtubeIframeContainer.create('detail-video-youtube');
        $video.div.id = 'player';
        _youtubePlayer = new YT.Player('player', {
            videoId: youtubeId,
            playerVars: { 'autoplay': 1, 'modestbranding': 1, 'enablejsapi': 1 },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
        _videoPlayerCreated = true;
    }

    function onPlayerReady(e) {
        const iframe = document.querySelector('.detail-video-youtube');
        let allows = iframe.allow;
        allows += "; fullscreen";
        iframe.setAttribute('allow', allows);
        iframe.title = DataModel.get('youtubePlayerTitle');
        hideInitVideoUI();
        revealIframeContainer({ time: 800 });
        _this.delayedCall(() => {
            updateYouTubeIframeInteractionState({ state: true });
        }, 1100);
    }

    function onPlayerStateChange(e) {
        if (e.data === YT.PlayerState.ENDED && !_videoFinished) {
            stopVideo();
            _videoFinished = true;
            _this.delayedCall(_ => _initUIInteractable = true, 150);
        }

        // if (e.data === YT.PlayerState.PLAYING) GAEventTracker.captureEvent({ eventCategory: 'Deep Dive Video', eventAction: 'play video', eventLabel: 'playing ID' });

        _playerVolume.value = _youtubePlayer.getVolume();
    }

    function updateYouTubeIframeInteractionState({ state = false } = {}) {
        const iframe = document.querySelector('.detail-video-youtube');
        if (state) {
            iframe.classList.add('interactable');
        } else {
            iframe.classList.remove('interactable');
        }
    }

    function revealInitVideoUI({ immediate = false } = {}) {
        $thumbnailWrapper.classList().remove('hidden');
        $playButton.classList().remove('hidden');

        if (immediate) {
            $thumbnailWrapper.css({ opacity: 1.0 });
            $playButton.transform({ scale: 1.0 });
            return;
        }

        $thumbnailWrapper.tween({ opacity: 1 }, 800, 'linear');

        $playIcon.transform({ scale: 1.0 });
        $playButtonBackground.transform({ scale: 1.0 });
        $playButton.transform({ scale: 0.8 });
        $playButton.tween({
            scale: 1.0,
            opacity: 1
        }, 800, 'easeOutExpo');
    }

    function hideInitVideoUI({ immediate = false } = {}) {
        if (immediate) {
            $thumbnailWrapper.classList().add('hidden');
            $thumbnailWrapper.css({ opacity: 0 });

            $playButton.classList().add('hidden');
            $playButton.css({ opacity: 0 });

            return;
        }

        $thumbnailWrapper.tween({ opacity: 0 }, 900, 'linear', 500).onComplete(_ => {
            $thumbnailWrapper.classList().add('hidden');
        });

        $playButton.tween({ scale: 0 }, 800, 'easeInOutExpo').onComplete(_ => {
            $playButton.classList().add('hidden');
        });
    }

    function revealIframeContainer({ time, immediate = false } = {}) {
        if (immediate) {
            $youtubeIframeContainer.css({ opacity: 1.0 });
            return;
        }
        $youtubeIframeContainer.tween({ opacity: 1.0 }, time, 'linear', 1000);
    }

    function hideIframeContainer({ time, immediate = false } = {}) {
        if (immediate) {
            $youtubeIframeContainer.css({ opacity: 0.0 });
            return;
        }
        $youtubeIframeContainer.tween({ opacity: 1.0 }, time, 'linear');
    }

    function playVideo() {
        _videoFinished = false;
        _initUIInteractable = false;
        _youtubePlayer.playVideo();

        if (typeof (Analytics) !== 'undefined') {
            Analytics.captureEvent('PlayVideo', {
                event_category: 'play',
                event_label: youtubeId
            });
        }

        revealIframeContainer({ time: 800 });
        hideInitVideoUI();
        _playerVolume.value = _youtubePlayer.getVolume();
        _this.delayedCall(() => {
            updateYouTubeIframeInteractionState({ state: true });
        }, 1000);
    }

    function pauseVideo() {
        _youtubePlayer.pauseVideo();
    }

    //TODO: pause video -> reveal UI -> stop video
    function stopVideo() {
        _youtubePlayer.stopVideo();
        updateYouTubeIframeInteractionState({ state: false });
        hideIframeContainer({ time: 150 });
        revealInitVideoUI();
    }

    function onContentHide() {
        if (!_youtubePlayer || !window.YT) return;

        $thumbnailWrapper.classList().remove('hidden');
        $thumbnailWrapper.tween({ opacity: 1 }, 800, 'linear');
        hideIframeContainer({ time: 800 });
        tween(_playerVolume, { value: 0 }, 500, 'linear').onUpdate(() => {
            _youtubePlayer.setVolume(_playerVolume.value);
        }).onComplete(() => {
            _youtubePlayer.pauseVideo();
            revealInitVideoUI({ immediate: true });
            _youtubePlayer.stopVideo();
            _videoFinished = true;
            _initUIInteractable = true;
        });
    }

    //*** Event handlers
    function addHandlers() {
        _this.events.sub(DetailUIContent.STOPVIDEOS, onContentHide);
        $thumbnailWrapper.interact(hover, click, '#', DataModel.get('videoPlay'));
    }

    function hover(e) {
        if (!_initUIInteractable) return;
        $playButtonBackground.clearTween();
        switch (e.action) {
            case 'over': {
                $playButtonBackground.tween({ scale: 0.9, spring: 1.0, damping: 0.6 }, 1000, 'easeOutElastic');
                $playIcon.tween({ scale: 1.25 }, 800, 'easeOutExpo');
            }
                break;
            case 'out': {
                $playButtonBackground.tween({ scale: 1.0, spring: 1.0, damping: 0.6 }, 1000, 'easeOutElastic');
                $playIcon.tween({ scale: 1.0 }, 800, 'easeOutExpo');
            }
                break;
        }
    }

    function click(e) {
        if (window.YT) {
            if (!_videoPlayerCreated) {
                initYouTubePlayer();
            } else {
                if (!_initUIInteractable) return;
                playVideo();
            }
        } else {
            loadYouTubeAPI();
        }
    }

    //*** Public methods
    this.onDestroy = function () {
        if (_youtubePlayer) {
            _youtubePlayer.destroy();
        }
    };

    this.playVideo = playVideo;
    this.pauseVideo = pauseVideo;
    this.stopVideo = stopVideo;

    this.animateIn = function() {
        $this.css({ opacity: 0 });
        $this.transform({ y: 50 });

        $this.tween({ opacity: 1.0, y: 0 }, 1000, 'easeOutCubic');
    };

    this.animateOut = function() {
        $this.tween({ opacity: 0.0 }, 600, 'easeOutCubic');
    };
}, _ => {
    DetailVideo.PlayIcon = `
        <svg width="13" height="16" viewBox="0 0 13 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 8L2.54292e-07 16L9.53674e-07 -5.68248e-07L13 8Z" fill="white"/>
        </svg>
    `;
});
