+++
title = "QRServ Development and Inconveniences of a Cross-platform Framework"
description = "The troubles of a cross-platform framework"
date = 2023-04-03

[extra]
unlisted = false
+++

## The origins

QRServ is a cross-platform Flutter application that hosts a HTTP server of which presents a QR code of a URL that by default allows a browser or download client to download the file selection. It is officially available via [GitHub](https://github.com/uintdev/qrserv) and [Google Play Store](https://play.google.com/store/apps/details?id=dev.uint.qrserv).

The concept was inspired by [3dsend](https://github.com/MeatReed/3dsend/tree/1.5.0) ([web archive](https://web.archive.org/web/20230403093912/https://github.com/MeatReed/3dsend/tree/1.5.0)), an Electron-built application.
The idea originally was to be able to scan QR codes for use in software featuring 'download via QR code' support to take advantage of on a Nintendo 3DS console with CFW (custom firmware). [Did you know that it's very easy to hack a 3DS?](https://3ds.hacks.guide/)

Having thought about it, it could be useful for helping get content over to other devices fairly quickly, such as getting a photo from Android to iOS.

## Determining the requirements

Mainly, I wanted for this to be on a phone for the sake of convenience. I did not want to limit what files were allowed, as that would most certainly be inconvenient. I especially did not want to use technologies that requires use of JavaScript. No inefficient or ~~Facebook~~ Meta technologies.

### Keeping it simple

This collectively means that there should absolutely be no dependency on having a new app to handle receiving of the data to transfer over. This is a hard requirement. No exceptions. Not for Bluetooth, not for mDNS-SD (for device discovery). Tempting, but no.
The application is also intended to be very simple and for a specific sort of use case, rather than acting like a swiss-army knife.

Yes, this limits the potential of the application, but I was more of developing the application for myself with the intent to distribute for anyone who might find it useful (and it had proved so).

### Similar applications exist

Many Android applications at the time already existed for transferring files. The QR code feature or working natively with what is already available on devices (like a browser) weren't exactly in the forefront, however.
The closest I came across at the time was an app that looked very dated and had a QR code button, so the QR code would not immediately be visible. What worsened things is that it depended on an external application for QR code encoding.

As there wasn't an application out there that checked all the boxes, it was in my hands to do something about it.

## Concept to material

This was the opportunity to make use of Flutter for a practically useful application that to myself will most certainly be useful. I already practiced a lot with developing Flutter applications, but that was just the beginning.

Surprisingly, Flutter, as well as the programming language, Dart, offered a lot. Such as a HTTP server that by itself would come up with an unused port number that can be listened on. As I went further into development, however, there were some things that happened to require far more work than I could've ever anticipated. Not in the usual way when newly working with technologies, either.

## Slight hiccups

Flutter is good as a UI framework, I can say that much. Fairly simple to get one's head around in a short amount of time. The following are just a few issues.

### Theming and deprecations

It could be a little better when it comes to reliably theming elements with standard names without deprecating them so often or complicating the process of how to theme specific element types. This sort of thing did use up a fair bit of time throughout various Flutter updates. This is probably becoming less of a pain point as Material 3 is gradually becoming a thing (despite some existing imperfections at the time of writing).

### Long unresolved bugs

There are some high and low hanging bugs in Flutter (that had not been resolved for years), but usually these can be worked around.. after a lot of time. As for issues that can't be worked around.. well.. just hope they won't be a real roadblock.

### Inconsistent build behaviour

Something I should mention is that debug builds behave very differently in general for the sake of fast debugging but the app itself can function very differently too in comparison to a release build. For example, a state might visibly update in the debug build but not do so at all on the release build.
So, it's crucial to test both builds when making large changes just in case whatever issue might be lurking about cannot be worked around (without large compromises). This sort of behaviour had happened various times and it's no fun to deal with. Save yourself the headache.

### In general

There had been numerous build issues and so forth as time went on, but I'll get into that shortly.

## Being dependant on 3rd party packages

There's a lot I could go on about in great detail, but one of the notable larger pitfalls I had noticed with the Flutter framework was the availability and quality of the 3rd party Flutter packages. This itself carries a lot of issues.

### Limited availability

One of the core features I needed was a way to at least navigate and select files. There were very few options that support both Android and Windows platforms.

### Reliance

If you want to use very specific native platform features that the framework normally does not have hooks into, chances are that you will need to either rely on an existing dependency or put together something yourself.

The problem with dependencies is that.. well.. it's someone else's existing work to depend on for the functionality it offers. You end up relying on the maintainer to get things right. Usually, dependencies are there for the convenience. And they can work exactly as expected to the T. Unfortunately, when it came to some of the packages I went with, it was quite the contrary.

### Bad practices

I wanted my application to be as robust as possible. So when the file picker did not give out platform exceptions from the operating system for myself to handle and instead simply assumes it's some file picker user cancellation, that was a very bad approach and went against what I was aiming to achieve.
In this case, I decided to contribute via GitLab -- hardly ideal for me but it is what it is. This ended up being a mess, as a final crucial adjustment I sent off for merging did not get merged (meaning a possible non-user-facing crash up-on a platform exception). I then stuck with my own fork with the appropriate changes as the dependency.

### Abandoned or barely maintained

When it comes to other packages, they can eventually cause build errors due to eventual dependency version conflicts or relying on old unsupported Gradle versions. Those packages tend to be abandoned, so there would be no point in issuing a pull request. These had to be forked and depended on with the much needed adjustments.

During the point of when Flutter was beginning to enforce null safety, I was one of those who went helping out with making the packages I rely on null safe, even issuing some pull requests for the actively maintained projects. Where there isn't active maintenance at the time, I published new Flutter packages denoting that they're null safe with the `_ns` suffix. When some got maintained again to officially make their needed adjustments, I unlisted my publications as appropriate.

### Instability

Another example of a troublesome dependency that is not being actively being maintained is the share intent package. The Google Play Console vaguely reported a crash coming from the dependency relating to getting the duration of a video file. As I did not need that specific functionality, I had essentially cut that functionality off rather than finding a real fix for that in the Kotlin code that is called via method channel.

### The conclusion

This is overall essentially the case of having to do everything yourself if you want it more or less to your liking. Especially in the case of platform integration.
It's not great to be in such a position too often, especially when it involves dependencies. It's bad enough as it is to try deciphering the madness from crash reports that would normally be far more detailed and specific in natively built applications (yes, I included debug symbols).
I don't want to have to waste too much of my time. Time matters.

Open source is open source. You get what you pay for.

## The elephant in the room

Something that may had been noticed is that the last desktop builds are on `v1.1.1`. Ever since, there had been a lot of changes. There is a known bug where the app can fatally crash when selecting certain ZIP archive files -- the reason is unknown but the vague crash log cited the flutter dynamic library as being the source. If the bug would still be present if it were to be built now, I don't know.

Due to the inconvenience of building and testing the applications (especially Linux builds), I don't plan to create such builds anymore. In theory, however, they should build fine. If not, rebuilding those platform directories and manually adjusting the window sizing should do the trick.

Yes, not great to claim "cross-platform" when the more recent builds don't appear to include more than one platform, but the desktop builds do exist and function. The specific release entry is also linked to in the README.

## The large compromise

As I got to use Flutter more, issues and limitations came more apparent. Race conditions would happen easily and far too often. It would take a while to iron those out as much as possible before release. This sort of issue held back the `v2.0` release back a little longer than expected when I began working on QRServ again. Even before working on `v2.0`, this was an issue.

One of the large issues that I'm not willing to deal with involves the file import process.

### File importation inconveniences

Some users had noticed how QRServ can take time with large files while importing them.

#### Yes, I know

During initial development, it was intended to directly access the files from where it would be stored at that very moment. Although, due to the move to scoped storage and the pre-existing Flutter packages (even at the time of writing) used to help make file selections, these only resulted in the copying of the selected files from Android's built-in documents / files picker UI and sharesheet into the application's cache folder.
This essentially means making a copy of the file selection at first, using up additional internal storage temporarily. These Flutter packages do not expose the full direct path to the file selection.

#### Performance hold ups

On some devices, there will be slow storage that would result in waiting an impractical amount of time to make the copy into internal storage if the file is too large. This could also, such as in the case of the sharesheet, cause an ANR, from having to hold up the main thread longer than what would normally be expected.

#### Storage usage

There were efforts to avoid unnecessary storage use under the current circumstances.

In the case of storage usage, the application does clear out files that are no longer in use. For example, the files selected to be placed into a created ZIP archive file.

During the file import process, sufficient storage would be required to initially fit those files. Even more so when doing a multi-file selection, as the ZIP archive file would need to be created too before the cache clean up kicks in to remove the copies of the actual file selection.

#### Others are impacted by this

Various Android applications developed with Flutter involving importing of files on Android unfortunately suffer from the same limitations.

Technically, this may be possible to resolve. However, this would involve platform specific code in order to call platform APIs in a very specific way. Due to how involved that might be and considering how things are functioning now, there is absolutely no desire to go that route.
It's worth noting that QRServ targets an API that is 30 or above.

#### Expectations

These sort of struggles are going to especially happen when working with a framework with the expectation to not deal with native platform specific code so much. For one, the user may not know Kotlin that well, let alone not have plans to deal with method channels (a way to communicate with platform native code that performs platform-specific tasks in behalf of the framework).

## The future

As much as I love challenges, having to try working around highly visible bugs and putting up with the inconveniences (that a lot of them are long unresolved bugs) for a huge amount of the development time (of which I haven't mentioned the half of the issues) that are mainly to do with the framework itself (let alone the dependencies out there) is terrible. No amount of hot reloading or fancy features will make up for that.

### Getting burnout

I'd rather for that time to go towards implementing functionality and fixing bugs that I end up creating myself.

For something that is supposed to ease (cross-platform) application development, sure, it's easy to put together a basic app that would run right out the gate on various platforms and the UI is not difficult to customise. However, it most certainly does not put me at ease when it comes to the functional side of things. The amount of time I spent to deal with issues that should not be happening in the first place.. it's ridiculous.

#### I did not sign up to this

When I began working on QRServ, I expected challenges. That's exactly what I got. But it was also far more than I bargained for. The sort that causes way too much friction that really puts a hold on things from every corner. Occasional issues to iron out that weren't issues before. Or I happen to use something I haven't used before (in a certain way) only to find out it doesn't work correctly.

Truth is, it was never intended for it take a lot of time to put together. But it did. It took an unnecessarily long time to get it where it is today, let alone before the first stable release. Hours add up fast.

#### Bugs will always be a thing

Bugs will happen in programming languages, frameworks, and libraries. But I would hope that low-hanging issues, especially in basic functionality, does not stay in limbo for years as if it's something on Bugzilla (Mozilla bug tracker). Especially if it's to be used in production. This is unlike anything I've seen before, and I've seen bad. It's to the point where it does not feel it should be used for anything 'serious'.

#### The strain

Software development can be enjoyable. But like anything, if you keep hitting brick walls with no satisfying (enough) resolutions or having to severely compromise the idea you're trying to make into a reality, it can get very taxing. That you're fighting against rather than working with that framework.

Like how stepping back for a bit can help bring ideas of how to approach an issue, it also helps if you're getting exhausted by something out-right not playing ball. To re-evaluate the approach and try to regain the motivation. Or do something else entirely until you feel you're ready to take a fresh look at it once more.

#### Laying out the cards

Bashing out code is not the only thing I'm good at. It's just one of the things I focus on doing the most. The main thing. Perhaps I should try out the other hobbies more. Widen up some avenues in other departments.
In general, that would be wise in any case. Never place all your eggs in one basket.

There is technically a bit of 'jack of all trades, master of none' vibes if I were to exclude software development from the list. Even then, there are some that I had focused on far more than others. Some of which also tend to interconnect.

### Good in some cases

I would say that it's perhaps more ideal for not-so-method-channel-reliant applications (unless you would be willing to write platform native code to an extent) or something too complex, but apparently there's numerous bugs with things as basic as forms & text fields too. So, have fun with that.

### Decisions

I plan to continue maintaining QRServ where necessary.
If I were to create new applications that involve the Android platform (or Windows, for now), Flutter would be my go-to at this time. Only because it's the more convenient option, knowing how to work with it far more than Kotlin or C++ with WinUI (I don't plan to develop anything with C# any time soon). Although that side of things is far more likely to be done professionally for the time being.
Tauri is what I aim to use for Windows GUI applications in the future, with none of the JavaScript or web views.

### Reconsidering the approach

Mainly using very different desktop and mobile platforms, I have a clearer view of how to avoid making the same mistakes. By using a platform's native language and tooling to begin with (Swift, Swift UI -- despite hearing UIKit being a bit more mature.. most definitely not touching Objective-C).

Just like how I probably should've scrapped the desktop app idea for QRServ and instead focused on the Android app with Jetpack Compose toolkit (of which I entirely forgot about being a thing at the time) with Kotlin. I may go that route for Android projects far into the future, so that I have far more control and predictability over behaviour.

The Windows app does work and has been useful, but it feels half-baked. At least in appearance. Or that could just be the Windows native UI elements in general. Either way, not great. Plus, that unusual aforementioned bug with at least the Windows build doesn't do any favours.

## Concluding thoughts

This sort of experience with Flutter has been interesting, but ultimately, I most certainly feel discouraged to make serious use of it in the future. Which really is a shame.

If you should use the Flutter framework or not is not up to me.
The information I present here is intended to be a 'heads up' on the sort of things to expect. To adjust expectations. Depending on the approach taken, it might be worth it. Maybe dependencies won't be so much of a concern if native platform code can be written yourself. Perhaps some issues can be worked around without too much inconvenience.
Make use of the information as you will and draw your own conclusions.

I haven't gave myself that much of an opportunity to explore further into other avenues again for quite some time. Usually, this comes down to the lack of ideas of what to produce. Maybe I just need to look around for more inspiration, like how I've done so for graphical illustrations in the past.
~~There might be 'test' music I had thrown together on my main website.~~

I've been exploring other programming languages and technologies. One I had been very satisfied with is Rust. Yes, it's as good as many are making it out to be. 'Rust Analyzer' can be a bit buggy at times, but it's nowhere as much of a pain to deal with. Overall, it's a gift that keeps on giving.

Our past (mistakes) makes us who we are today. We may not be able to change the past, but we can learn from it and change future outcomes. Do what would help give you satisfaction and happiness in the long run.
