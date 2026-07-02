# Jungle Star Games Quick Launch Pack

## DO NOT overwrite your root `index.html`
The uploaded game arcade had its own `index.html`. This pack puts that file safely inside:

`arcade/index.html`

Your main JungleStar.net homepage stays safe.

## Copy into your real repo
Copy these into your `junglestar.net` repo:

- `games.html` -> replace root `games.html`
- `arcade/` -> new folder at the repo root

Final structure:

```
junglestar.net/
  games.html
  arcade/
    index.html
    fruit_kabob_game.html
    rainbow_smoothie_lab.html
    protect_the_garden.html
    common.css
    shared-systems.js
    ui-utils.js
```

## Commit
Summary:
`Launch classroom arcade games`

Then:
Commit to main -> Push origin

## Test links
- http://junglestar.net/games.html
- http://junglestar.net/arcade/
- http://junglestar.net/arcade/fruit_kabob_game.html
- http://junglestar.net/arcade/rainbow_smoothie_lab.html
- http://junglestar.net/arcade/protect_the_garden.html
