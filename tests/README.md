# Sundae Run tests

Run the fast regression suite with:

```sh
node --test tests/app-regression.test.cjs
```

For the full browser workflow, start the local test server:

```sh
python3 tests/run_browser_smoke.py
```

Open the printed URL in Safari while the server is running. The page exercises the app at a 390 × 844 viewport, posts its results to the terminal, and exits with a nonzero status when a check fails. It covers logging, photo compression, backdating, search and filters, editing, shops and maps, backup contents, deletion, accessibility basics, PWA caching, and an offline launch.
