import glob
import json
import os
import socket
import random
from threading import Thread
import time
from pits.modules.utils import gateway_time_to_timestamp


class Lora:

    def __init__(self, host="localhost", port=6004, debug=False, simulate=False, storage_manager=None):
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

        self.ssdv_path = '/home/pi/lora-gateway/ssdv'
        self.SelectedSSDVFile = 0

        self.host = host
        self.port = port
        self.lora_socket = None

        self.storage_manager = storage_manager

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

                                    self.storage_manager.save_data({
                                        "payload": json_data['payload'],
                                        "channel": json_data['channel'],
                                        "lat": json_data['lat'],
                                        "lon": json_data['lon'],
                                        "alt": json_data['alt'],
                                        "session": self.storage_manager.session,
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

            self.storage_manager.save_data({
                "payload": self.payload,
                "channel": self.channel,
                "lat": self.lat,
                "lon": self.lon,
                "alt": self.alt,
                "session": self.storage_manager.session,
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
