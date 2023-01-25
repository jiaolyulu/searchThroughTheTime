/**
 * This script has a variable time interval in which it examines a state machine.
 * Depending on lack of user-interaction, the attract loop will appear.
 * If a user engages during the attract loop state, the animation will change
 * immediately and the attract loop will exit to show the timeline.
 */


/**Variables */

const activityTimer = 9; // seconds to test for inactivity
let userHasScrolled = false;
let userHasClicked = false;
let attractLoopVisible = false;
let portalTween;

console.log('ATTRACT: attract.js loaded...');

/**Handle User Events */

window.onwheel = function (e) {
    console.log('ATTRACT: USER SCROLLED');
    userHasScrolled = true;
    if (attractLoopVisible) {
        startExitAnimation();
    }
};
window.onclick = function (e) {
    console.log('ATTRACT: USER CLICKED');
    userHasClicked = true;
    if (attractLoopVisible) {
        startExitAnimation();
    }
};


/**State Machine & Interval Logic */

// function to be called on the interval
const timeOutLogic = () => {
    console.log(`TIMEOUT: ATTRACT: userhasclicked:${userHasClicked}, userhasscrolled:${userHasScrolled}, attractloopvisible:${attractLoopVisible} `);
    if (!attractLoopVisible && (!userHasClicked && !userHasScrolled)) {
        // if user hasn't engaged the main screen for x time, turn on the attract loop
        console.log(`ATTRACT: No user activity in ${activityTimer} seconds reported on timeline view`);
        toggleAttractLoop();
        initAnimation();
    } else if (attractLoopVisible & (userHasClicked || userHasScrolled)) {
        // if attrack loop is on and user engages, go to content timeline
        // console.log('ATTRACT: User engaged with attract loop, return to timeline');
        // toggleAttractLoop();
    } else {
        console.log('ATTRACT: no state change required');
        cleanUpUserState();
    }
};

// set interval to check state
let userTimeout = setInterval(timeOutLogic, activityTimer * 1000);


// function to toggle the attract loop and clean up the state machine
function toggleAttractLoop() {
    console.log('ATTRACT: toggleAttractLoop');
    // toggle the attract loop div
    const el = document.getElementsByClassName('attractLoopScr');
    !attractLoopVisible ? el[0].style.display = 'flex' : el[0].style.display = 'none';
    cleanUpUserState();
    attractLoopVisible = !attractLoopVisible;
    console.log(`TOGGLE: ATTRACT: userhasclicked:${userHasClicked}, userhasscrolled:${userHasScrolled}, attractloopvisible:${attractLoopVisible} `);
}

// helper function to clean up user state excluding the attractLoopVisible flag
function cleanUpUserState() {
    console.log('ATTRACT: cleanup user state');
    // user interaction state management
    if (userHasClicked) userHasClicked = !userHasClicked;
    if (userHasScrolled) userHasScrolled = !userHasScrolled;
}



/** ANIMATIONS */

// function to start the attract animation
function initAnimation() {
    portalTween = gsap.to('#portal', { scale: 1, rotation: 360, ease: 'none', duration: 10, repeat: -1, paused: false });
}

// function to start the exit attract loop animation
function startExitAnimation() {
    console.log('ATTRACT: starting startExitAnimation');
    portalTween = gsap.to('#portal', {
        scale: 0,
        rotation: -360,
        ease: 'none',
        duration: 3,
        paused: false,
        onComplete: startExitAnimationHelper
    });
}
// helper function for exit animation's onComplete callback
function startExitAnimationHelper() {
    toggleAttractLoop();
    clearInterval(userTimeout);
    userTimeout = setInterval(timeOutLogic, activityTimer * 1000);
    userHasClicked = true; // start the next cycle with this as true so we dont jump right back to attract loop
}

/**
 * TODO:
 * 1. Prevent scrolling while in attract loop from affecting timeline
 * 2. Check on mouse clicks not being recorded anymore
 * 3. Why is the right arrow from the timeline visible in the attract view?
 */
