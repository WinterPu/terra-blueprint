import json
from pathlib import Path
import math
from typing import Union, Dict, List

def split_json_file(
    input_file_path: str, 
    num_parts: int, 
    inner_key: str,
    output_dir: str = None
):
    """
    将JSON文件按照指定的inner_key进行拆分，保留其他顶层属性
    
    参数:
    input_file_path: 输入JSON文件的路径
    num_parts: 要拆分成的文件数量
    inner_key: 要拆分的内部键名
    output_dir: 输出文件夹路径，默认在输入文件同目录下创建
    """
    # 转换为Path对象
    input_path = Path(input_file_path)
    
    # 设置输出目录
    if output_dir is None:
        output_dir = input_path.parent
    else:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
    
    # 读取JSON文件
    try:
        with input_path.open('r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"读取JSON文件时出错: {e}")
        return
    
    # 确保数据是字典类型
    if not isinstance(data, dict):
        print("输入的JSON必须是字典/对象类型")
        return
    
    # 确保inner_key存在
    if inner_key not in data:
        print(f"未找到指定的键 '{inner_key}'")
        return
    
    # 获取要拆分的数据
    inner_data = data[inner_key]
    
    # 确保inner_data是列表或字典类型
    if not isinstance(inner_data, (list, dict)):
        print(f"'{inner_key}' 必须是列表或字典类型")
        return
    
    # 创建基础数据（不包含要拆分的inner_key）
    base_data = {k: v for k, v in data.items() if k != inner_key}
    
    # 根据inner_data类型进行拆分
    if isinstance(inner_data, list):
        total_items = len(inner_data)
        items_per_file = math.ceil(total_items / num_parts)
        
        for i in range(num_parts):
            start_idx = i * items_per_file
            end_idx = min((i + 1) * items_per_file, total_items)
            
            if start_idx >= total_items:
                break
            
            # 创建新的数据对象，包含基础数据
            new_data = base_data.copy()
            # 添加拆分后的inner数据
            new_data[inner_key] = inner_data[start_idx:end_idx]
            
            # 保存文件
            output_file = output_dir / f"{input_path.stem}_part{i+1}{input_path.suffix}"
            try:
                with output_file.open('w', encoding='utf-8') as f:
                    json.dump(new_data, f, ensure_ascii=False, indent=2)
                print(f"已创建文件: {output_file}")
            except Exception as e:
                print(f"保存文件 {output_file} 时出错: {e}")
    
    elif isinstance(inner_data, dict):
        keys = list(inner_data.keys())
        total_keys = len(keys)
        keys_per_file = math.ceil(total_keys / num_parts)
        
        for i in range(num_parts):
            start_idx = i * keys_per_file
            end_idx = min((i + 1) * keys_per_file, total_keys)
            
            if start_idx >= total_keys:
                break
            
            # 创建新的数据对象，包含基础数据
            new_data = base_data.copy()
            # 添加拆分后的inner数据
            new_data[inner_key] = {
                k: inner_data[k] 
                for k in keys[start_idx:end_idx]
            }
            
            # 保存文件
            output_file = output_dir / f"{input_path.stem}_part{i+1}{input_path.suffix}"
            try:
                with output_file.open('w', encoding='utf-8') as f:
                    json.dump(new_data, f, ensure_ascii=False, indent=2)
                print(f"已创建文件: {output_file}")
            except Exception as e:
                print(f"保存文件 {output_file} 时出错: {e}")

# 使用示例
if __name__ == "__main__":
    # 拆分文件
    split_json_file(
        input_file_path= Path("/Users/admin/Documents/terra-blueprint/.terra/cxx_parser/dump_clang_ast_IAgoraRtcEngine.h_d09817fd3e3119bd59292c070c381e80.json"),
        num_parts=30,
        inner_key="inner",
        output_dir= Path("./split_output")
    )
