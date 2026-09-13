(function () {

    'use strict';

    var CONFIG = {
        apiUrl: 'https://amazingvideoshub.github.io/app-video-data/videos.json',
        apiTimeout: 15000,
        cacheBustApi: true
    };


    /* =========================================================
       ELEMENTS
    ========================================================= */

    var pageLoading = document.getElementById('avPageLoading');
    var pageError = document.getElementById('avPageError');
    var pageErrorText = document.getElementById('avPageErrorText');
    var watchContent = document.getElementById('avWatchContent');

    var previewCard = document.getElementById('avVideoPreview');
    var previewImage = document.getElementById('avPreviewImage');

    var titleEl = document.getElementById('avVideoTitle');
    var videoIdEl = document.getElementById('avVideoId');
    var videoSlugEl = document.getElementById('avVideoSlug');
    var videoStatusEl = document.getElementById('avVideoStatus');

    var openVideoBtn = document.getElementById('avOpenVideoBtn');
    var copyVideoLinkBtn = document.getElementById('avCopyVideoLink');
    var copyMessage = document.getElementById('avCopyMessage');


    /* =========================================================
       STATE
    ========================================================= */

    var currentVideo = null;


    /* =========================================================
       HELPERS
    ========================================================= */

    function getSlug() {
        var params = new URLSearchParams(window.location.search);
        return String(params.get('slug') || '').trim();
    }

    function cleanUrl(value) {
        var raw = String(value || '').trim();

        if (!raw) {
            return '';
        }

        try {
            var url = new URL(raw, window.location.href);

            if (
                window.location.protocol === 'https:' &&
                url.protocol === 'http:'
            ) {
                url.protocol = 'https:';
            }

            if (url.protocol !== 'https:' && url.protocol !== 'http:') {
                return '';
            }

            return url.href;

        } catch (error) {
            return '';
        }
    }

    function showLoading() {
        pageLoading.style.display = 'block';
        pageError.style.display = 'none';
        watchContent.style.display = 'none';
    }

    function showError(message) {
        pageLoading.style.display = 'none';
        watchContent.style.display = 'none';
        pageError.style.display = 'block';
        pageErrorText.textContent = message || 'Unable to load this video.';
    }

    function showContent() {
        pageLoading.style.display = 'none';
        pageError.style.display = 'none';
        watchContent.style.display = 'block';
    }

    async function fetchJsonWithTimeout(url, timeout) {
        var controller = new AbortController();

        var timer = setTimeout(function () {
            controller.abort();
        }, timeout);

        try {
            var response = await fetch(url, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error('API HTTP ' + response.status);
            }

            return await response.json();

        } finally {
            clearTimeout(timer);
        }
    }

    function openVideoInNewTab() {
        if (!currentVideo) {
            return;
        }

        var videoUrl = cleanUrl(currentVideo.video_url);

        if (!videoUrl) {
            showError('Video link is missing or invalid.');
            return;
        }

        var opened = window.open(videoUrl, '_blank', 'noopener,noreferrer');

        if (!opened) {
            window.location.href = videoUrl;
        }
    }

    async function copyVideoLink() {
        if (!currentVideo) {
            return;
        }

        var videoUrl = cleanUrl(currentVideo.video_url);

        if (!videoUrl) {
            copyMessage.textContent = 'Video link not available.';
            return;
        }

        try {
            await navigator.clipboard.writeText(videoUrl);
            copyMessage.textContent = 'Video link copied successfully.';
        } catch (error) {
            copyMessage.textContent = 'Copy failed. Please copy manually.';
        }

        setTimeout(function () {
            copyMessage.textContent = '';
        }, 2500);
    }


    /* =========================================================
       RENDER
    ========================================================= */

    function renderVideo(video) {
        currentVideo = video;

        var thumbnail = cleanUrl(video.thumbnail);
        var videoUrl = cleanUrl(video.video_url);

        titleEl.textContent = video.title || 'Untitled Video';
        videoIdEl.textContent = video.id || '--';
        videoSlugEl.textContent = video.slug || '--';
        videoStatusEl.textContent = video.active === false ? 'Inactive' : 'Active';

        document.title = (video.title || 'Video') + ' - Amazing Video';

        previewImage.src = thumbnail || 'images/default-video.jpg';
        previewImage.alt = video.title || 'Video Thumbnail';

        openVideoBtn.href = videoUrl || '#';

        showContent();
    }


    /* =========================================================
       LOAD DATA
    ========================================================= */

    async function loadVideoData() {
        var slug = getSlug();

        if (!slug) {
            showError('No video was selected.');
            return;
        }

        showLoading();

        try {
            var apiUrl = CONFIG.apiUrl;

            if (CONFIG.cacheBustApi) {
                apiUrl += (apiUrl.indexOf('?') === -1 ? '?' : '&') + 'v=' + Date.now();
            }

            var data = await fetchJsonWithTimeout(apiUrl, CONFIG.apiTimeout);

            if (
                !data ||
                data.success !== true ||
                !Array.isArray(data.videos)
            ) {
                throw new Error('Invalid API response');
            }

            var selectedVideo = data.videos.find(function (item) {
                if (!item) {
                    return false;
                }

                return (
                    String(item.slug || '').toLowerCase().trim() === slug.toLowerCase().trim()
                    &&
                    item.active !== false
                );
            });

            if (!selectedVideo) {
                showError('This video was not found or is currently unavailable.');
                return;
            }

            if (!cleanUrl(selectedVideo.video_url)) {
                showError('Video URL is missing or invalid.');
                return;
            }

            renderVideo(selectedVideo);

        } catch (error) {
            console.error('Amazing Video Preview Error:', error);

            if (error && error.name === 'AbortError') {
                showError('The video service took too long to respond. Please try again.');
            } else {
                showError('Unable to connect to the video service.');
            }
        }
    }


    /* =========================================================
       EVENTS
    ========================================================= */

    if (previewCard) {
        previewCard.addEventListener('click', openVideoInNewTab);
    }

    if (openVideoBtn) {
        openVideoBtn.addEventListener('click', function (event) {
            if (!currentVideo) {
                event.preventDefault();
                return;
            }

            var videoUrl = cleanUrl(currentVideo.video_url);

            if (!videoUrl) {
                event.preventDefault();
                showError('Video URL is missing or invalid.');
                return;
            }

            openVideoBtn.href = videoUrl;
        });
    }

    if (copyVideoLinkBtn) {
        copyVideoLinkBtn.addEventListener('click', copyVideoLink);
    }

    loadVideoData();

})();