(function () {

    'use strict';


    /* =========================================================
       AMAZING VIDEO
       PREMIUM REMOTE VIDEO PLAYER
    ========================================================= */

    var CONFIG = {

        /*
         * JSON API
         */
        apiUrl:
            'https://amazingvideoshub.github.io/app-video-data/videos.json',


        /*
         * Seek
         */
        seekSeconds:
            10,


        /*
         * Controls auto-hide
         */
        controlsTimeout:
            2800,


        /*
         * Double tap timing
         */
        doubleTapDelay:
            300,


        /*
         * Individual video source timeout
         */
        sourceLoadTimeout:
            25000,


        /*
         * JSON API timeout
         */
        apiTimeout:
            15000,


        /*
         * Prevent stale GitHub Pages JSON
         */
        cacheBustApi:
            true

    };



    /* =========================================================
       PAGE ELEMENTS
    ========================================================= */

    var pageLoading =
        document.getElementById(
            'avPageLoading'
        );


    var pageError =
        document.getElementById(
            'avPageError'
        );


    var pageErrorText =
        document.getElementById(
            'avPageErrorText'
        );


    var watchContent =
        document.getElementById(
            'avWatchContent'
        );


    var player =
        document.getElementById(
            'avPlayer'
        );


    var video =
        document.getElementById(
            'avVideo'
        );


    var bufferLoader =
        document.getElementById(
            'avBufferLoader'
        );


    var title =
        document.getElementById(
            'avVideoTitle'
        );


    var videoId =
        document.getElementById(
            'avVideoId'
        );



    /* =========================================================
       PLAYER CONTROLS
    ========================================================= */

    var centerPlay =
        document.getElementById(
            'avCenterPlay'
        );


    var bottomPlay =
        document.getElementById(
            'avBottomPlay'
        );


    var centerBack =
        document.getElementById(
            'avCenterBack'
        );


    var centerForward =
        document.getElementById(
            'avCenterForward'
        );


    var tapLeft =
        document.getElementById(
            'avTapLeft'
        );


    var tapRight =
        document.getElementById(
            'avTapRight'
        );


    var feedbackLeft =
        document.getElementById(
            'avSeekFeedbackLeft'
        );


    var feedbackRight =
        document.getElementById(
            'avSeekFeedbackRight'
        );


    var progress =
        document.getElementById(
            'avProgress'
        );


    var playedBar =
        document.getElementById(
            'avPlayedBar'
        );


    var bufferedBar =
        document.getElementById(
            'avBufferedBar'
        );


    var progressHandle =
        document.getElementById(
            'avProgressHandle'
        );


    var currentTimeEl =
        document.getElementById(
            'avCurrentTime'
        );


    var durationEl =
        document.getElementById(
            'avDuration'
        );


    var muteBtn =
        document.getElementById(
            'avMute'
        );


    var volume =
        document.getElementById(
            'avVolume'
        );


    var speedBtn =
        document.getElementById(
            'avSpeedBtn'
        );


    var speedMenu =
        document.getElementById(
            'avSpeedMenu'
        );


    var pipBtn =
        document.getElementById(
            'avPip'
        );


    var fullscreenBtn =
        document.getElementById(
            'avFullscreen'
        );



    /* =========================================================
       REQUIRED ELEMENT CHECK
    ========================================================= */

    var requiredElements = [

        pageLoading,
        pageError,
        pageErrorText,
        watchContent,

        player,
        video,
        bufferLoader,

        title,
        videoId,

        centerPlay,
        bottomPlay,
        centerBack,
        centerForward,

        tapLeft,
        tapRight,

        feedbackLeft,
        feedbackRight,

        progress,
        playedBar,
        bufferedBar,
        progressHandle,

        currentTimeEl,
        durationEl,

        muteBtn,
        volume,

        speedBtn,
        speedMenu,

        fullscreenBtn

    ];


    var hasMissingElement =
        requiredElements.some(
            function (element) {

                return !element;

            }
        );


    if (hasMissingElement) {

        console.error(
            'Amazing Video Player: required HTML elements are missing.'
        );

        return;

    }



    /* =========================================================
       STATE
    ========================================================= */

    var controlsTimer =
        null;


    var leftTapTimer =
        null;


    var rightTapTimer =
        null;


    var isDraggingProgress =
        false;


    var sources =
        [];


    var sourceIndex =
        -1;


    var sourceTimer =
        null;


    var hlsInstance =
        null;


    var selectedVideo =
        null;


    var directSourceButton =
        null;


    var currentSourceReady =
        false;



    /* =========================================================
       GET SLUG FROM URL
    ========================================================= */

    function getSlug() {

        var params =
            new URLSearchParams(
                window.location.search
            );


        return String(
            params.get('slug') || ''
        ).trim();

    }



    /* =========================================================
       FORMAT TIME
    ========================================================= */

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
                    .padStart(2, '0')

                +

                ':'

                +

                String(minutes)
                    .padStart(2, '0')

                +

                ':'

                +

                String(secs)
                    .padStart(2, '0')

            );

        }


        return (

            String(minutes)
                .padStart(2, '0')

            +

            ':'

            +

            String(secs)
                .padStart(2, '0')

        );

    }



    /* =========================================================
       URL CLEANER
    ========================================================= */

    function cleanUrl(value) {

        var raw =
            String(
                value || ''
            ).trim();


        if (!raw) {

            return '';

        }


        try {

            var url =
                new URL(
                    raw,
                    window.location.href
                );


            /*
             * HTTPS website cannot use HTTP video.
             *
             * We try HTTPS equivalent.
             *
             * It will only work if remote server supports HTTPS.
             */

            if (
                window.location.protocol === 'https:' &&
                url.protocol === 'http:'
            ) {

                url.protocol =
                    'https:';

            }


            if (
                url.protocol !== 'https:' &&
                url.protocol !== 'http:'
            ) {

                return '';

            }


            return url.href;


        } catch (error) {

            return '';

        }

    }



    /* =========================================================
       MIME TYPE
    ========================================================= */

    function guessMime(
        url,
        explicitType
    ) {

        if (explicitType) {

            return String(
                explicitType
            ).trim();

        }


        var clean =
            String(
                url || ''
            )

            .split('?')[0]

            .split('#')[0]

            .toLowerCase();


        if (
            clean.endsWith('.m3u8')
        ) {

            return 'application/vnd.apple.mpegurl';

        }


        if (
            clean.endsWith('.webm')
        ) {

            return 'video/webm';

        }


        if (
            clean.endsWith('.ogv') ||
            clean.endsWith('.ogg')
        ) {

            return 'video/ogg';

        }


        if (
            clean.endsWith('.mov')
        ) {

            return 'video/quicktime';

        }


        if (
            clean.endsWith('.mp4') ||
            clean.endsWith('.m4v')
        ) {

            return 'video/mp4';

        }


        return '';

    }



    /* =========================================================
       CHECK HLS
    ========================================================= */

    function isHlsSource(source) {

        var type =
            String(
                source.type || ''
            ).toLowerCase();


        var url =
            String(
                source.url || ''
            )

            .split('?')[0]

            .toLowerCase();


        return (

            type.indexOf(
                'mpegurl'
            ) !== -1

            ||

            url.endsWith(
                '.m3u8'
            )

        );

    }



    /* =========================================================
       REMOVE DUPLICATE SOURCES
    ========================================================= */

    function uniqueSources(items) {

        var seen =
            Object.create(null);


        return items.filter(
            function (source) {

                if (
                    !source ||
                    !source.url
                ) {

                    return false;

                }


                var key =
                    source.url;


                if (
                    seen[key]
                ) {

                    return false;

                }


                seen[key] =
                    true;


                return true;

            }
        );

    }



    /* =========================================================
       BUILD VIDEO SOURCE LIST
    ========================================================= */

    function buildSourceList(data) {

        var list =
            [];


        /*
         * OPTIONAL FUTURE FORMAT:
         *
         * "sources": [
         *
         *   {
         *      "url": "...mp4",
         *      "type": "video/mp4"
         *   },
         *
         *   {
         *      "url": "...m3u8",
         *      "type": "application/vnd.apple.mpegurl"
         *   }
         *
         * ]
         */

        if (
            Array.isArray(
                data.sources
            )
        ) {

            data.sources.forEach(
                function (item) {

                    if (!item) {

                        return;

                    }


                    /*
                     * sources: ["url1", "url2"]
                     */

                    if (
                        typeof item === 'string'
                    ) {

                        var stringUrl =
                            cleanUrl(
                                item
                            );


                        if (
                            stringUrl
                        ) {

                            list.push({

                                url:
                                    stringUrl,

                                type:
                                    guessMime(
                                        stringUrl,
                                        ''
                                    )

                            });

                        }


                        return;

                    }


                    /*
                     * sources:
                     *
                     * {
                     *   url: "",
                     *   type: ""
                     * }
                     */

                    var itemUrl =
                        cleanUrl(
                            item.url ||
                            item.src
                        );


                    if (
                        itemUrl
                    ) {

                        list.push({

                            url:
                                itemUrl,

                            type:
                                guessMime(
                                    itemUrl,
                                    item.type || ''
                                )

                        });

                    }

                }
            );

        }



        /*
         * Primary video_url
         */

        var primary =
            cleanUrl(
                data.video_url
            );


        if (
            primary
        ) {

            list.push({

                url:
                    primary,

                type:
                    guessMime(
                        primary,
                        data.video_type ||
                        data.mime_type ||
                        ''
                    )

            });

        }



        /*
         * Optional backup video
         */

        var fallback =
            cleanUrl(
                data.fallback_video_url
            );


        if (
            fallback
        ) {

            list.push({

                url:
                    fallback,

                type:
                    guessMime(
                        fallback,
                        data.fallback_video_type ||
                        ''
                    )

            });

        }


        return uniqueSources(
            list
        );

    }



    /* =========================================================
       CLEAR SOURCE TIMER
    ========================================================= */

    function clearSourceTimer() {

        if (
            sourceTimer
        ) {

            clearTimeout(
                sourceTimer
            );


            sourceTimer =
                null;

        }

    }



    /* =========================================================
       DESTROY HLS
    ========================================================= */

    function destroyHls() {

        if (
            hlsInstance
        ) {

            try {

                hlsInstance.destroy();

            } catch (error) {

            }


            hlsInstance =
                null;

        }

    }



    /* =========================================================
       RESET VIDEO
    ========================================================= */

    function resetVideoElement() {

        clearSourceTimer();

        destroyHls();


        currentSourceReady =
            false;


        try {

            video.pause();

        } catch (error) {

        }


        /*
         * Important:
         *
         * Do NOT set:
         *
         * crossorigin="anonymous"
         *
         * Third-party MP4 playback normally
         * doesn't require CORS.
         */

        video.removeAttribute(
            'crossorigin'
        );


        video.removeAttribute(
            'src'
        );


        while (
            video.firstChild
        ) {

            video.removeChild(
                video.firstChild
            );

        }


        try {

            video.load();

        } catch (error) {

        }

    }



    /* =========================================================
       MEDIA ERROR TEXT
    ========================================================= */

    function getMediaErrorText() {

        if (
            !video.error
        ) {

            return 'Unknown media error';

        }


        switch (
            video.error.code
        ) {

            case 1:

                return 'Video playback was aborted.';


            case 2:

                return 'Network error while loading the video.';


            case 3:

                return 'Browser could not decode this video.';


            case 4:

                return 'Video source or format is not supported.';


            default:

                return 'Unknown media error.';

        }

    }



    /* =========================================================
       CURRENT SOURCE
    ========================================================= */

    function currentSourceUrl() {

        if (
            sourceIndex >= 0 &&
            sourceIndex < sources.length
        ) {

            return sources[
                sourceIndex
            ].url;

        }


        return '';

    }



    /* =========================================================
       DIRECT SOURCE FALLBACK BUTTON
    ========================================================= */

    function removeDirectSourceButton() {

        if (
            directSourceButton &&
            directSourceButton.parentNode
        ) {

            directSourceButton
                .parentNode
                .removeChild(
                    directSourceButton
                );

        }


        directSourceButton =
            null;

    }



    function addDirectSourceButton(url) {

        removeDirectSourceButton();


        if (!url) {

            return;

        }


        directSourceButton =
            document.createElement(
                'a'
            );


        directSourceButton.href =
            url;


        directSourceButton.target =
            '_blank';


        directSourceButton.rel =
            'noopener noreferrer';


        directSourceButton.className =
            'av-page-error-btn';


        directSourceButton.style.marginLeft =
            '8px';


        directSourceButton.innerHTML =

            '<i class="fa fa-external-link"></i>' +

            ' Open Video Directly';


        var existingButton =
            pageError.querySelector(
                '.av-page-error-btn'
            );


        if (
            existingButton &&
            existingButton.parentNode
        ) {

            existingButton
                .parentNode
                .appendChild(
                    directSourceButton
                );

        } else {

            pageError.appendChild(
                directSourceButton
            );

        }

    }



    /* =========================================================
       SHOW PAGE ERROR
    ========================================================= */

    function showPageError(
        message,
        sourceUrl
    ) {

        clearSourceTimer();

        destroyHls();


        pageLoading.style.display =
            'none';


        watchContent.style.display =
            'none';


        pageErrorText.textContent =
            message;


        pageError.style.display =
            'block';


        addDirectSourceButton(
            sourceUrl || ''
        );

    }



    /* =========================================================
       FETCH JSON WITH TIMEOUT
    ========================================================= */

    async function fetchJsonWithTimeout(
        url,
        timeout
    ) {

        var controller =
            new AbortController();


        var timer =
            setTimeout(
                function () {

                    controller.abort();

                },
                timeout
            );


        try {

            var response =
                await fetch(
                    url,
                    {

                        method:
                            'GET',

                        cache:
                            'no-store',

                        headers: {

                            'Accept':
                                'application/json'

                        },

                        signal:
                            controller.signal

                    }
                );


            if (
                !response.ok
            ) {

                throw new Error(
                    'API HTTP ' +
                    response.status
                );

            }


            return await response.json();


        } finally {

            clearTimeout(
                timer
            );

        }

    }



    /* =========================================================
       FETCH VIDEO DATA
    ========================================================= */

    async function loadVideoData() {

        var slug =
            getSlug();


        if (
            !slug
        ) {

            showPageError(
                'No video was selected.'
            );

            return;

        }


        pageLoading.style.display =
            'block';


        pageError.style.display =
            'none';


        watchContent.style.display =
            'none';


        removeDirectSourceButton();


        try {

            var apiUrl =
                CONFIG.apiUrl;


            if (
                CONFIG.cacheBustApi
            ) {

                apiUrl +=

                    (
                        apiUrl.indexOf('?') === -1

                        ? '?'

                        : '&'
                    )

                    +

                    'v='

                    +

                    Date.now();

            }


            var data =
                await fetchJsonWithTimeout(
                    apiUrl,
                    CONFIG.apiTimeout
                );


            if (

                !data

                ||

                data.success !== true

                ||

                !Array.isArray(
                    data.videos
                )

            ) {

                throw new Error(
                    'Invalid API response'
                );

            }



            /*
             * Find selected video by slug
             */

            selectedVideo =
                data.videos.find(
                    function (item) {

                        if (
                            !item
                        ) {

                            return false;

                        }


                        return (

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


            if (
                !selectedVideo
            ) {

                showPageError(

                    'This video was not found or is currently unavailable.'

                );

                return;

            }



            /*
             * Build available sources
             */

            sources =
                buildSourceList(
                    selectedVideo
                );


            if (
                !sources.length
            ) {

                showPageError(

                    'The video source is missing or is not a valid HTTP/HTTPS URL.'

                );

                return;

            }


            /*
             * Ready
             */

            prepareVideo(
                selectedVideo
            );


        } catch (error) {

            console.error(
                'Amazing Video API error:',
                error
            );


            if (
                error &&
                error.name === 'AbortError'
            ) {

                showPageError(

                    'The video service took too long to respond. Please try again.'

                );

            } else {

                showPageError(

                    'Unable to connect to the video service.'

                );

            }

        }

    }



    /* =========================================================
       PREPARE VIDEO
    ========================================================= */

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
            )

            +

            ' - Amazing Video';



        /*
         * Thumbnail poster
         */

        if (
            data.thumbnail
        ) {

            video.poster =
                data.thumbnail;

        }



        /*
         * Disable default controls
         */

        video.controls =
            false;


        video.preload =
            'metadata';


        video.playsInline =
            true;



        /*
         * Page state
         */

        pageLoading.style.display =
            'none';


        pageError.style.display =
            'none';


        watchContent.style.display =
            'block';


        bufferLoader
            .classList
            .remove(
                'hidden'
            );


        sourceIndex =
            -1;


        /*
         * Start source loading
         */

        tryNextSource();


        showControls();

    }



    /* =========================================================
       TRY NEXT VIDEO SOURCE
    ========================================================= */

    function tryNextSource(reason) {

        clearSourceTimer();

        destroyHls();


        if (
            reason
        ) {

            console.warn(

                'Amazing Video source failed:',

                currentSourceUrl(),

                'Reason:',

                reason

            );

        }


        sourceIndex +=
            1;


        /*
         * All sources failed
         */

        if (
            sourceIndex >=
            sources.length
        ) {

            var finalUrl =

                sources.length

                    ? sources[0].url

                    : '';


            showPageError(

                'The third-party video source could not be played in this browser. ' +

                'The remote server may be unavailable, may not support HTTPS, ' +

                'may not support video range requests, or may not permit embedded playback.',

                finalUrl

            );


            return;

        }



        var source =
            sources[
                sourceIndex
            ];


        console.log(

            'Amazing Video trying source',

            sourceIndex + 1,

            'of',

            sources.length,

            source

        );



        /*
         * Reset old source
         */

        resetVideoElement();


        bufferLoader
            .classList
            .remove(
                'hidden'
            );



        /*
         * Source timeout
         */

        sourceTimer =
            setTimeout(
                function () {

                    if (
                        !currentSourceReady
                    ) {

                        tryNextSource(

                            'Timed out while loading video metadata'

                        );

                    }

                },
                CONFIG.sourceLoadTimeout
            );



        /*
         * HLS
         */

        if (
            isHlsSource(
                source
            )
        ) {

            loadHlsSource(
                source
            );

        } else {

            loadDirectSource(
                source
            );

        }

    }



    /* =========================================================
       DIRECT MP4 / WEBM / OGG
    ========================================================= */

    function loadDirectSource(source) {

        /*
         * Important:
         *
         * We are NOT using fetch() for MP4.
         *
         * Direct <video src=""> playback generally works
         * without normal AJAX CORS permission.
         */

        video.src =
            source.url;


        try {

            video.load();

        } catch (error) {

            tryNextSource(

                'video.load() failed: ' +
                error.message

            );

        }

    }



    /* =========================================================
       HLS M3U8
    ========================================================= */

    function loadHlsSource(source) {

        /*
         * Native HLS
         *
         * Safari / iPhone / Mac
         */

        if (

            video.canPlayType(
                'application/vnd.apple.mpegurl'
            )

            ||

            video.canPlayType(
                'application/x-mpegURL'
            )

        ) {

            video.src =
                source.url;


            video.load();


            return;

        }



        /*
         * HLS.js
         *
         * Chrome / Edge / Firefox
         */

        if (

            window.Hls

            &&

            window.Hls.isSupported()

        ) {

            hlsInstance =
                new window.Hls({

                    enableWorker:
                        true,

                    lowLatencyMode:
                        false,

                    backBufferLength:
                        60

                });


            hlsInstance.loadSource(
                source.url
            );


            hlsInstance.attachMedia(
                video
            );


            hlsInstance.on(

                window.Hls.Events.MANIFEST_PARSED,

                function () {

                    clearSourceTimer();


                    currentSourceReady =
                        true;


                    bufferLoader
                        .classList
                        .add(
                            'hidden'
                        );

                }

            );


            hlsInstance.on(

                window.Hls.Events.ERROR,

                function (
                    event,
                    data
                ) {

                    console.warn(

                        'Amazing Video HLS error:',

                        data

                    );


                    if (

                        data

                        &&

                        data.fatal

                    ) {

                        tryNextSource(

                            'Fatal HLS error: '

                            +

                            String(
                                data.type || ''
                            )

                            +

                            ' / '

                            +

                            String(
                                data.details || ''
                            )

                        );

                    }

                }

            );


            return;

        }



        tryNextSource(

            'HLS is not supported in this browser'

        );

    }



    /* =========================================================
       PLAY / PAUSE
    ========================================================= */

    function togglePlay() {

        if (
            video.paused
        ) {

            var playPromise =
                video.play();


            if (

                playPromise

                &&

                typeof playPromise.catch ===
                'function'

            ) {

                playPromise.catch(
                    function (error) {

                        console.warn(

                            'Amazing Video play() rejected:',

                            error

                        );


                        showControls();

                    }
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



    /* =========================================================
       SEEK +/- 10 SECONDS
    ========================================================= */

    function seekBy(seconds) {

        if (
            !Number.isFinite(
                video.duration
            )
        ) {

            return;

        }


        video.currentTime =

            Math.max(

                0,

                Math.min(

                    video.duration,

                    video.currentTime
                    +
                    seconds

                )

            );


        showSeekFeedback(

            seconds < 0

                ? feedbackLeft

                : feedbackRight

        );


        showControls();

    }



    function showSeekFeedback(
        element
    ) {

        element
            .classList
            .add(
                'show'
            );


        clearTimeout(
            element._timer
        );


        element._timer =
            setTimeout(
                function () {

                    element
                        .classList
                        .remove(
                            'show'
                        );

                },
                500
            );

    }



    /* =========================================================
       DOUBLE TAP LEFT
    ========================================================= */

    tapLeft.addEventListener(
        'click',
        function () {

            if (
                leftTapTimer
            ) {

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



    /* =========================================================
       DOUBLE TAP RIGHT
    ========================================================= */

    tapRight.addEventListener(
        'click',
        function () {

            if (
                rightTapTimer
            ) {

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



    /* =========================================================
       PROGRESS
    ========================================================= */

    function updateProgress() {

        if (

            !Number.isFinite(
                video.duration
            )

            ||

            video.duration <= 0

        ) {

            return;

        }


        var percent =

            (
                video.currentTime /
                video.duration
            )

            *

            100;


        if (
            !isDraggingProgress
        ) {

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



    /* =========================================================
       BUFFER PROGRESS
    ========================================================= */

    function updateBuffered() {

        if (

            !video.buffered

            ||

            video.buffered.length === 0

            ||

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
                )

                *

                100;


            bufferedBar.style.width =

                Math.min(
                    100,
                    percent
                )

                +

                '%';


        } catch (error) {

        }

    }



    /* =========================================================
       PROGRESS DRAG
    ========================================================= */

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

                        video.duration

                        *

                        percent

                        /

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

                    video.duration

                    *

                    Number(
                        progress.value
                    )

                    /

                    100;

            }


            isDraggingProgress =
                false;

        }
    );



    /* =========================================================
       VOLUME
    ========================================================= */

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

            video.muted

            ||

            video.volume === 0

        ) {

            icon =
                'fa-volume-off';

        } else if (
            video.volume < 0.5
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



    /* =========================================================
       PLAYBACK SPEED
    ========================================================= */

    speedBtn.addEventListener(
        'click',
        function (event) {

            event.stopPropagation();


            speedMenu
                .classList
                .toggle(
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

                                    item
                                        .classList
                                        .remove(
                                            'active'
                                        );

                                }
                            );


                        button
                            .classList
                            .add(
                                'active'
                            );


                        speedMenu
                            .classList
                            .remove(
                                'open'
                            );

                    }
                );

            }
        );



    /* =========================================================
       FULLSCREEN
    ========================================================= */

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

                } else if (
                    document.webkitExitFullscreen
                ) {

                    document.webkitExitFullscreen();

                }

            }

        }
    );



    /* =========================================================
       PICTURE IN PICTURE
    ========================================================= */

    if (
        pipBtn
    ) {

        pipBtn.addEventListener(
            'click',
            async function () {

                try {

                    if (

                        !document.pictureInPictureEnabled

                        ||

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

                        'Amazing Video PiP unavailable',

                        error

                    );

                }

            }
        );


        if (
            !document.pictureInPictureEnabled
        ) {

            pipBtn.style.display =
                'none';

        }

    }



    /* =========================================================
       AUTO HIDE CONTROLS
    ========================================================= */

    function showControls() {

        player
            .classList
            .remove(
                'av-controls-hidden'
            );


        clearTimeout(
            controlsTimer
        );


        if (
            !video.paused
        ) {

            controlsTimer =
                setTimeout(
                    function () {

                        player
                            .classList
                            .add(
                                'av-controls-hidden'
                            );


                        speedMenu
                            .classList
                            .remove(
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
            passive:
                true
        }
    );



    player.addEventListener(
        'mouseleave',
        function () {

            if (
                !video.paused
            ) {

                player
                    .classList
                    .add(
                        'av-controls-hidden'
                    );

            }

        }
    );



    /* =========================================================
       PLAYER BUTTONS
    ========================================================= */

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



    /* =========================================================
       VIDEO LOAD START
    ========================================================= */

    video.addEventListener(
        'loadstart',
        function () {

            bufferLoader
                .classList
                .remove(
                    'hidden'
                );

        }
    );



    /* =========================================================
       METADATA READY
    ========================================================= */

    video.addEventListener(
        'loadedmetadata',
        function () {

            currentSourceReady =
                true;


            clearSourceTimer();


            durationEl.textContent =
                formatTime(
                    video.duration
                );


            bufferLoader
                .classList
                .add(
                    'hidden'
                );


            updateProgress();


            console.log(

                'Amazing Video media loaded:',

                video.currentSrc ||
                currentSourceUrl()

            );

        }
    );



    /* =========================================================
       CAN PLAY
    ========================================================= */

    video.addEventListener(
        'canplay',
        function () {

            currentSourceReady =
                true;


            clearSourceTimer();


            bufferLoader
                .classList
                .add(
                    'hidden'
                );

        }
    );



    /* =========================================================
       PLAY
    ========================================================= */

    video.addEventListener(
        'play',
        function () {

            updatePlayIcons();


            bufferLoader
                .classList
                .add(
                    'hidden'
                );


            showControls();

        }
    );



    /* =========================================================
       PAUSE
    ========================================================= */

    video.addEventListener(
        'pause',
        function () {

            updatePlayIcons();


            showControls();

        }
    );



    /* =========================================================
       BUFFERING
    ========================================================= */

    video.addEventListener(
        'waiting',
        function () {

            bufferLoader
                .classList
                .remove(
                    'hidden'
                );

        }
    );



    /* =========================================================
       STALLED
    ========================================================= */

    video.addEventListener(
        'stalled',
        function () {

            console.warn(

                'Amazing Video media stalled:',

                video.currentSrc ||
                currentSourceUrl()

            );


            bufferLoader
                .classList
                .remove(
                    'hidden'
                );

        }
    );



    /* =========================================================
       PLAYING
    ========================================================= */

    video.addEventListener(
        'playing',
        function () {

            bufferLoader
                .classList
                .add(
                    'hidden'
                );

        }
    );



    /* =========================================================
       TIME UPDATE
    ========================================================= */

    video.addEventListener(
        'timeupdate',
        updateProgress
    );



    video.addEventListener(
        'progress',
        updateBuffered
    );



    /* =========================================================
       ENDED
    ========================================================= */

    video.addEventListener(
        'ended',
        function () {

            updatePlayIcons();


            showControls();


            video.currentTime =
                0;

        }
    );



    /* =========================================================
       VIDEO ERROR
    ========================================================= */

    video.addEventListener(
        'error',
        function () {

            /*
             * Ignore temporary empty-source events
             * during reset.
             */

            if (

                sourceIndex < 0

                ||

                sourceIndex >=
                sources.length

            ) {

                return;

            }


            var reason =
                getMediaErrorText();


            console.error(

                'Amazing Video media error:',

                {

                    code:

                        video.error
                            ? video.error.code
                            : null,

                    message:

                        video.error
                            ? video.error.message
                            : '',

                    reason:
                        reason,

                    currentSrc:
                        video.currentSrc,

                    attemptedSource:
                        currentSourceUrl()

                }

            );


            /*
             * Try backup source if available
             */

            tryNextSource(
                reason
            );

        }
    );



    /* =========================================================
       KEYBOARD CONTROLS
    ========================================================= */

    document.addEventListener(
        'keydown',
        function (event) {

            var tag =

                document.activeElement

                    ? document.activeElement.tagName

                    : '';


            /*
             * Do not interfere with forms
             */

            if (

                tag === 'INPUT'

                ||

                tag === 'TEXTAREA'

                ||

                tag === 'SELECT'

            ) {

                return;

            }



            switch (
                event.key.toLowerCase()
            ) {

                /*
                 * Play / pause
                 */

                case ' ':

                    event.preventDefault();

                    togglePlay();

                    break;



                /*
                 * -10 sec
                 */

                case 'arrowleft':

                    event.preventDefault();

                    seekBy(
                        -CONFIG.seekSeconds
                    );

                    break;



                /*
                 * +10 sec
                 */

                case 'arrowright':

                    event.preventDefault();

                    seekBy(
                        CONFIG.seekSeconds
                    );

                    break;



                /*
                 * Mute
                 */

                case 'm':

                    video.muted =
                        !video.muted;


                    updateVolumeIcon();

                    break;



                /*
                 * Fullscreen
                 */

                case 'f':

                    fullscreenBtn.click();

                    break;



                /*
                 * YouTube style K
                 */

                case 'k':

                    togglePlay();

                    break;

            }

        }
    );



    /* =========================================================
       CLOSE SPEED MENU
    ========================================================= */

    document.addEventListener(
        'click',
        function (event) {

            if (

                !speedMenu.contains(
                    event.target
                )

                &&

                event.target !==
                speedBtn

            ) {

                speedMenu
                    .classList
                    .remove(
                        'open'
                    );

            }

        }
    );



    /* =========================================================
       PAGE UNLOAD
    ========================================================= */

    window.addEventListener(
        'beforeunload',
        function () {

            clearSourceTimer();

            destroyHls();

        }
    );



    /* =========================================================
       INIT
    ========================================================= */

    updatePlayIcons();


    updateVolumeIcon();


    loadVideoData();


})();