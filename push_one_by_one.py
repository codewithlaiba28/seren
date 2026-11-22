import os
import subprocess
import glob
import time

def run_git(cmd):
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error running {' '.join(cmd)}:\n{result.stderr}")
        return False, result.stderr
    return True, result.stdout

def push_file(filepaths, msg):
    if isinstance(filepaths, str):
        filepaths = [filepaths]
    
    print(f"\n--> Staging: {', '.join(filepaths[:3])}{'...' if len(filepaths) > 3 else ''}")
    ok, out = run_git(["git", "add"] + filepaths)
    if not ok:
        return False
    
    ok, out = run_git(["git", "commit", "-m", msg])
    if not ok:
        if "nothing to commit" in out:
            print(f"Skipping (nothing to commit)")
            return True
        return False
    
    print(f"--> Pushing to origin main: \"{msg}\"...")
    ok, out = run_git(["git", "push", "origin", "main"])
    if not ok:
        # Retry once after 2 seconds
        time.sleep(2)
        ok, out = run_git(["git", "push", "origin", "main"])
        if not ok:
            return False
    print(f"✓ Pushed: {msg}")
    return True

# 1. Root configuration & code files (one by one)
root_files = [
    ("package.json", "Add package.json configuration"),
    ("package-lock.json", "Add package-lock.json"),
    ("vite.config.js", "Add Vite build and dev server configuration"),
    ("index.html", "Add index.html with luxury resort layout and semantic tags"),
    ("README.md", "Add comprehensive documentation in README.md"),
    ("template.html", "Add reference Stitch template"),
    ("extract-frames.py", "Add automated video frame extraction script"),
    ("download-images.js", "Add asset downloader script"),
    ("seren.mp4", "Add original seren.mp4 source video")
]

print("=== STAGE 1: PUSHING ROOT FILES ONE BY ONE ===")
for fp, msg in root_files:
    if os.path.exists(fp):
        push_file(fp, msg)
        time.sleep(0.5)

# 2. Source code files (one by one)
src_files = [
    ("src/styles/main.css", "Add master styles, CSS variables and design tokens"),
    ("src/modules/navbar.js", "Add adaptive navbar module with scroll direction detection"),
    ("src/modules/preloader.js", "Add preloader and assets loading progress module"),
    ("src/modules/bubbles.js", "Add underwater bubbles canvas particle system"),
    ("src/modules/underwaterThree.js", "Add Three.js low-poly floating marine life"),
    ("src/modules/villas.js", "Add pinned 3D villas sanctuary showcase"),
    ("src/modules/waterRipple.js", "Add WebGL water ripple displacement shader"),
    ("src/modules/scrollSequence.js", "Add 900vh GSAP ScrollTrigger canvas scrub sequence"),
    ("src/modules/cursor.js", "Add cursor interactions"),
    ("src/main.js", "Add application entry point with Lenis and GSAP sync")
]

print("\n=== STAGE 2: PUSHING SOURCE CODE FILES ONE BY ONE ===")
for fp, msg in src_files:
    if os.path.exists(fp):
        push_file(fp, msg)
        time.sleep(0.5)

# 3. Public resort image assets (one by one)
print("\n=== STAGE 3: PUSHING RESORT IMAGES ONE BY ONE ===")
images = sorted(glob.glob("public/images/*.*"))
for img_path in images:
    normalized = img_path.replace("\\", "/")
    filename = os.path.basename(normalized)
    push_file(normalized, f"Add resort image asset: {filename}")
    time.sleep(0.5)

# 4. Mobile WebP frames (pushed sequentially in 8 batches of 15 frames)
print("\n=== STAGE 4: PUSHING MOBILE FRAMES SEQUENTIALLY ===")
mobile_frames = sorted(glob.glob("public/frames-mobile/*.webp"))
batch_size_m = 15
for idx in range(0, len(mobile_frames), batch_size_m):
    chunk = [f.replace("\\", "/") for f in mobile_frames[idx:idx + batch_size_m]]
    start_f = os.path.basename(chunk[0])
    end_f = os.path.basename(chunk[-1])
    push_file(chunk, f"Add mobile frames batch: {start_f} to {end_f}")
    time.sleep(0.8)

# 5. Desktop WebP frames (pushed sequentially in 15 batches of 24 frames = 1 sec each)
print("\n=== STAGE 5: PUSHING DESKTOP FRAMES SEQUENTIALLY ===")
desktop_frames = sorted(glob.glob("public/frames/*.webp"))
batch_size_d = 24
for idx in range(0, len(desktop_frames), batch_size_d):
    sec = (idx // batch_size_d) + 1
    chunk = [f.replace("\\", "/") for f in desktop_frames[idx:idx + batch_size_d]]
    start_f = os.path.basename(chunk[0])
    end_f = os.path.basename(chunk[-1])
    push_file(chunk, f"Add video frames second {sec}/15: {start_f} to {end_f}")
    time.sleep(0.8)

print("\n==========================================================")
print("🎉 ALL FILES PUSHED ONE BY ONE TO codewithlaiba28/seren!")
print("==========================================================")
