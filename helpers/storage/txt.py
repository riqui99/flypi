import json
import os


class TextDBHelper:
    def __init__(self):
        self.session = "Unknown Session"
        if not os.path.isfile('sessions/_.txt'):
            open("sessions/_.txt", "w")

        return

    def save_data(self, doc):
        session_file = "sessions/_.txt" if self.session == "Unknown Session" else 'sessions/{}.txt'.format(self.session)

        with open(session_file, 'r+') as outfile:
            try:
                data = json.load(outfile)
            except:
                data = []
            data.append(doc)
        with open(session_file, 'w+') as outfile:
            outfile.write(json.dumps(data))
        return

    def get_stored_data(self, payload=None, start_time=None, end_time=None, session=None):
        session_file = "sessions/_.txt" if session == "Unknown Session" else 'sessions/{}.txt'.format(session)
        try:
            with open(session_file, 'r+') as outfile:
                return json.load(outfile)
        except:
            return []

    def session_exists(self, session):
        if os.path.isfile('sessions/{}.txt'.format(session)):
            return True
        return False

    def new_session(self, session):
        if not os.path.isfile('sessions/{}.txt'.format(session)):
            f = open('sessions/{}.txt'.format(session), "w+")
            f.close()

    def start_session(self, session):
        self.new_session(session)
        self.session = session

    def finalize_session(self):
        self.session = "Unknown Session"

    def remove_session(self, session):
        if session == self.session:
            self.finalize_session()

        if os.path.isfile('sessions/{}.txt'.format(session)):
            os.remove('sessions/{}.txt'.format(session))

        return True

    def get_sessions_list(self):
        try:
            sessions_list = [f.replace(".txt", "") for f in os.listdir("sessions") if f != "_.txt" if f != ".gitignore" and os.path.isfile(os.path.join("sessions", f))]
        except:
            sessions_list = []

        return sessions_list
