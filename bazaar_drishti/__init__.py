import os
import sys

_backend_src = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "src"))
if _backend_src not in sys.path:
    sys.path.insert(0, _backend_src)

_real_pkg = os.path.join(_backend_src, "bazaar_drishti")
if _real_pkg not in __path__:
    __path__.append(_real_pkg)
