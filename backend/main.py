from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import os
import ffmpeg
import shutil

app = FastAPI()

# Enable CORS for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLO model
model = YOLO("models/best.pt")

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

# Function to count workers without safety gear
def count_workers_without_gear(detections):
    workers = []
    # missing_gear_count = 0
    missing_gear = {"helmet":0,"jacket":0}
        

    # for det in detections:
    #     if det["class"] == "person":
    #         workers.append(det["bbox"])

    # for worker in workers:
    #     has_helmet = any(
    #         det["class"] == "helmet" and det["bbox"][0] >= worker[0] and det["bbox"][2] <= worker[2]
    #         for det in detections
    #     )
    #     has_vest = any(
    #         det["class"] == "vest" and det["bbox"][0] >= worker[0] and det["bbox"][2] <= worker[2]
    #         for det in detections
    #     )

    #     if not (has_helmet and has_vest):
    #         missing_gear_count += 1
    missing_gear["helmet"] = sum(
        1 for det in detections if det["class"] in ["no-helmet"]
    )
    
    missing_gear["jacket"]=sum(
        1 for det in detections if det["class"] in ["no-vest"]
    )

    return missing_gear

# Detect safety gear in a single image
@app.post("/detect/image")
async def detect_image(file: UploadFile = File(...)):
    total_missing_gear = {"helmet":0,"jacket":0}

    image_path = f"uploads/{file.filename}"
    with open(image_path, "wb") as buffer:
        buffer.write(await file.read())

    image = cv2.imread(image_path)
    results = model(image)

    detections = []
    for result in results:
        for box in result.boxes:
            detections.append({
                "class": model.names[int(box.cls)],
                "bbox": box.xyxy.tolist()[0]
            })
    # detections = []
    # for result in results:
    #     for box in result.boxes:
    #         class_id = int(box.cls)
    #         class_name = model.names[class_id]
    #         bbox = box.xyxy.tolist()[0]
    #         detections.append({
    #             "class": class_name,
    #             "bbox": bbox
    #         })
            
            
    total_missing_gear["helmet"]=count_workers_without_gear(detections).get("helmet",0)
    total_missing_gear["jacket"]=count_workers_without_gear(detections).get("jacket",0)
    os.remove(image_path)
    # return {"workers_without_gear": count_workers_without_gear(detections)}
    return total_missing_gear
# Detect safety gear in a video
@app.post("/detect/video")
async def detect_video(file: UploadFile = File(...)):
    video_path = f"uploads/{file.filename}"
    frames_dir = "uploads/frames"
    os.makedirs(frames_dir, exist_ok=True)

    with open(video_path, "wb") as buffer:
        buffer.write(await file.read())

    # Extract frames using ffmpeg (1 frame per second)
    (
        ffmpeg.input(video_path)
        .filter("fps", fps=1)
        .output(f"{frames_dir}/frame_%04d.jpg")
        .run()
    )

    frames = sorted(os.listdir(frames_dir))
    total_missing_gear = {"helmet":0,"jacket":0}
    # helm_count =0;
    for frame in frames:
        frame_path = os.path.join(frames_dir, frame)
        image = cv2.imread(frame_path)
        detections = []

        for result in model(image):
            for box in result.boxes:
                detections.append({
                    "class": model.names[int(box.cls)],
                    "bbox": box.xyxy.tolist()[0]
                })
        # helm_count+=count_workers_without_gear(detections)
        total_missing_gear["helmet"] += count_workers_without_gear(detections).get("helmet",0)
        total_missing_gear["jacket"]+=count_workers_without_gear(detections).get("jacket",0)
        os.remove(frame_path)

    os.remove(video_path)
    shutil.rmtree(frames_dir)

    return total_missing_gear
