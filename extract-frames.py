import os
import subprocess
import glob
import imageio_ffmpeg

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
print(f"Using ffmpeg at: {ffmpeg_exe}")

os.makedirs("public/frames", exist_ok=True)
os.makedirs("public/frames-mobile", exist_ok=True)

# 1. Extract desktop frames: 24fps, width 1440, quality 70
# -vf "fps=24,scale=1440:-2" -c:v libwebp -quality 70
cmd_desktop = [
    ffmpeg_exe,
    "-y",
    "-i", "seren.mp4",
    "-vf", "fps=24,scale=1440:-2",
    "-c:v", "libwebp",
    "-quality", "70",
    "public/frames/frame_%04d.webp"
]

print("Running desktop frame extraction...")
res = subprocess.run(cmd_desktop, capture_output=True, text=True)
if res.returncode != 0:
    print("Error during desktop extraction:", res.stderr)
else:
    print("Desktop extraction completed!")

desktop_frames = sorted(glob.glob("public/frames/frame_*.webp"))
desktop_total_size = sum(os.path.getsize(f) for f in desktop_frames)
print(f"Desktop frames generated: {len(desktop_frames)}")
print(f"Desktop total size: {desktop_total_size / (1024 * 1024):.2f} MB")

# 2. Extract mobile frames: every 3rd frame at width 800 in public/frames-mobile/
# Mobile: 24/3 = 8 fps, width 800
# Or extract every 3rd frame from desktop or directly from video with fps=8,scale=800:-2
cmd_mobile = [
    ffmpeg_exe,
    "-y",
    "-i", "seren.mp4",
    "-vf", "fps=8,scale=800:-2",
    "-c:v", "libwebp",
    "-quality", "70",
    "public/frames-mobile/frame_%04d.webp"
]

print("Running mobile frame extraction...")
res_m = subprocess.run(cmd_mobile, capture_output=True, text=True)
if res_m.returncode != 0:
    print("Error during mobile extraction:", res_m.stderr)
else:
    print("Mobile extraction completed!")

mobile_frames = sorted(glob.glob("public/frames-mobile/frame_*.webp"))
mobile_total_size = sum(os.path.getsize(f) for f in mobile_frames)
print(f"Mobile frames generated: {len(mobile_frames)}")
print(f"Mobile total size: {mobile_total_size / (1024 * 1024):.2f} MB")
