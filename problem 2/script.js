
// get DOM elements
const start_btn = document.getElementById("start");
const pause_resume_btn = document.getElementById("pause_resume");
const hour_input = document.getElementById("hours");
const min_input = document.getElementById("minutes");
const sec_input = document.getElementById("seconds");
const countdown = document.getElementById("countdown");

// create observables from click events
const start$ = rxjs.fromEvent(start_btn, "click");
const pauseResume$ = rxjs.fromEvent(pause_resume_btn, "click");
const inputs = [hour_input, min_input, sec_input];

// error checking
inputs.forEach(input => {
    rxjs.fromEvent(input, 'input').subscribe((event) => {
        event.target.value = event.target.value.replace(/[-.]/g, '');
    });
});

// create a BehaviorSubject with an initial value of false
const isPaused$ = new rxjs.BehaviorSubject(false); 

// subscribe to isPaused$ to change the text of the pause/resume button
isPaused$.subscribe(() => {
    pause_resume_btn.innerHTML = isPaused$.value ? "&#9658; RESUME" : "&#9612;&#9612; PAUSE";
});

// subscribe to pauseResume$ to toggle the value of isPaused$
pauseResume$.subscribe(() => {
    isPaused$.next(!isPaused$.value);
});


let isRunning = false;
let elapsedSeconds = 0;

// subscribe to start$ to start the timer
start$.pipe(
    // when tapped, set isPaused$ to false and isRunning to true
    rxjs.tap(() => {
        isPaused$.next(false);
        isRunning = true;
    }),
    // switchMap to a new observable that emits the remaining seconds
    rxjs.switchMap(() => {
        elapsedSeconds = 0;

        // create observables from the input fields
        const sec$ = rxjs.fromEvent(sec_input, "input").pipe(
            // if the timer is running, ignore the input event 
            rxjs.filter(() => !isRunning),
            // convert the value of the input field to number
            rxjs.map(event => Number(event.target.value)),
            // start with the current value of the input field
            rxjs.startWith(sec_input.value ? Number(sec_input.value) : 0)
        );

        // same as above except it subscribes to the sec$ observable
        const min$ = sec$.pipe(
            rxjs.switchMap(() => rxjs.fromEvent(min_input, "input").pipe(
                rxjs.filter(() => !isRunning),
                rxjs.map(event => Number(event.target.value)),
                rxjs.startWith(min_input.value ? Number(min_input.value) : 0)
            ))
        );

        // same as above except it subscribes to the min$ observable
        const hour$ = min$.pipe(
            rxjs.switchMap(() => rxjs.fromEvent(hour_input, "input").pipe(
                rxjs.filter(() => !isRunning),
                rxjs.map(event => Number(event.target.value)),
                rxjs.startWith(hour_input.value ? Number(hour_input.value) : 0)
            ))
        );

        // combine the three observables into one
        const countdownTime$ = rxjs.combineLatest([hour$, min$, sec$]).pipe(
            rxjs.map(([hours, minutes, seconds]) => hours * 3600 + minutes * 60 + seconds + 1)
        );

        // create an observable that emits every second
        const countdown$ = countdownTime$.pipe(
            rxjs.switchMap(totalSeconds => {
                // return an observable that emits the remaining seconds
                return rxjs.interval(1000).pipe(
                    // start with the total seconds
                    rxjs.startWith(totalSeconds),
                    // if the timer is paused, ignore the interval event
                    rxjs.filter(() => !isPaused$.value),
                    // map the interval event to the remaining seconds
                    rxjs.map(i => {
                        elapsedSeconds++;
                        return totalSeconds - elapsedSeconds;
                    }),
                    rxjs.take(totalSeconds),
                    rxjs.takeUntil(start$)
                );
            })
        );
        return countdown$;
    }))

    // functionality for countdown to work with timer
    .subscribe(remainingSeconds => {
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = remainingSeconds % 60;
    
        const hours_show = hours < 10 ? `0${hours}` : `${hours}`;
        const mins_show = minutes < 10 ? `0${minutes}` : `${minutes}`;
        const secs_show = seconds < 10 ? `0${seconds}` : `${seconds}`;
    
        countdown.innerHTML = `${hours_show}:${mins_show}:${secs_show}`;
    
        if (remainingSeconds === 0) {
            countdown.classList.add('reachedZero');
        } else {
            countdown.classList.remove('reachedZero');
        }
    });