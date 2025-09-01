+++
title = "VLC 3.x Out of Bounds Read in Seconds"
description = "A slip up in time"
date = 2022-12-07

[extra]
image = true
unlisted = false
+++

{% callout(type="info") %}
References of `secstotimestr` were from before it was renamed to `vlc_tick_to_str` as a result of a commit found [here](https://code.videolan.org/videolan/vlc/-/commit/3475f8e972a2d54343ec36c2b35424f5406f7d56).
`i_seconds` was also renamed to `ticks` with the type `vlc_tick_t` in [this commit](https://code.videolan.org/videolan/vlc/-/commit/a59cb66257cfee50568fd4868c795f4e25f1fe98). For the purposes of keeping it simple, the parameter change will not be reflected here.
{% end %}

Like any other day on Discord, I would come across specially crafted WEBM files that would mess around with the duration of the video.
This usually results in media players:

-   Video duration being the same as the current duration count (incrementing as the play time exceeds the fake video duration time)
-   Videos being able to seemingly stop early
-   Very long video duration that is never reached (video stops at its actual total playback time)

## The unusual encounter

On January 14 2021, I had came across a video named `chinax.webm` (can be downloaded [here](assets/chinax.webm)).
When playing back the video on Discord in the Electron desktop application, it presented something I had never seen before. The times shown were in the negatives.

{% figure(src="assets/discord_playback.webp", alt="Discord media player") %}
Discord media player duration looking a little out of wack
{% end %}

On Google Chrome, this shown slightly different behaviour.

{% figure(src="assets/chrome_playback.webp", alt="Chrome media player") %}
Chrome media player has not too dissimilar behaviour in comparison
{% end %}

It is worth noting that Discord uses a modified version of the media player. Yes, this did result in some unique bugs that went as far as crashing the entire client.

Now, what about VLC media player? Lets check that one ou--

{% figure(src="assets/vlc_crash.webp", alt="VLC media player crash") %}
VLC media player crashed
{% end %}

Ah, right.

## Digging in

My first attempt to try debugging this was by running VLC via CMD with the verbose flag. There was no output at all. It so turns out that if I want a clearer picture of what is going on, I have to use something else.

I had spun up a Ubuntu virtual machine. I then re-attempted. It said nothing really new. Just that there was a segmentation fault.

{% figure(src="assets/vlc_seg1.webp", alt="VLC media player segfault 1") %}
Segmentation faults in the first few attempts
{% end %}

{% figure(src="assets/vlc_seg2.webp", alt="VLC media player segfault 2") %}
And again...
{% end %}

Evidently, not very useful. Plan B? GDB. That is the correct approach to debugging such software.

{% figure(src="assets/gdb_1.webp", alt="GDB outputted responsible function") %}
GDB to the rescue!
{% end %}

This revealed that the at-the-time `secstotimestr` was causing the application to crash.

{% figure(src="assets/gdb_2.webp", alt="GDB outputted the meta duration") %}
The duration in the negatives
{% end %}

GDB also helped reveal the fake duration that would have been shown at first.

## The source

Reviewing the commit found [here](https://code.videolan.org/videolan/vlc/-/blob/cc129a71d75220c0600727aa1f7b984e60f83c0c/src/misc/mtime.c#L41) (`src/misc/mtime.c`), the code looked very off.

`src/misc/mtime.c`

```cpp
char *secstotimestr( char *psz_buffer, int32_t i_seconds )
{
    if( unlikely(i_seconds < 0) )
    {
        secstotimestr( psz_buffer + 1, -i_seconds );
        *psz_buffer = '-';
        return psz_buffer;
    }

    // ...

    return psz_buffer;
}
```

To get a better understanding of the issue, I decided to compile a few builds.

## VLC 4 dev compilation and testing

My initial assumption was that the long unreleased VLC 4 dev build would be affected as it appeared to have the same code. Au contraire, mon ami.

{% figure(src="assets/vlc4_compilation.webp", alt="VLC 4 dev compilation") %}
Compiling VLC 4 dev
{% end %}

{% figure(src="assets/vlc4_playback.webp", alt="VLC 4 dev playback") %}
Testing playback on VLC 4 dev
{% end %}

{% figure(src="assets/vlc4_duration.webp", alt="VLC 4 dev duration") %}
Nothing appeared to have changed in terms of the meta duration
{% end %}

VLC 4 appeared to be unaffected. This may have been as a result of the adjustments made under [this commit](https://code.videolan.org/videolan/vlc/-/commit/a59cb66257cfee50568fd4868c795f4e25f1fe98).

## VLC 3 compilation and debugging

After compiling (unoptimised) the most recent VLC 3 build at the time, I tested the video again and it still crashed. I then went and used GDB. This painted a clear image as to what was going on.

{% figure(src="assets/gdb_unopt.webp", alt="VLC 3 unoptimised build GDB with crash presented") %}
Buffer out-of-bounds read in action
{% end %}

## The bug

There was an integer overflow with `i_seconds` of which was using the type `int32_t` (32-bit signed integer).
The urinary operator has undefined behaviour when it comes to overflowed or underflowed integers. Basically, it ended up not making the integer into a positive number and so it remained in the negatives.

As `i_seconds` would remain in the negatives, it would be in a position where it would keep meeting the condition and the function would recursively call itself. It would as a result keep incrementing and going through the buffer. This goes through the application's own memory. Eventually, it causes a memory violation and then the application's process ends with SIGSEGV signal (segmentation fault).

## Further visualising the issue

To better observe the behaviour, I had created a test program with the specific affected parts of the code.

```cpp
#include <stdio.h>
#include <stdlib.h>

int loops = 0;

char *secstotimestr( char *psz_buffer, int32_t i_seconds )
{
    printf("%s\n", "-------- secstotimestr() exec --------");
    printf("Loops: %i\n", loops);
    printf("Seconds while executing function: %d\n", i_seconds);
    printf("Buffer output while executing function: %s\n", psz_buffer);
    ++loops;

    if ( i_seconds < 0 )
    {
        printf("%s\n", "-------- i_seconds < 0 --------");
        printf("Pre-seconds: %d\n", i_seconds);
        printf("Pre-buffer output: %s\n", psz_buffer);

        secstotimestr( psz_buffer + 1, -i_seconds );
        *psz_buffer = '-';

        printf("Post-seconds: %d\n", i_seconds);
        printf("Post-buffer output: %s\n", psz_buffer);
        printf("%s\n", "-------------------------------");
        return psz_buffer;
    }

    printf("%s", "Passed block!\n");
    printf("Passed buffer output: %s\n", psz_buffer);
    printf("%s\n", "-------------------------------");

    return psz_buffer;
}

int main()
{
    char ptz[22];
    int32_t seconds = 2147483648;

    //printf("%i :: %i\n", seconds, -seconds);

    secstotimestr(ptz, seconds);

    return 0;
}
```

This had resulted in the following output:

```
-------- i_seconds < 0 --------
Pre-seconds: -2147483648
Pre-buffer output: x86_64
-------- secstotimestr() exec --------
Loops: 833
Seconds while executing function: -2147483648
Buffer output while executing function: 86_64
-------- i_seconds < 0 --------
Pre-seconds: -2147483648
Pre-buffer output: 86_64
-------- secstotimestr() exec --------
Loops: 834
Seconds while executing function: -2147483648
Buffer output while executing function: 6_64
-------- i_seconds < 0 --------
Pre-seconds: -2147483648
Pre-buffer output: 6_64
-------- secstotimestr() exec --------
Loops: 835
Seconds while executing function: -2147483648
Buffer output while executing function: _64
-------- i_seconds < 0 --------
Pre-seconds: -2147483648
Pre-buffer output: 64
-------- secstotimestr() exec --------
Loops: 836
Seconds while executing function: -2147483648
Buffer output while executing function: 64
-------- i_seconds < 0 --------
Pre-seconds: -2147483648
Pre-buffer output: 64
-------- secstotimestr() exec --------
Loops: 837
Seconds while executing function: -2147483648
Buffer output while executing function:
-------- i_seconds < 0 --------
Pre-seconds: -2147483648
Pre-buffer output: 4
-------- secstotimestr() exec --------
Loops: 838
Seconds while executing function: -2147483648
Buffer output while executing function:
-------- i_seconds < 0 --------
Pre-seconds: -2147483648
Pre-buffer output:
-------- secstotimestr() exec --------
Loops: 839
Seconds while executing function: -2147483648
Buffer output while executing function: /vuldemo
-------- i_seconds < 0 --------
Pre-seconds: -2147483648
```

## A second pair of eyes

At the time of writing, there is this trend of using the GPT-3.5 based ChatGPT AI (while it is still 'free').

There had been talk about it writing code as well as identifying issues. So, why not give it my test code as something to review?

The following is a snippet of what came back after the prompt to look out for any security vulnerabilities or bugs:

```
Second, the code calls `secstotimestr` recursively without checking for a maximum recursion depth. This could cause a stack overflow if the input `i_seconds` is negative and large enough.
Third, the code does not check for integer overflow when converting the input `i_seconds` to a string. This could cause an incorrect string to be returned or even a crash if the input is large enough.
Finally, the code does not check the size of the `psz_buffer` array before writing to it. This could cause a buffer overflow if the input `¡_seconds` is large and the `psz_buffer` array is not big enough to hold the resulting string.
```

This is not completely accurate but it mostly is. More than enough to raise red flags that this was not written safely.

## Severity of the issue

Considering that there are protections against ROP ([return-oriented programming](https://en.wikipedia.org/wiki/Return-oriented_programming)), I do not see a clear path of exploiting this issue through a specially crafted video file when it comes to production builds.
If anything, this is a lesson of what not to do in C++.. or any memory unsafe languages for that matter.
