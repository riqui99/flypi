import json


class Config:
    def __init__(self):
        self.server_port = 8080
        self.mongo_host = 'localhost'
        self.mongo_port = 27017


class FileConfig(Config):
    def __init__(self, filepath):
        Config.__init__(self)
        with open(filepath) as openfile:
            conf = json.load(openfile)
            self.server_port = 8080 if "server_port" not in conf else conf["server_port"]
            self.mongo_host = 'localhost' if "mongo_host" not in conf else conf["mongo_host"]
            self.mongo_port = 27017 if "mongo_port" not in conf else conf["mongo_port"]
