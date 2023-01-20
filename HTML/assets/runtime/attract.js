const activityTimer = 10; // seconds to test for inactivity
let userHasScrolled = false;
let userHasClicked = false;
let attractLoopVisible = false;

console.log('ATTRACT: attract.js loaded...');

window.onwheel = function (e) {
    console.log('ATTRACT: USER SCROLLED');
    userHasScrolled = true;
};
window.onclick = function (e) {
    console.log('ATTRACT: USER CLICKED');
    userHasClicked = true;
};


const userTimeout = setInterval(() => {
    if (!attractLoopVisible && (!userHasClicked && !userHasScrolled)) {
        // if user hasn't engaged the main screen for x time, turn on the attract loop
        // clearInterval(userTimeout);
        console.log(`ATTRACT: No user activity in ${activityTimer} seconds reported on timeline view`);
        toggleAttractLoop();
    } else if (attractLoopVisible & (userHasClicked || userHasScrolled)) {
        // if attrack loop is on and user engages, go to content timeline
        console.log('ATTRACT: User engaged with attract loop, return to timeline');
        toggleAttractLoop();
    } else {
        console.log('ATTRACT: no state change required');
        cleanUpUserState();
    }
}, activityTimer * 1000);

function toggleAttractLoop() {
    // toggle the attract loop div
    const el = document.getElementsByClassName('attractloop');
    !attractLoopVisible ? el[0].style.display = 'block' : el[0].style.display = 'none';
    cleanUpUserState();
    attractLoopVisible = !attractLoopVisible;
    console.log(`ATTRACT: userhasclicked:${userHasClicked}, userhasscrolled:${userHasScrolled}, attractloopvisible:${attractLoopVisible} `);
}

function cleanUpUserState() {
    // user interaction state management
    if (userHasClicked) userHasClicked = !userHasClicked;
    if (userHasScrolled) userHasScrolled = !userHasScrolled;
}

/**
 * TODO:
 * 1. Prevent scrolling while in attract loop from affecting timeline
 */
