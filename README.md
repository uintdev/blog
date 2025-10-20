# uintdev blog

This is the source code of the Zola site assets that are used as part of building a static website for [blog.uint.dev](https://blog.uint.dev/).

This website is hosted using Cloudflare Workers.

## Setup

### CLI

Zola is in form of a binary. This typically has to be installed. For the respective platform instructions, [refer to the official documentation](https://www.getzola.org/documentation/getting-started/installation/).

```bash
# Build and run the development server
zola serve
# Build and output into 'public/'
zola build
```

### Web server

For the web server of your choice, point the document root for the virtual host to the `public/` directory (or its results) that was created from the build process.

## Licensing

The [MIT license](LICENSE) is used for this project. The font is under [OFL](static/fonts/OFL.txt) -- more details can be found [here](https://fonts.google.com/specimen/Nunito).
