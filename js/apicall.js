(function () {

    'use strict';


    /* =====================================================
       CONFIG
    ===================================================== */

    var CONFIG = {

        /*
         * GitHub JSON API
         */
        apiUrl:
            'https://amazingvideoshub.github.io/app-video-data/videos.json',


        /*
         * First time kitne cards?
         *
         * Desktop = 4 cards per row
         * 8 = 2 rows
         */
        perPage: 8,


        /*
         * Detail page
         */
        viewPage:
            'view.html',


        /*
         * Thumbnail fallback
         *
         * Ensure ye image exist karti ho.
         */
        fallbackImage:
            'images/video-placeholder.jpg',


        /*
         * Search delay
         */
        debounceTime:
            250

    };



    /* =====================================================
       STATE
    ===================================================== */

    var state = {

        videos: [],

        filtered: [],

        visible:
            CONFIG.perPage,

        keyword: '',

        type: 'all',

        loading: false

    };



    /* =====================================================
       DOM
    ===================================================== */

    var grid =
        document.getElementById(
            'videoGrid'
        );

    var loading =
        document.getElementById(
            'videoLoading'
        );

    var error =
        document.getElementById(
            'videoError'
        );

    var empty =
        document.getElementById(
            'videoEmpty'
        );

    var resultInfo =
        document.getElementById(
            'videoResultInfo'
        );

    var loadMoreWrap =
        document.getElementById(
            'videoLoadMoreWrap'
        );

    var loadMoreBtn =
        document.getElementById(
            'videoLoadMoreBtn'
        );

    var retryBtn =
        document.getElementById(
            'videoRetryBtn'
        );


    var searchForm =
        document.getElementById(
            'amazingSearchForm'
        );

    var searchInput =
        document.getElementById(
            'amazingSearchInput'
        );

    var searchType =
        document.getElementById(
            'amazingSearchType'
        );

    var searchStatus =
        document.getElementById(
            'amazingSearchStatus'
        );



    /* =====================================================
       HELPERS
    ===================================================== */

    function escapeHtml(value) {

        return String(
            value === undefined ||
            value === null
                ? ''
                : value
        )

        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    }



    function cleanString(value) {

        return String(
            value || ''
        ).trim();

    }



    function debounce(
        callback,
        delay
    ) {

        var timer;

        return function () {

            var context = this;

            var args = arguments;

            clearTimeout(timer);

            timer = setTimeout(
                function () {

                    callback.apply(
                        context,
                        args
                    );

                },
                delay
            );

        };

    }



    /* =====================================================
       SLUG
    ===================================================== */

    function generateSlug(text) {

        return cleanString(text)

            .toLowerCase()

            .replace(/[^a-z0-9]+/g, '-')

            .replace(/^-+|-+$/g, '');

    }



    /* =====================================================
       DETAIL PAGE URL
    ===================================================== */

    function getVideoPageUrl(video) {

        /*
         * IMPORTANT:
         *
         * view.html?slug=test-video-1
         */

        return CONFIG.viewPage +
            '?slug=' +
            encodeURIComponent(
                video.slug
            );

    }



    /* =====================================================
       NORMALIZE API RECORD
    ===================================================== */

    function normalizeVideo(item) {

        if (
            !item ||
            typeof item !== 'object'
        ) {

            return null;

        }


        var id =
            cleanString(
                item.id
            );

        var title =
            cleanString(
                item.title
            );

        var thumbnail =
            cleanString(
                item.thumbnail
            );

        var videoUrl =
            cleanString(
                item.video_url
            );

        var slug =
            cleanString(
                item.slug
            );


        /*
         * Required values
         */

        if (!id) {
            return null;
        }


        if (!title) {

            title =
                'Untitled Video';

        }


        if (!slug) {

            slug =
                generateSlug(
                    title
                ) || id;

        }


        if (!thumbnail) {

            thumbnail =
                CONFIG.fallbackImage;

        }


        /*
         * video_url required
         */

        if (!videoUrl) {

            return null;

        }


        return {

            id: id,

            title: title,

            thumbnail: thumbnail,

            video_url: videoUrl,

            slug: slug,

            type:
                cleanString(
                    item.type
                ) || 'video',

            duration:
                cleanString(
                    item.duration
                ),

            active:
                item.active !== false

        };

    }



    /* =====================================================
       LOAD API
    ===================================================== */

    async function fetchVideos() {

        if (state.loading) {
            return;
        }


        state.loading = true;


        showLoading();


        try {

            var response =
                await fetch(
                    CONFIG.apiUrl +
                    '?v=' +
                    Date.now(),
                    {
                        method: 'GET',

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


            var json =
                await response.json();


            if (
                !json ||
                json.success !== true ||
                !Array.isArray(
                    json.videos
                )
            ) {

                throw new Error(
                    'Invalid JSON response'
                );

            }


            /*
             * Convert API records
             */

            var videos =
                json.videos

                .map(normalizeVideo)

                .filter(
                    function (video) {

                        return (
                            video !== null &&
                            video.active === true
                        );

                    }
                );


            state.videos =
                videos;

            state.filtered =
                videos.slice();

            state.visible =
                CONFIG.perPage;


            applySearch();


        } catch (err) {

            console.error(
                'Video API Error:',
                err
            );


            showError();

        } finally {

            state.loading = false;

        }

    }



    /* =====================================================
       CREATE CARD
    ===================================================== */

    function createCard(video) {

        var col =
            document.createElement(
                'div'
            );


        /*
         * Bootstrap:
         *
         * Desktop large: 4
         * Tablet:        3
         * Small:         2
         * Mobile:        1
         */

        col.className =
            'col-xs-12 ' +
            'col-sm-6 ' +
            'col-md-4 ' +
            'col-lg-3 ' +
            'av-video-col';


        var viewUrl =
            getVideoPageUrl(
                video
            );


        var duration = '';


        if (video.duration) {

            duration =

                '<div class="av-video-duration">' +

                    escapeHtml(
                        video.duration
                    ) +

                '</div>';

        }


        col.innerHTML =

            '<article class="av-video-card">' +


                '<div class="av-video-thumb">' +


                    '<img ' +
                        'class="av-thumb-image" ' +
                        'src="' +
                            escapeHtml(
                                video.thumbnail
                            ) +
                        '" ' +
                        'alt="' +
                            escapeHtml(
                                video.title
                            ) +
                        '" ' +
                        'loading="lazy" ' +
                        'decoding="async"' +
                    '>' +


                    duration +


                    '<a ' +
                        'href="' +
                            escapeHtml(
                                viewUrl
                            ) +
                        '" ' +
                        'class="av-video-play" ' +
                        'aria-label="Play ' +
                            escapeHtml(
                                video.title
                            ) +
                        '">' +

                        '<i class="fa fa-play"></i>' +

                    '</a>' +


                '</div>' +


                '<div class="av-video-body">' +


                    '<h5 class="av-video-title">' +

                        '<a href="' +
                            escapeHtml(
                                viewUrl
                            ) +
                        '">' +

                            escapeHtml(
                                video.title
                            ) +

                        '</a>' +

                    '</h5>' +


                    '<div class="av-video-meta">' +

                        '<i class="fa fa-play-circle"></i>' +

                        'Watch Video' +

                    '</div>' +


                '</div>' +


            '</article>';


        /*
         * Image error fallback
         */

        var image =
            col.querySelector(
                '.av-thumb-image'
            );


        image.onerror =
            function () {

                if (
                    image.dataset.fallback
                ) {

                    return;

                }


                image.dataset.fallback =
                    'true';


                image.src =
                    CONFIG.fallbackImage;

            };


        return col;

    }



    /* =====================================================
       RENDER CARDS
    ===================================================== */

    function renderVideos() {

        hideStates();


        grid.innerHTML = '';


        var total =
            state.filtered.length;


        if (total === 0) {

            empty.style.display =
                'block';

            loadMoreWrap.style.display =
                'none';

            resultInfo.style.display =
                'none';

            updateSearchStatus();

            return;

        }


        var shown =
            Math.min(
                state.visible,
                total
            );


        var fragment =
            document.createDocumentFragment();


        for (
            var i = 0;
            i < shown;
            i++
        ) {

            fragment.appendChild(
                createCard(
                    state.filtered[i]
                )
            );

        }


        grid.appendChild(
            fragment
        );


        /*
         * Result info
         */

        resultInfo.style.display =
            'block';


        resultInfo.innerHTML =

            'Showing <strong>' +
                shown +
            '</strong> of <strong>' +
                total +
            '</strong> videos';


        /*
         * Load more
         */

        if (shown < total) {

            loadMoreWrap.style.display =
                'block';

        } else {

            loadMoreWrap.style.display =
                'none';

        }


        updateSearchStatus();

    }



    /* =====================================================
       SEARCH
    ===================================================== */

    function applySearch() {

        var keyword =
            state.keyword
                .toLowerCase()
                .trim();


        state.filtered =
            state.videos.filter(
                function (video) {

                    var text = (

                        video.title +
                        ' ' +

                        video.slug +
                        ' ' +

                        video.id

                    ).toLowerCase();


                    var keywordMatches =

                        keyword === '' ||

                        text.indexOf(
                            keyword
                        ) !== -1;


                    var typeMatches =

                        state.type === 'all' ||

                        video.type ===
                            state.type;


                    return (
                        keywordMatches &&
                        typeMatches
                    );

                }
            );


        state.visible =
            CONFIG.perPage;


        renderVideos();

    }



    function updateSearchStatus() {

        var activeSearch =

            state.keyword !== '' ||

            state.type !== 'all';


        if (!activeSearch) {

            searchStatus.style.display =
                'none';

            searchStatus.innerHTML =
                '';

            return;

        }


        searchStatus.style.display =
            'block';


        searchStatus.textContent =

            state.filtered.length +
            (
                state.filtered.length === 1
                    ? ' video found'
                    : ' videos found'
            );

    }



    /* =====================================================
       UI STATES
    ===================================================== */

    function hideStates() {

        loading.style.display =
            'none';

        error.style.display =
            'none';

        empty.style.display =
            'none';

    }



    function showLoading() {

        grid.innerHTML = '';

        resultInfo.style.display =
            'none';

        loadMoreWrap.style.display =
            'none';

        error.style.display =
            'none';

        empty.style.display =
            'none';

        loading.style.display =
            'block';

    }



    function showError() {

        grid.innerHTML = '';

        loading.style.display =
            'none';

        empty.style.display =
            'none';

        resultInfo.style.display =
            'none';

        loadMoreWrap.style.display =
            'none';

        error.style.display =
            'block';

    }



    /* =====================================================
       EVENTS
    ===================================================== */

    searchInput.addEventListener(
        'input',
        debounce(
            function () {

                state.keyword =
                    searchInput.value;

                applySearch();

            },
            CONFIG.debounceTime
        )
    );



    searchType.addEventListener(
        'change',
        function () {

            state.type =
                searchType.value;

            applySearch();

        }
    );



    searchForm.addEventListener(
        'submit',
        function (event) {

            event.preventDefault();


            state.keyword =
                searchInput.value;


            state.type =
                searchType.value;


            applySearch();


            /*
             * Scroll to videos
             */

            var section =
                document.querySelector(
                    '.gallery-section'
                );


            if (section) {

                section.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

            }

        }
    );



    loadMoreBtn.addEventListener(
        'click',
        function () {

            state.visible +=
                CONFIG.perPage;


            renderVideos();

        }
    );



    retryBtn.addEventListener(
        'click',
        function () {

            fetchVideos();

        }
    );



    /* =====================================================
       START
    ===================================================== */

    fetchVideos();


})();