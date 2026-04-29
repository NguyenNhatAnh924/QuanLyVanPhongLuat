import hashlib
import hmac
import urllib.parse

class vnpay:
    def __init__(self):
        self.requestData = {}
        self.responseData = {}

    def get_payment_url(self, vnpay_url, secret_key):
        inputData = sorted(self.requestData.items())
        query_string = "&".join([f"{k}={urllib.parse.quote_plus(str(v))}" for k, v in inputData if v])
        hash_value = hmac.new(
            secret_key.encode('utf-8'), 
            query_string.encode('utf-8'), 
            hashlib.sha512
        ).hexdigest()
        print(f"--- [VNPAY DEBUG] CHUỖI ĐEM ĐI HASH: {query_string}")
        print(f"--- [VNPAY DEBUG] CHỮ KÝ TẠO RA: {hash_value}")

        return f"{vnpay_url}?{query_string}&vnp_SecureHash={hash_value}"

    def validate_response(self, secret_key):
        vnp_SecureHash = self.responseData.get('vnp_SecureHash')
        data = {k: v for k, v in self.responseData.items() if k not in ['vnp_SecureHash', 'vnp_SecureHashType']}
        
        sorted_data = sorted(data.items())
        query_string = "&".join([f"{k}={urllib.parse.quote_plus(str(v))}" for k, v in sorted_data if v])
        
        check_hash = hmac.new(
            secret_key.encode('utf-8'), 
            query_string.encode('utf-8'), 
            hashlib.sha512
        ).hexdigest()
        
        return check_hash == vnp_SecureHash