import json


class MongoHelper:
    def __init__(self, mongo):
        self.mongo = mongo
        self.db = self.mongo["flypi"]["data"]
        self.session = None
        return

    def save_data(self, doc):
        self.db.insert(doc)
        return

    def get_stored_data(self, payload=None, start_time=None, end_time=None, session=None):
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

    def session_exists(self, session):
        row = self.db.find_one({"session": session})
        return row is not None

    def new_session(self, session):
        return

    def start_session(self, session):
        self.session = session

    def finalize_session(self):
        self.session = None

    def remove_session(self, session):
        if session == self.session:
            self.finalize_session()

        self.db.remove({"session": session})

        return True

    def get_sessions_list(self):
        try:
            sessions_list = self.db.distinct("session")
            if len(sessions_list) == 1 and sessions_list[0] is None:
                sessions_list = []
        except:
            sessions_list = []

        return sessions_list
