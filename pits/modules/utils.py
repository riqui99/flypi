import time
from datetime import datetime
from time import mktime

def gateway_time_to_timestamp(gatewayTime="00:00:00"):
    dt = datetime.strptime(gatewayTime, "%H:%M:%S")
    dt_now = datetime.now()
    dt = dt.replace(year=dt_now.year, month=dt_now.month, day=dt_now.day)
    result = time.mktime(dt.timetuple())
    return result
