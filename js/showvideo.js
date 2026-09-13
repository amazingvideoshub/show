(function () {

    'use strict';


    /* =========================================================
       CONFIG
    ========================================================= */

    var CONFIG = {

        apiUrl:
            'https://amazingvideoshub.github.io/app-video-data/videos.json',

        apiTimeout:
            15000,

        cacheBustApi:
            true

    };


    /* =========================================================
       ELEMENTS
    ========================================================= */

    var pageLoading =
        document.getElementById('avPageLoading');

    var pageError =
        document.getElementById('avPageError');

    var pageErrorText =
        document.getElementById('avPageErrorText');

    var watchContent =
        document.getElementById('avWatchContent');


    var previewCard =
        document.getElementById('avVideoPreview');

    var previewImage =
        document.getElementById('avPreviewImage');


    var titleEl =
        document.getElementById('avVideoTitle');

    var videoIdEl =
        document.getElementById('avVideoId');

    var videoSlugEl =
        document.getElementById('avVideoSlug');

    var videoStatusEl =
        document.getElementById('avVideoStatus');


    var openVideoBtn =
        document.getElementById('avOpenVideoBtn');

    var copyVideoLinkBtn =
        document.getElementById('avCopyVideoLink');

    var copyMessage =
        document.getElementById('avCopyMessage');


    /* =========================================================
       STATE
    ========================================================= */

    var currentVideo =
        null;


    /* =========================================================
       GET SLUG
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
       CLEAN / VALIDATE URL
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
             * GitHub Pages uses HTTPS.
             *
             * If API accidentally returns HTTP,
             * first try HTTPS equivalent.
             */
            if (
                window.location.protocol === 'https:' &&
                url.protocol === 'http:'
            ) {

                url.protocol =
                    'https:';

            }


            /*
             * Only normal web URLs
             */
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
       PAGE STATES
    ========================================================= */

    function showLoading() {

        if (pageLoading) {

            pageLoading.style.display =
                'block';

        }


        if (pageError) {

            pageError.style.display =
                'none';

        }


        if (watchContent) {

            watchContent.style.display =
                'none';

        }

    }


    function showError(message) {

        if (pageLoading) {

            pageLoading.style.display =
                'none';

        }


        if (watchContent) {

            watchContent.style.display =
                'none';

        }


        if (pageError) {

            pageError.style.display =
                'block';

        }


        if (pageErrorText) {

            pageErrorText.textContent =
                message ||
                'Unable to load this video.';

        }

    }


    function showContent() {

        if (pageLoading) {

            pageLoading.style.display =
                'none';

        }


        if (pageError) {

            pageError.style.display =
                'none';

        }


        if (watchContent) {

            watchContent.style.display =
                'block';

        }

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


            if (!response.ok) {

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
       OPEN VIDEO
       ONLY NEW TAB
       NEVER CURRENT TAB
    ========================================================= */

    function openVideoInNewTab() {

        if (!currentVideo) {

            return;

        }


        var videoUrl =
            cleanUrl(
                currentVideo.video_url
            );


        if (!videoUrl) {

            showError(
                'Video link is missing or invalid.'
            );

            return;

        }


        /*
         * IMPORTANT:
         *
         * We create an anchor dynamically.
         *
         * target="_blank"
         * means NEW TAB only.
         *
         * There is NO:
         *
         * window.location.href
         *
         * fallback.
         *
         * Therefore current view.html
         * will stay open.
         */

        var link =
            document.createElement('a');


        link.href =
            videoUrl;


        link.target =
            '_blank';


        link.rel =
            'noopener noreferrer';


        /*
         * Keep hidden.
         */
        link.style.display =
            'none';


        document.body.appendChild(
            link
        );


        link.click();


        document.body.removeChild(
            link
        );

    }


    /* =========================================================
       COPY VIDEO LINK
    ========================================================= */

    async function copyVideoLink() {

        if (!currentVideo) {

            return;

        }


        var videoUrl =
            cleanUrl(
                currentVideo.video_url
            );


        if (!videoUrl) {

            if (copyMessage) {

                copyMessage.textContent =
                    'Video link not available.';

            }

            return;

        }


        try {

            /*
             * Modern HTTPS browsers
             */
            if (
                navigator.clipboard &&
                navigator.clipboard.writeText
            ) {

                await navigator.clipboard.writeText(
                    videoUrl
                );

            } else {

                /*
                 * Older browser fallback
                 */
                fallbackCopyText(
                    videoUrl
                );

            }


            if (copyMessage) {

                copyMessage.textContent =
                    'Video link copied successfully.';

            }


        } catch (error) {

            console.error(
                'Copy error:',
                error
            );


            try {

                fallbackCopyText(
                    videoUrl
                );


                if (copyMessage) {

                    copyMessage.textContent =
                        'Video link copied successfully.';

                }


            } catch (copyError) {

                if (copyMessage) {

                    copyMessage.textContent =
                        'Copy failed. Please copy manually.';

                }

            }

        }


        setTimeout(
            function () {

                if (copyMessage) {

                    copyMessage.textContent =
                        '';

                }

            },
            2500
        );

    }


    /* =========================================================
       FALLBACK COPY
    ========================================================= */

    function fallbackCopyText(text) {

        var textarea =
            document.createElement(
                'textarea'
            );


        textarea.value =
            text;


        textarea.setAttribute(
            'readonly',
            ''
        );


        textarea.style.position =
            'fixed';

        textarea.style.opacity =
            '0';

        textarea.style.pointerEvents =
            'none';


        document.body.appendChild(
            textarea
        );


        textarea.select();


        document.execCommand(
            'copy'
        );


        document.body.removeChild(
            textarea
        );

    }


    /* =========================================================
       IMAGE FALLBACK
    ========================================================= */

    function setupImageFallback() {

        if (!previewImage) {

            return;

        }


        previewImage.onerror =
            function () {

                /*
                 * Prevent infinite onerror loop.
                 */
                previewImage.onerror =
                    null;


                previewImage.src =
                    'images/default-video.jpg';

            };

    }


    /* =========================================================
       RENDER VIDEO DATA
    ========================================================= */

    function renderVideo(video) {

        currentVideo =
            video;


        var thumbnail =
            cleanUrl(
                video.thumbnail
            );


        var videoUrl =
            cleanUrl(
                video.video_url
            );


        /*
         * Title
         */
        if (titleEl) {

            titleEl.textContent =
                video.title ||
                'Untitled Video';

        }


        /*
         * Video ID
         */
        if (videoIdEl) {

            videoIdEl.textContent =
                video.id ||
                '--';

        }


        /*
         * Slug
         */
        if (videoSlugEl) {

            videoSlugEl.textContent =
                video.slug ||
                '--';

        }


        /*
         * Status
         */
        if (videoStatusEl) {

            videoStatusEl.textContent =
                video.active === false
                    ? 'Inactive'
                    : 'Active';

        }


        /*
         * Browser page title
         */
        document.title =

            (
                video.title ||
                'Video'
            )

            +

            ' - Amazing Video';


        /*
         * Preview thumbnail
         */
        if (previewImage) {

            setupImageFallback();


            previewImage.src =
                thumbnail ||
                'images/default-video.jpg';


            previewImage.alt =
                video.title ||
                'Video Thumbnail';

        }


        /*
         * Button href exists for accessibility,
         * but JS click will prevent normal navigation.
         */
        if (openVideoBtn) {

            openVideoBtn.href =
                videoUrl ||
                '#';


            openVideoBtn.target =
                '_blank';


            openVideoBtn.rel =
                'noopener noreferrer';

        }


        showContent();

    }


    /* =========================================================
       LOAD VIDEO DATA
    ========================================================= */

    async function loadVideoData() {

        var slug =
            getSlug();


        if (!slug) {

            showError(
                'No video was selected.'
            );

            return;

        }


        showLoading();


        try {

            var apiUrl =
                CONFIG.apiUrl;


            /*
             * Prevent GitHub Pages cached JSON
             */
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


            /*
             * Validate API
             */
            if (
                !data ||
                data.success !== true ||
                !Array.isArray(data.videos)
            ) {

                throw new Error(
                    'Invalid API response'
                );

            }


            /*
             * Find video by slug
             */
            var selectedVideo =
                data.videos.find(
                    function (item) {

                        if (!item) {

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


            /*
             * Not found
             */
            if (!selectedVideo) {

                showError(
                    'This video was not found or is currently unavailable.'
                );

                return;

            }


            /*
             * Video URL required
             */
            if (
                !cleanUrl(
                    selectedVideo.video_url
                )
            ) {

                showError(
                    'Video URL is missing or invalid.'
                );

                return;

            }


            /*
             * Render page
             */
            renderVideo(
                selectedVideo
            );


        } catch (error) {

            console.error(
                'Amazing Video Preview Error:',
                error
            );


            if (
                error &&
                error.name === 'AbortError'
            ) {

                showError(
                    'The video service took too long to respond. Please try again.'
                );

            } else {

                showError(
                    'Unable to connect to the video service.'
                );

            }

        }

    }


    /* =========================================================
       EVENTS
    ========================================================= */


    /*
     * PREVIEW IMAGE / CARD
     *
     * Opens video ONLY in new tab.
     */
    if (previewCard) {

        previewCard.addEventListener(
            'click',
            function (event) {

                /*
                 * Prevent any default button/link behaviour.
                 */
                event.preventDefault();


                /*
                 * Stop parent click handlers.
                 */
                event.stopPropagation();


                openVideoInNewTab();

            }
        );

    }


    /*
     * OPEN VIDEO BUTTON
     *
     * Opens video ONLY in new tab.
     */
    if (openVideoBtn) {

        openVideoBtn.addEventListener(
            'click',
            function (event) {

                /*
                 * Very important:
                 *
                 * Prevent normal href navigation.
                 */
                event.preventDefault();


                event.stopPropagation();


                openVideoInNewTab();

            }
        );

    }


    /*
     * COPY VIDEO LINK
     */
    if (copyVideoLinkBtn) {

        copyVideoLinkBtn.addEventListener(
            'click',
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                copyVideoLink();

            }
        );

    }


    /* =========================================================
       INIT
    ========================================================= */

    loadVideoData();


})();