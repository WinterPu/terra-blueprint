# History
1. 第一版: 一开始是尝试直接 bp 与 cpp 的 Enum 之间 static_cast 但是发现由于BP的Enum 都是uint8 (0~255)
2. 第二版: 针对值不一样的Enum，包成一个Wrapper 单独进行Remmaping 重新映射
3. 第三版：由于发现BP 首项是需要 等于0的，当时方式是如果不是从0开始的enum 单独添加 
```
INVALID_OPT_BPGEN_NULL UMETA(Hidden, DisplayName = "AGORA NULL VALUE")
```
	这个有这么几个坏处：首先是这一项虽然可以Hidden 但是还是会某些地方成为Default，而且这个值不对应Agora 的任何值，万一用户选择了，就不知道对应什么
4. 第四版：Agora 的 Enum 都做一个Remmaping ，并且通过预先定义的Macro 函数去预先写好生成的模板 GEN_UABTFUNC_SIGNATURE_ENUMCONVERSION_4_ENTRIES：
	1. 实现上是预先定义ToRawValue 与 WrapWithUEEnum
	2. 但是这也有问题：就是这个Macro 目前的Entries 数量是要先定义好的，Agora 有些Enum 是有超过70个的，每个Macro 函数都写一个感觉也比较费
	3. 使用模板函数呢，也有一个问题，那就是可能会有Enum 值存在一样的情况
		4.主要是当时为了好写：用的是Switch ，但是Switch 本身Case 不能有重复项
```
// 打个比方：
enum class VIDEO_SOURCE_TYPE : uint8{

	VIDEO_SOURCE_CAMERA_PRIMARY = 0,
	// VIDEO_SOURCE_CAMERA = VIDEO_SOURCE_CAMERA_PRIMARY,
	VIDEO_SOURCE_CAMERA,
	
	VIDEO_SOURCE_CAMERA_SECONDARY,
	
	VIDEO_SOURCE_SCREEN_PRIMARY,
	//VIDEO_SOURCE_SCREEN = VIDEO_SOURCE_SCREEN_PRIMARY,
	VIDEO_SOURCE_SCREEN,
	//....
	
};
```


## Terra
目前Terra 版本：由于Enum 77 太多了，所以去掉了使用Macro Function 做模板
直接让Terra 生成原来的函数