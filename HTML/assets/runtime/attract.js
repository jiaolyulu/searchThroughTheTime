/**
 * This script has a variable time interval in which it examines a state machine.
 * Depending on lack of user-interaction, the attract loop will appear.
 * The timer only runs while the app is in the timeline state.
 * If a user engages during the attract loop state, the animation will change
 * immediately and the attract loop will exit to show the timeline.
 */


/**Variables */


const activityTimer = 190; // seconds to test for inactivity

// state management
let userHasScrolled = false;
let userHasClicked = false;
let attractLoopVisible = false;
let ignoreUserInput = false; // flag to ignore user input during into/exit attract loop animations
// gsap animation
let portalTween;
// events
let attractEvent; // fired to alert other components to experience state (used for disabling timeline scrolling, etc)

console.log('ATTRACT: attract.js loaded...');

/**Handle User Events */


window.onwheel = function (e) {
    console.log('ATTRACT: USER SCROLLED');
    userHasScrolled = true;
    if (attractLoopVisible && !ignoreUserInput) {
        ignoreUserInput = true;
        startExitAnimation();
    }
};
window.onclick = function (e) {
    console.log('ATTRACT: USER CLICKED');
    userHasClicked = true;
    if (attractLoopVisible && !ignoreUserInput) {
        ignoreUserInput = true;
        startExitAnimation();
    }
};
// DEV (to remove): listen for custom event we fire when view change happens in either direction to make sure it fires
window.addEventListener('ATTRACT_ENABLED', (e) => console.log(`ATTRACT: CUSTOM EVENT FIRED!!!!! Value: ${e.detail} varialble: ${attractLoopVisible}`));


/**State Machine & Interval Logic */

// function to be called by setInterval (this runs during timeline view and tests to engage attract loop)
const checkForInactivity = () => {
    console.log(`TIMEOUT: ATTRACT: userhasclicked:${userHasClicked}, userhasscrolled:${userHasScrolled}, attractloopvisible:${attractLoopVisible} `);
    if (!attractLoopVisible && (!userHasClicked && !userHasScrolled)) {
        // if user hasn't engaged the main timeline screen for {activityTimer} time, turn on the attract loop
        console.log(`ATTRACT: No user activity in ${activityTimer} seconds reported on timeline view`);
        // start attract loop animation
        startIntroAnimation();
        gsap.timeline().to(document.getElementById('Stage'), {
            opacity: 0,
            duration: 1.5,
            onComplete: () => {
                // toggle the attract loop div
                toggleAttractLoop();
                // fire event for attract loop toggled
                fireAttractLoopMsg();
                // clear interval
                clearInterval(userTimeout);
                // update state to allow user clicks to be recorded again (turned off during attract loop exit animation execution)
                ignoreUserInput = false;
            }
        });
    } else {
        console.log('ATTRACT: no state change required');
        resetUserInteractedStates();
    }
};

// set interval to check state and start attract loop
let userTimeout = setInterval(checkForInactivity, activityTimer * 1000);


// function to toggle the attract loop and clean up the state machine
function toggleAttractLoop() {
    console.log('ATTRACT: toggleAttractLoop');
    // toggle the attract loop div
    const el = document.getElementsByClassName('attractLoopScr');
    const stage = document.getElementById("Stage");
    if (attractLoopVisible) {
        el[0].style.display = 'none';
        stage.style.display = 'flex';
    } else {
        el[0].style.display = 'flex';
        stage.style.display = 'none';
    }
    resetUserInteractedStates();
    attractLoopVisible = !attractLoopVisible;
    // console.log(`TOGGLE: ATTRACT: userhasclicked:${userHasClicked}, userhasscrolled:${userHasScrolled}, attractloopvisible:${attractLoopVisible} `);
}

// helper function to clean up user state excluding the attractLoopVisible flag
function resetUserInteractedStates() {
    console.log('ATTRACT: cleanup user state');
    // user interaction state management
    if (userHasClicked) userHasClicked = !userHasClicked;
    if (userHasScrolled) userHasScrolled = !userHasScrolled;
}

function fireAttractLoopMsg() {
    attractEvent = new CustomEvent('ATTRACT_ENABLED', { detail: attractLoopVisible });
    window.dispatchEvent(attractEvent);
}

function fireIntroAnimationMsg() {
    let introEvent = new CustomEvent('INTRO_ANIMATION');
    window.dispatchEvent(introEvent);
}

/** ANIMATIONS */

// function to start the attract animation
function startIntroAnimation() {
    portalTween = gsap.timeline()
        .to(document.getElementsByClassName('attractLoopScr'), { opacity: 1, })
        .fromTo('#portal', { scale: 0, rotation: 0 }, { scale: 1, rotation: 360, ease: 'none', duration: 5, paused: false })
    //.from('#portal', { rotation: -360, duration: 10, ease: 'none', repeat: -1 });
}

// function to start the exit attract loop animation
function startExitAnimation() {
    console.log('ATTRACT: starting startExitAnimation');
    portalTween = gsap.timeline()
        .to('#portal', {
            scale: 0,
            rotation: 360,
            ease: 'none',
            duration: 1,
            paused: false
        })
        .to(document.getElementsByClassName('attractLoopScr'), {
            opacity: 0,
            duration: 1,
            onComplete: startExitAnimationHelper,
        })
        .to(document.getElementById('Stage'), {
            opacity: 1,
            duration: 2
        });
}
// helper function for exit animation's onComplete callback
function startExitAnimationHelper() {
    fireIntroAnimationMsg();
    // portalTween = gsap.fromTo('.attractLoopScr', {opacity:1 }, {opacity: 0, duration: 3, })
    toggleAttractLoop(); // hide attract loop
    // fire attract loop message for other components
    fireAttractLoopMsg();
    userTimeout = setInterval(checkForInactivity, activityTimer * 1000); // set a new timer for the timeline view
}

/**
 * TODO:
 * 1. Prevent scrolling while in attract loop from affecting timeline
 * 2. Why is the right circle arrow from the timeline visible in the attract view?
 * 3. Sometimes mouse clicks dont register...
 */
