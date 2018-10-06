import unittest
import sys
sys.path.append('./')

from pits.modules.utils import gateway_time_to_timestamp

class gateway_time_to_timestamp_Tests(unittest.TestCase):
    def test_gateway_time_to_timestamp_return_float_value(self):
    	result = gateway_time_to_timestamp("02:56:33")
    	self.assertTrue(type(result) is float)
    	self.assertTrue(len(str(result)) >= 10)


if __name__ == '__main__':
    unittest.main()