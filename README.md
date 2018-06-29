# Flypi


Flipy is a web-based user interface to interact with data that comes from [Pi-in-the-sky lora-gateway](https://github.com/PiInTheSky/lora-gateway) project.


## Installation

Clone this repository and access on it
```
git clone https://github.com/riqui99/flypi
cd flypi
```

Then, using [pip](https://pip.pypa.io/en/stable/installing/) package manager for Python, install all dependencies:

```
sudo pip install bottle
sudo pip install gevent-websocket
sudo pip install pymongo
// or
sudo pip install -r requirements.txt
```

>Note: For performance, flypi allows you to save the sessions of flights in MongoDB, but this is not a requirement. If you do not have it installed on the system, it is automatically detected and the sessions being stored on file system.


## How to run

`python server.py`


## Configure it
If you want change some parameter you should do it calling the server with -c argument.

`python server.py -c "path/to/config_file.json"`

The config file is a json file (you can found an example called config.json on the project root path) with the follow parameters:
  - server port: The port where the server is running.
  - mongo_host: If you want to use MongoDB remotely, you can define the host using this parameter
  - mongo_port: Port for MongoDB connection

## Todos

 - Reconnection socket
 - Add more statistics in session section
 - Use all JS dependencies locally (moment, leaflet, material icons, highcharts)
 - Improve popups (now are using javascript native for confirmations - create session)
 - Add navigation to follow the balloon on live with map.
 - Share in social media (create a public area in another server to sync sessions amd make public flights)
 - Store images on database
 - Create video - as a gif - with all images of the flight
 - Write Tests
 - Add Night Mode

License
----

MIT