(function () {

    'use strict';


    /* ======================================================
       CONFIG
    ====================================================== */

    var CONFIG = {

        apiUrl:
            'https://amazingvideoshub.github.io/app-video-data/videos.json',

        seekSeconds:
            10,

        controlsTimeout:
            2800,

        doubleTapDelay:
            300

    };


    /* ======================================================
       PAGE ELEMENTS
    ====================================================== */

    var pageLoading =
        document.getElementById('avPageLoading');

    var pageError =
        document.getElementById('avPageError');

    var pageErrorText =
        document.getElementById('avPageErrorText');

    var watchContent =
        document.getElementById('avWatchContent');


    var player =
        document.getElementById('avPlayer');

    var video =
        document.getElementById('avVideo');

    var bufferLoader =
        document.getElementById('avBufferLoader');


    var title =
        document.getElementById('avVideoTitle');

    var videoId =
        document.getElementById('avVideoId');


    /* ======================================================
       CONTROLS
    ====================================================== */

    var centerPlay =
        document.getElementById('avCenterPlay');

    var bottomPlay =
        document.getElementById('avBottomPlay');

    var centerBack =
        document.getElementById('avCenterBack');

    var centerForward =
        document.getElementById('avCenterForward');


    var tapLeft =
        document.getElementById('avTapLeft');

    var tapRight =
        document.getElementById('avTapRight');


    var feedbackLeft =
        document.getElementById('avSeekFeedbackLeft');

    var feedbackRight =
        document.getElementById('avSeekFeedbackRight');


    var progress =
        document.getElementById('avProgress');

    var playedBar =
        document.getElementById('avPlayedBar');

    var bufferedBar =
        document.getElementById('avBufferedBar');

    var progressHandle =
        document.getElementById('avProgressHandle');


    var currentTimeEl =
        document.getElementById('avCurrentTime');

    var durationEl =
        document.getElementById('avDuration');


    var muteBtn =
        document.getElementById('avMute');

    var volume =
        document.getElementById('avVolume');


    var speedBtn =
        document.getElementById('avSpeedBtn');

    var speedMenu =
        document.getElementById('avSpeedMenu');


    var pipBtn =
        document.getElementById('avPip');

    var fullscreenBtn =
        document.getElementById('avFullscreen');



    /* ======================================================
       STATE
    ====================================================== */

    var controlsTimer = null;

    var leftTapTimer = null;

    var rightTapTimer = null;

    var isDraggingProgress = false;



    /* ======================================================
       GET SLUG
    ====================================================== */

    function getSlug() {

        var params =
            new URLSearchParams(
                window.location.search
            );

        return String(
            params.get('slug') || ''
        ).trim();

    }



    /* ======================================================
       TIME FORMAT
    ====================================================== */

    function formatTime(seconds) {

        if (
            !Number.isFinite(seconds)
        ) {

            return '00:00';

        }


        seconds =
            Math.max(
                0,
                Math.floor(seconds)
            );


        var hours =
            Math.floor(
                seconds / 3600
            );


        var minutes =
            Math.floor(
                (seconds % 3600) / 60
            );


        var secs =
            seconds % 60;


        if (hours > 0) {

            return (
                String(hours)
                    .padStart(2, '0') +

                ':' +

                String(minutes)
                    .padStart(2, '0') +

                ':' +

                String(secs)
                    .padStart(2, '0')
            );

        }


        return (
            String(minutes)
                .padStart(2, '0') +

            ':' +

            String(secs)
                .padStart(2, '0')
        );

    }



    /* ======================================================
       ERROR
    ====================================================== */

    function showPageError(message) {

        pageLoading.style.display =
            'none';

        watchContent.style.display =
            'none';

        pageErrorText.textContent =
            message;

        pageError.style.display =
            'block';

    }



    /* ======================================================
       LOAD API VIDEO
    ====================================================== */

    async function loadVideoData() {

        var slug =
            getSlug();


        if (!slug) {

            showPageError(
                'No video was selected.'
            );

            return;

        }


        try {

            var response =
                await fetch(
                    CONFIG.apiUrl +
                    '?v=' +
                    Date.now(),
                    {
                        headers: {
                            'Accept':
                                'application/json'
                        }
                    }
                );


            if (!response.ok) {

                throw new Error(
                    'HTTP ' +
                    response.status
                );

            }


            var data =
                await response.json();


            if (
                !data ||
                data.success !== true ||
                !Array.isArray(
                    data.videos
                )
            ) {

                throw new Error(
                    'Invalid response'
                );

            }


            var selected =
                data.videos.find(
                    function (item) {

                        return (

                            item &&

                            String(
                                item.slug || ''
                            )
                            .toLowerCase()
                            .trim()

                            ===

                            slug
                            .toLowerCase()
                            .trim()

                            &&

                            item.active !== false

                        );

                    }
                );


            if (!selected) {

                showPageError(
                    'This video was not found or is unavailable.'
                );

                return;

            }


            if (!selected.video_url) {

                showPageError(
                    'The video source is unavailable.'
                );

                return;

            }


            prepareVideo(
                selected
            );


        } catch (error) {

            console.error(
                'Amazing Video:',
                error
            );


            showPageError(
                'Unable to connect to the video service.'
            );

        }

    }



    /* ======================================================
       PREPARE VIDEO
    ====================================================== */

    function prepareVideo(data) {

        title.textContent =
            data.title ||
            'Untitled Video';


        videoId.textContent =
            data.id || '';


        document.title =
            (
                data.title ||
                'Video'
            ) +
            ' - Amazing Video';


        if (data.thumbnail) {

            video.poster =
                data.thumbnail;

        }


        video.src =
            data.video_url;


        video.controls =
            false;


        pageLoading.style.display =
            'none';


        pageError.style.display =
            'none';


        watchContent.style.display =
            'block';


        bufferLoader.classList.remove(
            'hidden'
        );


        video.load();


        showControls();

    }



    /* ======================================================
       PLAY / PAUSE
    ====================================================== */

    function togglePlay() {

        if (video.paused) {

            var playPromise =
                video.play();


            if (
                playPromise &&
                typeof playPromise.catch
                === 'function'
            ) {

                playPromise.catch(
                    function () {}
                );

            }

        } else {

            video.pause();

        }


        showControls();

    }



    function updatePlayIcons() {

        var icon =
            video.paused
                ? 'fa-play'
                : 'fa-pause';


        centerPlay.innerHTML =
            '<i class="fa ' +
            icon +
            '"></i>';


        bottomPlay.innerHTML =
            '<i class="fa ' +
            icon +
            '"></i>';

    }



    /* ======================================================
       SEEK
    ====================================================== */

    function seekBy(seconds) {

        if (!Number.isFinite(
            video.duration
        )) {

            return;

        }


        video.currentTime =
            Math.max(
                0,
                Math.min(
                    video.duration,
                    video.currentTime +
                    seconds
                )
            );


        if (seconds < 0) {

            showSeekFeedback(
                feedbackLeft
            );

        } else {

            showSeekFeedback(
                feedbackRight
            );

        }


        showControls();

    }



    function showSeekFeedback(element) {

        element.classList.add(
            'show'
        );


        clearTimeout(
            element._timer
        );


        element._timer =
            setTimeout(
                function () {

                    element.classList.remove(
                        'show'
                    );

                },
                500
            );

    }



    /* ======================================================
       DOUBLE TAP
    ====================================================== */

    tapLeft.addEventListener(
        'click',
        function () {

            if (leftTapTimer) {

                clearTimeout(
                    leftTapTimer
                );

                leftTapTimer =
                    null;


                seekBy(
                    -CONFIG.seekSeconds
                );


                return;

            }


            leftTapTimer =
                setTimeout(
                    function () {

                        leftTapTimer =
                            null;

                        showControls();

                    },
                    CONFIG.doubleTapDelay
                );

        }
    );


    tapRight.addEventListener(
        'click',
        function () {

            if (rightTapTimer) {

                clearTimeout(
                    rightTapTimer
                );

                rightTapTimer =
                    null;


                seekBy(
                    CONFIG.seekSeconds
                );


                return;

            }


            rightTapTimer =
                setTimeout(
                    function () {

                        rightTapTimer =
                            null;

                        showControls();

                    },
                    CONFIG.doubleTapDelay
                );

        }
    );



    /* ======================================================
       PROGRESS
    ====================================================== */

    function updateProgress() {

        if (
            !Number.isFinite(
                video.duration
            ) ||
            video.duration <= 0
        ) {

            return;

        }


        var percent =
            (
                video.currentTime /
                video.duration
            ) * 100;


        if (!isDraggingProgress) {

            progress.value =
                percent;

        }


        playedBar.style.width =
            percent + '%';


        progressHandle.style.left =
            percent + '%';


        currentTimeEl.textContent =
            formatTime(
                video.currentTime
            );


        durationEl.textContent =
            formatTime(
                video.duration
            );


        updateBuffered();

    }



    function updateBuffered() {

        if (
            !video.buffered ||
            video.buffered.length === 0 ||
            !Number.isFinite(
                video.duration
            )
        ) {

            return;

        }


        try {

            var bufferedEnd =
                video.buffered.end(
                    video.buffered.length - 1
                );


            var percent =
                (
                    bufferedEnd /
                    video.duration
                ) * 100;


            bufferedBar.style.width =
                Math.min(
                    100,
                    percent
                ) + '%';

        } catch (e) {}

    }



    progress.addEventListener(
        'input',
        function () {

            isDraggingProgress =
                true;


            var percent =
                Number(
                    progress.value
                );


            playedBar.style.width =
                percent + '%';


            progressHandle.style.left =
                percent + '%';


            if (
                Number.isFinite(
                    video.duration
                )
            ) {

                currentTimeEl.textContent =
                    formatTime(
                        video.duration *
                        percent /
                        100
                    );

            }

        }
    );


    progress.addEventListener(
        'change',
        function () {

            if (
                Number.isFinite(
                    video.duration
                )
            ) {

                video.currentTime =
                    video.duration *
                    Number(
                        progress.value
                    ) /
                    100;

            }


            isDraggingProgress =
                false;

        }
    );



    /* ======================================================
       VOLUME
    ====================================================== */

    volume.addEventListener(
        'input',
        function () {

            video.volume =
                Number(
                    volume.value
                );


            video.muted =
                video.volume === 0;


            updateVolumeIcon();

        }
    );



    muteBtn.addEventListener(
        'click',
        function () {

            video.muted =
                !video.muted;


            updateVolumeIcon();

        }
    );



    function updateVolumeIcon() {

        var icon;


        if (
            video.muted ||
            video.volume === 0
        ) {

            icon =
                'fa-volume-off';

        } else if (
            video.volume < .5
        ) {

            icon =
                'fa-volume-down';

        } else {

            icon =
                'fa-volume-up';

        }


        muteBtn.innerHTML =
            '<i class="fa ' +
            icon +
            '"></i>';

    }



    /* ======================================================
       PLAYBACK SPEED
    ====================================================== */

    speedBtn.addEventListener(
        'click',
        function (event) {

            event.stopPropagation();


            speedMenu.classList.toggle(
                'open'
            );

        }
    );


    speedMenu
        .querySelectorAll(
            'button[data-speed]'
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    'click',
                    function () {

                        var speed =
                            Number(
                                button.dataset.speed
                            );


                        video.playbackRate =
                            speed;


                        speedBtn.textContent =
                            speed + 'x';


                        speedMenu
                            .querySelectorAll(
                                'button'
                            )
                            .forEach(
                                function (item) {

                                    item.classList.remove(
                                        'active'
                                    );

                                }
                            );


                        button.classList.add(
                            'active'
                        );


                        speedMenu.classList.remove(
                            'open'
                        );

                    }
                );

            }
        );



    /* ======================================================
       FULLSCREEN
    ====================================================== */

    fullscreenBtn.addEventListener(
        'click',
        function () {

            if (
                !document.fullscreenElement
            ) {

                if (
                    player.requestFullscreen
                ) {

                    player.requestFullscreen();

                } else if (
                    player.webkitRequestFullscreen
                ) {

                    player.webkitRequestFullscreen();

                }

            } else {

                if (
                    document.exitFullscreen
                ) {

                    document.exitFullscreen();

                }

            }

        }
    );



    /* ======================================================
       PICTURE IN PICTURE
    ====================================================== */

    pipBtn.addEventListener(
        'click',
        async function () {

            try {

                if (
                    !document.pictureInPictureEnabled ||
                    !video.requestPictureInPicture
                ) {

                    return;

                }


                if (
                    document.pictureInPictureElement
                ) {

                    await document.exitPictureInPicture();

                } else {

                    await video.requestPictureInPicture();

                }

            } catch (error) {

                console.log(
                    'PiP unavailable',
                    error
                );

            }

        }
    );


    /*
     * Hide PiP button if browser
     * doesn't support it.
     */

    if (
        !document.pictureInPictureEnabled
    ) {

        pipBtn.style.display =
            'none';

    }



    /* ======================================================
       AUTO HIDE CONTROLS
    ====================================================== */

    function showControls() {

        player.classList.remove(
            'av-controls-hidden'
        );


        clearTimeout(
            controlsTimer
        );


        if (!video.paused) {

            controlsTimer =
                setTimeout(
                    function () {

                        player.classList.add(
                            'av-controls-hidden'
                        );

                        speedMenu.classList.remove(
                            'open'
                        );

                    },
                    CONFIG.controlsTimeout
                );

        }

    }



    player.addEventListener(
        'mousemove',
        showControls
    );


    player.addEventListener(
        'touchstart',
        showControls,
        {
            passive: true
        }
    );


    player.addEventListener(
        'mouseleave',
        function () {

            if (!video.paused) {

                player.classList.add(
                    'av-controls-hidden'
                );

            }

        }
    );



    /* ======================================================
       BUTTON EVENTS
    ====================================================== */

    centerPlay.addEventListener(
        'click',
        togglePlay
    );


    bottomPlay.addEventListener(
        'click',
        togglePlay
    );


    centerBack.addEventListener(
        'click',
        function () {

            seekBy(
                -CONFIG.seekSeconds
            );

        }
    );


    centerForward.addEventListener(
        'click',
        function () {

            seekBy(
                CONFIG.seekSeconds
            );

        }
    );



    /* ======================================================
       VIDEO EVENTS
    ====================================================== */

    video.addEventListener(
        'play',
        function () {

            updatePlayIcons();

            bufferLoader.classList.add(
                'hidden'
            );

            showControls();

        }
    );


    video.addEventListener(
        'pause',
        function () {

            updatePlayIcons();

            showControls();

        }
    );


    video.addEventListener(
        'loadedmetadata',
        function () {

            durationEl.textContent =
                formatTime(
                    video.duration
                );


            bufferLoader.classList.add(
                'hidden'
            );


            updateProgress();

        }
    );


    video.addEventListener(
        'canplay',
        function () {

            bufferLoader.classList.add(
                'hidden'
            );

        }
    );


    video.addEventListener(
        'waiting',
        function () {

            bufferLoader.classList.remove(
                'hidden'
            );

        }
    );


    video.addEventListener(
        'playing',
        function () {

            bufferLoader.classList.add(
                'hidden'
            );

        }
    );


    video.addEventListener(
        'timeupdate',
        updateProgress
    );


    video.addEventListener(
        'progress',
        updateBuffered
    );


    video.addEventListener(
        'ended',
        function () {

            updatePlayIcons();

            showControls();

            video.currentTime =
                0;

        }
    );


    video.addEventListener(
        'error',
        function () {

            bufferLoader.classList.add(
                'hidden'
            );


            showPageError(
                'The video could not be played. The source may be unavailable.'
            );

        }
    );



    /* ======================================================
       KEYBOARD CONTROLS
    ====================================================== */

    document.addEventListener(
        'keydown',
        function (event) {

            /*
             * Don't interfere with input fields
             */

            var tag =
                document.activeElement
                    ? document.activeElement.tagName
                    : '';


            if (
                tag === 'INPUT' ||
                tag === 'TEXTAREA' ||
                tag === 'SELECT'
            ) {

                return;

            }


            switch (
                event.key.toLowerCase()
            ) {

                case ' ':

                    event.preventDefault();

                    togglePlay();

                    break;


                case 'arrowleft':

                    event.preventDefault();

                    seekBy(
                        -CONFIG.seekSeconds
                    );

                    break;


                case 'arrowright':

                    event.preventDefault();

                    seekBy(
                        CONFIG.seekSeconds
                    );

                    break;


                case 'm':

                    video.muted =
                        !video.muted;

                    updateVolumeIcon();

                    break;


                case 'f':

                    fullscreenBtn.click();

                    break;


                case 'k':

                    togglePlay();

                    break;

            }

        }
    );



    /* ======================================================
       CLOSE SPEED MENU
    ====================================================== */

    document.addEventListener(
        'click',
        function (event) {

            if (
                !speedMenu.contains(
                    event.target
                ) &&
                event.target !==
                speedBtn
            ) {

                speedMenu.classList.remove(
                    'open'
                );

            }

        }
    );



    /* ======================================================
       INIT
    ====================================================== */

    updatePlayIcons();

    updateVolumeIcon();

    loadVideoData();


})();