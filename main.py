import os
import sys

# Ensure backend/src is on the module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend", "src")))

from bazaar_drishti.api.app import app  # noqa: E402

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
