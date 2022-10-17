`imgSketch` replaces HTML `img` elements with human-editable vector graphics data specified in a Query String. There are not many use cases for such functionality since SVG images can be embedded in the HTML document, encoded as a Data URL, or simply fetched from a server. However, `imgSketch` could be useful in some situations.

A overview of features can be seen at: <https://deverac.github.io/imgsketch/>

## Developer info

`imgSketch` is a single Javascript file. Use of `npm` is optional and is only needed to:

1. Run Unit Tests
1. Minimize the Javascript code

Install `npm`.

    apt-get install npm    # Install npm

Install `npm` packages.

    npm install            # Install dependencies

Run `npm` targets.

    npm test               # Run Unit Tests

    npm run minjs          # Minimize Javascript source

An alternate method may be used to run Unit Tests. It runs a server and uses the `geckodriver` to interact with the browser; you may need to install a different driver which supports your browser.

    npm run testserver     # Starts a testing server.
                           # Open a browser to http://localhost:8888
