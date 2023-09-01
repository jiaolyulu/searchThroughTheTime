/**
 * This script has a variable time interval in which it examines a state machine.
 * Depending on lack of user-interaction, the attract loop will appear.
 * The timer only runs while the app is in the timeline state.
 * If a user engages during the attract loop state, the animation will change
 * immediately and the attract loop will exit to show the timeline.
 */

/**Variables */
let activityTimer = 60;
// set interval to check state and start attract loop

// state management
let userHasScrolled = false;
let userHasClicked = false;
let interationState = null;
let attractLoopVisible = false;
let ignoreUserInput = false; // flag to ignore user input during into/exit attract loop animations

// events
let attractEvent; // fired to alert other components to experience state (used for disabling timeline scrolling, etc)

const fireStartInteractionMsg = () => {
    if (interationState !== "started") {
        interationState = "started";
        let startInteractionEvent = new CustomEvent("START_INTERACTION", {});
        window.dispatchEvent(startInteractionEvent);
    }
};
const fireEndInteractionMsg = () => {
    if (interationState === "started") {
        interationState = "ended";
        let endInteractionEvent = new CustomEvent("END_INTERACTION", {});
        window.dispatchEvent(endInteractionEvent);
    }
};

window.onwheel = function (e) {
    //console.log('ATTRACT: USER SCROLLED');

    fireStartInteractionMsg();

    userHasScrolled = true;

    if (attractLoopVisible && !ignoreUserInput) {
        ignoreUserInput = true;
        startExitAnimation();
    }
};
window.onclick = function (e) {
    //console.log('ATTRACT: USER CLICKED');
    fireStartInteractionMsg();
    userHasClicked = true;

    if (attractLoopVisible && !ignoreUserInput) {
        ignoreUserInput = true;
        startExitAnimation();
    }
};

window.addEventListener("GB_STATE_CHANGED", (e) => {
    console.log("GB_STATE_CHANGED", e);
    activityTimer = e.detail.attractTimer;
    clearInterval(userTimeout);
    restartActivityTimer();
});

/**State Machine & Interval Logic */

// function to be called by setInterval (this runs during timeline view and tests to engage attract loop)
const checkForInactivity = () => {
    console.log(
        `TIMEOUT: ATTRACT: userhasclicked:${userHasClicked}, userhasscrolled:${userHasScrolled}, attractloopvisible:${attractLoopVisible} `
    );
    if (!attractLoopVisible && !userHasClicked && !userHasScrolled) {
        // if user hasn't engaged the main timeline screen for {activityTimer} time, turn on the attract loop
        console.log(
            `ATTRACT: No user activity in ${activityTimer} seconds reported on timeline view`
        );
        // start attract loop animation
        startIntroAnimation();
        gsap.timeline().to(document.getElementById("Stage"), {
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
            },
        });
    } else {
        console.log("ATTRACT: no state change required");
        resetUserInteractedStates();
    }
};

let userTimeout = setInterval(checkForInactivity, activityTimer * 1000);

const restartActivityTimer = () => {
    userTimeout = setInterval(checkForInactivity, activityTimer * 1000);
};

// function to toggle the attract loop and clean up the state machine
function toggleAttractLoop() {
    console.log("ATTRACT: toggleAttractLoop");
    // toggle the attract loop div
    const el = document.getElementsByClassName("attractLoopScr");
    const stage = document.getElementById("Stage");
    if (attractLoopVisible) {
        el[0].style.display = "none";
        stage.style.display = "flex";
        let unmountEvent = new CustomEvent("UNMOUNT");
        window.dispatchEvent(unmountEvent);
    } else {
        el[0].style.display = "flex";
        let renderEvent = new CustomEvent("RENDER");
        window.dispatchEvent(renderEvent);
        stage.style.display = "none";
    }
    resetUserInteractedStates();
    attractLoopVisible = !attractLoopVisible;
    // console.log(`TOGGLE: ATTRACT: userhasclicked:${userHasClicked}, userhasscrolled:${userHasScrolled}, attractloopvisible:${attractLoopVisible} `);
}

// helper function to clean up user state excluding the attractLoopVisible flag
function resetUserInteractedStates() {
    console.log("ATTRACT: cleanup user state");
    // user interaction state management
    if (userHasClicked) userHasClicked = !userHasClicked;
    if (userHasScrolled) userHasScrolled = !userHasScrolled;
}

function fireAttractLoopMsg() {
    attractEvent = new CustomEvent("ATTRACT_ENABLED", {
        detail: attractLoopVisible,
    });
    window.dispatchEvent(attractEvent);
}

function fireIntroAnimationMsg() {
    let introEvent = new CustomEvent("INTRO_ANIMATION");
    window.dispatchEvent(introEvent);
}

/** ANIMATIONS */

// function to start the attract animation
function startIntroAnimation() {
    fireEndInteractionMsg();

    portalTween = gsap
        .timeline()
        .to(document.getElementsByClassName("attractLoopScr"), {
            opacity: 1,
            duration: 1.5,
        });
}

// function to start the exit attract loop animation
function startExitAnimation() {
    console.log("ATTRACT: starting startExitAnimation");
    portalTween = gsap
        .timeline({
            onStart: () => {
                let exitEvent = new CustomEvent("EXIT_ANIMATION");
                window.dispatchEvent(exitEvent);
            },
        })
        .to(
            document.getElementsByClassName("attractLoopScr"),
            {
                opacity: 0,
                duration: 2,
                onComplete: startExitAnimationHelper,
            },
            1
        )
        .to(document.getElementById("Stage"), {
            opacity: 1,
            duration: 2,
        });
}
// helper function for exit animation's onComplete callback
function startExitAnimationHelper() {
    fireIntroAnimationMsg();
    toggleAttractLoop(); // hide attract loop
    // fire attract loop message for other components
    fireAttractLoopMsg();
    restartActivityTimer();
}
