import sys
import os
import json
from threading import Thread

import time
from bottle import request, Bottle, abort, template, static_file

from gevent.pywsgi import WSGIServer
from geventwebsocket import WebSocketError
from geventwebsocket.handler import WebSocketHandler

from config import Config, FileConfig
from pits.modules.lora_gateway import Lora

# CONFIGURATION
import argparse

parser = argparse.ArgumentParser(description='Start Flypi Server.')
parser.add_argument('--config', '-c', default=None,
                    help='Configuration file to change parameters (default: server_port on 8080, MongoDB connection on localhost:27017)')

args = parser.parse_args()

config = Config()
try:
    if args.config is not None:
        config = FileConfig(args.config)
except:
    print "Failed parsing config file, please check that file is accessible and well formatted."
    exit()


app = Bottle()


@app.route('/image/<file_name>')
def img_live(file_name):
    return static_file(file_name, root=lora.ssdv_path)


@app.route('/images/last')
def img_live():
    last_filename = ""
    last_image = lora.get_last_image()
    if last_image is not None:
        last_filename = last_image[1]

    return json.dumps(last_filename)


@app.route('/images/names')
def img_live():
    return json.dumps(lora.get_image_list())


@app.route('/images/live')
def img_live():
    file_name = ""
    selection = lora.get_last_image()
    if selection is not None:
        file_name = selection[1]

    return static_file(file_name, root='/')


@app.route('/static/<path:path>')
def callback(path):
    return static_file(path, root='./static')


@app.route('/')
def index():
    return template('views/index.html')


@app.route('/websocket')
def handle_websocket():
    wsock = request.environ.get('wsgi.websocket')
    if not wsock:
        abort(400, 'Expected WebSocket request.')

    while True:
        try:
            data_ws = json.loads(wsock.receive())

            if data_ws["action"] == "start_data_loop":
                thread = Thread(target=data_loop, args=(wsock, ""))
                thread.start()
            elif data_ws["action"] == "get_sessions_list":
                data = lora.get_sessions_list()
                wsock.send(json.dumps({
                    "action": "sessions_list",
                    "data": data
                }))
            elif data_ws["action"] == "session_data":
                session = data_ws["session"] if "session" in data_ws else None
                data = lora.get_stored_data(session=session)
                wsock.send(json.dumps({
                    "action": "session_data",
                    "session": session,
                    "data": data
                }))
            elif data_ws["action"] == "new_session":
                session = data_ws["session"]
                if lora.session_exists(session):
                    wsock.send(json.dumps({
                        "action": "new_session",
                        "data": False,
                        "session": session
                    }))
                else:
                    lora.new_session(session)
                    wsock.send(json.dumps({
                        "action": "new_session",
                        "data": True,
                        "session": session
                    }))
            elif data_ws["action"] == "start_session":
                lora.start_session(data_ws["session"])
                wsock.send(json.dumps({
                    "action": "session_started",
                    "done": True,
                    "session": data_ws["session"]
                }))
            elif data_ws["action"] == "finalize_session":
                lora.finalize_session()
                wsock.send(json.dumps({
                    "action": "session_finalized",
                    "done": True
                }))
            elif data_ws["action"] == "remove_session":
                done = lora.remove_session(data_ws["session"])
                wsock.send(json.dumps({
                    "action": "session_removed",
                    "session": data_ws["session"],
                    "done": done
                }))

        except WebSocketError:
            break


def data_loop(wsock, message):
    try:
        while True:
            data = lora.get_data()
            wsock.send(json.dumps({
                "action": "payload_data",
                "data": data
            }))

            time.sleep(5)
    except:
        print "WebSocketError, finish thread"


lora = Lora(simulate=True, mongo_host=config.mongo_host, mongo_port=config.mongo_port)
server = WSGIServer(("0.0.0.0", config.server_port), app, handler_class=WebSocketHandler)
print "Serving on port {}".format(config.server_port)

try:
    server.serve_forever()
except KeyboardInterrupt:
        print 'Script interrupted'
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)
