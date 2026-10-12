"""Check bounded HTTP reads reject unsafe/full downloads and bad responses."""
import io
import unittest
from unittest.mock import patch
from starter import RangeFile, SOURCE_BYTES, SOURCE_ETAG


class Response:
    def __init__(self, status=206, content=b'PAR1', range_value=None, etag=SOURCE_ETAG):
        self.status_code=status
        self.headers={'Content-Range': range_value or f'bytes 0-3/{SOURCE_BYTES}', 'ETag': etag}
        self.raw=io.BytesIO(content)
    def __enter__(self): return self
    def __exit__(self, *args): pass


class BoundedDownloadTests(unittest.TestCase):
    def test_exact_range_and_eof(self):
        source=RangeFile()
        with patch('starter.requests.get', return_value=Response()) as request:
            self.assertEqual(source.read(4), b'PAR1')
            self.assertEqual(source.transferred, 4)
            self.assertEqual(request.call_args.kwargs['headers']['If-Match'], SOURCE_ETAG)
        source.seek(0, 2)
        self.assertEqual(source.read(4), b'')

    def test_reject_invalid_http_responses(self):
        cases=[Response(status=200),Response(range_value='bytes 1-4/99'),
               Response(etag='changed'),Response(content=b'PAR'),Response(content=b'PAR12')]
        for response in cases:
            with self.subTest(headers=response.headers), patch('starter.requests.get',return_value=response):
                source=RangeFile()
                with self.assertRaises(RuntimeError): source.read(4)
                self.assertEqual(source.transferred,0)

    def test_limits_fail_before_network(self):
        with patch('starter.requests.get') as request:
            for size in [-1,16_000_001]:
                with self.assertRaises(ValueError): RangeFile().read(size)
            source=RangeFile();source.transferred=50_000_000
            with self.assertRaises(ValueError): source.read(1)
            with self.assertRaises(ValueError): source.seek(-1)
            with self.assertRaises(ValueError): source.seek(0,3)
            request.assert_not_called()


if __name__=='__main__': unittest.main()
