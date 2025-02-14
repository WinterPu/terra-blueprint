import shutil
from pathlib import Path

# 定义源路径和目标路径
src_path  = Path.home() / Path("Documents/terra/cxx-parser")
dest_path = Path("./node_modules/@agoraio-extensions/cxx-parser")


# 检查目标路径是否存在，如果存在则删除
if dest_path.exists():
    shutil.rmtree(dest_path)

print(f"======= Start Copying {src_path} to {dest_path} =======")
# 复制源路径到目标路径
shutil.copytree(src_path, dest_path)

print(f"Copied TerraCode Completed")