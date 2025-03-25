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
