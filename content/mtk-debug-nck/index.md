+++
title = "Network Unlocking without Carrier or OEM Intervention on MediaTek"
description = "Low-end MediaTek-powered device vs. reverse-engineering"
date = 2022-11-24

[extra]
image = true
unlisted = false
+++

{% callout(type="important") %}
This information is for educational research purposes only.
<br>
Needless to say, if your device is not supposed to be network-unlocked yet (i.e., ongoing contract), refrain from doing so.
{% end %}

{% callout(type="info") %}
This post was updated on 2024-03-18 with a follow-up at the end.
{% end %}

While I was on holiday in Hungary to stay with a friend, one idea that came up was to go to a technology store to see the terrible-quality products that would be around. There were a lot.

Initially, it was the poorly performing Windows laptops, with the common theme of demo software crashing in a loop. Meanwhile, in the Apple section, things were far more sane. I wonder why that was.

## On the hunt

Something that caught our eye was a rack full of smartphones priced around €30. More specifically, in a lime-colored box labeled with the carrier 'Yettel' (formerly 'Telenor'), the phone was the `Navon SPT1100`.

Knowing how insecure very low-budget MediaTek devices are, we went ahead and picked one up.

## Getting right into it

A lot was done, such as using [MTKClient](https://github.com/bkerler/mtkclient) to make a full backup of the device and root it that way. For the scope of this blog post, however, I will focus on one of the various findings.

## Unexpected hidden application

While using [Activity Launcher](https://play.google.com/store/apps/details?id=de.szalkowski.activitylauncher) to find any hidden applications, we came across an application named `NCK` (com.forest.simlock, 1.0).

{% figure(src="assets/activity_launcher.webp", alt="Activity Launcher entry") %}
Quite the package name
{% end %}

This was a basic network (un)lock tool that asked for a network code key. It offered five attempts.

{% figure(src="assets/nck.webp", alt="NCK application UI") %}
Relatively straight-forward UI
{% end %}

## Unintentional network lock

This was a strange one because the phone should not have been network-locked in the first place. Yettel could not network-unlock it themselves and would need to contact the OEM for that information.

{% figure(src="assets/carrier_resp.webp", alt="Carrier response") %}
Carrier was not prepared for this one
{% end %}

> Dear Customer!
> Currently we don't have Network Code Key available for [redacted] IMEI number.
> We have started a request towards the manufacturer, as soon as we receive it we'll notify you in another SMS.
> Regards: Yettel

What makes this all the more interesting is that there were `build.prop` properties explicitly marking the device as network-locked, too. There was also a comment stating what the 1 and 0 values represent.

## We must go deeper

I decided to take a look at the `NCK` application. I took the system image file that was extracted from the super partition (a dynamic partition containing platform, vendor, and system partitions-the `b` slot was blanked out due to insufficient 8 GB of storage) and opened it using 7-Zip. This was thanks to the aforementioned MTKClient and the extraction of the super partition image. I then looked in `/system/app` to find a directory named `SimlockSecretCode_M4009Y`. Within this was `SimlockSecretCode_M4009Y.apk`.

Using 7-Zip, the `classes.dex` file was extracted from the APK. It was then processed with [dex2jar](https://github.com/pxb1988/dex2jar) using the following command:

```ps1
./d2j-dex2jar.bat -f -o SimlockSecretCode_M4009Y.jar ./SimlockSecretCode_M4009Y.apk
```

The resulting `SimlockSecretCode_M4009Y.jar` was imported into [JD GUI](https://github.com/java-decompiler/jd-gui). This was the point when the investigation revealed deeper underlying issues.

## Now, what do we have here?

Having done some digging, I made a few discoveries:

- The code attempt counter is saved via the app's own shared preferences, meaning that clearing the app data is enough to reset the counter.
- The app can network-lock the device using the same code.

What I was mainly looking for involves the network unlock code. Validity is determined entirely offline and is calculated based on the device's own information.

## It does not get any better

I noticed that the app was setting a preference in the device's settings app regarding the unlock status (`slu_unlocked`). Shortly after, it would send a broadcast to the MTK Engineering Mode application to send an `AT+EGMR` command to the modem. The device would then reboot.

This turned out to be far less effort than expected. Allow me to explain.

## The engineer's key

Under the `SimLockUnlockFragment` class, there was a method named `isRightPasswords` that took a string parameter. This would be the user-provided code.

This check goes through multiple methods to determine what is considered a valid network unlock code, which is then checked against the data the user provided. One of the conditions, however, was slightly different from the others.

```java, linenos
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

One condition was to check the user-provided data against a hardcoded string. This hardcoded string was `20150327`. If this matched, it would return `true`; otherwise, it would fall back to method 3 as the final way to validate.

After entering the hardcoded string as the network unlock code, the device unlocked successfully. The phone no longer refused SIM cards from other networks.

## Using GSIs, custom ROMs & persistence

If you manage to get a GSI running on a device (as with the device used in this blog post after many partition-modification attempts) or a custom ROM, you may end up with the network lock code prompt. In the case of the device tested in this blog post, the same hardcoded network code key worked.

From further testing, it appears that on reboot, the network code key is prompted for again, as if it were a temporary code that you could use again. In contrast, the stock ROM did not do this (perhaps `slu_unlocked` might be causing it to skip that keyguard persistently until set to `0`).

The solution to keep it truly network-unlocked is to have the real network code key and use it through the Android network code key keyguard rather than the `NCK` application. So this does at least look more like a temporary solution once you step out of the stock ROM.

My suspicion is that `NCK` is an engineering tool that bypasses the normal network code key check and is intended to allow valid not-so-persistent codes to be persistent-like on the ROM it is configured for. At least, it would make sense for it to be made for testing purposes. I cannot say the same about how others might use it, though.

## Conclusion

When purchasing a very low-end device-let alone one using a MediaTek SoC-there should be no expectation of security. From the lack of software updates to the very few low-level security measures, these devices fall short. They can even end up using IMEI numbers that have a completely different Chinese OEM's product tied to them, as happened with the device tested here.

The engineering software on such devices tends not to have much effort put into protecting itself against unintended users and can damage the software or potentially the hardware if misused. If you have no full backup, the device might be completely screwed if there is nothing available online to help get it back up and running.

That said, this sort of find was disappointing but not surprising. Sure, it allows the user to have the freedom they should have had in the first place in situations such as this, but it also can be misused.

Making it almost effortless to find a working code, let alone a static one, is not a great thing. There are other issues that would likely make it possible to perform the same task, but this one is very low-hanging fruit.

This is not the sort of tool that should be left around in release builds, especially the functionality that it ties into within the `MTK Engineering Mode` application.

At the end of the day, like the hardware, it is the sort of thing that is just thrown together cheaply, without much consideration for user experience and how hardened the device should be. It just has to do the bare minimum.

{% figure(src="assets/phone_internals.webp", alt="Phone internals") %}
Generic main board and low-end components
{% end %}

If you want a device to play around with and get familiar with the world of old and low-end MediaTek SoCs, it is a nice little playground. Just make sure to do a full backup before doing anything else. The device in this case has some test and engineering tools scattered around, and you can recover all or individual partitions should something break. USB 2.0 must be used when using the MTKClient tool, or there will be connection dropouts.

## An update on the official network unlock

The carrier, after so long, eventually came back with the NCK. Unfortunately, the NCK was not considered valid for that device.

This is concerning, as the OEM failed to ensure that the network unlock functionality for a truly persistent network unlock works. This also raises the question of whether the carrier had even tested whether this would work for a user wanting to network-unlock a device originally locked to their network.

I mean, they seemed very confident about selling such a device, given that there were so many in a rack. But then again, maybe it was solely the OEM's responsibility to check ahead of time, and it was expected to just work.

If the contract between the carrier and OEM covers this-well, that might get interesting.

So, at the time of writing, what is essentially the test NCK is probably the best way to go (especially on the stock operating system) in such a case.

## The company behind Navon

Navon was a brand by `Hungaro Flotta KFT.` ([privacy policy](https://smartnavon.eu/adatvedelmi-tajekoztato/) [[archived](https://web.archive.org/web/20240317232751/https://smartnavon.eu/adatvedelmi-tajekoztato/)]). Notice how that is in the past tense?

`Hungaro Flotta KFT.` (an LLC) filed for bankruptcy in late Q2 2023. This was noted, among other information about the proceedings, on their now-defunct website.
<br>
The archived copy can be found [here](https://web.archive.org/web/20231128115509/http://hungaroflotta.hu/). The archive is broken, so search for the mention of `FELHÍVÁS` on the page to find the relevant section.

Some company information regarding liquidation can be found [here](https://www.nemzeticegtar.hu/hungaro-flotta-kft-c1909509036.html).

I am taking it that the device is not going to be properly network-unlocked any time soon.
