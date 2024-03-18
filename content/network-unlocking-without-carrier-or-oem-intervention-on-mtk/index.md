+++
title = "Network Unlocking without Carrier or OEM Intervention on MediaTek"
description = "Low-end MediaTek-powered device Vs. reverse engineering"
date = 2022-11-24

[extra]
unlisted = false
+++

<br>
{% callout(type="info") %}
This post had been updated on March 18th 2024 with a follow-up at the end.
{% end %}
<br>

While I was on holiday in Hungary to stay with a friend, one of the ideas that came up was to go to a technology store to see the terrible quality products that would be around. There were a lot.
Initially, it was the terrible performing Windows laptops and there was the common theme of demo software crashing in a loop. Meanwhile in the Apple section, things were far more sane. Wonder why was that.

## On the hunt

Something that caught our eye was a rack full of around €30 smartphones. More specifically, a phone in a lime coloured box labeled with the carrier 'Yettel' (formerly 'Telenor'). This phone was the `Navon SPT1100`.

Knowing how insecure very low budget MediaTek devices are, we went ahead and picked one up.

## Getting right into it

There was a lot done, such as using [MTK Client](https://github.com/bkerler/mtkclient) to make a full backup of the device and getting it rooted that way. For the scope of this blog post however, I will be focusing on one of the many findings.

## Unexpected hidden application

While using [Activity Launcher](https://play.google.com/store/apps/details?id=de.szalkowski.activitylauncher) to find any hidden applications, something we had came across was an application named `NCK` (com.forest.simlock, 1.0).

{% figure(src="assets/activity_launcher.webp", alt="Activity Launcher entry") %}
Quite the package name
{% end %}

This was a basic network (un)lock tool that would ask for a network code key. This would offer 5 attempts.

{% figure(src="assets/nck.webp", alt="NCK application UI") %}
Relatively straight-forward UI
{% end %}

## Unintentional network lock

Now, this was a strange one because the phone should have not even been network locked in the first place. Yettel could not network unlock it themselves and would need to contact the OEM for that information.

{% figure(src="assets/carrier_resp.webp", alt="Carrier response") %}
Carrier was not prepared for this one
{% end %}

> Dear Customer!
> Currently we don't have Network Code Key available for [redacted] IMEI number.
> We have started a request towards the manufacturer, as soon as we receive it we'll notify you in another SMS.
> Regards: Yettel

<br>

What does make this all the more interesting was that there were `build.prop` properties explicitly marking the device as network locked too. There would be a comment stating what the 1 and 0 values represent.

## We must go deeper

I decided to take a look into the `NCK` application. I took the system image file that was extracted from the super partition (dynamic partition containing platform, vendor and system partitions -- used for very low storage devices) and opened it up using 7-Zip. This was thanks to the aforementioned MTK Client and the extraction of the super partition image. I then looked into `/system/app` to find a directory named `SimlockSecretCode_M4009Y`. Within this was `SimlockSecretCode_M4009Y.apk`.

Using 7-Zip, the `classes.dex` file was extracted from the APK file. This was then used with [dex2jar](https://github.com/pxb1988/dex2jar) by using the following command: `./d2j-dex2jar.bat -f -o SimlockSecretCode_M4009Y.jar .\SimlockSecretCode_M4009Y.apk`

The resulting `SimlockSecretCode_M4009Y.jar` was then imported into [JD GUI](https://github.com/java-decompiler/jd-gui). This was the point when the investigation really went down.

## Now, what do we have here?

Having done some digging, there were a few discoveries:

-   The code attempt counter would be saved via the app's own shared preferences, meaning that clearing the app data would be enough to reset the counter
-   The app can network lock the device using the same code

What I was mainly looking for involves the network unlock code. What would be determined to be valid would be done entirely offline and would be calculated based on the device's own information.

## It does not get any better

I noticed how the app was setting a preference to the device's settings app regarding the unlock status (`slu_unlocked`). Shortly after, that it would send a broadcast to the MTK Engineering mode application to send an `AT+EGMR` command to the modem. The device would then be rebooted.

This turned out to be far less of an effort than expected. Allow for me to explain.

## The engineer's key

Under the `SimLockUnlockFragment` class, there was a method named `isRightPasswords`, of which had a string parameter. This would be the user provided code.

This check goes through multiple methods of what would end up being seen as a valid network unlock code to then be checked against the data that the user had provided. One of the conditions was however slightly different from the others.

```java
private Boolean isRightPasswords(String param1String) {
    Boolean bool = Boolean.TRUE;
    Log.i("yzheng", "---isRightPasswords---");
    return (
        getNckStr().equals(param1String) ||
        getNckStr2().equals(param1String) ||
        "20150327".equals(param1String)) ?
            bool :
                (getNckStr3().equals(param1String) ?
            bool :
                Boolean.FALSE
        );
}
```

One of the conditions was checking the user provided data against a hardcoded string. This hardcoded string was `20150327`. If this matches, it would return `true`. Otherwise, it would fall back to method 3 as the final method to validate against.

After entering the hardcoded string as the network unlock code, this successfully network unlocked the device. The phone no longer refused SIM cards from other networks.

## Using GSIs, custom ROMs & persistence

If you manage to get a GSI running on a device (like with the device used in this blog post after many partition modification attempts) or a custom ROM, you may end up with the network lock code prompt. In the case of the device that was tested in this blog post, the same hardcoded network code key worked.

From further testing, it appears that on reboot, the network code key does get prompted for again, as if it was a temporary code that you could use again. In contrast, the stock ROM didn't do this (perhaps `slu_unlocked` might be causing it to skip that keyguard persistently until set to `0`).

The solution to keep it truly network unlocked is to have the real network code key and to use it through the Android network code key keyguard rather than the `NCK` application. So this does at least look like this is more of a temporary solution once you step out of the stock ROM.

My suspicion is that `NCK` is an engineering tool that bypasses the normal network code key check and that it intends to allow valid not-so-persistent codes to be persistent-like on the ROM that it's configured for. At least, it would make sense for it to be made for testing purposes. Can't say the same about how others might use it though.

## Conclusion

When purchasing a very low end device, let alone one utilising a MediaTek SoC, there should be no expectation of security. From (the lack of) software updates to the very little low level security measures. They can even end up using IMEI numbers that has a completely different Chinese OEM's product tied to it, as it so happened with the device tested here.

The engineering software on such devices tend to not have much effort put into protecting themselves against unintended users and can damage the software or potentially hardware if misused. If you have no full backup, the device might be very much screwed if there is nothing available online to help get it back up and running.

That said, this sort of find was disappointing but not surprising. Sure, it allows the user to kind of have the freedom they should've had in the first place in situations such as this. But this also can be misused.

Making it almost effortless to find a working code, let alone a static one, is not a great thing. There are other issues that would likely make it possible to perform the same task, but this one is very low hanging fruit.

This is not the sort of tool that should be left around in release builds, especially the functionality that it ties into within the `MTK Engineering Mode` application.

Needless to say, if your device is not supposed to be network unlocked yet (i.e. contract), please refrain from doing so.

At the end of the day, like the hardware, it's the sort of thing that is just thrown together cheap without much consideration for user experience and how hardened the device should be. It just has to do the bare minimum.

{% figure(src="assets/phone_internals.webp", alt="Phone internals") %}
Generic main board and low-end components
{% end %}

If you want a device to play around with and to get familiar with the world of old & low end MediaTek SoCs, it's a nice little playground. Just make sure to do a full backup before doing anything else. The device in this case has some test and engineering tools scattered around and you can recover all or individual partitions should something break. USB 2.0 must be used when using the MTK Client tool or there will be connection drop-outs.

## An update on the official network unlock

The carrier after so long eventually came back with the NCK. Unfortunately, the NCK was not considered valid for that device.

This is concerning, as the OEM had failed to ensure that the network unlock functionality for a truly persistent network unlock works. This also raises the question of if the carrier had even tested if this would work in the case of a user wanting to network unlock such a device that would originally be locked to their network.

I mean, they seemed very confident about selling such device that there were so many in a rack. But then again, maybe it was solely the OEM's responsibility to check ahead of time and it was expected to just work.

If the contract between the carrier and OEM covers this.. well.. that might get interesting.

So it appears that at the time of writing, what is essentially the test NCK is probably the best way to go (especially on the stock operating system) in such a case.

## The company behind Navon

Navon was a brand by `Hungaro Flotta KFT.` ([privacy policy](https://smartnavon.eu/adatvedelmi-tajekoztato/) [[archived](https://web.archive.org/web/20240317232751/https://smartnavon.eu/adatvedelmi-tajekoztato/)]). Noticed how that's in past tense?

`Hungaro Flotta KFT.` (an LLC) filed for bankruptcy late Q2 2023. This was noted, among other information about the proceedings, on their now defunct website.
<br>
The archived copy can be found [here](https://web.archive.org/web/20231128115509/http://hungaroflotta.hu/). The archive is broken, so search for the mention of `FELHÍVÁS` on the page to find the relevant section.

Some company information regarding liquidation can be found [here](https://www.nemzeticegtar.hu/hungaro-flotta-kft-c1909509036.html).

I'm taking it that the device is not going to be properly network unlocked any time soon.
