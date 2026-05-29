import httpx
from PIL import Image
import io

# create dummy image
img = Image.new('RGB', (100, 100), color = 'red')
img_bytes = io.BytesIO()
img.save(img_bytes, format='PNG')
img_bytes.seek(0)

# upload it
try:
    with httpx.Client() as client:
        # get project id from flowboard? 
        # Actually, let's just make a POST to /api/upload
        # project_id is required. 
        # Where to get project_id?
        # /api/board might have it?
        pass
except Exception as e:
    print(e)
