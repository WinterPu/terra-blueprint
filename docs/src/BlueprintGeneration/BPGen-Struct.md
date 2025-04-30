这里注意Category 是必须要的，因为是Editor 需要一个分类
```  

USTRUCT(BlueprintType)

struct FUABT_UserInfo

{

GENERATED_BODY()

public:

UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|UserInfo")

int64 uid = 0;

}

};
```


## How to resolve: FUABT macro scope problem




### USTRUCT 没法包在Macro Scope 内
```
#if PLATFORM_WINDOWS

USTRUCT(BlueprintType)
struct FUABT_Test{
	GENERATED_BODY()
public:

}

#endif

Error: USTRUCT must not be inside preprocessor blocks, except for WITH_EDITORONLY_DATA
```
