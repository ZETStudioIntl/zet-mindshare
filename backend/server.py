import sys
sys.stderr.write("MINIMAL: start\n"); sys.stderr.flush()
print("MINIMAL: start", flush=True)

from fastapi import FastAPI
print("MINIMAL: fastapi imported", flush=True)


app = FastAPI()
print("MINIMAL: app created", flush=True)

@app.get("/health")
def health():
    return {"ok": True, "revision": "minimal-test"}

print("MINIMAL: routes registered", flush=True)
sys.stderr.write("MINIMAL: module load complete\n"); sys.stderr.flush()
