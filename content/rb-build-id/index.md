+++
title = "Reproducible Builds and Build IDs"
description = "Inconveniently placed information"
date = 2026-04-20

[extra]
feature_image = true
unlisted = false
+++

When using frameworks on Android, such as React Native or Flutter, they may include native libraries in your builds.
Native libraries can include build IDs, which can be a problem if a build reproduction attempt results in a different build ID.

## Checking for Build IDs

On a Linux system, we will need to use a command named `readelf`.

1. Open the `.apk` build using an archive utility (it is a ZIP archive)
2. Extract the `.so` files from `lib/{arch}/`
3. Run `readelf --wide --notes {filename}` for each file

For the following example, we are using Flutter, and it is the Dart native library that is of concern.

`readelf --wide --notes libdartjni.so`

```
Displaying notes found in: .note.android.ident
  Owner                Data size     Description
  Android              0x00000084        NT_VERSION (version)        description data: 15 00 00 00 72 32 38 63 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 31 33 36 37 36 33 35 38 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
Displaying notes found in: .note.gnu.build-id
  Owner                Data size     Description
  GNU                  0x00000014    NT_GNU_BUILD_ID (unique build ID bitstring)        Build ID: 05ad3d7794b52a46ba1725fdc23fc08579766548
```

Notably, there is a `.note.gnu.build-id` note that mentions the Build ID.

On another system, it may instead look like this:

```
Displaying notes found in: .note.android.ident
  Owner                Data size     Description
  Android              0x00000084        NT_VERSION (version)        description data: 15 00 00 00 72 32 38 63 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 31 33 36 37 36 33 35 38 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
Displaying notes found in: .note.gnu.build-id
  Owner                Data size     Description
  GNU                  0x00000014    NT_GNU_BUILD_ID (unique build ID bitstring)        Build ID: eb6bf5d73541d54e12f5b6b3c9f6ea253c5d7dfe
```

The only difference is the build ID.

## Removing Build IDs

Usually, there are various methods to deal with this. However, in this case, they had not made a dent.

GitHub user [ffiltech](https://github.com/ffiltech) put together a working solution. There are several commits, but the code in this tutorial is heavily based on the code introduced in commit [48bd3a0](https://github.com/ffiltech/Simple-Badminton/commit/48bd3a0a9902da2bcc9ada61143752c6691c20ed) of their project repository. Kudos to them for the solution.

We will start by creating a `no-build-id.gradle` file under `android/`. Then enter the following code:

```java, linenos
// MIT License - Copyright (c) 2026 Simple Badminton Contributors

def home = System.getenv("ANDROID_HOME") ?: ""
println "[no-build-id] ANDROID_HOME environment variable value: ${home}"
def objcopy = null
if (home) {
    def ndkRoot = new File("${home}/ndk")
    if (ndkRoot.isDirectory()) {
        ndkRoot.eachDir { ver ->
            if (objcopy) return
            println "[no-build-id] first path to check for llvm-objcopy: ${ver}/toolchains/llvm/prebuilt"
            def prebuilt = new File("${ver}/toolchains/llvm/prebuilt")
            if (!prebuilt.isDirectory()) return
            prebuilt.eachDir { platform ->
                if (objcopy) return
                println "[no-build-id] second path to check for llvm-objcopy: ${platform}/bin/llvm-objcopy"
                def c = new File("${platform}/bin/llvm-objcopy")
                if (c.exists()) objcopy = c.absolutePath
            }
        }
    }
}
if (!objcopy) {
    println "[no-build-id] llvm-objcopy not found - Build ID strip skipped"
    return
}
final String oc = objcopy
tasks.matching { it.name.startsWith("merge") && it.name.endsWith("NativeLibs") }
    .configureEach { t ->
        t.doLast {
            t.outputs.files.each { dir ->
                if (!(dir instanceof File) || !dir.isDirectory()) return
                dir.eachFileRecurse { f ->
                    if (!f.name.endsWith('.so')) return
                    exec { commandLine oc, '--remove-section', '.note.gnu.build-id', f.absolutePath }
                    println "[no-build-id] stripped Build ID: ${f.name}"
                }
            }
        }
    }
```

Under `android/app/`, add the following to the end of `build.gradle.kts`:

```kotlin
afterEvaluate {
    apply(from = "../no-build-id.gradle")
}
```

or to `build.gradle`:

```java
afterEvaluate {
    apply from: '../no-build-id.gradle'
}
```

<br>
{% callout(type="tip") %}
While the code could be placed directly within the `afterEvaluate` code block, this approach is cleaner and also works if you use `build.gradle.kts` rather than `build.gradle`.
{% end %}

### Notes on included print lines

Lines mentioning `println` will be printed upon build if conditions are met.

For the first half of the code that has prints relating to the NDK path, that is for debugging purposes, and you can remove it if the output would be too noisy for your taste.

{% callout(type="caution") %}
A `println` should at least be left within the `objcopy` conditional check in the code above to indicate whether there was an issue. Failures are not fatal, so on failure your builds would proceed successfully, but with build IDs still intact.
{% end %}

## Validation

Perform your usual app build. You should see extra output, such as `.so` files being listed. Once the build has been completed, reattempt the [Checking for Build IDs](#checking-for-build-ids) section.

If all goes well, the `.note.gnu.build-id` section should no longer be present.

```
Displaying notes found in: .note.android.ident
  Owner                Data size     Description
  Android              0x00000084        NT_VERSION (version)        description data: 15 00 00 00 72 32 38 63 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 31 33 36 37 36 33 35 38 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
```
