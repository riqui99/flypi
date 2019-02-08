import glob
import json
import os
import socket
import random
from threading import Thread
import time
from bson.json_util import dumps

from pits.modules.utils import gateway_time_to_timestamp


class Lora:

    def __init__(self, host="localhost", port=6004, debug=False, simulate=False, mongo_host='localhost', mongo_port=27017):
        self.payload = ""
        self.channel = ""
        self.lat = 0
        self.lon = 0
        self.alt = 0
        self.time = 0
        self.lastupdate = 0
        self.updated = 0

        self.debug = debug
        self.simulate = simulate

        self.session = "Unknown Session"

        self.ssdv_path = '/home/pi/lora-gateway/ssdv'
        self.SelectedSSDVFile = 0

        self.host = host
        self.port = port
        self.lora_socket = None

        try:
            from pymongo import MongoClient
            mongo = MongoClient(["{}:{}".format(mongo_host, mongo_port)])
            mongo.server_info()
            self.db = mongo["flypi"]["data"]
        except:
            print ("No MongoDB Found. This software will save the data in the file system.")
            self.new_session("_")
            self.db = None

        self.init_lora()

    def init_lora(self):
        thread = Thread(target=self.connect, args=())
        thread.start()

    def connect(self):
        if not self.simulate:
            try:
                self.lora_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                self.lora_socket.connect((self.host, self.port))

                print ("Connected to gateway. This software are dettecting and receiving data from lora-gateway application.")

                thread = Thread(target=self.process_lora, args=())
                thread.start()
            except:
                print ("ERROR on Gateway. Data from lora-gateway software is not detected. Ensure lora-gateway is running and receving data or use this application on a simulated mode.")
                if self.lora_socket is not None:
                    self.lora_socket.close()
                time.sleep(5)
                self.connect()
        else:
            self.start_simulation()

    def process_lora(self):
        try:
            q_count = 0
            _buffer = ''
            while True:
                reply = self.lora_socket.recv(4096)
                if reply:
                    q_count = 0
                    input_string = reply.split(b'\n')
                    for line in input_string:
                        temp = line.decode('utf-8')
                        temp = _buffer + temp
                        _buffer = ''

                        if temp.endswith('\r'):
                            json_data = json.loads(temp)
                            if json_data['class'] == 'POSN':
                                if json_data['payload'] != '':
                                    if self.debug:
                                        print ("LORA: " + json_data['payload'] +
                                               ", t= " + json_data['time'] +
                                               ", lat=" + str(json_data['lat']) +
                                               ", lon=" + str(json_data['lon']) +
                                               ", alt = " + str(json_data['alt']))

                                    self.channel = json_data['channel']

                                    self.payload = json_data['payload']

                                    timeConverted = gateway_time_to_timestamp(json_data['time'])

                                    if self.debug:
                                        print ("timeConverted: " + timeConverted)

                                    if timeConverted != self.time:
                                        if self.time == '':
                                            print ("First telemetry from payload " + json_data['payload'])
                                        elif int(time.time()) > (self.lastupdate + 60):
                                            print ("Resumed telemetry from payload " + json_data['payload'])
                                        self.lastupdate = int(time.time())

                                    self.time = timeConverted
                                    self.lat = json_data['lat']
                                    self.lon = json_data['lon']
                                    self.alt = json_data['alt']

                                    self.save_data({
                                        "payload": json_data['payload'],
                                        "channel": json_data['channel'],
                                        "lat": json_data['lat'],
                                        "lon": json_data['lon'],
                                        "alt": json_data['alt'],
                                        "session": self.session,
                                        "time": timeConverted,
                                        "updated_time": int(time.time())
                                    })

                                    self.updated = 1
                            elif json_data['class'] == 'SET':
                                # EditSettings['gateway.' + j['set']] = j['val']
                                pass
                        else:
                            _buffer = temp
                else:
                    q_count += 1
                    if q_count >= 5:
                        print ("TIMED OUT")
                        return
                    time.sleep(1)
        except:
            print ("ERROR, Lora Lost Connection")
            self.lora_socket.close()
            self.connect()

    def get_data(self):
        return {
            "payload": self.payload,
            "channel": self.channel,
            "lat": self.lat,
            "lon": self.lon,
            "alt": self.alt,
            "time": self.time,
            "last_update": self.lastupdate
        }

    # DATABASE
    def save_data(self, doc):
        if self.db is not None:
            self.db.insert(doc)
        else:
            session_file = "sessions/_.txt" if self.session is "Unknown Session" else 'sessions/{}.txt'.format(self.session)

            with open(session_file, 'r+') as outfile:
                try:
                    data = json.load(outfile)
                except:
                    data = []
                data.append(doc)
            with open(session_file, 'w+') as outfile:
                outfile.write(json.dumps(data))

    def get_stored_data(self, payload=None, start_time=None, end_time=None, session=None):
        if self.db is not None:
            q = {}
            if payload is not None:
                q["payload"] = payload
            if session is not None:
                q["session"] = session
            if start_time is not None:
                q["time"] = {"$gt": start_time}
            if end_time is not None:
                if "time" not in q:
                    q["time"] = {"$lt": end_time}
                else:
                    q["time"]["$lt"] = end_time

            cur = self.db.find(q).sort("time", -1)
            arr = []
            for c in cur:
                _json = json.loads(dumps(c))
                _json["_id"] = _json["_id"]["$oid"]
                arr.append(_json)
            return arr
        else:
            session_file = "sessions/_.txt" if session is "Unknown Session" else 'sessions/{}.txt'.format(session)
            try:
                with open(session_file, 'r+') as outfile:
                    return json.load(outfile)
            except:
                return []

    def session_exists(self, session):
        if self.db is not None:
            row = self.db.find_one({"session": session})
            return row is not None
        # File Session Mode
        if os.path.isfile('sessions/{}.txt'.format(session)):
            return True
        return False

    def new_session(self, session):
        # File Session Mode
        if not os.path.isfile('sessions/{}.txt'.format(session)):
            f = open('sessions/{}.txt'.format(session), "w+")
            f.close()

    def start_session(self, session):
        if self.db is None:
            self.new_session(session)
        self.session = session

    def finalize_session(self):
        self.session = None

    def remove_session(self, session):
        if session == self.session:
            self.finalize_session()

        if self.db is not None:
            self.db.remove({"session": session})
        else:
            if os.path.isfile('sessions/{}.txt'.format(session)):
                os.remove('sessions/{}.txt'.format(session))

        return True

    def get_sessions_list(self):
        try:
            if self.db is not None:
                sessions_list = self.db.distinct("session")
                if len(sessions_list) == 1 and sessions_list[0] is None:
                    sessions_list = []
            else:
                sessions_list = [f.replace(".txt", "") for f in os.listdir("sessions") if f != "_.txt" if f != ".gitignore" and os.path.isfile(os.path.join("sessions", f))]
        except:
            sessions_list = []

        return sessions_list

    # SIMULATE GLOBE POSITIONS
    def start_simulation(self):
        thread = Thread(target=self.get_simulate, args=())
        thread.start()

    def get_simulate(self):
        self.payload = "SIM"
        start_time = time.time()

        while True:
            self.time = time.time()

            self.lat = self.lat + self.get_rand_pos() if self.lat != 0 else 41.4911619
            self.lon = self.lon + self.get_rand_pos() if self.lon != 0 else 2.1548483

            if self.debug:
                print ("SIMULATE: " + self.payload +
                       ", t= " + str(self.time) +
                       ", lat=" + str(self.lat) +
                       ", lon=" + str(self.lon) +
                       ", alt = " + str(self.alt))

            sim_time = time.time() - start_time
            if sim_time < (20 * 60):  # RISING
                self.alt += 50
            elif (20 * 60) < sim_time < (40 * 60):  # GOING DOWN
                self.alt -= 50
            else:  # RESET
                self.lat = 41.4911619
                self.lon = 2.1548483
                self.alt = 0
                start_time = time.time()

            self.save_data({
                "payload": self.payload,
                "channel": self.channel,
                "lat": self.lat,
                "lon": self.lon,
                "alt": self.alt,
                "session": self.session,
                "time": self.time,
                "updated_time": int(time.time())
            })

            time.sleep(10)

    @staticmethod
    def get_rand_pos():
        random_num = random.randint(1, 10) / 1000.0
        sign = 1 if random.randint(1, 10) < 5 else -1
        return random_num * sign

    # SSDV Images
    def get_image_list(self):
        return glob.glob(self.ssdv_path + '/*.JPG')

    def get_last_image(self):
        # Get list of jpg files
        date_file_list = []
        for file in glob.glob(self.ssdv_path + '/*.JPG'):
            stats = os.stat(file)
            lastmod_date = time.localtime(stats[8])
            date_file_tuple = lastmod_date, file
            date_file_list.append(date_file_tuple)

        if len(date_file_list) == 0:
            return None

        if self.SelectedSSDVFile < 0:
            self.SelectedSSDVFile = 0

        if self.SelectedSSDVFile >= len(date_file_list):
            self.SelectedSSDVFile = len(date_file_list) - 1

        index = len(date_file_list) - self.SelectedSSDVFile - 1

        return sorted(date_file_list)[index]
