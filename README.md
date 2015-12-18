#ca-fluid

An implementation of a basic fluid simulation using cellular automata.

All automata calculations are run in parallel across all cells on the GPU using a series of custom fragment shaders.

Doesn't yet support drawing solid tiles, but hopefully I'll get around to it soon.

Getting it Running
------------------
Check it out [here](beanbeam.github.io/ca-fluid), or make the files available with a webserver:
```
cd {whatever}/dungeon
python -m SimpleHTTPServer
```
Then just connect to the server, `localhost:8000` if you ran the above command.

Also, try adding `/?seed=text&iterations=2` to the url.

