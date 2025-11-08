+++
title = "QRServ Development and Inconveniences of a Cross-platform Framework"
description = "Cross-platform framework misadventures"
date = 2023-04-03

[extra]
image = true
unlisted = false
+++

{% callout(type="info") %}
This post was updated on 2025-05-04.
{% end %}

QRServ is a cross-platform Flutter application that hosts an HTTP server, which presents a QR code for a URL that, by default, allows a browser or download client to download the selected files. It is officially available via [GitHub](https://github.com/uintdev/qrserv) and the [Google Play Store](https://play.google.com/store/apps/details?id=dev.uint.qrserv).

The concept was inspired by [3dsend](https://github.com/MeatReed/3dsend/tree/1.5.0) ([web archive](https://web.archive.org/web/20230403093912/https://github.com/MeatReed/3dsend/tree/1.5.0)), an Electron-based application.

The original idea was to scan QR codes for use in software featuring 'download via QR code' support on a Nintendo 3DS console with CFW (custom firmware). [Did you know that it is very easy to hack a 3DS?](https://3ds.hacks.guide/)

Having thought about it, it could be useful for getting content onto other devices quickly, such as sharing a photo from Android to iOS.

## Determining the requirements

Mainly, I wanted this to be on a phone for the sake of convenience. I did not want to limit which files were allowed, as that would most certainly be inconvenient.
<br>
I especially did not want to use technologies that require JavaScript. No inefficient or ~~Facebook~~ Meta technologies. React Native at least involves native platform widgets (which, if aiming for a native experience, is better than painting on a canvas), but it also has some pitfalls.

### Keeping it simple

This collectively means there should be absolutely no dependency on having a new app to handle receiving the data. This is a hard requirement. No exceptions. Not for Bluetooth, not for mDNS-SD (for device discovery). Tempting, but no.

The application is also intended to be very simple and for a specific use case rather than a Swiss Army knife.

There are applications such as LocalSend. They are very useful for cross-platform transfer, especially for one's own devices, but they ultimately depend on the same application being installed on the receiving device. This would not work for how QRServ is intended to be used. The use of either application depends on the user's intent and how convenient it might be in their case. As with anything and everything, there will be pros and cons. Use the tool that works best.

Yes, this limits the potential of the application, but I developed the application for myself with the intent to distribute it to anyone who might find it useful. Since then, it has proved useful for at least a thousand users.

### Similar applications exist

Many Android applications already existed at the time for transferring files. However, the QR code feature, or working natively with what was already available on devices (like a browser), was not exactly at the forefront.

The closest I came across at the time was an app that looked very dated and had a QR code button, so the QR code would not be immediately visible. What worsened things was that it depended on an external application for QR code encoding.

Since there was no application that checked all the boxes, it was up to me to do something about it.

## Concept to material

This was an opportunity to use Flutter to develop an application that would be practically useful to me. I had already practiced a lot with developing Flutter applications, but that was just the beginning.

Surprisingly, Flutter, as well as the programming language Dart, offered a lot-such as an HTTP server that can automatically select an unused port to listen on. As I went further into development, however, some things required far more work than I could have anticipated-not in the usual way when newly working with technologies, either.

## Slight hiccups

Flutter is good as a UI framework; I can say that much. It is fairly simple to get one's head around in a short time frame. The following are just a few issues.

### Theming and deprecations

It could do a better job of reliably theming elements with standard names without deprecating them so often or complicating how to theme specific element types. This used up a sizable amount of time throughout various Flutter updates. This is probably becoming less of a pain point as Material 3 has gradually become a thing (there are typically some imperfections in the theme that tries to mimic the real platform widgets).

### Long unresolved bugs

There are some high and low-hanging bugs in Flutter that have not been resolved for years, but these can usually be worked around after a lot of time. As for issues that can not be worked around, well, just hope they won't be a real roadblock.

### Inconsistent build behaviour

Something I should mention is that debug builds behave very differently in general for the sake of fast debugging, but the app itself can function very differently, too, in terms of expected behavior compared to release builds. For example, a state might visibly update in the debug build but not do so at all in the release build.

So, it is crucial to test both builds when making large changes, just in case an issue lurking about cannot be worked around (without large compromises). This sort of behavior has happened various times, and it is no fun to deal with. Save yourself the headache.

### In general

There had been numerous build issues and so forth as time went on, but I will get into that shortly.

## Being very dependant on 3rd party packages

There is a lot I could go on about in great detail, but one of the notable pitfalls I noticed with the Flutter framework was the availability and quality of third-party Flutter packages. This itself carries a lot of issues.

### Limited availability

One of the core features I needed was a way to navigate and select files. There were very few options that supported both Android and Windows platforms.

### Reliance

If you want to use very specific native platform features that the framework normally does not have hooks into, chances are you will need to rely on an existing dependency or put something together yourself.

The problem with dependencies is that... well... it is someone else's work you depend on for the functionality it offers. You end up relying on the maintainer to get things right. Usually, dependencies work exactly as expected. Unfortunately, with some of the packages I chose, it was quite the contrary.

### Bad practices

I wanted my application to be as robust as possible. So, when the file picker did not properly surface platform exceptions from the operating system for me to handle and instead simply assumed it was a file picker user cancellation, that was a very bad approach and went against what I was aiming to achieve.

In this case, I decided to contribute via GitLab-hardly ideal for me, but it is what it is. This ended up being a mess, as a final crucial adjustment I sent off for merging did not get merged (meaning a possible non-user-facing crash upon a platform exception). I then stuck with my own fork, with the appropriate changes, as the dependency.

### Abandoned or barely maintained

When it comes to other packages, they can cause build errors due to dependency version conflicts or reliance on old, unsupported Gradle versions. Those packages tend to be abandoned, so there is no point in issuing a pull request. These had to be forked and depended on with the necessary adjustments.

When Flutter began enforcing null safety in Dart, I helped make the packages I rely on null-safe, even issuing some pull requests for actively maintained projects. Where there was no active maintenance at the time, I published new Flutter packages denoting that they are null-safe with the `_ns` suffix. When some were maintained again and officially made the needed adjustments, I unlisted my publications as appropriate.

### Instability

Another troublesome example of a rarely maintained dependency was the share intent package. The Google Play Console vaguely reported a crash from the dependency related to getting a video file’s duration. Since I didn’t need that specific functionality, I removed it rather than finding a real fix in the Kotlin code called via the method channel. This was eventually resolved with a larger rewrite by the maintainer, but it took a long time.

### The conclusion

This is essentially a case of having to do everything yourself if you want it more or less to your liking, especially with platform integration.

It’s not great to be in such a position too often, especially when it involves dependencies. It’s bad enough as it is to decipher the madness from crash reports that would normally be far more detailed and specific in natively built applications (yes, I included debug symbols). I don’t want to waste too much of my time. Time matters.

When it comes to free and open-source software (FOSS), if something is wrong, it sometimes falls on you to put in the effort to fix it yourself if you really want what you want. That is how it is in general, but it’s even worse when you cannot make certain platform API calls without depending on, or creating, your own wrapper.

## The elephant in the room

Something that may have been noticed is that the latest desktop builds are on `v1.1.1`. Since then, there have been many changes. There is a known bug where the app can fatally crash when selecting certain ZIP archive files-the reason is unknown, but the vague crash log cites the Flutter dynamic library as the source. Whether the bug would still be present if it were built now, I do not know.

Due to the inconvenience of building and testing the applications (especially Linux builds), I do not plan to create such builds anymore. In theory, however, they should build fine. If not, rebuilding those platform directories and manually adjusting the window sizing should do the trick.

Yes, it is not great to claim "cross-platform" when the more recent builds do not include more than one platform, but the desktop builds do exist and function. The specific release entry is also linked in the README.

## The large compromise

As I used Flutter more, issues and limitations became more apparent. Race conditions happened easily and far too often. It took a while to iron those out as much as possible before release. This sort of issue held the `v2.0` release back a little longer than expected when I began working on QRServ again. Even before working on `v2.0`, this was an issue.

One of the major issues that I'm not willing to deal with involves the file import process.

### File importation inconveniences

Some users noticed that QRServ can take time to import large files.

#### Yes, I know

During initial development, the intent was to access files directly from their current storage location. However, due to the move to scoped storage and the preexisting Flutter packages (even at the time of writing) used to facilitate file selection, the selected files were copied from Android's built-in documents/files picker UI and sharesheet into the application's cache folder.

This means a copy of the selected files is made initially, temporarily consuming additional internal storage. These Flutter packages do not expose the full direct path to the selected files.

#### Performance hold ups

On some devices, slow storage can make copying large files into internal storage take an impractically long time. This can also cause an ANR in the case of the sharesheet by blocking the main thread longer than expected.

#### Storage usage

There were efforts to avoid unnecessary storage use under the current circumstances.

For storage usage, the application clears out files that are no longer in use-for example, files selected to be placed into a ZIP archive.

During the file import process, sufficient storage is required to initially accommodate those files. This is even more important with a multi-file selection, as the ZIP archive must also be created before the cache cleanup removes the copies of the selected files.

#### Others are impacted by this

Various Android applications developed with Flutter that involve importing files on Android unfortunately suffer from the same limitations.

Technically, this may be possible to resolve. However, this would involve platform-specific code to call platform APIs in a very specific way. Given how involved that might be, and considering how things function now, there is absolutely no desire to go that route.

#### Expectations

These sorts of struggles are especially likely when working with a framework expected to minimize native, platform-specific code. For one, the user may not know Kotlin well, let alone plan to deal with method channels (a way to communicate with platform-native code that performs platform-specific tasks on behalf of the framework).

## The future

As much as I love challenges, having to work around highly visible bugs and put up with the inconveniences (that a lot of them are long unresolved bugs) for a huge amount of the development time (of which I have not mentioned the half of the issues) that are mainly to do with the framework itself, let alone the dependencies out there, is terrible. No amount of hot reloading or fancy features will make up for that.

### Getting close to burnout

I'd rather have that time go toward implementing functionality and fixing bugs that I end up creating myself.

For something that is supposed to ease cross-platform application development, sure, it is easy to put together a basic app that runs right out of the gate on various platforms, and the UI is not difficult to customize. However, it certainly does not put me at ease when it comes to the functional side of things. The amount of time I spent dealing with issues that should not be happening in the first place... it is ridiculous.

#### I did not sign up to this

When I began working on QRServ, I expected challenges. That's exactly what I got. But it was also far more than I bargained for-the sort that causes too much friction and really puts a hold on things from every corner. Occasional issues to iron out that were not issues before. Or I use something I have not used before (in a certain way), only to find out it does not work correctly.

It was never intended to take a lot of time to put together, but it did. It took an unnecessarily long time to get it where it is today, let alone before the first stable release. Hours add up fast.

#### Bugs will always be a thing

Bugs will happen in programming languages, frameworks, and libraries-anything involving human input being turned into logic. But I would hope that low-hanging issues, especially in basic functionality, do not stay in limbo for years as if they were something on Bugzilla (Mozilla’s bug tracker), if they are to be used in production. This is unlike anything I have seen before, and I have seen bad. It is to the point where it does not feel like it should be used for anything “serious.”

#### The strain

Software development can be enjoyable, but like anything, if you keep hitting brick walls with no sufficiently satisfying resolutions or have to severely compromise the idea you're trying to make a reality, it can be very taxing. You end up fighting against it rather than working with it.

Just as stepping back for a bit can help you figure out how to approach an issue, it also helps if you're exhausted by something outright not playing ball. Reevaluate your approach and try to regain your motivation, or do something else entirely until you feel ready to take a fresh look at it once more.

#### Laying out the cards

Bashing out code is not the only thing I am good at; it is just one of the things I focus on most-the main thing. Perhaps I should try my other hobbies more and widen some avenues in other departments.
In general, that would be wise in any case. Never place all your eggs in one basket.

There is a bit of 'jack of all trades, master of none' if I were to exclude software development from the list. Even then, there are some that I have focused on far more than others, some of which also tend to interconnect.

### Good in some cases

I would say it is more suitable for applications that are not so method-channel-reliant (unless you are willing to write some platform-native code) or for something complex, but apparently there are numerous bugs with basics like forms and text fields. So have fun with that.

### Decisions

I plan to continue maintaining QRServ where necessary.
If I were to create new applications that involve the Android platform (or Windows, for now), Flutter would be my go-to at this time only because it is the more convenient option. I know how to work with it far more than Kotlin or C++ with WinUI (I do not plan to develop anything with C# any time soon), although that side of things is far more likely to be done professionally for the time being.

Tauri is what I aim to use for Windows GUI applications in the future, with none of the JavaScript or web views.

### Reconsidering the approach

Mainly by using very different desktop and mobile platforms, I have a clearer view of how to avoid making the same mistakes. I will use a platform’s native language and tooling to begin with (Swift, SwiftUI-despite hearing UIKit is a bit more mature; I am most definitely not touching Objective-C).

I probably should have scrapped the desktop app idea for QRServ and instead focused on the Android app with the Jetpack Compose toolkit (which I entirely forgot was a thing at the time) with Kotlin. I may go that route for Android projects far into the future so that I have far more control and predictability over behavior.

The Windows app does work and has been useful, but it feels half-baked-at least in appearance. Or that could just be the Windows native UI elements in general. Either way, not great. Plus, that unusual aforementioned bug with at least the Windows build doesn’t do any favors.

## Concluding thoughts

This sort of experience with Flutter has been interesting, but ultimately I feel discouraged from making serious use of it in the future. Which really is a shame.

Whether you should use the Flutter framework is not up to me.
The information I present here is intended as a heads-up on the sort of things to expect-to adjust expectations. Depending on the approach taken, it might be worth it. Maybe dependencies won't be as much of a concern if you can write native platform code yourself. Perhaps some issues can be worked around without too much inconvenience.

Make use of the information as you will, and draw your own conclusions.

I haven't given myself much of an opportunity to explore other avenues again for some time. Usually, this comes down to a lack of ideas about what to produce. Maybe I just need to look around for more inspiration, as I did for graphical illustrations in the past.

~~There might be 'test' music I had thrown together on my main website.~~

I've been exploring other programming languages and technologies. One I have been very satisfied with is Rust. Yes, it is as good as many are making it out to be. 'Rust Analyzer' can be a bit buggy at times, but it is nowhere near as much of a pain to deal with. Overall, it is a gift that keeps on giving.

Our past mistakes make us who we are today. We may not be able to change the past, but we can learn from it and change future outcomes. Do what will give you satisfaction, happiness, and better results in the long run.
