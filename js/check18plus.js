(function () {

    'use strict';


    /* =========================================
       CONFIG
    ========================================= */

    var STORAGE_KEY = 'amazing_video_age_status';

    var STATUS_VERIFIED = 'verified';

    var STATUS_RESTRICTED = 'restricted';



    /* =========================================
       ELEMENTS
    ========================================= */

    var ageOverlay =
        document.getElementById('avAgeOverlay');

    var restrictedPage =
        document.getElementById('avRestrictedPage');

    var yesButton =
        document.getElementById('avAgeYes');

    var noButton =
        document.getElementById('avAgeNo');



    /* =========================================
       HELPERS
    ========================================= */

    function lockPage() {

        document.body.classList.add(
            'av-age-locked'
        );

    }



    function unlockPage() {

        document.body.classList.remove(
            'av-age-locked'
        );

    }



    function hideEverything() {

        if (ageOverlay) {
            ageOverlay.classList.remove(
                'is-visible'
            );
        }

        if (restrictedPage) {
            restrictedPage.classList.remove(
                'is-visible'
            );
        }

    }



    /* =========================================
       SHOW AGE POPUP
    ========================================= */

    function showAgeVerification() {

        hideEverything();

        lockPage();

        if (ageOverlay) {

            ageOverlay.classList.add(
                'is-visible'
            );

        }

    }



    /* =========================================
       ALLOW WEBSITE
    ========================================= */

    function allowWebsite() {

        localStorage.setItem(
            STORAGE_KEY,
            STATUS_VERIFIED
        );

        hideEverything();

        unlockPage();

    }



    /* =========================================
       BLOCK WEBSITE
    ========================================= */

    function restrictWebsite() {

        localStorage.setItem(
            STORAGE_KEY,
            STATUS_RESTRICTED
        );

        hideEverything();

        lockPage();

        if (restrictedPage) {

            restrictedPage.classList.add(
                'is-visible'
            );

        }

    }



    /* =========================================
       CHECK SAVED STATUS
    ========================================= */

    function checkAgeStatus() {

        var status =
            localStorage.getItem(
                STORAGE_KEY
            );


        /*
         * Already verified
         */

        if (status === STATUS_VERIFIED) {

            hideEverything();

            unlockPage();

            return;

        }


        /*
         * User previously selected NO
         */

        if (status === STATUS_RESTRICTED) {

            hideEverything();

            lockPage();

            restrictedPage.classList.add(
                'is-visible'
            );

            return;

        }


        /*
         * First Visit
         */

        showAgeVerification();

    }



    /* =========================================
       EVENTS
    ========================================= */

    if (yesButton) {

        yesButton.addEventListener(
            'click',
            function () {

                allowWebsite();

            }
        );

    }



    if (noButton) {

        noButton.addEventListener(
            'click',
            function () {

                restrictWebsite();

            }
        );

    }



    /* =========================================
       INIT
    ========================================= */

    checkAgeStatus();


})();





















